import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Deposit from "@/models/Deposit";
import User from "@/models/User";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;
  if (String(auth.user?.role || "user") !== "agent") {
    return NextResponse.json({ ok: false, message: "Agent only" }, { status: 403 });
  }

  await dbConnect();
  const deposits = await Deposit.find({ status: "processing" }).sort({ createdAt: -1 }).limit(200).lean();
  const userIds = Array.from(new Set((deposits || []).map((d) => String(d.userId || "")).filter(Boolean)));
  const users = await User.find({ _id: { $in: userIds }, role: "user" }).select("_id fullName mobile role").lean();
  const map = new Map(users.map((u) => [String(u._id), u]));
  const items = (deposits || [])
    .filter((d) => map.has(String(d.userId || "")))
    .map((d) => {
      const u = map.get(String(d.userId)) || null;
      const userName = u?.fullName || u?.mobile || "User";
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

  return NextResponse.json({ ok: true, data: { items, agentBalance: Number(auth.user?.balance || 0) } }, { status: 200 });
}
