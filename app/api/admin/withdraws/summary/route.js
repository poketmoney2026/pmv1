import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import Withdraw from "@/models/Withdraw";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return { ok: false, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  try {
    const { payload } = await jwtVerify(token, secret);
    const role = String(payload?.role || "user").toLowerCase();
    if (role !== "admin") {
      return { ok: false, res: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
    }
    return { ok: true, payload };
  } catch {
    return { ok: false, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
}

// Dhaka day start in UTC instant
function startOfDhakaDayUTC(date = new Date()) {
  const offsetMs = 6 * 60 * 60 * 1000;
  const dhakaMs = date.getTime() + offsetMs;
  const d = new Date(dhakaMs);
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() - offsetMs);
}

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  await dbConnect();

  const byStatus = await Withdraw.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        amountSum: { $sum: "$amount" },
      },
    },
  ]);

  const total = byStatus.reduce(
    (acc, r) => {
      acc.count += Number(r.count || 0);
      acc.amount += Number(r.amountSum || 0);
      return acc;
    },
    { count: 0, amount: 0 }
  );

  const map = (arr) => {
    const out = { pending: 0, processing: 0, successful: 0, reject: 0 };
    const amt = { pending: 0, processing: 0, successful: 0, reject: 0 };
    for (const r of arr) {
      const k = String(r._id || "").toLowerCase();
      if (k in out) {
        out[k] = Number(r.count || 0);
        amt[k] = Number(r.amountSum || 0);
      }
    }
    return { counts: out, amounts: amt };
  };

  const overall = map(byStatus);

  // ✅ Today analytics (Dhaka day)
  const dayStart = startOfDhakaDayUTC(new Date());
  const todayByStatus = await Withdraw.aggregate([
    { $match: { createdAt: { $gte: dayStart } } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        amountSum: { $sum: "$amount" },
      },
    },
  ]);

  const todayTotal = todayByStatus.reduce(
    (acc, r) => {
      acc.count += Number(r.count || 0);
      acc.amount += Number(r.amountSum || 0);
      return acc;
    },
    { count: 0, amount: 0 }
  );

  const today = map(todayByStatus);

  return NextResponse.json({
    ok: true,
    data: {
      totalCount: total.count,
      totalAmount: total.amount,
      counts: overall.counts,
      amounts: overall.amounts,
      today: {
        startUtc: dayStart,
        totalCount: todayTotal.count,
        totalAmount: todayTotal.amount,
        counts: today.counts,
        amounts: today.amounts,
      },
    },
  });
}
