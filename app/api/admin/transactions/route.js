import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { getAuthUserFromRequest } from "@/lib/auth";
import { loadAdminTransactions } from "@/lib/adminTransactions";
import Deposit from "@/models/Deposit";
import Withdraw from "@/models/Withdraw";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import ReferralIncome from "@/models/ReferralIncome";
import GeneralSettings from "@/models/GeneralSettings";

const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

async function creditReferralForDeposit(user, amount, session) {
  const settings = await GeneralSettings.findOne({ key: "global" }).lean();
  const firstReferralPercent = Number(settings?.firstReferralBonus ?? 10);
  const regularReferralPercent = Number(settings?.regularReferralBonus ?? 0);
  let referralPaid = false;
  if (!user?.referredBy) return referralPaid;
  const refUser = await User.findById(user.referredBy).session(session);
  if (!refUser || String(refUser.status || "active") !== "active") return referralPaid;
  const alreadyPaid = Boolean(user.referralBonus);
  const bonusPercent = alreadyPaid ? regularReferralPercent : firstReferralPercent;
  const bonus = round2((Number(amount || 0) * bonusPercent) / 100);
  if (bonus <= 0) return referralPaid;
  refUser.balance = Number(refUser.balance || 0) + bonus;
  const tRef = await Transaction.create([{ user: refUser._id, type: "referralBonus", status: "successful", amount: bonus, note: `Referral bonus credited: Tk${bonus}`, date: new Date() }], { session });
  refUser.transactions = Array.isArray(refUser.transactions) ? refUser.transactions : [];
  refUser.transactions.push(tRef[0]._id);
  await refUser.save({ session });
  await ReferralIncome.findOneAndUpdate({ userId: refUser._id }, { $inc: { amount: bonus }, $setOnInsert: { date: new Date() } }, { upsert: true, new: true, session });
  if (!alreadyPaid) user.referralBonus = true;
  referralPaid = true;
  return referralPaid;
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";
  const source = searchParams.get("source") || "";
  const userId = searchParams.get("userId") || "";
  const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit") || 50)));
  const offset = Math.max(0, Number(searchParams.get("offset") || 0));

  const data = await loadAdminTransactions({ q, type, status, source, userId, limit, offset });
  return NextResponse.json({ ok: true, data: { items: data.rows, facets: data.facets, total: data.total, hasMore: offset + data.rows.length < data.total } }, { status: 200 });
}

export async function POST(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const source = String(body.source || "").toLowerCase();
  const entityId = String(body.entityId || "").trim();
  const action = String(body.action || "").toLowerCase();
  const paymentProof = String(body.paymentProof || "").trim();

  if (!entityId || !["deposit", "withdraw"].includes(source) || !["success", "reject"].includes(action)) {
    return NextResponse.json({ ok: false, message: "Invalid request" }, { status: 400 });
  }

  const session = await mongoose.startSession();
  try {
    let message = "Updated";
    await session.withTransaction(async () => {
      if (source === "deposit") {
        const dep = await Deposit.findById(entityId).session(session);
        if (!dep) throw new Error("Deposit not found");
        const user = await User.findById(dep.userId).session(session);
        if (!user) throw new Error("User not found");
        const amount = Number(dep.amount || 0);

        if (action === "reject") {
          if (String(dep.status) === "success") throw new Error("Successful deposits are locked here");
          dep.status = "reject";
          dep.type = "none";
          await dep.save({ session });
          message = "Deposit rejected";
          return;
        }

        if (String(dep.status) === "success") throw new Error("Deposit already successful");
        dep.status = "success";
        dep.type = "running";
        dep.createdDate = dep.createdDate || new Date();
        dep.claimDate = dep.claimDate || new Date();
        await dep.save({ session });

        const tDeposit = await Transaction.create([{ user: user._id, type: "deposit", status: "successful", amount, note: `Deposit added successfully: ${amount}`, date: new Date() }], { session });
        user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
        user.transactions.push(tDeposit[0]._id);
        await creditReferralForDeposit(user, amount, session);
        await user.save({ session });
        message = "Deposit successful";
        return;
      }

      const w = await Withdraw.findById(entityId).session(session);
      if (!w) throw new Error("Withdraw not found");
      const user = await User.findById(w.userId).session(session);
      if (!user) throw new Error("User not found");
      const amount = Number(w.amount || 0);
      const feeAmount = Number(w.feeAmount || 0);
      const debitAmount = Number(w.totalDebit || amount + feeAmount);

      if (action === "success") {
        if (String(w.status) === "successful") throw new Error("Withdrawal already successful");
        if (String(w.status) === "reject") {
          if (Number(user.balance || 0) < debitAmount) throw new Error("User does not have enough balance now");
          user.balance = round2(Number(user.balance || 0) - debitAmount);
          await user.save({ session });
        }
        w.status = "successful";
        if (paymentProof) w.paymentProof = paymentProof;
        await w.save({ session });
        const tx = await Transaction.create([{ user: user._id, type: "withdraw", status: "successful", amount, note: `Withdrawal of Tk${amount} has been marked successful.`, date: new Date() }], { session });
        await User.updateOne({ _id: user._id }, { $push: { transactions: tx[0]._id } }, { session });
        message = "Withdrawal marked successful";
        return;
      }

      if (String(w.status) === "successful") throw new Error("Successful withdrawals are locked here");
      if (String(w.status) !== "reject") {
        w.status = "reject";
        await w.save({ session });
        await User.updateOne({ _id: user._id }, { $inc: { balance: debitAmount } }, { session });
        const tx = await Transaction.create([{ user: user._id, type: "refund", status: "successful", amount: debitAmount, note: "Withdrawal rejected and refunded to balance.", date: new Date() }], { session });
        await User.updateOne({ _id: user._id }, { $push: { transactions: tx[0]._id } }, { session });
      }
      message = "Withdrawal rejected and refunded";
    });

    return NextResponse.json({ ok: true, message }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error?.message || "Action failed" }, { status: 400 });
  } finally {
    await session.endSession();
  }
}
