// app/api/user/plan-and-balance-claim/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import Deposit from "@/models/Deposit";
import Interest from "@/models/Interest";
import User from "@/models/User";
import { clampPlanDays } from "@/lib/planDays";
import { readClaimCooldownSec } from "@/lib/claimCooldown";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const DAY_MS = 24 * 60 * 60 * 1000;
const SCALE = 100000;

async function getAuthUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload?.userId ? String(payload.userId) : null;
  } catch {
    return null;
  }
}

const round5 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100000) / 100000;

function getCreatedMs(dep) {
  const a = dep?.createdDate ? new Date(dep.createdDate).getTime() : 0;
  const b = dep?.createdAt ? new Date(dep.createdAt).getTime() : 0;
  return a || b || 0;
}
function getClaimMs(dep) {
  return dep?.claimDate ? new Date(dep.claimDate).getTime() : 0;
}

function earnedAmountForDelta({ amount, ratePercent, deltaMs }) {
  const dailyUnits = Math.round((Number(amount || 0) * Number(ratePercent || 0) * SCALE) / 100);
  if (!Number.isFinite(dailyUnits) || dailyUnits <= 0) return 0;
  const earnedUnitsBig = (BigInt(dailyUnits) * BigInt(Math.max(0, deltaMs))) / BigInt(DAY_MS);
  const earnedUnits = Number(earnedUnitsBig);
  return round5(earnedUnits / SCALE);
}

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const interestDoc = await Interest.findOne({}).sort({ updatedAt: -1, createdAt: -1 }).lean();
  const interestPercent = Number(interestDoc?.valuePercent || 0);
  const daysTotal = clampPlanDays(interestDoc?.day || 12);
  const claimCooldownSec = await readClaimCooldownSec();

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  if (String(user.status || "active") !== "active") return NextResponse.json({ ok: false, message: "Your account is inactive. Please contact support." }, { status: 403 });

  const items = await Deposit.find({ userId, status: "success" }).sort({ createdAt: -1 });
  const nowMs = Date.now();
  let totalAutoAdded = 0;

  for (const dep of items) {
    const type = String(dep.type || "none");
    const createdMs = getCreatedMs(dep);
    if (!createdMs) continue;

    const expiryMs = createdMs + daysTotal * DAY_MS;

    if (nowMs > expiryMs && type !== "done" && Number(interestPercent) > 0) {
      const lastClaimMs = getClaimMs(dep);
      let baseMs = lastClaimMs ? Math.max(createdMs, lastClaimMs) : createdMs;
      baseMs = Math.min(baseMs, expiryMs);
      const deltaMs = expiryMs - baseMs;

      if (deltaMs > 0) {
        const addAmount = earnedAmountForDelta({ amount: dep.amount, ratePercent: interestPercent, deltaMs });
        if (addAmount > 0) totalAutoAdded = round5(totalAutoAdded + addAmount);
      }

      dep.claimDate = new Date(expiryMs);
      dep.type = "done";
      await dep.save();
    }
  }

  if (totalAutoAdded > 0) {
    user.balance = round5(Number(user.balance || 0) + totalAutoAdded);
    await user.save();
  }

  const mapped = items.map((d) => ({
    _id: String(d._id),
    amount: Number(d.amount || 0),
    createdAt: d.createdAt,
    createdDate: d.createdDate || null,
    claimDate: d.claimDate || null,
    type: String(d.type || "none"),
    status: String(d.status || "success"),
  }));

  return NextResponse.json(
    { ok: true, data: { interestPercent, daysTotal, claimCooldownSec, items: mapped } },
    { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}