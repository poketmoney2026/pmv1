import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Deposit from "@/models/Deposit";
import GeneralSettings from "@/models/GeneralSettings";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");

async function getAuthUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload?.userId ? String(payload.userId) : null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const skip = Math.max(0, Number(searchParams.get("skip") || 0));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));

  await dbConnect();

  const [user, items, settings] = await Promise.all([
    User.findById(userId).select("_id name fullName mobile status role").lean(),
    Deposit.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    GeneralSettings.findOne({ key: "global" }).lean(),
  ]);

  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const userName = user?.name || user?.fullName || user?.mobile || "User";

  const mapped = (items || []).map((d) => ({
    _id: String(d._id),
    userId: String(user._id).slice(-6),
    userName,
    createdAt: d.createdAt,
    mobile: d.senderNumber || "—",
    method: d.paymentMethod || "—",
    amount: d.amount || 0,
    verifyVia: d.verifyMode || "—",
    status: d.status || "processing",
    trxId: d.trxId || "",
    screenshotUrl: d.screenshotUrl || "",
    paymentProofImageUrl: d.paymentProofImageUrl || "",
    processingExpiresAt: d.processingExpiresAt || null,
  }));

  return NextResponse.json(
    {
      ok: true,
      data: {
        items: mapped,
        settings: {
          allowMultipleDeposits: settings?.allowMultipleDeposits !== false,
          depositTimerHours: Number(settings?.depositTimerHours ?? 1),
          minDeposit: Number(settings?.minDeposit ?? 0),
          agentMinDepositBkash: Number(settings?.agentMinDepositBkash ?? 0),
          agentMinDepositNagad: Number(settings?.agentMinDepositNagad ?? 0),
          role: String(user?.role || "user").toLowerCase(),
        },
      },
    },
    { status: 200 }
  );
}
