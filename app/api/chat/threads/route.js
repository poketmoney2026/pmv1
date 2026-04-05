import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ChatThread from "@/models/ChatThread";
import User from "@/models/User";
import { getAuthUserFromRequest } from "@/lib/auth";

async function ensureThreadForUser(userId) {
  let thread = await ChatThread.findOne({ userId }).lean();
  if (!thread) {
    thread = await ChatThread.create({ userId, lastMessage: "", lastMessageAt: new Date(), unreadByAdmin: 0, unreadByUser: 0 });
    return thread.toObject();
  }
  return thread;
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const role = String(auth.user.role || "user");
  if (role === "admin") {
    const threads = await ChatThread.find({})
      .sort({ lastMessageAt: -1 })
      .populate({ path: "userId", select: "fullName mobile status role" })
      .lean();

    return NextResponse.json({ ok: true, role: "admin", data: threads.map((row) => ({
      _id: String(row._id),
      user: row.userId ? {
        _id: String(row.userId._id),
        fullName: row.userId.fullName || "User",
        mobile: row.userId.mobile || "",
        status: row.userId.status || "active",
      } : null,
      lastMessage: row.lastMessage || "",
      lastMessageAt: row.lastMessageAt || row.updatedAt || null,
      unreadByAdmin: Number(row.unreadByAdmin || 0),
      unreadByUser: Number(row.unreadByUser || 0),
    })) }, { status: 200 });
  }

  const thread = await ensureThreadForUser(auth.userId);
  return NextResponse.json({ ok: true, role: "user", data: { _id: String(thread._id), userId: auth.userId, lastMessage: thread.lastMessage || "", lastMessageAt: thread.lastMessageAt || thread.updatedAt || null, unreadByAdmin: Number(thread.unreadByAdmin || 0), unreadByUser: Number(thread.unreadByUser || 0) } }, { status: 200 });
}
