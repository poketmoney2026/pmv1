import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Deposit from "@/models/Deposit";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import GeneralSettings from "@/models/GeneralSettings";
import ReferralIncome from "@/models/ReferralIncome";
import { getAuthUserFromRequest } from "@/lib/auth";

const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

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

  const dep = await Deposit.findById(id);
  if (!dep) return NextResponse.json({ message: "Deposit not found" }, { status: 404 });
  if (String(dep.status) !== "processing") return NextResponse.json({ message: "Already processed" }, { status: 400 });

  if (isReject) {
    dep.status = "reject";
    await dep.save();
    return NextResponse.json({ ok: true, message: "Deposit rejected" }, { status: 200 });
  }

  const amount = Number(dep.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ message: "Invalid deposit amount" }, { status: 400 });

  const user = await User.findById(dep.userId);
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
  if (String(user.status || "active") !== "active") return NextResponse.json({ message: "User inactive" }, { status: 403 });

  const settings = await GeneralSettings.findOne({ key: "global" }).lean();
  const firstReferralPercent = Number(settings?.firstReferralBonus ?? 10);
  const regularReferralPercent = Number(settings?.regularReferralBonus ?? 0);

  dep.type = "running";
  dep.status = "success";
  dep.createdDate = new Date();
  dep.claimDate = new Date();
  await dep.save();

  const tDeposit = await Transaction.create({ user: user._id, type: "deposit", status: "successful", amount, note: `Deposit added successfully: ${amount}`, date: new Date() });
  user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
  user.transactions.push(tDeposit._id);

  let referralPaid = false;
  let referralMessage = "";
  if (user.referredBy) {
    const refUser = await User.findById(user.referredBy);
    if (refUser && String(refUser.status || "active") === "active") {
      const alreadyPaid = Boolean(user.referralBonus);
      const bonusPercent = alreadyPaid ? regularReferralPercent : firstReferralPercent;
      const bonus = round2((amount * bonusPercent) / 100);
      if (bonus > 0) {
        refUser.balance = Number(refUser.balance || 0) + bonus;
        const tRef = await Transaction.create({ user: refUser._id, type: "referralBonus", status: "successful", amount: bonus, note: `Referral bonus credited: Tk${bonus}`, date: new Date() });
        refUser.transactions = Array.isArray(refUser.transactions) ? refUser.transactions : [];
        refUser.transactions.push(tRef._id);
        await refUser.save();
        await ReferralIncome.findOneAndUpdate({ userId: refUser._id }, { $inc: { amount: bonus }, $setOnInsert: { date: new Date() } }, { upsert: true, new: true });
        referralPaid = true;
        referralMessage = alreadyPaid ? "regular" : "first";
      }
      if (!alreadyPaid) user.referralBonus = true;
    }
  }

  await user.save();
  return NextResponse.json({ ok: true, message: referralPaid ? `Deposit successful (${referralMessage} referral bonus sent)` : "Deposit successful" }, { status: 200 });
}
