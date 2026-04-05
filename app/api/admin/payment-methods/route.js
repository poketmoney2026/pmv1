import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PaymentMethod from "@/models/PaymentMethod";
import { decryptText, encryptText } from "@/lib/crypto";
import { getAuthUserFromRequest } from "@/lib/auth";

const toBd11 = (v) => String(v || "").replace(/\D/g, "").slice(0, 11);

async function readPaymentMethods() {
  const rows = await PaymentMethod.find({}).select("method number isActive").lean();
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
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const data = await readPaymentMethods();
  return NextResponse.json({ ok: true, data }, { status: 200 });
}

export async function PUT(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const bkash = toBd11(body?.bkash);
  const nagad = toBd11(body?.nagad);

  await PaymentMethod.findOneAndUpdate({ method: "bkash" }, { $setOnInsert: { method: "bkash" }, $set: { number: encryptText(bkash), isActive: true } }, { upsert: true, new: true });
  await PaymentMethod.findOneAndUpdate({ method: "nagad" }, { $setOnInsert: { method: "nagad" }, $set: { number: encryptText(nagad), isActive: true } }, { upsert: true, new: true });

  return NextResponse.json({ ok: true, message: "Payment methods set", data: { bkash, nagad } }, { status: 200 });
}
