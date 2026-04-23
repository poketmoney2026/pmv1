import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import GeneralSettings from "@/models/GeneralSettings";
import LeaderboardCycle from "@/models/LeaderboardCycle";
import { getUserIdFromToken } from "@/lib/auth";

const DAY_MS = 24 * 60 * 60 * 1000;

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function getWindowStart() {
  return new Date(Date.now() - 30 * DAY_MS);
}

function prizeShape(settings) {
  return {
    firstPrize: Number(settings?.firstPrize ?? 10000),
    secondPrize: Number(settings?.secondPrize ?? 5000),
    thirdPrize: Number(settings?.thirdPrize ?? 3000),
    rank4to10Prize: Number(settings?.rank4to10Prize ?? 2000),
    rank11to50Prize: Number(settings?.rank11to50Prize ?? 1000),
  };
}

async function buildLeaderboard({ uid, limit, offset }) {
  const start = getWindowStart();
  const [settings, cycle, totalUsers, agg] = await Promise.all([
    GeneralSettings.findOne({ key: "global" }).lean(),
    LeaderboardCycle.findOne({ key: "global" }).lean(),
    User.countDocuments({ role: "user" }),
    Transaction.aggregate([
    { $match: { type: "claim", status: "successful", createdAt: { $gte: start } } },
    { $group: { _id: "$user", claimTotal: { $sum: { $ifNull: ["$amount", 0] } } } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $match: { "user.role": "user" } },
    { $project: { _id: 1, claimTotal: 1, fullName: "$user.fullName", mobile: "$user.mobile", status: "$user.status" } },
    { $sort: { claimTotal: -1, _id: 1 } },
    ]),
  ]);

  const ranked = agg.map((row, index) => ({
    id: String(row._id),
    name: row.fullName || row.mobile || "User",
    mobile: row.mobile || "",
    claimTotal: Number(row.claimTotal || 0),
    rank: index + 1,
    status: row.status || "active",
  }));

  const myPosition = uid ? (ranked.findIndex((u) => String(u.id) === String(uid)) + 1 || 0) : 0;
  const slice = ranked.slice(offset, offset + limit);
  const lastGiveawayAt = cycle?.lastGiveawayAt ? new Date(cycle.lastGiveawayAt).getTime() : 0;
  const nextGiveawayAt = lastGiveawayAt ? lastGiveawayAt + 29 * DAY_MS : Date.now();
  const prizeConfig = prizeShape(settings);

  return {
    totalUsers: Number(totalUsers || 0),
    myPosition,
    users: slice,
    hasMore: offset + slice.length < ranked.length,
    nextOffset: offset + slice.length,
    prizeConfig,
    cycle: {
      lastGiveawayAt: cycle?.lastGiveawayAt || null,
      nextGiveawayAt,
      giveawayEnabled: Date.now() >= nextGiveawayAt,
    },
  };
}

export async function GET(req) {
  try {
    await dbConnect();
    const uid = await getUserIdFromToken();
    if (!uid) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, toInt(url.searchParams.get("limit"), 50)));
    const offset = Math.max(0, toInt(url.searchParams.get("offset"), 0));
    const me = await User.findById(uid).select("_id role status fullName mobile").lean();
    if (!me) return NextResponse.json({ message: "User not found" }, { status: 404 });
    if (String(me.status || "active") !== "active") return NextResponse.json({ message: "Your account is inactive. Please contact support." }, { status: 403 });
    const payload = await buildLeaderboard({ uid, limit, offset });
    return NextResponse.json(payload, { status: 200 });
  } catch (e) {
    console.error("LEADERBOARD_GET_ERROR", e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
