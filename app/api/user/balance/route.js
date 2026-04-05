// app/api/user/balance/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getUserIdFromToken } from "@/lib/auth";

export async function GET() {
  const uid = await getUserIdFromToken();
  if (!uid) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const user = await User.findById(uid).select("balance status").lean();
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
  if (String(user.status || "active") !== "active") return NextResponse.json({ message: "Your account is inactive. Please contact support." }, { status: 403 });

  const res = NextResponse.json(
    { ok: true, data: { balance: Number(user.balance || 0) } },
    { status: 200 }
  );

  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");

  return res;
}
