
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getAuthUserFromRequest } from "@/lib/auth";

function safeStr(v) {
  return String(v ?? "").trim();
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const q = safeStr(searchParams.get("q"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
  const match = { role: { $in: ["user", "agent"] } };
  if (q) {
    match.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { mobile: { $regex: q, $options: "i" } },
      { referralCode: { $regex: q, $options: "i" } },
    ];
  }
  const users = await User.find(match)
    .select("_id fullName mobile role status balance referralCode createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return NextResponse.json({ ok: true, users }, { status: 200 });
}

export async function PATCH(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const userId = safeStr(body.userId);
  const nextRole = safeStr(body.role).toLowerCase();
  if (!userId) return NextResponse.json({ ok: false, message: "User id required" }, { status: 400 });
  if (!["user", "agent"].includes(nextRole)) return NextResponse.json({ ok: false, message: "Only user and agent roles are allowed." }, { status: 400 });
  if (String(auth.userId) === userId) return NextResponse.json({ ok: false, message: "You cannot change your own role." }, { status: 400 });

  const target = await User.findById(userId).select("_id fullName mobile role status");
  if (!target) return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  if (String(target.role || "user").toLowerCase() === "admin") {
    return NextResponse.json({ ok: false, message: "Admin role cannot be changed from this page." }, { status: 400 });
  }
  target.role = nextRole;
  await target.save();
  return NextResponse.json({ ok: true, message: `Role updated to ${nextRole}.`, user: { _id: String(target._id), fullName: target.fullName || "", mobile: target.mobile || "", role: target.role, status: target.status || "active" } }, { status: 200 });
}
