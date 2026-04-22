import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import VisitSession from "@/models/VisitSession";
import VisitEvent from "@/models/VisitEvent";
import User from "@/models/User";
import Deposit from "@/models/Deposit";
import Withdraw from "@/models/Withdraw";
import { getAuthUserFromRequest } from "@/lib/auth";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const VALID_PERIODS = new Set([1, 7, 15, 30]);

function cleanPeriod(value) {
  const n = Number(value || 1);
  return VALID_PERIODS.has(n) ? n : 1;
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function toId(value) {
  return value ? String(value) : "";
}

function moneySum(rows, key = "amount") {
  return rows.reduce((sum, row) => sum + Number(row?.[key] || 0), 0);
}

function buildEventAgg(events = []) {
  const userSet = new Set();
  const pageMap = new Map();
  const userStats = new Map();

  for (const event of events) {
    const uid = toId(event.userId) || String(event.mobile || "") || String(event.sessionKey || "");
    if (uid) userSet.add(uid);
    const path = String(event.path || "/") || "/";
    const type = String(event.eventType || "view").toLowerCase() === "click" ? "click" : "view";

    const page = pageMap.get(path) || { path, views: 0, clicks: 0, users: new Set(), lastAt: null };
    if (type === "click") page.clicks += 1;
    else page.views += 1;
    if (uid) page.users.add(uid);
    page.lastAt = event.createdAt || page.lastAt;
    pageMap.set(path, page);

    const stat = userStats.get(uid) || { views: 0, clicks: 0, lastAt: null };
    if (type === "click") stat.clicks += 1;
    else stat.views += 1;
    stat.lastAt = event.createdAt || stat.lastAt;
    userStats.set(uid, stat);
  }

  const pageRows = Array.from(pageMap.values())
    .map((row) => ({
      path: row.path,
      views: row.views,
      clicks: row.clicks,
      users: row.users.size,
      score: row.clicks * 2 + row.views,
      lastAt: row.lastAt,
    }))
    .sort((a, b) => b.score - a.score || b.users - a.users || b.clicks - a.clicks || b.views - a.views)
    .slice(0, 40);

  return {
    uniqueUsers: userSet.size,
    totalViews: events.filter((row) => String(row.eventType || "view") !== "click").length,
    totalClicks: events.filter((row) => String(row.eventType || "view") === "click").length,
    pageRows,
    userStats,
  };
}

function buildLivePageRows(onlineSessions = []) {
  const map = new Map();
  for (const row of onlineSessions) {
    const path = String(row.currentPath || "/") || "/";
    const item = map.get(path) || { path, users: 0, usersList: [] };
    item.users += 1;
    if (row.mobile || row.fullName) item.usersList.push({ fullName: row.fullName || "User", mobile: row.mobile || "" });
    map.set(path, item);
  }
  return Array.from(map.values())
    .sort((a, b) => b.users - a.users)
    .slice(0, 20);
}

async function buildUserDetail(userId, period, now, onlineSince) {
  const [user, onlineSession, sessions, eventsPeriod, events24, eventsYesterday] = await Promise.all([
    User.findById(userId).select("_id fullName mobile balance status role createdAt inactiveReason").lean(),
    VisitSession.findOne({ userId, lastSeenAt: { $gte: onlineSince } }).sort({ lastSeenAt: -1 }).lean(),
    VisitSession.find({ userId }).sort({ lastSeenAt: -1 }).limit(10).lean(),
    VisitEvent.find({ userId, role: "user", createdAt: { $gte: new Date(now - period * DAY_MS) } }).sort({ createdAt: -1 }).limit(500).lean(),
    VisitEvent.find({ userId, role: "user", createdAt: { $gte: new Date(now - DAY_MS) } }).lean(),
    VisitEvent.find({ userId, role: "user", createdAt: { $gte: new Date(now - 2 * DAY_MS), $lt: new Date(now - DAY_MS) } }).lean(),
  ]);

  if (!user) return null;

  const aggPeriod = buildEventAgg(eventsPeriod);
  const agg24 = buildEventAgg(events24);
  const aggYesterday = buildEventAgg(eventsYesterday);

  return {
    userId: String(user._id),
    fullName: user.fullName || "User",
    mobile: user.mobile || "",
    balance: Number(user.balance || 0),
    status: String(user.status || "active"),
    role: String(user.role || "user"),
    inactiveReason: user.inactiveReason || "",
    joinedAt: user.createdAt || null,
    online: Boolean(onlineSession),
    currentPath: onlineSession?.currentPath || sessions?.[0]?.currentPath || "/",
    lastSeenAt: onlineSession?.lastSeenAt || sessions?.[0]?.lastSeenAt || null,
    clicks24h: agg24.totalClicks,
    views24h: agg24.totalViews,
    clicksYesterday: aggYesterday.totalClicks,
    viewsYesterday: aggYesterday.totalViews,
    clicksPeriod: aggPeriod.totalClicks,
    viewsPeriod: aggPeriod.totalViews,
    pageRows: aggPeriod.pageRows.slice(0, 20),
    recentEvents: eventsPeriod.slice(0, 30).map((row) => ({ path: row.path || "/", eventType: row.eventType || "view", createdAt: row.createdAt })),
  };
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const period = cleanPeriod(searchParams.get("period"));
  const selectedUserId = String(searchParams.get("userId") || "").trim();
  const now = Date.now();
  const since24 = new Date(now - DAY_MS);
  const sincePeriod = new Date(now - period * DAY_MS);
  const onlineSince = new Date(now - 2 * 60 * 1000);

  const [
    sessions24,
    onlineSessionsRaw,
    sessionsPeriodRaw,
    eventsPeriod,
    newUsersPeriod,
    depositsPeriod,
    withdrawsPeriod,
    userDetail,
  ] = await Promise.all([
    VisitSession.find({ role: "user", lastSeenAt: { $gte: since24 } }).sort({ lastSeenAt: -1 }).lean(),
    VisitSession.find({ role: "user", lastSeenAt: { $gte: onlineSince } }).sort({ lastSeenAt: -1 }).lean(),
    VisitSession.find({ role: "user", lastSeenAt: { $gte: sincePeriod } }).sort({ lastSeenAt: -1 }).lean(),
    VisitEvent.find({ role: "user", createdAt: { $gte: sincePeriod } }).sort({ createdAt: -1 }).lean(),
    User.countDocuments({ role: "user", createdAt: { $gte: sincePeriod } }),
    Deposit.find({ createdAt: { $gte: sincePeriod } }).select("amount userId createdAt").lean(),
    Withdraw.find({ createdAt: { $gte: sincePeriod } }).select("amount feeAmount totalDebit userId createdAt").lean(),
    selectedUserId ? buildUserDetail(selectedUserId, period, now, onlineSince) : Promise.resolve(null),
  ]);

  const onlineSessions = uniqBy(onlineSessionsRaw, (item) => toId(item.userId) || item.mobile || item.sessionKey);
  const sessionsPeriod = uniqBy(sessionsPeriodRaw, (item) => toId(item.userId) || item.mobile || item.sessionKey);
  const visit24Users = uniqBy(sessions24, (item) => toId(item.userId) || item.mobile || item.sessionKey);
  const eventAgg = buildEventAgg(eventsPeriod);

  const userIds = Array.from(new Set([
    ...onlineSessions.map((item) => toId(item.userId)).filter(Boolean),
    ...sessionsPeriod.map((item) => toId(item.userId)).filter(Boolean),
    ...(selectedUserId ? [selectedUserId] : []),
  ]));
  const users = await User.find({ _id: { $in: userIds } }).select("_id fullName mobile balance status role").lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const onlineRows = onlineSessions.slice(0, 30).map((item) => {
    const user = userMap.get(toId(item.userId)) || {};
    const uid = toId(item.userId) || item.mobile || item.sessionKey;
    const stat = eventAgg.userStats.get(uid) || { views: 0, clicks: 0 };
    return {
      userId: toId(item.userId),
      fullName: user.fullName || item.fullName || "User",
      mobile: user.mobile || item.mobile || "",
      balance: Number(user.balance || 0),
      status: String(user.status || "active"),
      currentPath: item.currentPath || "/",
      liveForMin: Math.max(0, Math.floor((now - new Date(item.firstSeenAt || item.createdAt).getTime()) / 60000)),
      lastSeenSec: Math.max(0, Math.floor((now - new Date(item.lastSeenAt || item.updatedAt).getTime()) / 1000)),
      pingCount: Number(item.pingCount || 0),
      clickCount: Number(item.clickCount || 0),
      periodViews: stat.views || 0,
      periodClicks: stat.clicks || 0,
    };
  });

  const activeRows = sessionsPeriod.slice(0, 60).map((item) => {
    const user = userMap.get(toId(item.userId)) || {};
    const uid = toId(item.userId) || item.mobile || item.sessionKey;
    const stat = eventAgg.userStats.get(uid) || { views: 0, clicks: 0 };
    return {
      userId: toId(item.userId),
      fullName: user.fullName || item.fullName || "User",
      mobile: user.mobile || item.mobile || "",
      balance: Number(user.balance || 0),
      status: String(user.status || "active"),
      lastSeenAt: item.lastSeenAt || item.updatedAt || item.createdAt,
      currentPath: item.currentPath || "/",
      pingCount: Number(item.pingCount || 0),
      clickCount: Number(item.clickCount || 0),
      periodViews: stat.views || 0,
      periodClicks: stat.clicks || 0,
    };
  });

  return NextResponse.json({
    ok: true,
    data: {
      summary: {
        onlineNow: onlineRows.length,
        visitors24h: visit24Users.length,
        activePeriod: eventAgg.uniqueUsers,
        newUsersPeriod: Number(newUsersPeriod || 0),
        depositsPeriod: depositsPeriod.length,
        withdrawsPeriod: withdrawsPeriod.length,
        depositAmountPeriod: moneySum(depositsPeriod, "amount"),
        withdrawAmountPeriod: moneySum(withdrawsPeriod, "amount"),
        viewsPeriod: eventAgg.totalViews,
        clicksPeriod: eventAgg.totalClicks,
      },
      onlineRows,
      activeRows,
      pageRows: eventAgg.pageRows,
      livePageRows: buildLivePageRows(onlineSessions),
      detail: userDetail,
    },
  }, { status: 200 });
}
