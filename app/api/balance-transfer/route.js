import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getUserIdFromToken } from "@/lib/auth";

const DAY_MS = 24 * 60 * 60 * 1000;
const MOBILE_RE = /^01\d{9}$/;
const clean = (s) => String(s || "").trim();
const normMobile = (s) => clean(s).replace(/\D/g, "").slice(0, 11);

const parseMoney = (v) => {
  const s = String(v ?? "").replace(/[^\d.]/g, "");
  if (!s) return null;
  const parts = s.split(".");
  if (parts.length > 2) return null;
  const intPart = parts[0] || "0";
  const decPart = (parts[1] || "").slice(0, 2);
  const n = Number(decPart ? `${intPart}.${decPart}` : intPart);
  if (!Number.isFinite(n)) return null;
  return Number(n.toFixed(2));
};

const getLastPayment = async (userId) => {
  const tx = await Transaction.findOne({ user: userId, type: "payment", status: "successful" }).sort({ createdAt: -1 }).select("createdAt").lean();
  return tx?.createdAt ? new Date(tx.createdAt).getTime() : 0;
};

function buildUserQuery(identifier) {
  const mobile = normMobile(identifier);
  if (MOBILE_RE.test(mobile)) return { mobile };
  return null;
}

export async function GET() {
  try {
    await dbConnect();
    const uid = await getUserIdFromToken();
    if (!uid) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const userId = new mongoose.Types.ObjectId(uid);
    const me = await User.findById(userId).select("balance").lean();
    if (!me) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const lastAt = await getLastPayment(userId);
    const now = Date.now();
    const diff = lastAt ? Math.max(0, now - lastAt) : 0;
    const remainingMs = lastAt && diff < DAY_MS ? DAY_MS - diff : 0;
    const nextAllowedAt = remainingMs ? new Date(now + remainingMs).toISOString() : null;

    return NextResponse.json({ balance: Number(me.balance || 0), lastPaymentAt: lastAt ? new Date(lastAt).toISOString() : null, remainingMs, nextAllowedAt }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await mongoose.startSession();
  try {
    await dbConnect();
    const uid = await getUserIdFromToken();
    if (!uid) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const userId = new mongoose.Types.ObjectId(uid);

    const body = await req.json().catch(() => ({}));
    const identifier = String(body.identifier || body.mobile || "");
    const receiverQuery = buildUserQuery(identifier);
    const amount = parseMoney(body.amount);

    if (!receiverQuery) return NextResponse.json({ message: "Invalid receiver mobile number" }, { status: 400 });
    if (amount == null || amount < 10 || amount > 1000) return NextResponse.json({ message: "Invalid amount" }, { status: 400 });

    const lastAt = await getLastPayment(userId);
    const now = Date.now();
    if (lastAt && now - lastAt < DAY_MS) {
      const remainingMs = DAY_MS - (now - lastAt);
      return NextResponse.json({ message: "Cooldown active", remainingMs, nextAllowedAt: new Date(now + remainingMs).toISOString() }, { status: 429 });
    }

    let result = null;
    await session.withTransaction(async () => {
      const sender = await User.findById(userId).select("_id fullName mobile balance transactions status").session(session);
      if (!sender || String(sender.status || "active") !== "active") throw new Error("Sender not found");
      if (Number(sender.balance || 0) < amount) throw new Error("Insufficient balance");

      const receiver = await User.findOne(receiverQuery).select("_id fullName mobile balance transactions status").session(session);
      if (!receiver || String(receiver.status || "active") !== "active") throw new Error("Receiver not found");
      if (String(receiver._id) === String(sender._id)) throw new Error("Self transfer not allowed");

      const fee = Number((amount * 0.005).toFixed(2));
      const net = Number((amount - fee).toFixed(2));
      if (net <= 0) throw new Error("Invalid net");

      sender.balance = Number(sender.balance || 0) - amount;
      receiver.balance = Number(receiver.balance || 0) + net;
      await sender.save({ session });
      await receiver.save({ session });

      const senderName = clean(sender.fullName) || clean(sender.mobile) || "User";
      const receiverName = clean(receiver.fullName) || clean(receiver.mobile) || "User";

      const txPay = await Transaction.create([{ user: sender._id, type: "payment", status: "successful", amount: net, note: `Transfer sent from your account: Tk${net.toFixed(2)}. Receiver: ${receiverName}` }], { session });
      const txFee = await Transaction.create([{ user: sender._id, type: "debit", status: "successful", amount: fee, note: `Transfer fee charged: Tk${fee.toFixed(2)} (0.5%). Receiver: ${receiverName}` }], { session });
      const txRecv = await Transaction.create([{ user: receiver._id, type: "credit", status: "successful", amount: net, note: `Amount received in your account: Tk${net.toFixed(2)}. Sender: ${senderName}` }], { session });

      await User.updateOne({ _id: sender._id }, { $push: { transactions: { $each: [txPay[0]._id, txFee[0]._id] } } }, { session });
      await User.updateOne({ _id: receiver._id }, { $push: { transactions: txRecv[0]._id } }, { session });
      result = { net, fee };
    });

    return NextResponse.json({ message: "Transfer successful", ...result }, { status: 200 });
  } catch (e) {
    const msg = String(e?.message || "Server error");
    if (msg === "Insufficient balance") return NextResponse.json({ message: msg }, { status: 400 });
    if (msg === "Receiver not found") return NextResponse.json({ message: msg }, { status: 404 });
    if (msg === "Self transfer not allowed") return NextResponse.json({ message: msg }, { status: 400 });
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    session.endSession();
  }
}
