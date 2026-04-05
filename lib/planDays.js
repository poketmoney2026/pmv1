export const DEFAULT_PLAN_DAYS = 12;
export const MIN_PLAN_DAYS = 1;
export const MAX_PLAN_DAYS = 365;

export function clampPlanDays(n, fallback = DEFAULT_PLAN_DAYS) {
  const x = Number(n);
  const base = Number.isFinite(x) ? Math.floor(x) : fallback;
  return Math.max(MIN_PLAN_DAYS, Math.min(MAX_PLAN_DAYS, base || fallback));
}
