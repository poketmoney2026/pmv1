import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAuthUserFromRequest } from "@/lib/auth";
import { approveDepositByActor } from "@/lib/depositApproval";

export async function PATCH(req, ctx) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;
  if (String(auth.user?.role || "user") !== "agent") {
    return NextResponse.json({ ok: false, message: "Agent only" }, { status: 403 });
  }

  const { params } = ctx || {};
  const p = params ? await params : {};
  const id = p?.id ? String(p.id) : "";
  if (!id) return NextResponse.json({ ok: false, message: "Invalid id" }, { status: 400 });

  await dbConnect();
  const result = await approveDepositByActor({ depositId: id, actorUserId: auth.userId, actorRole: "agent" });
  if (!result?.ok) {
    return NextResponse.json({ ok: false, code: result?.code || "FAILED", message: result?.message || "Approval failed" }, { status: Number(result?.status || 500) });
  }
  return NextResponse.json({ ok: true, message: result.message }, { status: 200 });
}
