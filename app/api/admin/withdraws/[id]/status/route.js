import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Withdraw from "@/models/Withdraw";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) return { ok: false, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  try { const { payload } = await jwtVerify(token, secret); if (String(payload?.role || "user").toLowerCase() !== "admin") return { ok: false, res: NextResponse.json({ message: "Forbidden" }, { status: 403 }) }; return { ok: true, payload }; } catch { return { ok: false, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) }; }
}
export async function PUT(req, context) {
  const auth = await requireAdmin(req); if (!auth.ok) return auth.res;
  await dbConnect();
  const { id } = await context.params; const wid = String(id || "");
  if (!wid || !mongoose.Types.ObjectId.isValid(wid)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "").toLowerCase();
  const paymentProof = String(body?.paymentProof || "").trim();
  if (!["success", "reject"].includes(action)) return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  if (action === "success" && (!paymentProof || !/^https?:\/\//i.test(paymentProof))) return NextResponse.json({ message: "Payment proof required" }, { status: 400 });
  const session = await mongoose.startSession();
  try {
    let resultMessage = "";
    await session.withTransaction(async () => {
      const w = await Withdraw.findById(wid).session(session);
      if (!w) throw new Error("Withdraw not found");
      if (String(w.status) !== "pending") throw new Error("Only pending withdrawals can be updated");
      const user = await User.findById(w.userId).session(session);
      if (!user) throw new Error("User not found");
      const amount = Number(w.amount || 0);
      const feeAmount = Number(w.feeAmount || 0);
      const refundAmount = Number(w.totalDebit || amount + feeAmount);
      if (action === "success") {
        w.status = "successful";
        w.paymentProof = paymentProof;
        await w.save({ session });
        const tx = await Transaction.create([{ user: user._id, type: "withdraw", status: "successful", amount, note: `Withdrawal of Tk${amount} has been marked successful.`, date: new Date() }], { session });
        await User.updateOne({ _id: user._id }, { $push: { transactions: tx[0]._id } }, { session });
        resultMessage = "Withdrawal marked as successful";
        return;
      }
      w.status = "reject";
      await w.save({ session });
      await User.updateOne({ _id: user._id }, { $inc: { balance: refundAmount } }, { session });
      const tx = await Transaction.create([{ user: user._id, type: "refund", status: "successful", amount: refundAmount, note: "Withdrawal rejected and refunded to balance.", date: new Date() }], { session });
      await User.updateOne({ _id: user._id }, { $push: { transactions: tx[0]._id } }, { session });
      resultMessage = "Withdrawal rejected and refunded";
    });
    return NextResponse.json({ ok: true, message: resultMessage });
  } catch (e) {
    return NextResponse.json({ message: e?.message || "Action failed" }, { status: 400 });
  } finally { session.endSession(); }
}
