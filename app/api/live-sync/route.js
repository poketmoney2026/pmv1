import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import LinkSettings from "@/models/LinkSettings";
import Notice from "@/models/Notice";
import GeneralSettings from "@/models/GeneralSettings";
import { decryptText } from "@/lib/crypto";
import { decodeTokenValue } from "@/lib/auth";

export const dynamic = "force-dynamic";

function buildResponse(data, clearToken = false) {
  const res = NextResponse.json({ ok: true, data }, { status: 200 });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  if (clearToken) {
    res.cookies.set({
      name: "token",
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }
  return res;
}

async function readSupport() {
  const doc = await LinkSettings.findOne({}).select("contactWhatsApp contactTelegram contactTelegramGroup").lean();
  return {
    contactWhatsApp: decryptText(doc?.contactWhatsApp || ""),
    contactTelegram: decryptText(doc?.contactTelegram || ""),
    contactTelegramGroup: decryptText(doc?.contactTelegramGroup || ""),
  };
}

export async function GET(req) {
  try {
    await dbConnect();
    const [support, noticeDoc, settings] = await Promise.all([readSupport(), Notice.findOne({ key: "global" }).lean(), GeneralSettings.findOne({ key: "global" }).lean()]);
    const token = req.cookies.get("token")?.value || "";

    if (!token) {
      return buildResponse({ authenticated: false, role: "user", status: "guest", sessionState: "guest", support, notice: { title: noticeDoc?.title || "NOTICE", body: noticeDoc?.body || "", isActive: noticeDoc?.isActive !== false, updatedAt: noticeDoc?.updatedAt || null, intervalMin: Number(settings?.noticeIntervalMin || 30) } });
    }

    const payload = await decodeTokenValue(token);
    const userId = payload?.uid || payload?.userId || payload?.id || payload?.sub || null;
    if (!payload || !userId) {
      return buildResponse({ authenticated: false, role: "user", status: "invalid", sessionState: "invalid", support, notice: { title: noticeDoc?.title || "NOTICE", body: noticeDoc?.body || "", isActive: noticeDoc?.isActive !== false, updatedAt: noticeDoc?.updatedAt || null, intervalMin: Number(settings?.noticeIntervalMin || 30) } }, true);
    }

    const user = await User.findById(userId).select("_id role status inactiveReason fullName mobile balance giftNoticeOpen giftNoticeAmount giftNoticeUpdatedAt").lean();
    if (!user) {
      return buildResponse({ authenticated: false, role: "user", status: "deleted", sessionState: "invalid", support, notice: { title: noticeDoc?.title || "NOTICE", body: noticeDoc?.body || "", isActive: noticeDoc?.isActive !== false, updatedAt: noticeDoc?.updatedAt || null, intervalMin: Number(settings?.noticeIntervalMin || 30) } }, true);
    }

    const role = String(user.role || "user").toLowerCase() === "admin" ? "admin" : "user";
    const status = String(user.status || "active").toLowerCase() === "inactive" ? "inactive" : "active";

    return buildResponse({
      authenticated: true,
      role,
      status,
      sessionState: status === "active" ? "ok" : "inactive",
      support,
      inactiveReason: user.inactiveReason || "",
      notice: { title: noticeDoc?.title || "NOTICE", body: noticeDoc?.body || "", isActive: noticeDoc?.isActive !== false, updatedAt: noticeDoc?.updatedAt || null, intervalMin: Number(settings?.noticeIntervalMin || 30) },
      giftNotice: {
        open: Boolean(user.giftNoticeOpen),
        amount: Number(user.giftNoticeAmount || 0),
        updatedAt: user.giftNoticeUpdatedAt || null,
      },
      balance: role === "user" ? Number(user.balance || 0) : 0,
      user: {
        id: String(user._id),
        fullName: user.fullName || "",
        mobile: user.mobile || "",
      },
    });
  } catch (error) {
    console.error("LIVE_SYNC_GET_ERROR:", error);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
