import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Notice from "@/models/Notice";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: true });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const doc = await Notice.findOne({ key: "global" }).lean();
  return NextResponse.json({ ok: true, data: { title: doc?.title || "NOTICE", body: doc?.body || "", isActive: doc?.isActive !== false, updatedAt: doc?.updatedAt || null } }, { status: 200 });
}
