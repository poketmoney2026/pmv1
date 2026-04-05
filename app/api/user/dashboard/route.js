// app/api/user/dashboard/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getUserIdFromToken } from "@/lib/auth";
import User from "@/models/User";
import Deposit from "@/models/Deposit";
import Interest from "@/models/Interest";
import Transaction from "@/models/Transaction";
import Withdraw from "@/models/Withdraw";
import { readClaimCooldownSec } from "@/lib/claimCooldown";

const DAY_MS = 24 * 60 * 60 * 1000;
const SCALE = 100000;

const clampDays = (n) => Math.max(1, Math.min(365, Number(n || 12)));
const round5 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100000) / 100000;

function toMs(v) {
  const t = v ? new Date(v).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}
function createdMs(dep) {
  const a = toMs(dep?.createdDate);
  const b = toMs(dep?.createdAt);
  return a || b || 0;
}
function claimMs(dep) {
  return toMs(dep?.claimDate);
}
function dailyUnits(amount, ratePercent) {
  const a = Number(amount || 0);
  const r = Number(ratePercent || 0);
  if (!Number.isFinite(a) || !Number.isFinite(r) || a <= 0 || r <= 0) return 0;
  return Math.round((a * r * SCALE) / 100);
}
function earnUnitsForDelta(dailyU, deltaMs) {
  if (!dailyU || deltaMs <= 0) return 0;
  const earned = (BigInt(dailyU) * BigInt(Math.max(0, deltaMs))) / BigInt(DAY_MS);
  return Number(earned);
}
function earnAmountForWindow({ amount, ratePercent, startMs, endMs, planDays, depCreatedMs }) {
  const c = depCreatedMs || 0;
  if (!c) return 0;
  const expiryMs = c + planDays * DAY_MS;
  const s = Math.max(startMs, c);
  const e = Math.min(endMs, expiryMs);
  if (e <= s) return 0;
  const dU = dailyUnits(amount, ratePercent);
  const u = earnUnitsForDelta(dU, e - s);
  return u / SCALE;
}
function startOfTodayMs(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function GET() {
  const uid = await getUserIdFromToken();
  if (!uid) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const user = await User.findById(uid);
  if (!user) return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  if (String(user.status || "active") !== "active") return NextResponse.json({ ok: false, message: "Your account is inactive. Please contact support." }, { status: 403 });

  const interestDoc = await Interest.findOne({}).sort({ createdAt: -1 }).lean();
  const interestPercent = Number(interestDoc?.valuePercent || 0);
  const planDays = clampDays(interestDoc?.day || 12);

  const claimCooldownSec = await readClaimCooldownSec();
  const nowMs = Date.now();
  const todayStart = startOfTodayMs(nowMs);

  const start30 = todayStart - 30 * DAY_MS;
  const fetchFrom = new Date(start30 - planDays * DAY_MS);

  const deposits = await Deposit.find({
    userId: uid,
    status: "success",
    createdAt: { $gte: fetchFrom },
  }).sort({ createdAt: -1 });

  let autoAdded = 0;
  let maxRunningClaimMs = 0;

  let streamUnitsStart = 0;
  let streamUnitsPerSecond = 0;

  let todayIncome = 0;
  let yesterdayIncome = 0;
  let last7DaysIncome = 0;
  let last30DaysIncome = 0;

  let runningCount = 0;
  let speedDaily = 0;

  for (const dep of deposits) {
    const cMs = createdMs(dep);
    if (!cMs) continue;

    const type = String(dep.type || "none");
    const isDone = type === "done";
    const isRunning = !isDone;

    const expiryMs = cMs + planDays * DAY_MS;
    const dU = dailyUnits(dep.amount, interestPercent);

    if (isRunning) {
      const lastC = claimMs(dep);
      if (lastC) maxRunningClaimMs = Math.max(maxRunningClaimMs, lastC);

      if (nowMs > expiryMs && Number(interestPercent) > 0) {
        let base = lastC ? Math.max(cMs, lastC) : cMs;
        base = Math.min(base, expiryMs);
        const delta = expiryMs - base;
        if (delta > 0) {
          const u = earnUnitsForDelta(dU, delta);
          autoAdded += u / SCALE;
        }
        dep.claimDate = new Date(expiryMs);
        dep.type = "done";
        await dep.save();
      }
    }

    const cMs2 = createdMs(dep);
    const expiryMs2 = cMs2 + planDays * DAY_MS;

    const todayAmt = earnAmountForWindow({
      amount: dep.amount,
      ratePercent: interestPercent,
      startMs: todayStart,
      endMs: nowMs,
      planDays,
      depCreatedMs: cMs2,
    });
    todayIncome += todayAmt;

    const yStart = todayStart - DAY_MS;
    const yEnd = todayStart;
    yesterdayIncome += earnAmountForWindow({
      amount: dep.amount,
      ratePercent: interestPercent,
      startMs: yStart,
      endMs: yEnd,
      planDays,
      depCreatedMs: cMs2,
    });

    const s7 = todayStart - 7 * DAY_MS;
    last7DaysIncome += earnAmountForWindow({
      amount: dep.amount,
      ratePercent: interestPercent,
      startMs: s7,
      endMs: nowMs,
      planDays,
      depCreatedMs: cMs2,
    });

    const s30 = todayStart - 30 * DAY_MS;
    last30DaysIncome += earnAmountForWindow({
      amount: dep.amount,
      ratePercent: interestPercent,
      startMs: s30,
      endMs: nowMs,
      planDays,
      depCreatedMs: cMs2,
    });

    const finalType = String(dep.type || "none");
    if (finalType !== "done") {
      runningCount += 1;
      const dailyProfit = (Number(dep.amount || 0) * Number(interestPercent || 0)) / 100;
      if (Number.isFinite(dailyProfit) && dailyProfit > 0) {
        speedDaily += dailyProfit;
        streamUnitsPerSecond += (dailyProfit / 86400) * SCALE;
      }

      const lastC2 = claimMs(dep);
      const base = lastC2 ? Math.max(cMs2, lastC2) : cMs2;
      const end = Math.min(nowMs, expiryMs2);
      const delta = end - Math.min(base, end);
      if (delta > 0 && dU > 0) {
        const u = earnUnitsForDelta(dU, delta);
        streamUnitsStart += u;
      }
    }
  }

  if (autoAdded > 0) {
    user.balance = round5(Number(user.balance || 0) + autoAdded);
    await user.save();
  }

  const referralIncomeAgg = await Transaction.aggregate([
    { $match: { user: user._id, status: "successful", type: "referralBonus" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const referralIncome = Number(referralIncomeAgg?.[0]?.total || 0);

  const withdrawAgg = await Withdraw.aggregate([
    { $match: { userId: user._id, status: "successful" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalWithdraw = Number(withdrawAgg?.[0]?.total || 0);

  // ✅ CHANGED ONLY THIS PART: referralsCount from user.referrals array length
  const referralsCount = Array.isArray(user.referrals) ? user.referrals.length : 0;

  const cooldownRemainingSec =
    maxRunningClaimMs && nowMs - maxRunningClaimMs < claimCooldownSec * 1000
      ? Math.max(0, claimCooldownSec - Math.floor((nowMs - maxRunningClaimMs) / 1000))
      : 0;

  const speedHourly = speedDaily / 24;

  return NextResponse.json(
    {
      ok: true,
      data: {
        interestPercent: Number(interestPercent || 0),
        planDays,
        userBalance: Number(user.balance || 0),
        runningCount,
        stream: {
          unitsStart: Math.max(0, Math.floor(streamUnitsStart)),
          unitsPerSecond: Number(streamUnitsPerSecond || 0),
        },
        speed: {
          hourlyIncrease: round5(speedHourly),
          dailyIncrease: round5(speedDaily),
        },
        stats: {
          todayIncome: round5(todayIncome),
          yesterdayIncome: round5(yesterdayIncome),
          last7DaysIncome: round5(last7DaysIncome),
          last30DaysIncome: round5(last30DaysIncome),
          referralIncome: round5(referralIncome),
          totalWithdraw: round5(totalWithdraw),
          referrals: Number(referralsCount || 0),
        },
        cooldownRemainingSec,
        claimCooldownSec,
      },
    },
    { status: 200 }
  );
}