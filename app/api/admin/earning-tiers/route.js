import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import EarningTier from "@/models/EarningTier";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  if (!token) return { ok: false, status: 401, message: "Unauthorized." };

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload?.userId ? String(payload.userId) : null;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return { ok: false, status: 401, message: "Unauthorized." };
    }

    await dbConnect();
    const u = await User.findById(userId).select("role").lean();
    if (!u || u.role !== "admin") {
      return { ok: false, status: 403, message: "Only admin can set interest rate." };
    }

    return { ok: true, userId };
  } catch {
    return { ok: false, status: 401, message: "Unauthorized." };
  }
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ message: guard.message }, { status: guard.status });
  }

  const tiers = await EarningTier.find({})
    .sort({ sortOrder: 1, minBalance: 1, createdAt: 1 })
    .lean();

  return NextResponse.json(
    {
      tiers: tiers.map((t) => ({
        _id: String(t._id),
        label: t.label,
        minBalance: t.minBalance,
        maxBalance: t.maxBalance ?? null,
        dailyRatePercent: t.dailyRatePercent,
        sortOrder: t.sortOrder,
        isActive: Boolean(t.isActive),
      })),
    },
    { status: 200 }
  );
}

export async function POST(req) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ message: guard.message }, { status: guard.status });
  }

  const body = await req.json().catch(() => ({}));
  const tiers = Array.isArray(body?.tiers) ? body.tiers : [];

  if (!tiers.length) {
    return NextResponse.json({ message: "No tiers provided." }, { status: 400 });
  }

  // Basic server validation
  for (const [i, t] of tiers.entries()) {
    const label = String(t?.label || "").trim();
    const minBalance = Number(t?.minBalance);
    const maxBalance =
      t?.maxBalance === "" || t?.maxBalance === null || typeof t?.maxBalance === "undefined"
        ? null
        : Number(t?.maxBalance);
    const dailyRatePercent = Number(t?.dailyRatePercent);
    const sortOrder = Number(t?.sortOrder);
    const isActive = Boolean(t?.isActive);

    if (!label) return NextResponse.json({ message: `Row ${i + 1}: label required.` }, { status: 400 });
    if (!Number.isFinite(minBalance) || minBalance < 0)
      return NextResponse.json({ message: `Row ${i + 1}: minBalance invalid.` }, { status: 400 });
    if (maxBalance !== null && (!Number.isFinite(maxBalance) || maxBalance <= minBalance))
      return NextResponse.json({ message: `Row ${i + 1}: maxBalance invalid.` }, { status: 400 });
    if (!Number.isFinite(dailyRatePercent) || dailyRatePercent < 0)
      return NextResponse.json({ message: `Row ${i + 1}: dailyRatePercent invalid.` }, { status: 400 });
    if (!Number.isFinite(sortOrder))
      return NextResponse.json({ message: `Row ${i + 1}: sortOrder invalid.` }, { status: 400 });

    // normalize (mutate local)
    t.label = label;
    t.minBalance = minBalance;
    t.maxBalance = maxBalance;
    t.dailyRatePercent = dailyRatePercent;
    t.sortOrder = sortOrder;
    t.isActive = isActive;
  }

  // Upsert: update when _id exists, otherwise create a new document
  const results = [];
  for (const t of tiers) {
    const hasId = t?._id && mongoose.Types.ObjectId.isValid(String(t._id));

    if (hasId) {
      const updated = await EarningTier.findByIdAndUpdate(
        String(t._id),
        {
          label: t.label,
          minBalance: t.minBalance,
          maxBalance: t.maxBalance,
          dailyRatePercent: t.dailyRatePercent,
          sortOrder: t.sortOrder,
          isActive: t.isActive,
        },
        { new: true }
      ).lean();

      if (updated) results.push(updated);
    } else {
      const created = await EarningTier.create({
        label: t.label,
        minBalance: t.minBalance,
        maxBalance: t.maxBalance,
        dailyRatePercent: t.dailyRatePercent,
        sortOrder: t.sortOrder,
        isActive: t.isActive,
      });
      results.push(created.toObject());
    }
  }

  // return fresh sorted list
  const fresh = await EarningTier.find({})
    .sort({ sortOrder: 1, minBalance: 1, createdAt: 1 })
    .lean();

  return NextResponse.json(
    {
      message: "Saved successfully.",
      tiers: fresh.map((t) => ({
        _id: String(t._id),
        label: t.label,
        minBalance: t.minBalance,
        maxBalance: t.maxBalance ?? null,
        dailyRatePercent: t.dailyRatePercent,
        sortOrder: t.sortOrder,
        isActive: Boolean(t.isActive),
      })),
    },
    { status: 200 }
  );
}
