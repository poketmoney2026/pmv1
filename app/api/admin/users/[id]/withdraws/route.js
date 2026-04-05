import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Withdraw from "@/models/Withdraw";
import Transaction from "@/models/Transaction";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) return { ok: false, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  try {
    const { payload } = await jwtVerify(token, secret);
    const role = String(payload?.role || "user").toLowerCase();
    if (role !== "admin") return { ok: false, res: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
    return { ok: true, payload };
  } catch {
    return { ok: false, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
}

export async function GET(req, context) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  await dbConnect();

  const { id } = await context.params;
  const uid = String(id || "");
  if (!uid || !mongoose.Types.ObjectId.isValid(uid)) return NextResponse.json({ message: "Invalid user id" }, { status: 400 });

  const withdraws = await Withdraw.find({ userId: uid })
    .sort({ createdAt: -1 })
    .limit(200)
    .select("amount paymentMethod accountType mobile note paymentProof status createdAt")
    .lean();

  const depAgg = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(uid), type: "deposit", status: "successful" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const wdAgg = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(uid), type: "withdraw", status: "successful" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const depositAmount = Number(depAgg?.[0]?.total || 0);
  const withdrawAmount = Number(wdAgg?.[0]?.total || 0);

  return NextResponse.json({
    ok: true,
    data: {
      items: withdraws.map((w) => ({
        _id: String(w._id),
        createdAt: w.createdAt,
        mobile: String(w.mobile || ""),
        status: String(w.status || "pending"),
        amount: Number(w.amount || 0),
        netAmount: Number(w.amount || 0),
        paymentMethod: String(w.paymentMethod || "bkash"),
        accountType: String(w.accountType || "personal"),
      })),
      totals: { depositAmount, withdrawAmount },
    },
  });
}
