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
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload?.userId ? String(payload.userId) : null;
  } catch {
    return null;
  }
}

function fmtBDT0(n) { return `Tk ${Number(n || 0).toFixed(0)}`; }
function escapeHtml(s) { return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }

async function sendTelegramInvoice({ text }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, message: "TELEGRAM_ENV_MISSING" };
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j?.ok) return { ok: false, message: j?.description || "TELEGRAM_SEND_FAILED" };
  return { ok: true };
}

export async function POST(req) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amount);
  const paymentMethod = String(body?.paymentMethod || "").toLowerCase();
  const verifyMode = String(body?.verifyMode || "").toLowerCase();
  const senderNumber = String(body?.senderNumber || "");
  const trxId = String(body?.trxId || "");
  const screenshotUrl = String(body?.screenshotUrl || "");

  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ ok: false, message: "Invalid amount" }, { status: 400 });
  if (!["bkash", "nagad"].includes(paymentMethod)) return NextResponse.json({ ok: false, message: "Invalid payment method" }, { status: 400 });
  if (!["number", "trx", "screenshot"].includes(verifyMode)) return NextResponse.json({ ok: false, message: "Invalid verify mode" }, { status: 400 });
  if (verifyMode === "number" && !/^\d{11}$/.test(senderNumber)) return NextResponse.json({ ok: false, message: "Invalid sender number" }, { status: 400 });
  if (verifyMode === "trx" && trxId.trim().length < 6) return NextResponse.json({ ok: false, message: "Invalid transaction id" }, { status: 400 });
  if (verifyMode === "screenshot" && (!screenshotUrl || !/^https?:\/\//i.test(screenshotUrl))) return NextResponse.json({ ok: false, message: "Screenshot url missing" }, { status: 400 });

  await dbConnect();
  const [user, settings] = await Promise.all([
    User.findById(userId).select("_id name fullName mobile status").lean(),
    GeneralSettings.findOne({ key: "global" }).lean(),
  ]);
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (String(user.status || "active") !== "active") return NextResponse.json({ ok: false, message: "Your account is inactive. Please contact support." }, { status: 403 });
  if (settings?.minDeposit !== null && settings?.minDeposit !== undefined && amount < Number(settings.minDeposit)) return NextResponse.json({ ok: false, message: "Minimum deposit not reached" }, { status: 400 });
  if (settings?.maxDeposit !== null && settings?.maxDeposit !== undefined && amount > Number(settings.maxDeposit)) return NextResponse.json({ ok: false, message: "Maximum deposit exceeded" }, { status: 400 });

  const created = await Deposit.create({ userId, amount, paymentMethod, verifyMode, senderNumber: verifyMode === "number" ? senderNumber : "", trxId: verifyMode === "trx" ? trxId.trim() : "", screenshotUrl: verifyMode === "screenshot" ? screenshotUrl : "", status: "processing", note: "" });
  const userName = user?.name || user?.fullName || user?.mobile || "User";
  const verifyLine = verifyMode === "number" ? `<b>Sender:</b> ${escapeHtml(senderNumber)}` : verifyMode === "trx" ? `<b>TrxId:</b> ${escapeHtml(trxId.trim())}` : `<b>Screenshot:</b> ${escapeHtml(screenshotUrl)}`;
  const text = `<b>✅ Deposit Request</b>\n━━━━━━━━━━━━━━\n<b>Name:</b> ${escapeHtml(userName)}\n<b>Amount:</b> ${escapeHtml(fmtBDT0(amount))}\n<b>Method:</b> ${escapeHtml(paymentMethod.toUpperCase())}\n${verifyLine}`;
  const tg = await sendTelegramInvoice({ text });
  if (!tg.ok) return NextResponse.json({ ok: false, message: "Saved but Telegram failed", error: tg.message }, { status: 500 });
  const row = { _id: String(created._id), userId: String(user._id).slice(-6), userName, createdAt: created.createdAt, mobile: created.senderNumber || "—", method: created.paymentMethod, amount: created.amount, verifyVia: created.verifyMode, status: created.status, trxId: created.trxId || "", screenshotUrl: created.screenshotUrl || "" };
  return NextResponse.json({ ok: true, message: "Deposit request successful", data: { item: row } }, { status: 200 });
}
