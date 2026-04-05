import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req, ctx) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const { params } = ctx || {};
  const p = params ? await params : {};
  const id = String(p?.id || "");
  if (!id) return NextResponse.json({ ok: false, message: "Invalid user id" }, { status: 400 });

  const user = await User.findById(id).select("fullName mobile balance referralCode role status joinDate createdAt").lean();
  if (!user) return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });

  const transactions = await Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(100).select("type status amount note createdAt date").lean();

  return NextResponse.json({
    ok: true,
    data: {
      user: {
        _id: String(user._id),
        fullName: user.fullName || "",
        mobile: user.mobile || "",
        balance: Number(user.balance || 0),
        referralCode: user.referralCode || "",
        role: user.role || "user",
        status: user.status || "active",
        joinDate: user.joinDate || user.createdAt || null,
      },
      summary: {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      },
      transactions: transactions.map((row) => ({
        _id: String(row._id),
        type: row.type || "",
        status: row.status || "",
        amount: Number(row.amount || 0),
        note: row.note || "",
        createdAt: row.createdAt || row.date || null,
      })),
    },
  });
}
