import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PaymentMethod from "@/models/PaymentMethod";
import { decryptText } from "@/lib/crypto";
import { getAuthUserFromRequest } from "@/lib/auth";

async function readPaymentMethods() {
  const rows = await PaymentMethod.find({ isActive: true }).select("method number").lean();
  let bkash = "";
  let nagad = "";

  for (const r of rows || []) {
    const m = String(r?.method || "");
    const num = decryptText(String(r?.number || ""));
    if (m === "bkash") bkash = num;
    if (m === "nagad") nagad = num;
  }

  return { bkash, nagad };
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const data = await readPaymentMethods();
  return NextResponse.json({ ok: true, data }, { status: 200 });
}
