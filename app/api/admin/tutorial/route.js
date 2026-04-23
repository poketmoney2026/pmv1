import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import HelpContent from "@/models/HelpContent";
import TutorialVideo from "@/models/TutorialVideo";
import { getAuthUserFromRequest } from "@/lib/auth";
import { getDefaultTutorialSections, getDefaultTutorialText, getDefaultTutorialTitle, normalizeAudience, parseTutorialSections, sectionsToText } from "@/lib/defaultTutorialContent";

function keyForAudience(audience) {
  return audience === "agent" ? "tutorial-agent" : "tutorial-user";
}

function normalizeSections(input) {
  const raw = Array.isArray(input) ? input : [];
  return raw
    .map((item, index) => ({
      heading: String(item?.heading || "").trim(),
      content: String(item?.content || "").trim(),
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
      isActive: item?.isActive !== false,
    }))
    .filter((item) => item.heading || item.content)
    .sort((a, b) => a.order - b.order);
}

function shapeDoc(doc, audience) {
  const defaultTitle = getDefaultTutorialTitle(audience);
  const title = String(doc?.title || defaultTitle).trim() || defaultTitle;
  const hasStoredSections = Array.isArray(doc?.sections);
  const hasStoredText = String(doc?.text || "").trim().length > 0;
  const sections = hasStoredSections ? normalizeSections(doc.sections) : (hasStoredText ? normalizeSections(parseTutorialSections(doc.text)) : getDefaultTutorialSections(audience));
  const text = hasStoredSections ? sectionsToText(sections) : (String(doc?.text || sectionsToText(sections)).trim() || sectionsToText(sections));
  return { title, text, sections, isActive: doc?.isActive !== false, updatedAt: doc?.updatedAt || null };
}

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  const audience = normalizeAudience(req.nextUrl.searchParams.get("audience"));
  await dbConnect();
  const doc = await HelpContent.findOne({ key: keyForAudience(audience) }).lean();
  const videos = await TutorialVideo.find({ audience }).sort({ order: 1, createdAt: 1 }).lean();
  return NextResponse.json({ ok: true, data: { ...shapeDoc(doc, audience), videos } });
}

export async function PUT(req) {
  const auth = await getAuthUserFromRequest(req, { requireAdmin: true, allowInactive: false });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const body = await req.json().catch(() => ({}));
  const audience = normalizeAudience(body?.audience);
  const key = keyForAudience(audience);
  const title = String(body?.title || "").trim() || getDefaultTutorialTitle(audience);
  const sections = normalizeSections(body?.sections);
  const text = sectionsToText(sections);
  const isActive = body?.isActive !== false;

  const updated = await HelpContent.findOneAndUpdate(
    { key },
    { $setOnInsert: { key }, $set: { title, text, sections, isActive } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  const incomingVideos = Array.isArray(body?.videos) ? body.videos : [];
  await TutorialVideo.deleteMany({ audience });
  const cleanVideos = incomingVideos
    .map((item, index) => ({
      audience,
      title: String(item?.title || "").trim(),
      url: String(item?.url || "").trim(),
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
      isActive: item?.isActive !== false,
    }))
    .filter((item) => item.title && item.url);
  if (cleanVideos.length) await TutorialVideo.insertMany(cleanVideos);

  const videos = await TutorialVideo.find({ audience }).sort({ order: 1, createdAt: 1 }).lean();
  return NextResponse.json({ ok: true, message: "Tutorial content saved", data: { ...shapeDoc(updated, audience), videos } });
}
