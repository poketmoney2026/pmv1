import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import HelpContent from "@/models/HelpContent";
import { getAuthUserFromRequest } from "@/lib/auth";
import { DEFAULT_HELP_TEXT, DEFAULT_HELP_TITLE, helpTextToPoints, isLegacyHelpText, getDefaultHelpText, getDefaultHelpTitle } from "@/lib/defaultHelpText";

function normalizeAudience(value) {
  const v = String(value || "user").toLowerCase();
  return v === "agent" ? "agent" : "user";
}
function keyForAudience(audience) { return audience === "agent" ? "agent" : "global"; }

function shape(doc, audience = "user") {
  const defaultTitle = getDefaultHelpTitle(audience) || DEFAULT_HELP_TITLE;
  const defaultText = getDefaultHelpText(audience) || DEFAULT_HELP_TEXT;
  const title = String(doc?.title || defaultTitle).trim() || defaultTitle;
  const rawText = String(doc?.text || "").trim();
  const text = !rawText || isLegacyHelpText(rawText) ? defaultText : rawText;
  return { title, text, isActive: doc?.isActive !== false, points: helpTextToPoints(text), updatedAt: doc?.updatedAt || null, audience };
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  const audience = normalizeAudience(req.nextUrl.searchParams.get("audience"));
  await dbConnect();
  const doc = await HelpContent.findOne({ key: keyForAudience(audience) }).lean();
  return NextResponse.json({ ok: true, data: shape(doc, audience) }, { status: 200 });
}

export async function PUT(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const audience = normalizeAudience(body?.audience);
  const key = keyForAudience(audience);
  const defaultTitle = getDefaultHelpTitle(audience) || DEFAULT_HELP_TITLE;
  const defaultText = getDefaultHelpText(audience) || DEFAULT_HELP_TEXT;
  const title = String(body?.title || "").trim() || defaultTitle;
  const bodyText = String(body?.text || "").trim();
  const text = !bodyText || isLegacyHelpText(bodyText) ? defaultText : bodyText;
  const isActive = body?.isActive !== false;

  const updated = await HelpContent.findOneAndUpdate(
    { key },
    { $setOnInsert: { key }, $set: { title, text, isActive } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({ ok: true, message: "Help content saved", data: shape(updated, audience) }, { status: 200 });
}
