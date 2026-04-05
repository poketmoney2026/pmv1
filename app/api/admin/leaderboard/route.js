import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Transaction from "@/models/Transaction";
import GeneralSettings from "@/models/GeneralSettings";
import LeaderboardCycle from "@/models/LeaderboardCycle";
import User from "@/models/User";
import { getAuthUserFromRequest } from "@/lib/auth";

const DAY_MS = 24 * 60 * 60 * 1000;

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

function amountForRank(rank, prizeConfig) {
  if (rank === 1) return prizeConfig.firstPrize;
  if (rank === 2) return prizeConfig.secondPrize;
  if (rank === 3) return prizeConfig.thirdPrize;
  if (rank >= 4 && rank <= 10) return prizeConfig.rank4to10Prize;
  if (rank >= 11 && rank <= 50) return prizeConfig.rank11to50Prize;
  return 0;
}

async function buildRankedList() {
  const start = getWindowStart();
  const agg = await Transaction.aggregate([
    { $match: { type: "claim", status: "successful", createdAt: { $gte: start } } },
    { $group: { _id: "$user", claimTotal: { $sum: { $ifNull: ["$amount", 0] } } } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $match: { "user.role": "user" } },
    { $project: { _id: 1, claimTotal: 1, fullName: "$user.fullName", mobile: "$user.mobile", status: "$user.status" } },
    { $sort: { claimTotal: -1, _id: 1 } },
  ]);
  return agg.map((row, index) => ({
    id: String(row._id),
    userId: row._id,
    name: row.fullName || row.mobile || "User",
    mobile: row.mobile || "",
    claimTotal: Number(row.claimTotal || 0),
    rank: index + 1,
    status: row.status || "active",
  }));
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const settings = await GeneralSettings.findOne({ key: "global" }).lean();
  const prizeConfig = prizeShape(settings);
  const cycle = await LeaderboardCycle.findOne({ key: "global" }).lean();
  const users = await buildRankedList();
  const lastGiveawayAt = cycle?.lastGiveawayAt ? new Date(cycle.lastGiveawayAt).getTime() : 0;
  const nextGiveawayAt = lastGiveawayAt ? lastGiveawayAt + 29 * DAY_MS : Date.now();

  return NextResponse.json({
    ok: true,
    users,
    prizeConfig,
    cycle: {
      lastGiveawayAt: cycle?.lastGiveawayAt || null,
      nextGiveawayAt,
      giveawayEnabled: Date.now() >= nextGiveawayAt,
    },
  }, { status: 200 });
}

export async function POST(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const cycle = await LeaderboardCycle.findOne({ key: "global" }).lean();
  const lastGiveawayAt = cycle?.lastGiveawayAt ? new Date(cycle.lastGiveawayAt).getTime() : 0;
  const nextGiveawayAt = lastGiveawayAt ? lastGiveawayAt + 29 * DAY_MS : Date.now();
  if (Date.now() < nextGiveawayAt) {
    return NextResponse.json({ ok: false, message: "Giveaway is not available yet" }, { status: 400 });
  }

  const settings = await GeneralSettings.findOne({ key: "global" }).lean();
  const prizeConfig = prizeShape(settings);
  const rankedUsers = await buildRankedList();
  if (!rankedUsers.length) return NextResponse.json({ ok: false, message: "No ranked users available" }, { status: 400 });

  const winners = [];
  for (const row of rankedUsers) {
    const prize = amountForRank(row.rank, prizeConfig);
    if (prize <= 0) continue;
    const user = await User.findById(row.userId).select("_id balance transactions status");
    if (!user || String(user.status || "active") !== "active") continue;
    user.balance = Number(user.balance || 0) + prize;
    const tx = await Transaction.create({
      user: user._id,
      type: "giveaway",
      status: "successful",
      amount: prize,
      note: `Leaderboard giveaway reward credited for rank ${row.rank}: Tk ${prize.toFixed(2)}`,
      date: new Date(),
    });
    user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
    user.transactions.push(tx._id);
    await user.save();
    winners.push({ userId: String(user._id), rank: row.rank, amount: prize, name: row.name });
  }

  await LeaderboardCycle.findOneAndUpdate({ key: "global" }, { $setOnInsert: { key: "global" }, $set: { lastGiveawayAt: new Date() } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  return NextResponse.json({ ok: true, message: "Giveaway completed successfully", data: { winners } }, { status: 200 });
}
