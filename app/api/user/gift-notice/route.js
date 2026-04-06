import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  await User.updateOne({ _id: auth.userId }, { $set: { giftNoticeOpen: false, giftNoticeAmount: 0 } });
  return NextResponse.json({ ok: true, message: "Gift notice closed" }, { status: 200 });
}
