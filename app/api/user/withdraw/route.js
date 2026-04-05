import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Withdraw from "@/models/Withdraw";
import Transaction from "@/models/Transaction";
import GeneralSettings from "@/models/GeneralSettings";
import { getUserIdFromToken } from "@/lib/auth";

export const runtime = "nodejs";

const PAYMENT_METHODS = new Set(["bkash", "nagad", "recharge"]);
const STANDARD_ACCOUNT_TYPES = new Set(["personal", "agent", "merchant"]);
const RECHARGE_ACCOUNT_TYPES = new Set(["gp", "bl", "robi", "airtel", "teletalk"]);

function isValidMobileBD(v) { return /^01\d{9}$/.test(String(v || "").trim()); }
function round2(n) { return Number(Number(n || 0).toFixed(2)); }
function clamp0(n) { const x = Number(n || 0); return Number.isFinite(x) && x > 0 ? x : 0; }
function sec(n) { return Math.max(0, Math.floor(Number(n || 0))); }

async function getLast24hUsage(userId, now = new Date()) {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const uid = new mongoose.Types.ObjectId(userId);
  const agg = await Withdraw.aggregate([
    { $match: { userId: uid, status: { $in: ["pending", "successful"] }, date: { $gte: since } } },
    { $group: { _id: null, totalAmount: { $sum: "$amount" }, totalCount: { $sum: 1 }, oldest: { $min: "$date" } } },
  ]);
  const usedAmount = round2(Number(agg?.[0]?.totalAmount || 0));
  const usedCount = Number(agg?.[0]?.totalCount || 0);
  const oldest = agg?.[0]?.oldest ? new Date(agg[0].oldest) : null;
  const resetAt = oldest ? new Date(oldest.getTime() + 24 * 60 * 60 * 1000) : null;
  const retryAfterSec = oldest ? sec((resetAt.getTime() - now.getTime()) / 1000) : 0;
  return { usedAmount, usedCount, retryAfterSec, resetAt: resetAt ? resetAt.toISOString() : null };
}

export async function POST(req) {
  const uid = await getUserIdFromToken();
  if (!uid) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const amount = round2(Number(body.amount));
  const paymentMethod = String(body.paymentMethod || "bkash").toLowerCase();
  const accountType = String(body.accountType || "personal").toLowerCase();
  const mobile = String(body.mobile || "").trim();
  const note = String(body.note || "").trim();

  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ ok: false, message: "Invalid amount" }, { status: 400 });
  if (!PAYMENT_METHODS.has(paymentMethod)) return NextResponse.json({ ok: false, message: "Invalid method" }, { status: 400 });
  const allowedTypes = paymentMethod === "recharge" ? RECHARGE_ACCOUNT_TYPES : STANDARD_ACCOUNT_TYPES;
  if (!allowedTypes.has(accountType)) return NextResponse.json({ ok: false, message: "Invalid type" }, { status: 400 });
  if (!isValidMobileBD(mobile)) return NextResponse.json({ ok: false, message: "Invalid mobile" }, { status: 400 });
  if (note.length > 100) return NextResponse.json({ ok: false, message: "Note too long" }, { status: 400 });

  const user = await User.findById(uid);
  if (!user) return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });

  const s = await GeneralSettings.findOne({ key: "global" }).lean();
  const feePercent = paymentMethod === "recharge" ? 0 : clamp0(s?.withdrawFee ?? 0);
  const minWithdraw = paymentMethod === "recharge" ? clamp0(s?.rechargeMinWithdraw ?? 20) : clamp0(s?.minWithdraw ?? 0);
  const maxWithdraw = paymentMethod === "recharge" ? (s?.rechargeMaxWithdraw == null ? null : clamp0(s.rechargeMaxWithdraw)) : (s?.maxWithdraw == null ? null : clamp0(s.maxWithdraw));
  const dailyWithdrawLimit = s?.dailyWithdrawLimit == null ? null : Math.floor(clamp0(s.dailyWithdrawLimit));
  const dailyAmountLimit = s?.dailyAmountLimit == null ? null : round2(clamp0(s.dailyAmountLimit));

  if (minWithdraw && amount < minWithdraw) return NextResponse.json({ ok: false, message: "Min withdraw" }, { status: 400 });
  if (maxWithdraw !== null && amount > maxWithdraw) return NextResponse.json({ ok: false, message: "Max withdraw" }, { status: 400 });

  const feeAmount = round2((amount * feePercent) / 100);
  const totalDebit = round2(amount + feeAmount);
  const balance = clamp0(user.balance);
  if (totalDebit > balance) return NextResponse.json({ ok: false, message: `You need Tk ${totalDebit.toFixed(2)} balance` }, { status: 400 });

  const now = new Date();
  const usage = await getLast24hUsage(user._id, now);
  if (dailyWithdrawLimit !== null && usage.usedCount + 1 > dailyWithdrawLimit) {
    return NextResponse.json({ ok: false, code: "LIMIT_COUNT_24H", message: "24 hours withdraw limit exceeded", data: { ...usage, dailyWithdrawLimit, dailyAmountLimit, usedAmount: usage.usedAmount, usedCount: usage.usedCount } }, { status: 429 });
  }
  if (dailyAmountLimit !== null && round2(usage.usedAmount + amount) > dailyAmountLimit) {
    return NextResponse.json({ ok: false, code: "LIMIT_AMOUNT_24H", message: "24 hours amount limit exceeded", data: { ...usage, dailyWithdrawLimit, dailyAmountLimit, usedAmount: usage.usedAmount, usedCount: usage.usedCount, tryAmount: amount } }, { status: 429 });
  }

  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const w = await Withdraw.create([{
      userId: user._id,
      amount,
      feeAmount,
      totalDebit,
      paymentMethod,
      accountType,
      mobile,
      note,
      paymentProof: "",
      status: "pending",
      date: now,
    }], { session });

    const tx = await Transaction.create([{
      user: user._id,
      type: "withdraw",
      status: "processing",
      amount,
      note: `Withdrawal request submitted: Tk${amount}.`,
      date: now,
    }], { session });

    user.balance = round2(balance - totalDebit);
    user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
    user.transactions.push(tx[0]._id);
    if (Array.isArray(user.withdraw)) user.withdraw.push(w[0]._id);
    else user.withdraw = [w[0]._id];

    await user.save({ session });
    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({ ok: true, message: "Withdraw requested", data: { withdrawId: String(w[0]._id), newBalance: user.balance, feeAmount, receiveAmount: amount, totalDebit } }, { status: 200 });
  } catch (e) {
    try { if (session) { await session.abortTransaction(); session.endSession(); } } catch {}
    return NextResponse.json({ ok: false, message: "Withdraw failed" }, { status: 500 });
  }
}
