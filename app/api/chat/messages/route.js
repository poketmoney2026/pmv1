import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import ChatThread from "@/models/ChatThread";
import ChatMessage from "@/models/ChatMessage";
import User from "@/models/User";
import { getAuthUserFromRequest } from "@/lib/auth";

function escapeHtml(text) {
  return String(text || "").replace(/[&<>\"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

async function sendTelegramFirstMessage({ user, text, imageUrl, createdAt }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  const safeName = escapeHtml(user?.fullName || "User");
  const safeMobile = escapeHtml(user?.mobile || "");
  const safeText = escapeHtml(text || imageUrl || "Image message");
  const safeTime = escapeHtml(new Date(createdAt || Date.now()).toLocaleString("en-US"));
  const message = `<b>New Live Chat Message</b>\n<b>User:</b> ${safeName}\n<b>Mobile:</b> ${safeMobile}\n<b>Time:</b> ${safeTime}\n<b>Message:</b> ${safeText}${imageUrl ? `\n<b>Image:</b> ${escapeHtml(imageUrl)}` : ""}`;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML", disable_web_page_preview: false }),
  }).catch(() => null);
}

async function getThreadForAuth(auth, threadId) {
  if (!threadId || !mongoose.Types.ObjectId.isValid(threadId)) return null;
  const thread = await ChatThread.findById(threadId).lean();
  if (!thread) return null;
  const role = String(auth.user.role || "user");
  if (role === "admin") return thread;
  if (String(thread.userId) !== String(auth.userId)) return null;
  return thread;
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const { searchParams } = new URL(req.url);
  let threadId = String(searchParams.get("threadId") || "");
  const markRead = String(searchParams.get("markRead") || "") === "1";

  if (!threadId && String(auth.user.role || "user") !== "admin") {
    const thread = await ChatThread.findOne({ userId: auth.userId }).lean();
    if (!thread) return NextResponse.json({ ok: true, data: [] }, { status: 200 });
    threadId = String(thread._id);
  }

  const thread = await getThreadForAuth(auth, threadId);
  if (!thread) return NextResponse.json({ ok: false, message: "Thread not found" }, { status: 404 });

  const rows = await ChatMessage.find({ threadId: thread._id }).sort({ createdAt: 1 }).limit(500).lean();

  if (markRead) {
    if (String(auth.user.role || "user") === "admin") {
      await ChatThread.updateOne({ _id: thread._id }, { $set: { unreadByAdmin: 0 } });
    } else {
      await ChatThread.updateOne({ _id: thread._id }, { $set: { unreadByUser: 0 } });
    }
  }

  return NextResponse.json({
    ok: true,
    threadId: String(thread._id),
    data: rows.map((row) => ({
      _id: String(row._id),
      threadId: String(row.threadId),
      senderId: String(row.senderId),
      senderRole: row.senderRole,
      message: row.message || "",
      imageUrl: row.imageUrl || "",
      imagePublicId: row.imagePublicId || "",
      sessionId: row.sessionId || "",
      createdAt: row.createdAt || null,
    })),
  }, { status: 200 });
}

export async function POST(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const role = String(auth.user.role || "user");
  const message = String(body.message || "").trim();
  const imageUrl = String(body.imageUrl || "").trim();
  const imagePublicId = String(body.imagePublicId || "").trim();
  const sessionId = String(body.sessionId || "").trim().slice(0, 120);
  const notifyFirstInSession = Boolean(body.notifyFirstInSession);

  if (!message && !imageUrl) return NextResponse.json({ ok: false, message: "Message or image required" }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ ok: false, message: "Message too long" }, { status: 400 });

  let thread;
  if (role === "admin") {
    const threadId = String(body.threadId || "");
    thread = await getThreadForAuth(auth, threadId);
    if (!thread) return NextResponse.json({ ok: false, message: "Thread not found" }, { status: 404 });
  } else {
    const user = await User.findById(auth.userId).select("status fullName mobile").lean();
    if (!user || String(user.status || "active") !== "active") {
      return NextResponse.json({ ok: false, message: "Your account is inactive." }, { status: 403 });
    }
    thread = await ChatThread.findOneAndUpdate(
      { userId: auth.userId },
      { $setOnInsert: { userId: auth.userId, lastMessageAt: new Date(), lastMessage: "", unreadByAdmin: 0, unreadByUser: 0 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
  }

  const created = await ChatMessage.create({
    threadId: thread._id,
    senderId: auth.userId,
    senderRole: role === "admin" ? "admin" : "user",
    message,
    imageUrl,
    imagePublicId,
    sessionId,
  });

  const lastPreview = message || (imageUrl ? "Image" : "");
  await ChatThread.updateOne(
    { _id: thread._id },
    {
      $set: {
        lastMessage: lastPreview,
        lastMessageAt: created.createdAt || new Date(),
        ...(sessionId ? { latestSessionId: sessionId } : {}),
      },
      $inc: role === "admin" ? { unreadByUser: 1 } : { unreadByAdmin: 1 },
      ...(role === "admin" ? { $addToSet: { adminIds: auth.userId } } : {}),
    }
  );

  if (role !== "admin" && sessionId && notifyFirstInSession) {
    const user = auth.user;
    await sendTelegramFirstMessage({ user, text: message, imageUrl, createdAt: created.createdAt }).catch(() => null);
    await ChatThread.updateOne({ _id: thread._id }, { $set: { latestSessionId: sessionId, latestSessionNotifiedAt: new Date() } });
  }

  return NextResponse.json({
    ok: true,
    data: {
      _id: String(created._id),
      threadId: String(thread._id),
      senderId: String(created.senderId),
      senderRole: created.senderRole,
      message: created.message || "",
      imageUrl: created.imageUrl || "",
      imagePublicId: created.imagePublicId || "",
      sessionId: created.sessionId || "",
      createdAt: created.createdAt || null,
    },
  }, { status: 200 });
}
