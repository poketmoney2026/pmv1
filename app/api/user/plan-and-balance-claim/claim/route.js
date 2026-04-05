// app/api/user/plan-and-balance-claim/claim/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import Deposit from "@/models/Deposit";
import Interest from "@/models/Interest";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
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
  const amt = earnedUnits / SCALE;
  return round5(amt);
}

export async function POST(req) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const depositId = String(body?.depositId || "").trim();
  if (!depositId) return NextResponse.json({ ok: false, message: "Deposit id missing" }, { status: 400 });

  await dbConnect();

  const dep = await Deposit.findById(depositId);
  if (!dep) return NextResponse.json({ ok: false, message: "Deposit not found" }, { status: 404 });

  if (String(dep.userId) !== String(userId)) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  if (String(dep.status) !== "success") return NextResponse.json({ ok: false, message: "Only success deposits can be claimed" }, { status: 400 });

  const type = String(dep.type || "none");
  if (type === "done") return NextResponse.json({ ok: true, message: "This deposit is completed", data: { claimedAmount: 0, type: "done" } }, { status: 200 });

  const claimCooldownSec = await readClaimCooldownSec();
  const nowMs = Date.now();
  const lastClaimMs = getClaimMs(dep);
  if (lastClaimMs && nowMs - lastClaimMs < claimCooldownSec * 1000) {
    const remain = Math.max(0, claimCooldownSec - Math.floor((nowMs - lastClaimMs) / 1000));
    return NextResponse.json({ ok: false, message: `Please wait ${remain} sec before next claim`, data: { remainingSec: remain } }, { status: 429 });
  }

  const interestDoc = await Interest.findOne({}).sort({ createdAt: -1 }).lean();
  const ratePercent = Number(interestDoc?.valuePercent || 0);
  const daysTotal = clampPlanDays(interestDoc?.day || 12);
  if (!Number.isFinite(ratePercent) || ratePercent <= 0) return NextResponse.json({ ok: false, message: "Interest rate not set" }, { status: 400 });

  const amount = Number(dep.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ ok: false, message: "Invalid deposit amount" }, { status: 400 });

  const createdMs = getCreatedMs(dep);
  if (!createdMs) return NextResponse.json({ ok: false, message: "Invalid created date" }, { status: 400 });

  const expiryMs = createdMs + daysTotal * DAY_MS;
  const claimNowMs = Math.min(nowMs, expiryMs);

  let baseMs = lastClaimMs ? Math.max(createdMs, lastClaimMs) : createdMs;
  baseMs = Math.min(baseMs, claimNowMs);

  const deltaMs = claimNowMs - baseMs;
  if (deltaMs <= 0) {
    if (nowMs >= expiryMs) {
      dep.type = "done";
      dep.claimDate = new Date(expiryMs);
      await dep.save();
      return NextResponse.json({ ok: true, message: "This deposit is completed", data: { claimedAmount: 0, type: "done" } }, { status: 200 });
    }
    return NextResponse.json({ ok: true, message: "Nothing to claim yet", data: { claimedAmount: 0 } }, { status: 200 });
  }

  const claimedAmount = earnedAmountForDelta({ amount, ratePercent, deltaMs });
  if (!Number.isFinite(claimedAmount) || claimedAmount <= 0) return NextResponse.json({ ok: true, message: "Nothing to claim yet", data: { claimedAmount: 0 } }, { status: 200 });

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });

  user.balance = round5(Number(user.balance || 0) + claimedAmount);
  const claimTx = await Transaction.create({
    user: user._id,
    type: "claim",
    status: "successful",
    amount: claimedAmount,
    note: `Claim income added to balance: Tk ${claimedAmount.toFixed(5)}`,
    date: new Date(),
  });
  user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
  user.transactions.push(claimTx._id);
  await user.save();

  dep.claimDate = new Date(claimNowMs);
  if (nowMs >= expiryMs) dep.type = "done";
  await dep.save();

  return NextResponse.json(
    {
      ok: true,
      message: `Claimed Tk ${claimedAmount.toFixed(5)} added to balance`,
      data: { depositId, claimedAmount, claimDate: dep.claimDate, type: dep.type, newBalance: user.balance, claimCooldownSec },
    },
    { status: 200 }
  );
}
