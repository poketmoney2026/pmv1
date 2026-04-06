import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getAuthUserFromRequest } from "@/lib/auth";

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, toInt(searchParams.get("offset"), 0));
  const limit = Math.min(20, Math.max(1, toInt(searchParams.get("limit"), 5)));
  const q = String(searchParams.get("q") || "").trim();

  const match = { role: "user" };
  if (q) match.mobile = { $regex: q.replace(/\D/g, ""), $options: "i" };

  const rows = await User.aggregate([
    { $match: match },
    { $addFields: { referralsCount: { $size: { $ifNull: ["$referrals", []] } } } },
    { $sort: { referralsCount: -1, createdAt: 1 } },
    { $skip: offset },
    { $limit: limit + 1 },
    { $project: { fullName: 1, mobile: 1, balance: 1, referralsCount: 1 } },
  ]);

  const hasMore = rows.length > limit;
  const users = hasMore ? rows.slice(0, limit) : rows;
  return NextResponse.json({ ok: true, data: users.map((u) => ({
    _id: String(u._id),
    fullName: u.fullName || "User",
    mobile: u.mobile || "",
    balance: Number(u.balance || 0),
    referralsCount: Number(u.referralsCount || 0),
  })), hasMore }, { status: 200 });
}
