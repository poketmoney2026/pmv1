import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Notice from "@/models/Notice";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const doc = await Notice.findOne({ key: "global" }).lean();
  return NextResponse.json({ ok: true, data: { title: doc?.title || "NOTICE", body: doc?.body || "", isActive: doc?.isActive !== false } }, { status: 200 });
}

export async function PUT(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "NOTICE").trim().slice(0, 80) || "NOTICE";
  const noticeBody = String(body.body || "").trim().slice(0, 5000);
  const isActive = body.isActive !== false;
  const updated = await Notice.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global" }, $set: { title, body: noticeBody, isActive } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return NextResponse.json({ ok: true, message: "Notice saved", data: { title: updated.title, body: updated.body, isActive: updated.isActive } }, { status: 200 });
}
