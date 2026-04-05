import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import ReferralIncome from "@/models/ReferralIncome";
import EarningTier from "@/models/EarningTier";
import GeneralSettings from "@/models/GeneralSettings";
import { getAuthUserFromRequest } from "@/lib/auth";

function toNum(v) { const n = Number(String(v ?? "").trim()); return Number.isFinite(n) ? n : NaN; }
function round2(n) { const x = Number(n || 0); return Number.isFinite(x) ? Math.round(x * 100) / 100 : 0; }
function clamp0(n) { const x = Number(n || 0); return !Number.isFinite(x) ? 0 : Math.max(0, x); }
function formatDateTimeEnglish(d) { const dt = new Date(d); return `${dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} ${dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`; }

async function findTierForBalance(balance, session) {
  const b = clamp0(balance);
  const tiers = await EarningTier.find({ isActive: true }).select("minBalance maxBalance dailyRatePercent sortOrder").sort({ sortOrder: 1, minBalance: 1 }).session(session).lean();
  for (const t of tiers) {
    const minB = Number(t?.minBalance ?? 0);
    const maxB = t?.maxBalance === null || t?.maxBalance === undefined ? null : Number(t.maxBalance);
    if (b >= minB && (maxB === null || b <= maxB)) return t;
  }
  return tiers.at(-1) || null;
}

function calcInterest({ balance, dailyRatePercent, elapsedSeconds }) {
  const b = clamp0(balance); const rate = clamp0(dailyRatePercent);
  if (b <= 0 || rate <= 0 || !Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return 0;
  return round2((b * (rate / 100)) * (elapsedSeconds / 86400));
}

export async function POST(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
  const identifier = String(body.identifier || body.mobile || "").trim();
  const identifierMobile = identifier.replace(/\D/g, "").slice(0, 11);
  const mode = String(body.mode || "plus").toLowerCase();
  const amount = toNum(body.amount);
  const giftOption = String(body.giftOption || "").toLowerCase();

  if (!/^01\d{9}$/.test(identifierMobile)) return NextResponse.json({ ok: false, message: "Mobile required" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ ok: false, message: "Amount must be greater than 0" }, { status: 400 });
  if (!["plus", "minus", "gift"].includes(mode)) return NextResponse.json({ ok: false, message: "Invalid mode" }, { status: 400 });

  await dbConnect();
  const session = await mongoose.startSession();
  try {
    const settings = await GeneralSettings.findOne({ key: "global" }).lean();
    const firstReferralPercent = Number(settings?.firstReferralBonus ?? 10);
    const regularReferralPercent = Number(settings?.regularReferralBonus ?? 0);
    const defaultGiftAmount = round2(Number(settings?.giftBoxAmount ?? 0));
    let resultPayload = null;

    await session.withTransaction(async () => {
      const user = await User.findOne({ mobile: identifierMobile }).select("_id fullName mobile balance referredBy referralBonus transactions timerStartedAt status").session(session);
      if (!user) throw new Error("USER_NOT_FOUND");
      if (String(user.status || "active") !== "active") throw new Error("USER_INACTIVE");
      const isPlus = mode === "plus";
      const isGift = mode === "gift";
      const nowMs = Date.now();
      const startedAtMs = user.timerStartedAt ? new Date(user.timerStartedAt).getTime() : nowMs;
      const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
      const beforeBal = clamp0(user.balance);
      const tier = await findTierForBalance(beforeBal, session);
      const interest = calcInterest({ balance: beforeBal, dailyRatePercent: tier?.dailyRatePercent ?? 0, elapsedSeconds });
      user.balance = round2(beforeBal + interest);
      if (interest > 0) {
        const when = new Date();
        const interestTx = await Transaction.create([{ user: user._id, type: "profit", status: "successful", amount: interest, note: `On ${formatDateTimeEnglish(when)}, you earned Tk ${interest} interest on Tk ${round2(beforeBal)} balance.`, date: when }], { session });
        user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
        user.transactions.push(interestTx[0]._id);
      }
      user.timerStartedAt = new Date();

      const selectedAmount = isGift && giftOption === "default" && defaultGiftAmount > 0 ? defaultGiftAmount : amount;
      if (isPlus || isGift) {
        user.balance = round2(Number(user.balance || 0) + selectedAmount);
      } else {
        const nextBal = round2(Number(user.balance || 0) - amount);
        if (nextBal < 0) throw new Error("INSUFFICIENT_BALANCE");
        user.balance = nextBal;
      }

      const txType = isGift ? "gift" : isPlus ? "deposit" : "debit";
      const txAmount = isGift ? selectedAmount : amount;
      const txNote = isGift
        ? `Gift amount credited successfully: Tk ${selectedAmount.toFixed(2)}`
        : isPlus
          ? `Deposit added successfully: Tk ${amount.toFixed(2)}`
          : `Balance deducted successfully: Tk ${amount.toFixed(2)}`;

      const mainTx = await Transaction.create([{ user: user._id, type: txType, status: "successful", amount: txAmount, note: txNote, date: new Date() }], { session });
      user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
      user.transactions.push(mainTx[0]._id);

      let refBonus = 0;
      if (isPlus && user.referredBy) {
        const referrer = await User.findById(user.referredBy).select("_id fullName mobile balance transactions status").session(session);
        if (referrer && String(referrer.status || "active") === "active") {
          const alreadyPaid = Boolean(user.referralBonus);
          const percent = alreadyPaid ? regularReferralPercent : firstReferralPercent;
          refBonus = round2((amount * percent) / 100);
          if (refBonus > 0) {
            referrer.balance = round2(Number(referrer.balance || 0) + refBonus);
            const refTx = await Transaction.create([{ user: referrer._id, type: "referralBonus", status: "successful", amount: refBonus, note: `Referral bonus added from ${user.fullName || user.mobile || "User"}: Tk ${refBonus.toFixed(2)}`, date: new Date() }], { session });
            referrer.transactions = Array.isArray(referrer.transactions) ? referrer.transactions : [];
            referrer.transactions.push(refTx[0]._id);
            await referrer.save({ session });
            await ReferralIncome.findOneAndUpdate({ userId: referrer._id }, { $inc: { amount: refBonus }, $setOnInsert: { date: new Date() } }, { upsert: true, new: true, session });
          }
          if (!alreadyPaid) user.referralBonus = true;
        }
      }

      await user.save({ session });
      resultPayload = {
        ok: true,
        message: isGift ? "Gift sent successfully" : isPlus ? "Balance added successfully" : "Balance deducted successfully",
        data: {
          userId: String(user._id),
          mobile: user.mobile,
          fullName: user.fullName || "",
          balance: user.balance,
          referralBonus: refBonus,
          selectedAmount: txAmount,
        },
      };
    });

    return NextResponse.json(resultPayload, { status: 200 });
  } catch (error) {
    const code = String(error?.message || "SERVER_ERROR");
    const map = { USER_NOT_FOUND: [404, "User not found"], USER_INACTIVE: [403, "User inactive"], INSUFFICIENT_BALANCE: [400, "Insufficient balance"] };
    const [status, message] = map[code] || [500, "Server error"];
    return NextResponse.json({ ok: false, message }, { status });
  } finally {
    await session.endSession();
  }
}
