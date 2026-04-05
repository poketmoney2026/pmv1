// app/api/user/dashboard/claim-all/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getUserIdFromToken } from "@/lib/auth";
import User from "@/models/User";
import Deposit from "@/models/Deposit";
import Interest from "@/models/Interest";
import Transaction from "@/models/Transaction";
import { clampPlanDays } from "@/lib/planDays";
import { readClaimCooldownSec } from "@/lib/claimCooldown";

const DAY_MS = 24 * 60 * 60 * 1000;
const SCALE = 100000;

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

export async function POST() {
  const uid = await getUserIdFromToken();
  if (!uid) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const user = await User.findById(uid);
  if (!user) return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });

  const interestDoc = await Interest.findOne({}).sort({ createdAt: -1 }).lean();
  const interestPercent = Number(interestDoc?.valuePercent || 0);
  const planDays = clampPlanDays(interestDoc?.day || 12);
  if (!Number.isFinite(interestPercent) || interestPercent <= 0) {
    return NextResponse.json({ ok: false, message: "Interest rate not set" }, { status: 400 });
  }

  const deposits = await Deposit.find({
    userId: uid,
    status: "success",
    type: { $ne: "done" },
  }).sort({ createdAt: -1 });

  if (!deposits.length) {
    return NextResponse.json({ ok: true, message: "No running deposits to claim", data: { claimedAmount: 0, newBalance: Number(user.balance || 0), cooldownSec: 0 } }, { status: 200 });
  }

  const claimCooldownSec = await readClaimCooldownSec();
  const nowMs = Date.now();

  let maxClaim = 0;
  for (const dep of deposits) {
    const cm = claimMs(dep);
    if (cm) maxClaim = Math.max(maxClaim, cm);
  }

  if (maxClaim && nowMs - maxClaim < claimCooldownSec * 1000) {
    const remain = Math.max(0, claimCooldownSec - Math.floor((nowMs - maxClaim) / 1000));
    return NextResponse.json({ ok: false, message: `Please wait ${remain} sec before next claim`, data: { remainingSec: remain } }, { status: 429 });
  }

  let totalUnits = 0;

  for (const dep of deposits) {
    const cMs = createdMs(dep);
    if (!cMs) continue;

    const expiryMs = cMs + planDays * DAY_MS;
    const endMs = Math.min(nowMs, expiryMs);

    const lastC = claimMs(dep);
    let base = lastC ? Math.max(cMs, lastC) : cMs;
    base = Math.min(base, endMs);

    const delta = endMs - base;
    if (delta > 0) {
      const dU = dailyUnits(dep.amount, interestPercent);
      const u = earnUnitsForDelta(dU, delta);
      totalUnits += u;
    }

    dep.claimDate = new Date(endMs);
    dep.type = nowMs >= expiryMs ? "done" : "running";
    await dep.save();
  }

  const claimedAmount = totalUnits / SCALE;

  if (claimedAmount > 0) {
    user.balance = round5(Number(user.balance || 0) + claimedAmount);
    const claimTx = await Transaction.create({
      user: user._id,
      type: "claim",
      status: "successful",
      amount: claimedAmount,
      note: `Claim income added to balance: Tk ${Number(claimedAmount || 0).toFixed(5)}`,
      date: new Date(),
    });
    user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
    user.transactions.push(claimTx._id);
    await user.save();
  }

  return NextResponse.json(
    {
      ok: true,
      message: `Claimed Tk ${Number(claimedAmount || 0).toFixed(5)} added to main balance`,
      data: {
        claimedAmount: round5(claimedAmount),
        newBalance: Number(user.balance || 0),
        cooldownSec: claimCooldownSec,
      },
    },
    { status: 200 }
  );
}
