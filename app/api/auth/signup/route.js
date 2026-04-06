import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Deposit from "@/models/Deposit";
import Transaction from "@/models/Transaction";
import GeneralSettings from "@/models/GeneralSettings";

function isBdMobile11(phone) {
  return /^01\d{9}$/.test(String(phone || "").trim());
}

async function signToken(userId, role) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  const key = new TextEncoder().encode(secret);
  const safeRole = String(role || "user").toLowerCase() === "admin" ? "admin" : "user";
  return new SignJWT({ userId: String(userId), role: safeRole })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(key);
}

async function generateReferralCodeFromName(name) {
  const words = String(name || "USER")
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Z0-9]/g, ""))
    .filter(Boolean);
  let letters = "";
  if (words.length) {
    letters += words[0].slice(0, 3);
    let idx = 1;
    while (letters.length < 3 && idx < words.length) {
      letters += words[idx].slice(0, 3 - letters.length);
      idx += 1;
    }
  }
  letters = (letters || "USR").slice(0, 3).padEnd(3, "X");

  for (let i = 0; i < 20; i += 1) {
    const digitLen = i < 12 ? 2 : 3;
    const max = digitLen === 2 ? 100 : 1000;
    const digits = String(Math.floor(Math.random() * max)).padStart(digitLen, "0");
    const code = `${letters}${digits}`;
    const exists = await User.findOne({ referralCode: code }).select("_id").lean();
    if (!exists) return code;
  }

  return `${letters}${Date.now().toString().slice(-3)}`;
}

function round2(n) {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
}

function escapeHtml(text) {
  return String(text || "").replace(/[&<>\"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

async function sendTelegramNewAccount({ fullName, mobile }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  const text = `<b>New Account Created</b>\n<b>Name:</b> ${escapeHtml(fullName)}\n<b>Mobile:</b> ${escapeHtml(mobile)}\n<b>Time:</b> ${escapeHtml(new Date().toLocaleString("en-US"))}`;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  }).catch(() => null);
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");
    const referralCodeInput = String(body.referralCode || "").trim().toUpperCase();

    if (!fullName) return NextResponse.json({ ok: false, message: "Name required" }, { status: 400 });
    if (fullName.length < 3) return NextResponse.json({ ok: false, message: "Name too short" }, { status: 400 });
    if (!isBdMobile11(phone)) return NextResponse.json({ ok: false, message: "Invalid mobile number" }, { status: 400 });
    if (!password || password.length < 8) return NextResponse.json({ ok: false, message: "Password must be at least 8 characters" }, { status: 400 });

    await dbConnect();

    const phoneExists = await User.findOne({ mobile: phone }).select("_id").lean();
    if (phoneExists) return NextResponse.json({ ok: false, message: "Mobile number already used" }, { status: 409 });

    const settings = await GeneralSettings.findOne({ key: "global" }).lean();
    const welcomeBonus = round2(Number(settings?.welcomeBonus ?? 5));

    const newReferralCode = await generateReferralCodeFromName(fullName);
    let referredBy = null;
    if (referralCodeInput) {
      const refUser = await User.findOne({ referralCode: referralCodeInput }).select("_id referrals").lean();
      if (refUser?._id) referredBy = refUser._id;
    }

    const now = new Date();
    const userDoc = await User.create({
      fullName,
      mobile: phone,
      password,
      status: "active",
      balance: 0,
      referralCode: newReferralCode,
      referredBy,
      referrals: [],
      referralBonus: false,
      joinDate: now,
      timerStartedAt: now,
      withdraw: [],
      deposit: [],
      transactions: [],
      role: "user",
    });

    if (referredBy) {
      await User.updateOne({ _id: referredBy }, { $addToSet: { referrals: userDoc._id } });
    }

    if (welcomeBonus > 0) {
      const welcomeDeposit = await Deposit.create({
        userId: userDoc._id,
        amount: welcomeBonus,
        paymentMethod: "bkash",
        verifyMode: "number",
        senderNumber: "",
        trxId: "WELCOME-BONUS",
        screenshotUrl: "",
        type: "none",
        status: "success",
        note: "Welcome bonus deposit",
        createdDate: now,
        claimDate: now,
      });
      const welcomeTx = await Transaction.create({
        user: userDoc._id,
        type: "deposit",
        status: "successful",
        amount: welcomeBonus,
        note: `Welcome bonus deposit added: Tk ${welcomeBonus.toFixed(2)}`,
        date: now,
      });
      await User.updateOne({ _id: userDoc._id }, { $push: { deposit: welcomeDeposit._id, transactions: welcomeTx._id } });
    }

    const token = await signToken(userDoc._id, userDoc.role);
    const res = NextResponse.json({ ok: true, message: "Account created successfully", data: { welcomeBonus } }, { status: 200 });
    res.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    sendTelegramNewAccount({ fullName, mobile: phone }).catch(() => null);
    return res;
  } catch (err) {
    console.error("SIGNUP_ERROR:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
