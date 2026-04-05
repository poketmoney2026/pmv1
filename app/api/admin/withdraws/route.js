import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import Withdraw from "@/models/Withdraw";
import GeneralSettings from "@/models/GeneralSettings";

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
function toInt(v, fallback) { const n = Number(v); return !Number.isFinite(n) || n < 0 ? fallback : Math.floor(n); }
function round2(n) { return Number(Number(n || 0).toFixed(2)); }
export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  await dbConnect();
  const settings = await GeneralSettings.findOne({ key: "global" }).lean();
  const feePercent = Number(settings?.withdrawFee ?? 0);
  const { searchParams } = new URL(req.url);
  const status = String(searchParams.get("status") || "all").toLowerCase();
  const skip = toInt(searchParams.get("skip"), 0);
  const limit = Math.min(200, toInt(searchParams.get("limit"), 50));
  const q = String(searchParams.get("q") || "").trim();
  const filter = {};
  if (status !== "all") filter.status = status;
  if (q) filter.mobile = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const list = await Withdraw.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit + 1).populate("userId", "fullName mobile").lean();
  const hasMore = list.length > limit;
  const items = hasMore ? list.slice(0, limit) : list;
  return NextResponse.json({ ok: true, data: { feePercent, items: items.map((w) => {
    const amount = Number(w.amount || 0);
    const feeAmount = w.feeAmount != null ? round2(w.feeAmount) : (String(w.paymentMethod) === "recharge" ? 0 : round2((amount * Math.max(0, feePercent)) / 100));
    const totalDebit = w.totalDebit != null ? round2(w.totalDebit) : round2(amount + feeAmount);
    return {
      _id: String(w._id),
      user: w.userId ? { _id: String(w.userId._id), fullName: String(w.userId.fullName || ""), mobile: String(w.userId.mobile || "") } : null,
      userId: String(w.userId?._id || w.userId || ""),
      amount,
      feeAmount,
      totalDebit,
      netAmount: amount,
      payoutAmount: amount,
      paymentMethod: String(w.paymentMethod || "bkash"),
      accountType: String(w.accountType || "personal"),
      mobile: String(w.mobile || ""),
      note: String(w.note || ""),
      paymentProof: String(w.paymentProof || ""),
      status: String(w.status || "pending"),
      createdAt: w.createdAt,
    };
  }), hasMore } });
}
