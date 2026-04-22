import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ChatThread from "@/models/ChatThread";
import User from "@/models/User";
import { getAuthUserFromRequest } from "@/lib/auth";

const ONLINE_WINDOW_MS = 90 * 1000;

function buildPresence(lastSeenAt) {
  const value = lastSeenAt ? new Date(lastSeenAt) : null;
  const time = value && !Number.isNaN(value.getTime()) ? value.toISOString() : null;
  return {
    isOnline: !!(value && (Date.now() - value.getTime()) <= ONLINE_WINDOW_MS),
    lastSeenAt: time,
  };
}

async function markChatSeen(userId) {
  if (!userId) return;
  await User.updateOne({ _id: userId }, { $set: { chatLastSeenAt: new Date() } }).catch(() => null);
}

async function ensureThreadForUser(userId) {
  let thread = await ChatThread.findOne({ userId }).lean();
  if (!thread) {
    thread = await ChatThread.create({ userId, lastMessage: "", lastMessageAt: new Date(), unreadByAdmin: 0, unreadByUser: 0 });
    return thread.toObject();
  }
  return thread;
}

async function pickSupportAdmin(thread) {
  const preferredAdminId = Array.isArray(thread?.adminIds) && thread.adminIds.length ? thread.adminIds[thread.adminIds.length - 1] : null;
  let admin = null;
  if (preferredAdminId) admin = await User.findById(preferredAdminId).select("fullName mobile chatLastSeenAt").lean();
  if (!admin) admin = await User.findOne({ role: "admin" }).sort({ chatLastSeenAt: -1, createdAt: 1 }).select("fullName mobile chatLastSeenAt").lean();
  if (!admin) return { fullName: "Admin Support", mobile: "", label: "Admin", presence: { isOnline: false, lastSeenAt: null } };
  return {
    _id: String(admin._id),
    fullName: admin.fullName || "Admin Support",
    mobile: admin.mobile || "",
    label: "Admin",
    presence: buildPresence(admin.chatLastSeenAt),
  };
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  await markChatSeen(auth.userId);

  const role = String(auth.user.role || "user");
  if (role === "admin") {
    const threads = await ChatThread.find({})
      .sort({ lastMessageAt: -1 })
      .populate({ path: "userId", select: "fullName mobile status role chatLastSeenAt" })
      .lean();

    return NextResponse.json({ ok: true, role: "admin", data: threads.map((row) => ({
      _id: String(row._id),
      user: row.userId ? {
        _id: String(row.userId._id),
        fullName: row.userId.fullName || "User",
        mobile: row.userId.mobile || "",
        status: row.userId.status || "active",
        label: "User",
        presence: buildPresence(row.userId.chatLastSeenAt),
      } : null,
      lastMessage: row.lastMessage || "",
      lastMessageAt: row.lastMessageAt || row.updatedAt || null,
      unreadByAdmin: Number(row.unreadByAdmin || 0),
      unreadByUser: Number(row.unreadByUser || 0),
    })) }, { status: 200 });
  }

  const thread = await ensureThreadForUser(auth.userId);
  const supportAdmin = await pickSupportAdmin(thread);
  return NextResponse.json({ ok: true, role: "user", data: { _id: String(thread._id), userId: auth.userId, lastMessage: thread.lastMessage || "", lastMessageAt: thread.lastMessageAt || thread.updatedAt || null, unreadByAdmin: Number(thread.unreadByAdmin || 0), unreadByUser: Number(thread.unreadByUser || 0), supportAdmin } }, { status: 200 });
}
