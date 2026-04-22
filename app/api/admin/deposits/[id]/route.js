import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Deposit from "@/models/Deposit";
import { getAuthUserFromRequest } from "@/lib/auth";
import { approveDepositByActor } from "@/lib/depositApproval";

export async function PATCH(req, ctx) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;

  const { params } = ctx || {};
  const p = params ? await params : {};
  const id = p?.id ? String(p.id) : "";
  if (!id) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "").toLowerCase();
  const isApprove = action === "approve" || action === "success";
  const isReject = action === "reject";
  if (!isApprove && !isReject) return NextResponse.json({ message: "Invalid action" }, { status: 400 });

  await dbConnect();

  if (isReject) {
    const dep = await Deposit.findById(id);
    if (!dep) return NextResponse.json({ message: "Deposit not found" }, { status: 404 });
    if (String(dep.status) !== "processing") return NextResponse.json({ message: "Already processed" }, { status: 400 });
    dep.status = "reject";
    await dep.save();
    return NextResponse.json({ ok: true, message: "Deposit rejected" }, { status: 200 });
  }

  const result = await approveDepositByActor({ depositId: id, actorUserId: auth.userId, actorRole: "admin" });
  if (!result?.ok) return NextResponse.json({ message: result?.message || "Approval failed" }, { status: Number(result?.status || 500) });
  return NextResponse.json({ ok: true, message: result.message }, { status: 200 });
}
