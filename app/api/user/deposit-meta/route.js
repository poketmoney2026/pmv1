import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import LinkSettings from "@/models/LinkSettings";
import EarningTier from "@/models/EarningTier";
import GeneralSettings from "@/models/GeneralSettings";
import { decryptText } from "@/lib/crypto";
import { getAuthUserFromRequest } from "@/lib/auth";

async function readLinks() {
  const links = await LinkSettings.findOne({}).lean();
  return {
    contactWhatsApp: decryptText(links?.contactWhatsApp || ""),
    contactTelegram: decryptText(links?.contactTelegram || ""),
    contactTelegramGroup: decryptText(links?.contactTelegramGroup || ""),
  };
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;

  await dbConnect();
  const links = await readLinks();
  const settings = await GeneralSettings.findOne({ key: "global" }).lean();
  const tiers = await EarningTier.find({ isActive: true }).sort({ sortOrder: 1, minBalance: 1 }).select("label minBalance maxBalance dailyRatePercent sortOrder isActive").lean();

  return NextResponse.json({ ok: true, data: { links: { depositWhatsApp: "", depositTelegram: "", contactWhatsApp: links?.contactWhatsApp || "", contactTelegram: links?.contactTelegram || "", contactTelegramGroup: links?.contactTelegramGroup || "" }, tiers: Array.isArray(tiers) ? tiers : [], limits: { minDeposit: settings?.minDeposit ?? null, maxDeposit: settings?.maxDeposit ?? null } } }, { status: 200 });
}
