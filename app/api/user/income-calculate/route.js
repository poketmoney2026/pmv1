export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Interest from "@/models/Interest";
import Deposit from "@/models/Deposit";
import { clampPlanDays } from "@/lib/planDays";
import { getUserIdFromToken } from "@/lib/auth";

export async function GET() {
  try {
    const uid = await getUserIdFromToken({ allowInactive: true });
    if (!uid) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } });
    await dbConnect();
    const [interestDoc, depAgg] = await Promise.all([
      Interest.findOne({}).sort({ updatedAt: -1, createdAt: -1 }).lean(),
      Deposit.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(String(uid)), status: "success" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    ]);
    const valuePercent = Number(interestDoc?.valuePercent || 0);
    const day = clampPlanDays(interestDoc?.day || 12);
    const totalDepositAmount = Number(depAgg?.[0]?.total || 0);
    return NextResponse.json({ ok: true, data: { valuePercent, day, totalDepositAmount } }, { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
