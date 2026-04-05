import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import LinkSettings from "@/models/LinkSettings";
import { decryptText, encryptText } from "@/lib/crypto";
import { getAuthUserFromRequest } from "@/lib/auth";

const onlyDigits = (v) => String(v || "").replace(/\D/g, "");

function normalizeWaLinkFromBdMobile(raw) {
  const d = onlyDigits(raw);
  if (!d) return null;
  if (d.length === 11 && d.startsWith("01")) return `https://wa.me/${"880" + d.slice(1)}`;
  if (d.length === 13 && d.startsWith("8801")) return `https://wa.me/${d}`;
  return null;
}
function normalizeTgLinkFromAtUsername(raw) {
  const s0 = String(raw || "").trim();
  if (!s0) return null;
  const m1 = s0.match(/t\.me\/([A-Za-z0-9_]{3,})/i);
  if (m1?.[1]) return `https://t.me/${m1[1]}`;
  const u0 = s0.startsWith("@") ? s0.slice(1) : s0;
  const u = u0.trim();
  if (!/^[A-Za-z0-9_]{3,32}$/.test(u)) return null;
  return `https://t.me/${u}`;
}
function normalizeTgGroupLink(raw) {
  const s0 = String(raw || "").trim();
  if (!s0) return "";
  const s = s0.replace(/^http:\/\//i, "https://");
  if (/^https:\/\/t\.me\/.+/i.test(s)) return s;
  const m = s0.match(/t\.me\/(.+)/i);
  if (m?.[1]) return `https://t.me/${String(m[1]).trim()}`;
  const u0 = s0.startsWith("@") ? s0.slice(1) : s0;
  const u = u0.trim();
  if (!/^[A-Za-z0-9_+]{3,64}$/.test(u)) return null;
  return `https://t.me/${u}`;
}

async function readLinks() {
  const doc = await LinkSettings.findOne({}).lean();
  return {
    contactWhatsApp: decryptText(doc?.contactWhatsApp || ""),
    contactTelegram: decryptText(doc?.contactTelegram || ""),
    contactTelegramGroup: decryptText(doc?.contactTelegramGroup || ""),
  };
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const data = await readLinks();
  return NextResponse.json({ ok: true, data }, { status: 200 });
}

export async function POST(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
  const wa = normalizeWaLinkFromBdMobile(body.contactWhatsAppNumber);
  const tg = normalizeTgLinkFromAtUsername(body.contactTelegramAtUsername);
  const tgGroup = normalizeTgGroupLink(body.contactTelegramGroupLink);

  if (!wa) return NextResponse.json({ ok: false, message: "Invalid WhatsApp (11 digits)" }, { status: 400 });
  if (!tg) return NextResponse.json({ ok: false, message: "Invalid Telegram (@username)" }, { status: 400 });
  if (tgGroup === null) return NextResponse.json({ ok: false, message: "Invalid Telegram Group link" }, { status: 400 });

  await dbConnect();
  await LinkSettings.findOneAndUpdate({}, { $set: { contactWhatsApp: encryptText(wa), contactTelegram: encryptText(tg), contactTelegramGroup: encryptText(tgGroup || "") } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();

  const data = { contactWhatsApp: wa, contactTelegram: tg, contactTelegramGroup: tgGroup || "" };
  return NextResponse.json({ ok: true, message: "Saved", data }, { status: 200 });
}
