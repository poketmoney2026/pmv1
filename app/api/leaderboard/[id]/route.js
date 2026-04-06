import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getAuthUserFromRequest } from "@/lib/auth";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(date) {
  const ts = new Date(date || Date.now()).getTime();
  const diff = Math.max(0, Date.now() - ts);
  return Math.max(0, Math.floor(diff / DAY_MS));
}

async function getRankMap() {
  const start = new Date(Date.now() - 30 * DAY_MS);
  const rows = await Transaction.aggregate([
    { $match: { type: "claim", status: "successful", createdAt: { $gte: start } } },
    { $group: { _id: "$user", claimTotal: { $sum: { $ifNull: ["$amount", 0] } } } },
    { $sort: { claimTotal: -1, _id: 1 } },
  ]);
  const map = new Map();
  rows.forEach((row, idx) => map.set(String(row._id), idx + 1));
  return map;
}

export async function GET(req, { params }) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const id = String(params?.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ ok: false, message: "Invalid user" }, { status: 400 });

  const user = await User.findById(id).select("fullName mobile referrals joinDate createdAt role status").lean();
  if (!user || String(user.role || "user") !== "user") return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });

  const [earningAgg, depositAgg, rankMap] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id), status: "successful", type: { $in: ["claim", "bonus", "referralBonus"] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } } } },
    ]),
    Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id), status: "successful", type: "deposit" } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } } } },
    ]),
    getRankMap(),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      userId: id,
      name: user.fullName || user.mobile || "User",
      position: Number(rankMap.get(id) || 0),
      totalEarning: Number(earningAgg?.[0]?.total || 0),
      totalReferred: Array.isArray(user.referrals) ? user.referrals.length : 0,
      totalDeposited: Number(depositAgg?.[0]?.total || 0),
      joinedDaysAgo: daysAgo(user.joinDate || user.createdAt),
    },
  }, { status: 200 });
}
