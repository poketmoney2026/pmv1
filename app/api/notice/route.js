import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Notice from "@/models/Notice";
import { getAuthUserFromRequest } from "@/lib/auth";

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
    type: doc?.type === "news" ? "news" : "modal",
    intervalMin: Math.max(1, Number(doc?.intervalMin || 30)),
    maxShows: Math.max(0, Number(doc?.maxShows || 0)),
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

export async function GET(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: true });
  if (!auth.ok) return auth.res;
  await dbConnect();
  const doc = await findBestNotice(auth?.user?.mobile || "");
  return NextResponse.json({ ok: true, data: shapeNotice(doc, auth?.user?.mobile || "") }, { status: 200 });
}
