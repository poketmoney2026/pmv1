import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

function isBdMobile11(phone) {
  return /^01\d{9}$/.test(String(phone || "").trim());
}

async function signToken(userId, role) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");

  const key = new TextEncoder().encode(secret);
  const safeRole = ["admin", "agent", "user"].includes(String(role || "user").toLowerCase()) ? String(role || "user").toLowerCase() : "user";

  return new SignJWT({ userId: String(userId), role: safeRole })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(key);
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const mobile = String(body.mobile || "").trim();
    const password = String(body.password || "");

    if (!isBdMobile11(mobile)) {
      return NextResponse.json({ ok: false, message: "Invalid mobile number." }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ ok: false, message: "Invalid password." }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ mobile }).select("_id password status role");
    if (!user) {
      return NextResponse.json({ ok: false, message: "No account found with this mobile number." }, { status: 404 });
    }

    if (String(user.status || "active") === "inactive") {
      return NextResponse.json({ ok: false, message: "Your account is inactive. Please contact support." }, { status: 403 });
    }

    if (String(user.password || "") !== password) {
      return NextResponse.json({ ok: false, message: "Mobile number or password is incorrect." }, { status: 401 });
    }

    const token = await signToken(user._id, user.role);

    const res = NextResponse.json({ ok: true, message: "Sign in successful" }, { status: 200 });
    res.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (err) {
    console.error("SIGNIN_ERROR:", err);
    return NextResponse.json({ ok: false, message: "Server error. Please try again." }, { status: 500 });
  }
}
