import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import DownloadAsset from "@/models/DownloadAsset";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const doc = await DownloadAsset.findOne({ key: "android_app" }).lean();
  return NextResponse.json({ ok: true, data: { fileName: doc?.fileName || "app.apk", originalName: doc?.originalName || doc?.fileName || "app.apk", size: Number(doc?.size || 0), updatedAt: doc?.updatedAt || null, relativePath: doc?.relativePath || "/apps/app.apk" } }, { status: 200 });
}
