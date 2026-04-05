import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import Deposit from "@/models/Deposit";
import User from "@/models/User";

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

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  await dbConnect();

  const deposits = await Deposit.find({ status: "processing" })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const userIds = Array.from(
    new Set((deposits || []).map((d) => String(d.userId || "")).filter(Boolean))
  );

  const users = await User.find({ _id: { $in: userIds } })
    .select("_id fullName mobile")
    .lean();

  const map = new Map(users.map((u) => [String(u._id), u]));

  const items = (deposits || []).map((d) => {
    const u = map.get(String(d.userId)) || null;
    const userName =
      u?.fullName || u?.mobile || "User";

    return {
      _id: String(d._id),
      userId: String(d.userId || "").slice(-6),
      userName,
      createdAt: d.createdAt,
      mobile: d.senderNumber || "",
      method: d.paymentMethod || "—",
      amount: d.amount || 0,
      verifyVia: d.verifyMode || "—",
      status: d.status || "processing",
      trxId: d.trxId || "",
      screenshotUrl: d.screenshotUrl || "",
    };
  });

  return NextResponse.json({ ok: true, data: { items } }, { status: 200 });
}
