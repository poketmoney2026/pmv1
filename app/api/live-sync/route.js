import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import LinkSettings from "@/models/LinkSettings";
import Notice from "@/models/Notice";
import SiteUpdate from "@/models/SiteUpdate";
import { decryptText } from "@/lib/crypto";
import { decodeTokenValue } from "@/lib/auth";

export const dynamic = "force-dynamic";

function buildResponse(data, clearToken = false) {
  const res = NextResponse.json({ ok: true, data }, { status: 200 });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  if (clearToken) {
    res.cookies.set({ name: "token", value: "", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
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

function shapeSiteUpdate(doc) {
  return {
    startAt: doc?.startAt || null,
    endAt: doc?.endAt || null,
    notifyEveryMin: Number(doc?.notifyEveryMin || 30),
    isActive: Boolean(doc?.isActive && doc?.startAt && doc?.endAt),
    updatedAt: doc?.updatedAt || null,
  };
}

const cleanMobile = (v) => String(v || "").replace(/\D/g, "");
function shapeNotice(doc, mobile = "") {
  const targetMobile = cleanMobile(doc?.targetMobile || "");
  const activeForUser =
    doc?.isActive !== false &&
    !!String(doc?.body || "").trim() &&
    (!targetMobile || targetMobile === cleanMobile(mobile));
  return {
    title: doc?.title || "NOTICE",
    body: doc?.body || "",
    isActive: activeForUser,
    updatedAt: doc?.updatedAt || null,
    intervalMin: Math.max(1, Number(doc?.intervalMin || 30)),
    maxShows: Math.max(0, Number(doc?.maxShows || 0)),
    type: doc?.type === "news" ? "news" : "modal",
    targetMobile,
  };
}

async function findBestNotice(mobile = "") {
  const clean = cleanMobile(mobile);
  const docs = await Notice.find({ isActive: true }).sort({ updatedAt: -1, createdAt: -1 }).lean();
  const targeted = docs.find((doc) => {
    const targetMobile = cleanMobile(doc?.targetMobile || "");
    return targetMobile && targetMobile === clean && String(doc?.body || "").trim();
  });
  if (targeted) return targeted;
  const globalDoc = docs.find((doc) => !cleanMobile(doc?.targetMobile || "") && String(doc?.body || "").trim());
  return globalDoc || null;
}

function buildBasePayload({ support, noticeDoc, siteUpdate, mobile = "" }) {
  return {
    support,
    notice: shapeNotice(noticeDoc, mobile),
    siteUpdate: shapeSiteUpdate(siteUpdate),
  };
}

export async function GET(req) {
  try {
    await dbConnect();
    const [support, siteUpdate] = await Promise.all([
      readSupport(),
      SiteUpdate.findOne({ key: "global" }).lean(),
    ]);
    const token = req.cookies.get("token")?.value || "";

    if (!token) {
      const noticeDoc = await findBestNotice("");
      return buildResponse({ authenticated: false, role: "user", status: "guest", sessionState: "guest", ...buildBasePayload({ support, noticeDoc, siteUpdate }) });
    }

    const payload = await decodeTokenValue(token);
    const userId = payload?.uid || payload?.userId || payload?.id || payload?.sub || null;
    if (!payload || !userId) {
      const noticeDoc = await findBestNotice("");
      return buildResponse({ authenticated: false, role: "user", status: "invalid", sessionState: "invalid", ...buildBasePayload({ support, noticeDoc, siteUpdate }) }, true);
    }

    const user = await User.findById(userId).select("_id role status inactiveReason fullName mobile balance giftNoticeOpen giftNoticeAmount giftNoticeUpdatedAt").lean();
    if (!user) {
      const noticeDoc = await findBestNotice("");
      return buildResponse({ authenticated: false, role: "user", status: "deleted", sessionState: "invalid", ...buildBasePayload({ support, noticeDoc, siteUpdate }) }, true);
    }

    const rawRole = String(user.role || "user").toLowerCase();
    const role = ["admin", "agent", "user"].includes(rawRole) ? rawRole : "user";
    const status = String(user.status || "active").toLowerCase() === "inactive" ? "inactive" : "active";
    const noticeDoc = await findBestNotice(user.mobile || "");

    return buildResponse({
      authenticated: true,
      role,
      status,
      sessionState: status === "active" ? "ok" : "inactive",
      ...buildBasePayload({ support, noticeDoc, siteUpdate, mobile: user.mobile || "" }),
      inactiveReason: user.inactiveReason || "",
      giftNotice: {
        open: Boolean(user.giftNoticeOpen),
        amount: Number(user.giftNoticeAmount || 0),
        updatedAt: user.giftNoticeUpdatedAt || null,
      },
      balance: role !== "admin" ? Number(user.balance || 0) : 0,
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
