import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");

export async function decodeTokenValue(token) {
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload || null;
  } catch {
    return null;
  }
}

export function clearAuthCookieJson(body = { ok: false, message: "Unauthorized" }, status = 401) {
  const res = NextResponse.json(body, { status });
  res.cookies.set({ name: "token", value: "", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return res;
}

export async function getUserIdFromToken(options = {}) {
  const { allowInactive = false } = options;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  const payload = await decodeTokenValue(token);
  const userId = payload?.uid || payload?.userId || payload?.id || payload?.sub || null;
  if (!userId) return null;
  await dbConnect();
  const user = await User.findById(userId).select("_id status").lean();
  if (!user) return null;
  if (!allowInactive && String(user.status || "active") !== "active") return null;
  return String(user._id);
}

export async function getAuthUserFromRequest(req, options = {}) {
  const { requireAdmin = false, allowInactive = false } = options;
  const token = req.cookies.get("token")?.value || "";
  const payload = await decodeTokenValue(token);
  const userId = payload?.uid || payload?.userId || payload?.id || payload?.sub || null;
  if (!userId) {
    return { ok: false, res: clearAuthCookieJson({ ok: false, message: "Unauthorized", reason: "invalid_token" }, 401) };
  }

  await dbConnect();
  const user = await User.findById(userId).select("_id role status inactiveReason fullName mobile referralCode balance").lean();
  if (!user) {
    return { ok: false, res: clearAuthCookieJson({ ok: false, message: "User not found", reason: "deleted_user" }, 401) };
  }

  const status = String(user.status || "active").toLowerCase();
  const rawRole = String(user.role || "user").toLowerCase();
  const role = ["admin", "agent", "user"].includes(rawRole) ? rawRole : "user";

  if (!allowInactive && status !== "active") {
    return { ok: false, res: NextResponse.json({ ok: false, message: "Your account is inactive. Please contact support.", reason: "inactive", role, status, inactiveReason: user.inactiveReason || "" }, { status: 403 }) };
  }

  if (requireAdmin && role !== "admin") {
    return { ok: false, res: NextResponse.json({ ok: false, message: "Admin only", reason: "forbidden", role, status }, { status: 403 }) };
  }

  return { ok: true, payload, userId: String(user._id), user: { ...user, role, status } };
}
