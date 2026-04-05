import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = NextResponse.json(
      { ok: true, message: "Logout successful" },
      { status: 200 }
    );

    // ✅ Clear auth cookie (httpOnly)
    res.cookies.set({
      name: "token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error("LOGOUT_ERROR:", err);
    return NextResponse.json(
      { ok: false, message: "Logout failed" },
      { status: 500 }
    );
  }
}
