import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import LinkSettings from "@/models/LinkSettings";
import { decryptText } from "@/lib/crypto";

async function readLinks() {
  const doc = await LinkSettings.findOne({}).select("contactWhatsApp contactTelegram contactTelegramGroup").lean();
  return {
    contactWhatsApp: decryptText(doc?.contactWhatsApp || ""),
    contactTelegram: decryptText(doc?.contactTelegram || ""),
    contactTelegramGroup: decryptText(doc?.contactTelegramGroup || ""),
  };
}

export async function GET() {
  try {
    await dbConnect();
    const data = await readLinks();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err) {
    console.error("CONTACT_LINKS_GET_ERROR:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
