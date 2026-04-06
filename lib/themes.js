export const THEME_LS_KEY = "pm_theme_bw_v8";
export const DEFAULT_THEME_ID = "midnight";

export const THEMES = [
  { id: "ice", label: "ICE", a: "#dbeafe", b: "#bfdbfe", fg: "#111827" },
  { id: "storm", label: "STORM", a: "#0b1120", b: "#172554", fg: "#eff6ff" },
  { id: "midnight", label: "MIDNIGHT", a: "#030712", b: "#111827", fg: "#e5e7eb" },
  { id: "violet", label: "VIOLET", a: "#1e1b4b", b: "#312e81", fg: "#eef2ff" },
  { id: "slate", label: "SLATE", a: "#0f172a", b: "#1e293b", fg: "#f8fafc" },
];

export function bgCss(theme) {
  return `linear-gradient(135deg, ${theme.a}, ${theme.b})`;
}

export function getThemeById(id) {
  const key = String(id || "").trim().toLowerCase();
  const normalized = key === "black" ? "midnight" : key;
  return THEMES.find((item) => item.id === normalized) || THEMES.find((item) => item.id === DEFAULT_THEME_ID) || THEMES[0];
}

export function readSavedThemeId() {
  try {
    const value = localStorage.getItem(THEME_LS_KEY) || DEFAULT_THEME_ID;
    return getThemeById(value).id;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function persistThemeId(themeId) {
  try {
    localStorage.setItem(THEME_LS_KEY, getThemeById(themeId).id);
  } catch {}
}

export function applyThemeToDocument(themeInput) {
  if (typeof document === "undefined") return;
  const theme = themeInput && themeInput.a && themeInput.b && themeInput.fg ? themeInput : getThemeById(themeInput?.id || themeInput);
  const root = document.documentElement.style;
  root.setProperty("--pm-bg", theme.a);
  root.setProperty("--pm-accent", theme.a);
  root.setProperty("--pm-a", theme.a);
  root.setProperty("--pm-b", theme.b);
  root.setProperty("--pm-fg", theme.fg);
  root.setProperty("--pm-bg-grad", bgCss(theme));
}

export function broadcastThemeChange(themeInput) {
  if (typeof window === "undefined") return;
  const theme = getThemeById(themeInput?.id || themeInput);
  try {
    window.dispatchEvent(new CustomEvent("pm-theme-change", { detail: { themeId: theme.id, a: theme.a, b: theme.b, fg: theme.fg } }));
  } catch {}
}
