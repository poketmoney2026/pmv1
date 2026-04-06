import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req, ctx) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const params = await ctx.params;
  const id = String(params?.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ ok: false, message: "Invalid user" }, { status: 400 });

  const user = await User.findById(id).select("fullName mobile balance referrals").lean();
  if (!user) return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  const ids = Array.isArray(user.referrals) ? user.referrals : [];
  const refs = ids.length ? await User.find({ _id: { $in: ids } }).select("fullName mobile balance joinDate createdAt").lean() : [];
  const byId = new Map(refs.map((row) => [String(row._id), row]));
  const referredUsers = ids.map((rid) => byId.get(String(rid))).filter(Boolean).map((row) => ({
    _id: String(row._id),
    fullName: row.fullName || "User",
    mobile: row.mobile || "",
    balance: Number(row.balance || 0),
    joinDate: row.joinDate || row.createdAt || null,
  }));
  return NextResponse.json({ ok: true, data: {
    _id: id,
    fullName: user.fullName || "User",
    mobile: user.mobile || "",
    balance: Number(user.balance || 0),
    referredUsers,
  } }, { status: 200 });
}
