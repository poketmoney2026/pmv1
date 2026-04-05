export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { mkdir, rm, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import dbConnect from "@/lib/dbConnect";
import DownloadAsset from "@/models/DownloadAsset";
import { getAuthUserFromRequest } from "@/lib/auth";

function safeFileName(name) {
  const base = String(name || "app.apk").replace(/[^\w.() -]+/g, "").trim();
  return base || "app.apk";
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const doc = await DownloadAsset.findOne({ key: "android_app" }).lean();
  return NextResponse.json({ ok: true, data: doc ? { originalName: doc.originalName, fileName: doc.fileName, relativePath: doc.relativePath, size: doc.size || 0, updatedAt: doc.updatedAt || doc.createdAt || null } : null }, { status: 200 });
}

export async function POST(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ ok: false, message: "File required" }, { status: 400 });

  const originalName = safeFileName(file.name || "app.apk");
  const fileName = safeFileName(`app-${Date.now()}-${originalName}`);
  const dir = join(process.cwd(), "public", "apps");
  await mkdir(dir, { recursive: true });

  const current = await DownloadAsset.findOne({ key: "android_app" }).lean();
  if (current?.fileName) {
    const oldPath = join(dir, current.fileName);
    if (existsSync(oldPath)) {
      try { await rm(oldPath, { force: true }); } catch {}
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const diskPath = join(dir, fileName);
  await writeFile(diskPath, buffer);

  const updated = await DownloadAsset.findOneAndUpdate(
    { key: "android_app" },
    {
      $setOnInsert: { key: "android_app", label: "APP DOWNLOAD" },
      $set: {
        fileName,
        originalName,
        relativePath: `/apps/${fileName}`,
        mimeType: file.type || "application/octet-stream",
        size: buffer.byteLength,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({ ok: true, message: "File uploaded", data: { originalName: updated.originalName, fileName: updated.fileName, relativePath: updated.relativePath, size: updated.size || 0 } }, { status: 200 });
}
