import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Interest from "@/models/Interest";
import { clampPlanDays, MAX_PLAN_DAYS, MIN_PLAN_DAYS } from "@/lib/planDays";

const getSecret = () => {
  const s = process.env.JWT_SECRET || "";
  return s ? new TextEncoder().encode(s) : null;
};

async function getAuthUser() {
  const secret = getSecret();
  if (!secret) return { err: "JWT_SECRET missing" };
  const token = (await cookies()).get("token")?.value || "";
  if (!token) return { user: null };
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload?.userId ? String(payload.userId) : "";
    if (!userId) return { user: null };
    await dbConnect();
    const user = await User.findById(userId).select("_id role").lean();
    return { user: user || null };
  } catch {
    return { user: null };
  }
}

function isAdmin(u) {
  return String(u?.role || "").toLowerCase() === "admin";
}

export async function GET() {
  const { user, err } = await getAuthUser();
  if (err) return NextResponse.json({ ok: false, message: err }, { status: 500 });
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ ok: false, message: "Admin only" }, { status: 403 });

  await dbConnect();
  const doc = await Interest.findOne({}).select("valuePercent day").lean();

  return NextResponse.json(
    { ok: true, data: { valuePercent: typeof doc?.valuePercent === "number" ? doc.valuePercent : null, day: typeof doc?.day === "number" ? clampPlanDays(doc.day) : null } },
    { status: 200 }
  );
}

export async function POST(req) {
  const { user, err } = await getAuthUser();
  if (err) return NextResponse.json({ ok: false, message: err }, { status: 500 });
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ ok: false, message: "Admin only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const n = Number(String(body?.valuePercent ?? "").trim());
  const d = Number(String(body?.day ?? "").trim());

  if (!Number.isFinite(n) || n < 0) return NextResponse.json({ ok: false, message: "Invalid interest value" }, { status: 400 });
  if (!Number.isFinite(d) || d < MIN_PLAN_DAYS || d > MAX_PLAN_DAYS) return NextResponse.json({ ok: false, message: `Day must be between ${MIN_PLAN_DAYS} and ${MAX_PLAN_DAYS}` }, { status: 400 });

  const safeDay = clampPlanDays(d);

  await dbConnect();
  const doc = await Interest.findOneAndUpdate({}, { $set: { valuePercent: n, day: safeDay } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();

  return NextResponse.json({ ok: true, message: "Saved", data: { valuePercent: doc?.valuePercent ?? n, day: clampPlanDays(doc?.day ?? safeDay) } }, { status: 200 });
}
