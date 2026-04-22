import fs from "fs";
import path from "path";

let cachedEnv = null;

function parseEnvText(text) {
  const out = {};
  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

function readFallbackEnvFile() {
  if (cachedEnv) return cachedEnv;
  try {
    const envPath = path.join(process.cwd(), "env.txt");
    if (fs.existsSync(envPath)) {
      const text = fs.readFileSync(envPath, "utf8");
      cachedEnv = parseEnvText(text);
      return cachedEnv;
    }
  } catch {}
  cachedEnv = {};
  return cachedEnv;
}

export function getRuntimeEnv(key, fallback = "") {
  const direct = process.env[key];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const fileMap = readFallbackEnvFile();
  const fallbackValue = fileMap[key];
  if (typeof fallbackValue === "string" && fallbackValue.trim()) return fallbackValue.trim();
  return fallback;
}
