import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import Transaction from "@/models/Transaction";

async function getUserIdFromToken() {
  const cookieStore = await cookies(); // ✅ Next 15+ requires await
  const token = cookieStore.get("token")?.value || "";
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return String(payload?.userId || "") || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    await dbConnect();

    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const list = await Transaction.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ ok: true, transactions: list }, { status: 200 });
  } catch (err) {
    console.error("USER_TX_LIST_ERROR:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
