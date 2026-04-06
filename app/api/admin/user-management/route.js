import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Deposit from "@/models/Deposit";
import Withdraw from "@/models/Withdraw";
import ReferralIncome from "@/models/ReferralIncome";
import ChatThread from "@/models/ChatThread";
import ChatMessage from "@/models/ChatMessage";
import { getAuthUserFromRequest } from "@/lib/auth";

function toInt(v, d = 0) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function safeStr(v) {
  return String(v ?? "").trim();
}

async function ensureAdmin(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  return auth;
}

export async function GET(req) {
  const auth = await ensureAdmin(req);
  if (!auth.ok) return auth.res;
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Math.max(1, toInt(searchParams.get("limit"), 15)));
  const page = Math.max(0, toInt(searchParams.get("page"), 0));
  const sort = safeStr(searchParams.get("sort")) || "latest";
  const q = safeStr(searchParams.get("q"));
  const role = safeStr(searchParams.get("role"));
  const status = safeStr(searchParams.get("status"));

  const match = {};
  if (q) {
    match.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { mobile: { $regex: q, $options: "i" } },
      { referralCode: { $regex: q, $options: "i" } },
    ];
  }
  if (role) match.role = role;
  if (status) match.status = status;

  const totalsUsersAgg = await User.aggregate([{ $group: { _id: null, totalUsers: { $sum: 1 }, totalBalance: { $sum: { $ifNull: ["$balance", 0] } } } }]);
  const txSuccessAgg = await Transaction.aggregate([{ $match: { status: "successful" } }, { $group: { _id: null, successfulTx: { $sum: 1 } } }]);
  const txRejectAgg = await Transaction.aggregate([{ $match: { status: "reject" } }, { $group: { _id: null, rejectedTx: { $sum: 1 } } }]);
  const withdrawAgg = await Transaction.aggregate([{ $match: { status: "successful", type: "withdraw" } }, { $group: { _id: null, totalWithdrawAmount: { $sum: { $ifNull: ["$amount", 0] } }, successfulWithdrawCount: { $sum: 1 } } }]);

  const sortStage = sort === "balance_desc" ? { balance: -1, createdAt: -1 } : sort === "balance_asc" ? { balance: 1, createdAt: -1 } : sort === "tx_desc" ? { txCount: -1, createdAt: -1 } : sort === "withdraw_desc" ? { withdrawTotal: -1, createdAt: -1 } : sort === "deposit_desc" ? { depositTotal: -1, createdAt: -1 } : sort === "referral_desc" ? { referralsCount: -1, createdAt: -1 } : { createdAt: -1 };

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "transactions",
        let: { uid: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$user", "$$uid"] } } },
          { $group: { _id: null, txCount: { $sum: 1 }, successCount: { $sum: { $cond: [{ $eq: ["$status", "successful"] }, 1, 0] } }, rejectCount: { $sum: { $cond: [{ $eq: ["$status", "reject"] }, 1, 0] } }, withdrawCount: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "successful"] }, { $eq: ["$type", "withdraw"] }] }, 1, 0] } }, withdrawTotal: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "successful"] }, { $eq: ["$type", "withdraw"] }] }, { $ifNull: ["$amount", 0] }, 0] } }, depositTotal: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "successful"] }, { $eq: ["$type", "deposit"] }] }, { $ifNull: ["$amount", 0] }, 0] } } } },
        ],
        as: "txMeta",
      },
    },
    { $addFields: { txCount: { $ifNull: [{ $arrayElemAt: ["$txMeta.txCount", 0] }, 0] }, successCount: { $ifNull: [{ $arrayElemAt: ["$txMeta.successCount", 0] }, 0] }, rejectCount: { $ifNull: [{ $arrayElemAt: ["$txMeta.rejectCount", 0] }, 0] }, withdrawCount: { $ifNull: [{ $arrayElemAt: ["$txMeta.withdrawCount", 0] }, 0] }, withdrawTotal: { $ifNull: [{ $arrayElemAt: ["$txMeta.withdrawTotal", 0] }, 0] }, depositTotal: { $ifNull: [{ $arrayElemAt: ["$txMeta.depositTotal", 0] }, 0] }, referralsCount: { $size: { $ifNull: ["$referrals", []] } }, accountStatus: { $ifNull: ["$status", "active"] } } },
    { $sort: sortStage },
    { $skip: page * limit },
    { $limit: limit + 1 },
    { $project: { txMeta: 0, password: 0 } },
  ];

  const rows = await User.aggregate(pipeline);
  const hasMore = rows.length > limit;
  const users = hasMore ? rows.slice(0, limit) : rows;

  const totals = {
    totalUsers: Number(totalsUsersAgg?.[0]?.totalUsers || 0),
    totalBalance: Number(totalsUsersAgg?.[0]?.totalBalance || 0),
    totalWithdrawAmount: Number(withdrawAgg?.[0]?.totalWithdrawAmount || 0),
    successfulWithdrawCount: Number(withdrawAgg?.[0]?.successfulWithdrawCount || 0),
    successfulTx: Number(txSuccessAgg?.[0]?.successfulTx || 0),
    rejectedTx: Number(txRejectAgg?.[0]?.rejectedTx || 0),
  };

  return NextResponse.json({ ok: true, totals, users, page, limit, hasMore }, { status: 200 });
}

export async function PATCH(req) {
  const auth = await ensureAdmin(req);
  if (!auth.ok) return auth.res;
  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const userId = safeStr(body.userId);
  const status = safeStr(body.status).toLowerCase();
  const inactiveReason = safeStr(body.inactiveReason);

  if (!userId) return NextResponse.json({ ok: false, message: "User id required" }, { status: 400 });
  if (!["active", "inactive"].includes(status)) return NextResponse.json({ ok: false, message: "Invalid status" }, { status: 400 });
  if (String(auth.userId) === userId) return NextResponse.json({ ok: false, message: "You cannot change your own status" }, { status: 400 });

  const update = status === "inactive" ? { status, inactiveReason: inactiveReason || "আপনার অ্যাকাউন্ট ইনঅ্যাকটিভ করা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।" } : { status, inactiveReason: "" };
  const updated = await User.findByIdAndUpdate(userId, { $set: update }, { new: true }).select("_id status inactiveReason fullName mobile role").lean();
  if (!updated) return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });

  return NextResponse.json({ ok: true, message: `User ${status}`, data: updated }, { status: 200 });
}


export async function DELETE(req) {
  const auth = await ensureAdmin(req);
  if (!auth.ok) return auth.res;
  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const userId = safeStr(body.userId);
  if (!userId) return NextResponse.json({ ok: false, message: "User id required" }, { status: 400 });
  if (String(auth.userId) === userId) return NextResponse.json({ ok: false, message: "You cannot delete your own account" }, { status: 400 });

  const user = await User.findById(userId).select("_id referrals referredBy").lean();
  if (!user) return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });

  const thread = await ChatThread.findOne({ userId: user._id }).select("_id").lean();
  if (thread?._id) await ChatMessage.deleteMany({ threadId: thread._id });
  await ChatThread.deleteMany({ userId: user._id });
  await Deposit.deleteMany({ userId: user._id });
  await Withdraw.deleteMany({ userId: user._id });
  await Transaction.deleteMany({ user: user._id });
  await ReferralIncome.deleteMany({ userId: user._id });
  await User.updateMany({ referrals: user._id }, { $pull: { referrals: user._id } });
  await User.deleteOne({ _id: user._id });

  return NextResponse.json({ ok: true, message: "User deleted successfully" }, { status: 200 });
}
