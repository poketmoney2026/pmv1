// app/api/user/withdraw-history/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Withdraw from "@/models/Withdraw";
import { getUserIdFromToken } from "@/lib/auth";

function toInt(v, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

export async function GET(req) {
  const uid = await getUserIdFromToken();
  if (!uid) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const skip = toInt(searchParams.get("skip"), 0);
  const limit = Math.min(50, toInt(searchParams.get("limit"), 10));

  const user = await User.findById(uid).select("_id withdraw withdraws withdrawals status").lean();
  if (!user) return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  if (String(user.status || "active") !== "active") return NextResponse.json({ ok: false, message: "Your account is inactive. Please contact support." }, { status: 403 });

  const rawIds =
    (Array.isArray(user?.withdraw) && user.withdraw) ||
    (Array.isArray(user?.withdraws) && user.withdraws) ||
    (Array.isArray(user?.withdrawals) && user.withdrawals) ||
    [];

  if (rawIds.length) {
    const ordered = rawIds.map((x) => String(x)).reverse();
    const pageIds = ordered.slice(skip, skip + limit + 1);
    const docs = await Withdraw.find({ _id: { $in: pageIds } }).lean();
    const byId = new Map(docs.map((d) => [String(d._id), d]));
    const items = pageIds.map((id) => byId.get(id)).filter(Boolean);
    const hasMore = items.length > limit;
    const slice = hasMore ? items.slice(0, limit) : items;

    return NextResponse.json({
      ok: true,
      data: {
        items: slice.map((w) => ({
          _id: String(w._id),
          amount: Number(w.amount || 0),
          paymentMethod: String(w.paymentMethod || "bkash"),
          accountType: String(w.accountType || "personal"),
          mobile: String(w.mobile || ""),
          note: String(w.note || ""),
          paymentProof: String(w.paymentProof || ""),
          status: String(w.status || "pending"),
          createdAt: w.createdAt,
          processingExpiresAt: w.processingExpiresAt || null,
        })),
        hasMore,
      },
    });
  }

  const list = await Withdraw.find({ userId: uid }).sort({ createdAt: -1 }).skip(skip).limit(limit + 1).lean();
  const hasMore = list.length > limit;
  const items = hasMore ? list.slice(0, limit) : list;

  return NextResponse.json({
    ok: true,
    data: {
      items: items.map((w) => ({
        _id: String(w._id),
        amount: Number(w.amount || 0),
        paymentMethod: String(w.paymentMethod || "bkash"),
        accountType: String(w.accountType || "personal"),
        mobile: String(w.mobile || ""),
        note: String(w.note || ""),
        paymentProof: String(w.paymentProof || ""),
        status: String(w.status || "pending"),
        createdAt: w.createdAt,
        processingExpiresAt: w.processingExpiresAt || null,
      })),
      hasMore,
    },
  });
}
