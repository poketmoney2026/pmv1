import GeneralSettings from "@/models/GeneralSettings";

export const DEFAULT_CLAIM_COOLDOWN_SEC = 120;

export function sanitizeClaimCooldownSec(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_CLAIM_COOLDOWN_SEC;
  return Math.max(1, Math.min(86400, Math.floor(n)));
}

export async function readClaimCooldownSec() {
  const doc = await GeneralSettings.findOne({ key: "global" }).select("claimCooldownSec").lean();
  return sanitizeClaimCooldownSec(doc?.claimCooldownSec);
}
