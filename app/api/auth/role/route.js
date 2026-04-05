import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: true });
  if (!auth.ok) return auth.res;

  const role = String(auth.user.role || "user").toLowerCase() === "admin" ? "admin" : "user";
  const status = String(auth.user.status || "active").toLowerCase();

  if (status !== "active") {
    return NextResponse.json({ ok: false, role, status, message: "Your account is inactive. Please contact support.", reason: "inactive" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, role, status, userId: auth.userId }, { status: 200 });
}
