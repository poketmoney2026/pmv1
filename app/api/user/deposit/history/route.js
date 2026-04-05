// app/api/user/deposit/history/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Deposit from "@/models/Deposit";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function getAuthUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload?.userId ? String(payload.userId) : null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const skip = Math.max(0, Number(searchParams.get("skip") || 0));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));

  await dbConnect();

  const user = await User.findById(userId).select("_id name fullName mobile status").lean();
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const items = await Deposit.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

  const userName = user?.name || user?.fullName || user?.mobile || "User";

  const mapped = (items || []).map((d) => ({
    _id: String(d._id),
    userId: String(user._id).slice(-6),
    userName,
    createdAt: d.createdAt,
    mobile: d.senderNumber || "—",
    method: d.paymentMethod || "—",
    amount: d.amount || 0,
    verifyVia: d.verifyMode || "—",
    status: d.status || "processing",
    trxId: d.trxId || "",
    screenshotUrl: d.screenshotUrl || "",
    paymentProofImageUrl: d.paymentProofImageUrl || "",
  }));

  return NextResponse.json({ ok: true, data: { items: mapped } }, { status: 200 });
}
