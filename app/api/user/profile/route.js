import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import ReferralIncome from "@/models/ReferralIncome";
import { getAuthUserFromRequest } from "@/lib/auth";

function normalizeName(v) {
  return String(v || "").trim().replace(/\s+/g, " ");
}

function normalizeMobile(v) {
  return String(v || "").replace(/\D/g, "").trim();
}

function validateMobile11BD(m) {
  return !!m && m.length === 11 && m.startsWith("01");
}

function startOfTodayBD() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;

  await dbConnect();
  const user = await User.findById(auth.userId).lean();
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

  const uid = user._id;
  const agg = await Transaction.aggregate([
    { $match: { user: uid } },
    { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  const totalsByType = {};
  for (const row of agg) totalsByType[String(row._id)] = { total: Number(row.total || 0), count: Number(row.count || 0) };

  const withdrawAgg = await Transaction.aggregate([
    { $match: { user: uid, type: "withdraw", status: "successful" } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  const totalWithdraw = Number(withdrawAgg?.[0]?.total || 0);
  const withdrawCount = Number(withdrawAgg?.[0]?.count || 0);
  const todayStart = startOfTodayBD();
  const todayIncomeAgg = await Transaction.aggregate([
    { $match: { user: uid, status: "successful", createdAt: { $gte: todayStart }, type: { $in: ["reward", "bonus", "cashback", "commission", "royalty", "referralBonus"] } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const todayIncome = Number(todayIncomeAgg?.[0]?.total || 0);
  const ref = await ReferralIncome.findOne({ userId: uid }).lean();
  const referralIncome = Number(ref?.amount || 0);

  return NextResponse.json({
    ok: true,
    data: {
      user: {
        _id: String(user._id),
        fullName: user.fullName || "",
        mobile: user.mobile || "",
        referralCode: user.referralCode || "",
        referralsCount: Array.isArray(user.referrals) ? user.referrals.length : 0,
        joinDate: user.joinDate || user.createdAt || null,
        role: user.role || "user",
        status: user.status || "active",
      },
      wallet: { balance: Number(user.balance || 0), initialBalance: Number(user.initialBalance || 0) },
      totals: {
        totalWithdraw,
        withdrawCount,
        totalDeposit: Number(totalsByType?.deposit?.total || 0),
        depositCount: Number(totalsByType?.deposit?.count || 0),
        totalRefund: Number(totalsByType?.refund?.total || 0),
        refundCount: Number(totalsByType?.refund?.count || 0),
        totalTransactions: await Transaction.countDocuments({ user: uid }),
        todayIncome,
        byType: totalsByType,
      },
      referralIncome,
    },
  });
}

export async function PUT(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;

  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const fullNameRaw = body?.fullName;
  const mobileRaw = body?.mobile;
  const currentPasswordRaw = body?.currentPassword;
  const newPasswordRaw = body?.newPassword;
  const update = {};

  if (fullNameRaw !== undefined) {
    const name = normalizeName(fullNameRaw);
    if (!name || name.length < 2 || name.length > 50) return NextResponse.json({ message: "Name must be 2-50 characters" }, { status: 400 });
    update.fullName = name;
  }



  const wantsPwChange = currentPasswordRaw !== undefined || newPasswordRaw !== undefined;
  if (wantsPwChange) {
    const currentPassword = String(currentPasswordRaw || "");
    const newPassword = String(newPasswordRaw || "");
    if (!currentPassword || !newPassword) return NextResponse.json({ message: "Current and new password are required" }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ message: "New password must be at least 8 characters" }, { status: 400 });
    const existing = await User.findById(auth.userId).select("password").lean();
    if (!existing) return NextResponse.json({ message: "User not found" }, { status: 404 });
    if (String(existing.password || "") !== currentPassword) return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
    update.password = newPassword;
  }

  if (!Object.keys(update).length) return NextResponse.json({ message: "Nothing to update" }, { status: 400 });

  const saved = await User.findByIdAndUpdate(auth.userId, { $set: update }, { new: true }).lean();
  if (!saved) return NextResponse.json({ message: "User not found" }, { status: 404 });

  return NextResponse.json({ ok: true, message: wantsPwChange ? "Profile & password updated" : "Profile updated", data: { fullName: saved.fullName || "", mobile: saved.mobile || "", status: saved.status || "active" } });
}
