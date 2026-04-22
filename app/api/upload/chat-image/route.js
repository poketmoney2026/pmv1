import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { getRuntimeEnv } from "@/lib/runtimeEnv";

export const runtime = "nodejs";

const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: false });
  if (!auth.ok) return auth.res;

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, message: "No file selected" }, { status: 400 });
    }

    const mime = String(file.type || "").toLowerCase();
    if (!ALLOWED[mime]) {
      return NextResponse.json({ ok: false, message: "Only JPG, PNG, WEBP, and GIF images are allowed" }, { status: 400 });
    }

    const size = Number(file.size || 0);
    if (size <= 0) {
      return NextResponse.json({ ok: false, message: "Empty file" }, { status: 400 });
    }
    if (size > 5 * 1024 * 1024) {
      return NextResponse.json({ ok: false, message: "Image must be 5MB or smaller" }, { status: 400 });
    }

    const cloudName = getRuntimeEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
    const uploadPreset = getRuntimeEnv("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET");
    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ ok: false, message: "Cloudinary is not configured" }, { status: 500 });
    }

    const cloudinaryForm = new FormData();
    cloudinaryForm.append("file", file);
    cloudinaryForm.append("upload_preset", uploadPreset);
    cloudinaryForm.append("folder", "pocket-money/chat");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: cloudinaryForm,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.error?.message || data?.message || "Image upload failed";
      return NextResponse.json({ ok: false, message }, { status: 400 });
    }

    const imageUrl = String(data?.secure_url || data?.url || "").trim();
    const imagePublicId = String(data?.public_id || "").trim();
    if (!imageUrl) {
      return NextResponse.json({ ok: false, message: "Cloudinary did not return a public URL" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        imageUrl,
        imagePublicId,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("CHAT_IMAGE_UPLOAD_ERROR:", error);
    return NextResponse.json({ ok: false, message: "Image upload failed" }, { status: 500 });
  }
}
