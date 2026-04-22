import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Notice from "@/models/Notice";
import { getAuthUserFromRequest } from "@/lib/auth";

const cleanMobile = (v) => String(v || "").replace(/\D/g, "");

function randomKey() {
  return `notice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toClient(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    key: doc.key || "",
    title: doc.title || "NOTICE",
    body: doc.body || "",
    isActive: doc.isActive !== false,
    type: doc.type === "news" ? "news" : "modal",
    intervalMin: Math.max(1, Number(doc.intervalMin || 30)),
    maxShows: Math.max(0, Number(doc.maxShows || 0)),
    targetMobile: doc.targetMobile || "",
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;

  await dbConnect();
  const rows = await Notice.find({}).sort({ updatedAt: -1, createdAt: -1 }).lean();
  return NextResponse.json({ ok: true, items: rows.map(toClient) }, { status: 200 });
}

export async function PUT(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;

  await dbConnect();
  const body = await req.json().catch(() => ({}));

  const id = String(body.id || "").trim();
  const title = String(body.title || "NOTICE").trim().slice(0, 80) || "NOTICE";
  const noticeBody = String(body.body || "").trim().slice(0, 5000);
  const isActive = body.isActive !== false;
  const type = String(body.type || "modal").toLowerCase() === "news" ? "news" : "modal";
  const intervalMin = Math.max(1, Math.floor(Number(body.intervalMin || 30)));
  const maxShows = Math.max(0, Math.floor(Number(body.maxShows || 0)));
  const targetMobile = cleanMobile(body.targetMobile || "");

  let doc;
  if (id) {
    doc = await Notice.findByIdAndUpdate(
      id,
      { $set: { title, body: noticeBody, isActive, type, intervalMin, maxShows, targetMobile } },
      { new: true }
    ).lean();
    if (!doc) {
      return NextResponse.json({ ok: false, message: "Notice not found" }, { status: 404 });
    }
  } else {
    doc = await Notice.create({
      key: randomKey(),
      title,
      body: noticeBody,
      isActive,
      type,
      intervalMin,
      maxShows,
      targetMobile,
    });
    doc = doc.toObject();
  }

  return NextResponse.json({ ok: true, message: id ? "Notice updated" : "Notice created", item: toClient(doc) }, { status: 200 });
}

export async function PATCH(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;

  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ ok: false, message: "Missing notice id" }, { status: 400 });

  const update = {};
  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    update.isActive = Boolean(body.isActive);
  }
  if (!Object.keys(update).length) {
    return NextResponse.json({ ok: false, message: "No changes provided" }, { status: 400 });
  }

  const doc = await Notice.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!doc) return NextResponse.json({ ok: false, message: "Notice not found" }, { status: 404 });

  return NextResponse.json({ ok: true, message: "Notice status updated", item: toClient(doc) }, { status: 200 });
}

export async function DELETE(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json({ ok: false, message: "Missing notice id" }, { status: 400 });

  const deleted = await Notice.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ ok: false, message: "Notice not found" }, { status: 404 });

  return NextResponse.json({ ok: true, message: "Notice deleted" }, { status: 200 });
}
