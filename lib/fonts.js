export const FONT_LS_KEY = "pm_font_bw_v1";
export const DEFAULT_FONT_ID = "funnel";

export const FONTS = [
  { id: "funnel", label: "Funnel", cssVar: 'var(--font-funnel-display)' },
  { id: "manrope", label: "Manrope", cssVar: 'var(--font-manrope)' },
  { id: "sora", label: "Sora", cssVar: 'var(--font-sora)' },
  { id: "space", label: "Space Grotesk", cssVar: 'var(--font-space-grotesk)' },
  { id: "jakarta", label: "Jakarta", cssVar: 'var(--font-plus-jakarta)' },
];

export function getFontById(id) {
  const key = String(id || "").trim().toLowerCase();
  return FONTS.find((item) => item.id === key) || FONTS.find((item) => item.id === DEFAULT_FONT_ID) || FONTS[0];
}

export function readSavedFontId() {
  try {
    const value = localStorage.getItem(FONT_LS_KEY) || DEFAULT_FONT_ID;
    return getFontById(value).id;
  } catch {
    return DEFAULT_FONT_ID;
  }
}

export function persistFontId(fontId) {
  try {
    localStorage.setItem(FONT_LS_KEY, getFontById(fontId).id);
  } catch {}
}

export function applyFontToDocument(fontInput) {
  if (typeof document === "undefined") return;
  const font = typeof fontInput === "string" ? getFontById(fontInput) : getFontById(fontInput?.id);
  document.documentElement.style.setProperty("--pm-font", font.cssVar);
}

export function broadcastFontChange(fontInput) {
  if (typeof window === "undefined") return;
  const font = typeof fontInput === "string" ? getFontById(fontInput) : getFontById(fontInput?.id);
  try {
    window.dispatchEvent(new CustomEvent("pm-font-change", { detail: { fontId: font.id } }));
  } catch {}
}
