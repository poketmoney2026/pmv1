import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import HelpContent from "@/models/HelpContent";
import TutorialVideo from "@/models/TutorialVideo";
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
  const audience = normalizeAudience(req.nextUrl.searchParams.get("audience"));
  await dbConnect();
  let doc = await HelpContent.findOne({ key: keyForAudience(audience) }).lean();
  if (!doc) {
    const sections = getDefaultTutorialSections(audience);
    doc = await HelpContent.findOneAndUpdate(
      { key: keyForAudience(audience) },
      { $setOnInsert: { key: keyForAudience(audience), title: getDefaultTutorialTitle(audience), text: sectionsToText(sections), sections, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
  }
  const videos = await TutorialVideo.find({ audience, isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
  return NextResponse.json({ ok: true, data: { ...shapeDoc(doc, audience), videos } });
}
