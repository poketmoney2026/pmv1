import crypto from "crypto";

function getKey() {
  const raw = String(process.env.ENCRYPTION_KEY || "").trim();
  if (!raw) return null;
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptText(value) {
  const text = String(value || "");
  if (!text) return "";
  const key = getKey();
  if (!key) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptText(value) {
  const text = String(value || "");
  if (!text) return "";
  if (!text.startsWith("enc:")) return text;
  const key = getKey();
  if (!key) return "";
  const parts = text.split(":");
  if (parts.length !== 4) return "";
  try {
    const iv = Buffer.from(parts[1], "base64");
    const tag = Buffer.from(parts[2], "base64");
    const data = Buffer.from(parts[3], "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return "";
  }
}
