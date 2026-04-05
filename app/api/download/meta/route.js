import { NextResponse } from "next/server";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;
  const filePath = join(process.cwd(), 'public', 'apps', 'app.apk');
  const exists = existsSync(filePath);
  const stat = exists ? statSync(filePath) : null;
  return NextResponse.json({ ok: true, data: exists ? { originalName: 'app.apk', fileName: 'app.apk', size: stat?.size || 0, relativePath: '/apps/app.apk', updatedAt: stat?.mtime || null } : null }, { status: 200 });
}
