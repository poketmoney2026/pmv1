import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SiteUpdate from "@/models/SiteUpdate";
import { getAuthUserFromRequest } from "@/lib/auth";

function shape(doc) {
  return {
    startAt: doc?.startAt || null,
    endAt: doc?.endAt || null,
    notifyEveryMin: Number(doc?.notifyEveryMin || 30),
    isActive: Boolean(doc?.isActive),
    updatedAt: doc?.updatedAt || null,
  };
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const doc = await SiteUpdate.findOne({ key: "global" }).lean();
  return NextResponse.json({ ok: true, data: shape(doc) }, { status: 200 });
}

export async function PUT(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const startAt = body?.startAt ? new Date(body.startAt) : null;
  const endAt = body?.endAt ? new Date(body.endAt) : null;
  const notifyEveryMin = Number(body?.notifyEveryMin || 30);

  if ((body?.startAt && Number.isNaN(startAt?.getTime?.())) || (body?.endAt && Number.isNaN(endAt?.getTime?.()))) {
    return NextResponse.json({ ok: false, message: "Invalid date/time" }, { status: 400 });
  }
  if ((startAt && !endAt) || (!startAt && endAt)) {
    return NextResponse.json({ ok: false, message: "Both start and end time are required" }, { status: 400 });
  }
  if (startAt && endAt && endAt <= startAt) {
    return NextResponse.json({ ok: false, message: "End time must be after start time" }, { status: 400 });
  }
  if (!Number.isFinite(notifyEveryMin) || notifyEveryMin < 1) {
    return NextResponse.json({ ok: false, message: "Notify interval must be at least 1 minute" }, { status: 400 });
  }

  const payload = {
    startAt,
    endAt,
    notifyEveryMin,
    isActive: Boolean(startAt && endAt),
  };

  const updated = await SiteUpdate.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global" }, $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({ ok: true, message: "Site update settings saved", data: shape(updated) }, { status: 200 });
}
