export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAuthUserFromRequest } from "@/lib/auth";
import User from "@/models/User";
import Deposit from "@/models/Deposit";
import Withdraw from "@/models/Withdraw";
import Transaction from "@/models/Transaction";

function uniqueMobiles(values = []) {
  const seen = new Set();
  const out = [];
  for (const raw of values) {
    const value = String(raw || "").trim();
    if (!/^01\d{9}$/.test(value)) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function txtResponse(lines, filename = "numbers.txt") {
  return new NextResponse(Array.isArray(lines) ? lines.join("\n") + (lines.length ? "\n" : "") : "", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

async function getUserMobileMap(ids = []) {
  const cleanIds = Array.from(new Set(ids.map((id) => String(id || "")).filter(Boolean)));
  if (!cleanIds.length) return new Map();
  const users = await User.find({ _id: { $in: cleanIds } }).select("mobile").lean();
  return new Map(users.map((u) => [String(u._id), String(u.mobile || "")]));
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "users";
  const q = searchParams.get("q") || "";
  const userId = searchParams.get("userId") || "";

  if (mode === "users") {
    const query = String(q || "").trim();
    const filter = query
      ? { $or: [{ fullName: { $regex: query, $options: "i" } }, { mobile: { $regex: query, $options: "i" } }] }
      : {};
    const users = await User.find(filter).select("fullName mobile balance status").sort({ createdAt: -1 }).limit(30).lean();
    return NextResponse.json({ ok: true, data: users.map((user) => ({ id: String(user._id), fullName: user.fullName || "", mobile: user.mobile || "", balance: Number(user.balance || 0), status: user.status || "active" })) }, { status: 200 });
  }

  if (mode === "all-user-numbers") {
    const users = await User.find({}).select("mobile").lean();
    return txtResponse(uniqueMobiles(users.map((u) => u.mobile)), "all-user-numbers.txt");
  }

  if (mode === "all-deposit-numbers") {
    const deposits = await Deposit.find({}).select("senderNumber").lean();
    return txtResponse(uniqueMobiles(deposits.map((d) => d.senderNumber)), "all-deposit-numbers.txt");
  }

  if (mode === "all-withdraw-numbers") {
    const withdraws = await Withdraw.find({}).select("mobile").lean();
    return txtResponse(uniqueMobiles(withdraws.map((w) => w.mobile)), "all-withdraw-numbers.txt");
  }

  if (mode === "all-refund-numbers") {
    const rows = await Transaction.find({ type: "refund" }).select("user").lean();
    const map = await getUserMobileMap(rows.map((r) => r.user));
    return txtResponse(uniqueMobiles(rows.map((r) => map.get(String(r.user)) || "")), "all-refund-numbers.txt");
  }

  if (mode === "all-claim-numbers") {
    const rows = await Transaction.find({ type: "claim" }).select("user").lean();
    const map = await getUserMobileMap(rows.map((r) => r.user));
    return txtResponse(uniqueMobiles(rows.map((r) => map.get(String(r.user)) || "")), "all-claim-numbers.txt");
  }

  if (mode === "all-bonus-numbers") {
    const rows = await Transaction.find({ type: { $in: ["referralBonus", "gift", "profit", "bonus"] } }).select("user").lean();
    const map = await getUserMobileMap(rows.map((r) => r.user));
    return txtResponse(uniqueMobiles(rows.map((r) => map.get(String(r.user)) || "")), "all-bonus-numbers.txt");
  }

  if (!userId) return NextResponse.json({ ok: false, message: "userId is required" }, { status: 400 });

  if (mode === "user-deposit-numbers") {
    const deposits = await Deposit.find({ userId }).select("senderNumber").lean();
    return txtResponse(uniqueMobiles(deposits.map((d) => d.senderNumber)), "user-deposit-numbers.txt");
  }

  if (mode === "user-withdraw-numbers") {
    const withdraws = await Withdraw.find({ userId }).select("mobile").lean();
    return txtResponse(uniqueMobiles(withdraws.map((w) => w.mobile)), "user-withdraw-numbers.txt");
  }

  if (mode === "user-all-numbers") {
    const [deposits, withdraws, user] = await Promise.all([
      Deposit.find({ userId }).select("senderNumber").lean(),
      Withdraw.find({ userId }).select("mobile").lean(),
      User.findById(userId).select("mobile").lean(),
    ]);
    return txtResponse(uniqueMobiles([user?.mobile, ...deposits.map((d) => d.senderNumber), ...withdraws.map((w) => w.mobile)]), "user-all-numbers.txt");
  }

  return NextResponse.json({ ok: false, message: "Invalid mode" }, { status: 400 });
}
