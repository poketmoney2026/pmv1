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

export async function PATCH(req, { params }) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ message: guard.message }, { status: guard.status });
  }

  const id = String(params?.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid id." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  const label = String(body?.label ?? "").trim();
  const minBalance = Number(body?.minBalance);
  const maxBalance =
    body?.maxBalance === "" || body?.maxBalance === null || typeof body?.maxBalance === "undefined"
      ? null
      : Number(body?.maxBalance);
  const dailyRatePercent = Number(body?.dailyRatePercent);
  const sortOrder = Number(body?.sortOrder);
  const isActive = Boolean(body?.isActive);

  if (!label) return NextResponse.json({ message: "label required." }, { status: 400 });
  if (!Number.isFinite(minBalance) || minBalance < 0)
    return NextResponse.json({ message: "minBalance invalid." }, { status: 400 });
  if (maxBalance !== null && (!Number.isFinite(maxBalance) || maxBalance <= minBalance))
    return NextResponse.json({ message: "maxBalance invalid." }, { status: 400 });
  if (!Number.isFinite(dailyRatePercent) || dailyRatePercent < 0)
    return NextResponse.json({ message: "dailyRatePercent invalid." }, { status: 400 });
  if (!Number.isFinite(sortOrder))
    return NextResponse.json({ message: "sortOrder invalid." }, { status: 400 });

  const updated = await EarningTier.findByIdAndUpdate(
    id,
    { label, minBalance, maxBalance, dailyRatePercent, sortOrder, isActive },
    { new: true }
  ).lean();

  if (!updated) return NextResponse.json({ message: "Not found." }, { status: 404 });

  return NextResponse.json(
    {
      message: "Updated.",
      tier: {
        _id: String(updated._id),
        label: updated.label,
        minBalance: updated.minBalance,
        maxBalance: updated.maxBalance ?? null,
        dailyRatePercent: updated.dailyRatePercent,
        sortOrder: updated.sortOrder,
        isActive: Boolean(updated.isActive),
      },
    },
    { status: 200 }
  );
}

export async function DELETE(req, { params }) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ message: guard.message }, { status: guard.status });
  }

  const id = String(params?.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid id." }, { status: 400 });
  }

  const deleted = await EarningTier.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ message: "Not found." }, { status: 404 });

  return NextResponse.json({ message: "Deleted." }, { status: 200 });
}
