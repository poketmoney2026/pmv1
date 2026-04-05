import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import GeneralSettings from "@/models/GeneralSettings";
import { getAuthUserFromRequest } from "@/lib/auth";

function toNumOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function validateNonNegative(name, value) {
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number`);
  return value;
}

function shape(doc) {
  return {
    minDeposit: doc?.minDeposit ?? null,
    maxDeposit: doc?.maxDeposit ?? null,
    minWithdraw: doc?.minWithdraw ?? null,
    maxWithdraw: doc?.maxWithdraw ?? null,
    rechargeMinWithdraw: doc?.rechargeMinWithdraw ?? 20,
    rechargeMaxWithdraw: doc?.rechargeMaxWithdraw ?? null,
    withdrawFee: doc?.withdrawFee ?? null,
    dailyWithdrawLimit: doc?.dailyWithdrawLimit ?? null,
    dailyAmountLimit: doc?.dailyAmountLimit ?? null,
    claimCooldownSec: doc?.claimCooldownSec ?? 120,
    noticeIntervalMin: doc?.noticeIntervalMin ?? 30,
    firstReferralBonus: doc?.firstReferralBonus ?? 10,
    regularReferralBonus: doc?.regularReferralBonus ?? 0,
    welcomeBonus: doc?.welcomeBonus ?? 5,
    giftBoxAmount: doc?.giftBoxAmount ?? 5,
    firstPrize: doc?.firstPrize ?? 10000,
    secondPrize: doc?.secondPrize ?? 5000,
    thirdPrize: doc?.thirdPrize ?? 3000,
    rank4to10Prize: doc?.rank4to10Prize ?? 2000,
    rank11to50Prize: doc?.rank11to50Prize ?? 1000,
  };
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const doc = await GeneralSettings.findOne({ key: "global" }).lean();
  return NextResponse.json({ ok: true, data: shape(doc) }, { status: 200 });
}

export async function PUT(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const body = await req.json().catch(() => ({}));
  try {
    const payload = {
      minDeposit: validateNonNegative("minDeposit", toNumOrNull(body.minDeposit)),
      maxDeposit: validateNonNegative("maxDeposit", toNumOrNull(body.maxDeposit)),
      minWithdraw: validateNonNegative("minWithdraw", toNumOrNull(body.minWithdraw)),
      maxWithdraw: validateNonNegative("maxWithdraw", toNumOrNull(body.maxWithdraw)),
      rechargeMinWithdraw: validateNonNegative("rechargeMinWithdraw", toNumOrNull(body.rechargeMinWithdraw)),
      rechargeMaxWithdraw: validateNonNegative("rechargeMaxWithdraw", toNumOrNull(body.rechargeMaxWithdraw)),
      withdrawFee: validateNonNegative("withdrawFee", toNumOrNull(body.withdrawFee)),
      dailyWithdrawLimit: validateNonNegative("dailyWithdrawLimit", toNumOrNull(body.dailyWithdrawLimit)),
      dailyAmountLimit: validateNonNegative("dailyAmountLimit", toNumOrNull(body.dailyAmountLimit)),
      claimCooldownSec: validateNonNegative("claimCooldownSec", toNumOrNull(body.claimCooldownSec)),
      noticeIntervalMin: validateNonNegative("noticeIntervalMin", toNumOrNull(body.noticeIntervalMin)),
      firstReferralBonus: validateNonNegative("firstReferralBonus", toNumOrNull(body.firstReferralBonus)),
      regularReferralBonus: validateNonNegative("regularReferralBonus", toNumOrNull(body.regularReferralBonus)),
      welcomeBonus: validateNonNegative("welcomeBonus", toNumOrNull(body.welcomeBonus)),
      giftBoxAmount: validateNonNegative("giftBoxAmount", toNumOrNull(body.giftBoxAmount)),
      firstPrize: validateNonNegative("firstPrize", toNumOrNull(body.firstPrize)),
      secondPrize: validateNonNegative("secondPrize", toNumOrNull(body.secondPrize)),
      thirdPrize: validateNonNegative("thirdPrize", toNumOrNull(body.thirdPrize)),
      rank4to10Prize: validateNonNegative("rank4to10Prize", toNumOrNull(body.rank4to10Prize)),
      rank11to50Prize: validateNonNegative("rank11to50Prize", toNumOrNull(body.rank11to50Prize)),
    };
    if (payload.minDeposit !== null && payload.maxDeposit !== null && payload.minDeposit > payload.maxDeposit) {
      return NextResponse.json({ ok: false, message: "minDeposit cannot be greater than maxDeposit" }, { status: 400 });
    }
    if (payload.minWithdraw !== null && payload.maxWithdraw !== null && payload.minWithdraw > payload.maxWithdraw) {
      return NextResponse.json({ ok: false, message: "minWithdraw cannot be greater than maxWithdraw" }, { status: 400 });
    }
    if (payload.rechargeMinWithdraw !== null && payload.rechargeMaxWithdraw !== null && payload.rechargeMinWithdraw > payload.rechargeMaxWithdraw) {
      return NextResponse.json({ ok: false, message: "rechargeMinWithdraw cannot be greater than rechargeMaxWithdraw" }, { status: 400 });
    }
    if (payload.claimCooldownSec !== null && payload.claimCooldownSec < 1) {
      return NextResponse.json({ ok: false, message: "claimCooldownSec must be at least 1" }, { status: 400 });
    }
    if (payload.noticeIntervalMin !== null && payload.noticeIntervalMin < 1) {
      return NextResponse.json({ ok: false, message: "noticeIntervalMin must be at least 1" }, { status: 400 });
    }
    const updated = await GeneralSettings.findOneAndUpdate(
      { key: "global" },
      { $setOnInsert: { key: "global" }, $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return NextResponse.json({ ok: true, message: "Settings saved", data: shape(updated) }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e?.message || "Invalid data" }, { status: 400 });
  }
}
