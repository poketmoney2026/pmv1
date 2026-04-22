export const THEME_LS_KEY = "pm_theme_bw_v8";
export const DEFAULT_THEME_ID = "blue-deep";

const PALETTES = [
  { key: "slate", label: "Slate", deep: { a: "#0f172a", b: "#334155", fg: "#f8fafc" }, soft: { a: "#e2e8f0", b: "#cbd5e1", fg: "#0f172a" } },
  { key: "gray", label: "Gray", deep: { a: "#111827", b: "#4b5563", fg: "#f9fafb" }, soft: { a: "#e5e7eb", b: "#d1d5db", fg: "#111827" } },
  { key: "zinc", label: "Zinc", deep: { a: "#18181b", b: "#52525b", fg: "#fafafa" }, soft: { a: "#e4e4e7", b: "#d4d4d8", fg: "#18181b" } },
  { key: "stone", label: "Stone", deep: { a: "#1c1917", b: "#57534e", fg: "#fafaf9" }, soft: { a: "#e7e5e4", b: "#d6d3d1", fg: "#1c1917" } },
  { key: "blue", label: "Blue", deep: { a: "#1e3a8a", b: "#2563eb", fg: "#eff6ff" }, soft: { a: "#dbeafe", b: "#93c5fd", fg: "#111827" } },
  { key: "sky", label: "Sky", deep: { a: "#0c4a6e", b: "#0284c7", fg: "#f0f9ff" }, soft: { a: "#e0f2fe", b: "#7dd3fc", fg: "#082f49" } },
  { key: "cyan", label: "Cyan", deep: { a: "#164e63", b: "#0891b2", fg: "#ecfeff" }, soft: { a: "#cffafe", b: "#67e8f9", fg: "#083344" } },
  { key: "teal", label: "Teal", deep: { a: "#134e4a", b: "#0d9488", fg: "#f0fdfa" }, soft: { a: "#ccfbf1", b: "#5eead4", fg: "#042f2e" } },
  { key: "emerald", label: "Emerald", deep: { a: "#065f46", b: "#059669", fg: "#ecfdf5" }, soft: { a: "#d1fae5", b: "#6ee7b7", fg: "#022c22" } },
  { key: "green", label: "Green", deep: { a: "#166534", b: "#16a34a", fg: "#f0fdf4" }, soft: { a: "#dcfce7", b: "#86efac", fg: "#14532d" } },
  { key: "lime", label: "Lime", deep: { a: "#365314", b: "#65a30d", fg: "#f7fee7" }, soft: { a: "#ecfccb", b: "#bef264", fg: "#1a2e05" } },
  { key: "yellow", label: "Yellow", deep: { a: "#713f12", b: "#ca8a04", fg: "#fefce8" }, soft: { a: "#fef9c3", b: "#fde047", fg: "#713f12" } },
  { key: "amber", label: "Amber", deep: { a: "#78350f", b: "#d97706", fg: "#fffbeb" }, soft: { a: "#fef3c7", b: "#fcd34d", fg: "#451a03" } },
  { key: "orange", label: "Orange", deep: { a: "#7c2d12", b: "#ea580c", fg: "#fff7ed" }, soft: { a: "#ffedd5", b: "#fdba74", fg: "#431407" } },
  { key: "red", label: "Red", deep: { a: "#7f1d1d", b: "#dc2626", fg: "#fef2f2" }, soft: { a: "#fee2e2", b: "#fca5a5", fg: "#450a0a" } },
  { key: "rose", label: "Rose", deep: { a: "#881337", b: "#e11d48", fg: "#fff1f2" }, soft: { a: "#ffe4e6", b: "#fda4af", fg: "#4c0519" } },
  { key: "pink", label: "Pink", deep: { a: "#831843", b: "#db2777", fg: "#fdf2f8" }, soft: { a: "#fce7f3", b: "#f9a8d4", fg: "#500724" } },
  { key: "fuchsia", label: "Fuchsia", deep: { a: "#701a75", b: "#c026d3", fg: "#fdf4ff" }, soft: { a: "#fae8ff", b: "#f0abfc", fg: "#4a044e" } },
  { key: "purple", label: "Purple", deep: { a: "#581c87", b: "#9333ea", fg: "#faf5ff" }, soft: { a: "#f3e8ff", b: "#d8b4fe", fg: "#3b0764" } },
  { key: "violet", label: "Violet", deep: { a: "#4c1d95", b: "#7c3aed", fg: "#f5f3ff" }, soft: { a: "#ede9fe", b: "#c4b5fd", fg: "#2e1065" } },
  { key: "indigo", label: "Indigo", deep: { a: "#312e81", b: "#4f46e5", fg: "#eef2ff" }, soft: { a: "#e0e7ff", b: "#a5b4fc", fg: "#1e1b4b" } },
  { key: "navy", label: "Navy", deep: { a: "#0b1b3a", b: "#214ea0", fg: "#eef4ff" }, soft: { a: "#dce7ff", b: "#9bb7ff", fg: "#0b1b3a" } },
  { key: "mint", label: "Mint", deep: { a: "#0b3b35", b: "#0f9d8b", fg: "#eefcf8" }, soft: { a: "#d9fbf1", b: "#8cead0", fg: "#08312a" } },
  { key: "peach", label: "Peach", deep: { a: "#5c2f1c", b: "#f97316", fg: "#fff7ed" }, soft: { a: "#ffe7d6", b: "#fdba74", fg: "#5c2f1c" } },
  { key: "gold", label: "Gold", deep: { a: "#5b4104", b: "#d4a514", fg: "#fffbea" }, soft: { a: "#fff3bf", b: "#ffe066", fg: "#5b4104" } },
];

const buildTheme = (palette, mode) => ({
  id: `${palette.key}-${mode}`,
  label: `${palette.label} ${mode === "deep" ? "Deep" : "Soft"}`.toUpperCase(),
  a: palette[mode].a,
  b: palette[mode].b,
  fg: palette[mode].fg,
  mode,
  colorKey: palette.key,
});

export const DARK_THEMES = PALETTES.filter((palette) => palette.key !== "teal").map((palette) => buildTheme(palette, "deep"));
export const LIGHT_THEMES = PALETTES.filter((palette) => palette.key !== "zinc").map((palette) => buildTheme(palette, "soft"));
export const THEMES = [...DARK_THEMES, ...LIGHT_THEMES];
export const THEME_COUNT = THEMES.length;
export const THEME_BOOTSTRAP_MAP = Object.fromEntries(THEMES.map((theme) => [theme.id, { a: theme.a, b: theme.b, fg: theme.fg }]));

export function bgCss(theme) {
  return `linear-gradient(135deg, ${theme.a}, ${theme.b})`;
}

export function getThemeById(id) {
  const key = String(id || "").trim().toLowerCase();
  const normalized = key === "black" ? DEFAULT_THEME_ID : key;
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

export function buildThemeBootScript(fontMap = {}) {
  return `(function(){try{var themeKey=${JSON.stringify(THEME_LS_KEY)};var fontKey="pm_font_bw_v1";var themes=${JSON.stringify(THEME_BOOTSTRAP_MAP)};var fonts=${JSON.stringify(fontMap)};var id=(localStorage.getItem(themeKey)||${JSON.stringify(DEFAULT_THEME_ID)}).toLowerCase();if(id==='black')id=${JSON.stringify(DEFAULT_THEME_ID)};var t=themes[id]||themes[${JSON.stringify(DEFAULT_THEME_ID)}];var f=localStorage.getItem(fontKey)||'funnel';var s=document.documentElement.style;s.setProperty('--pm-bg',t.a);s.setProperty('--pm-accent',t.a);s.setProperty('--pm-a',t.a);s.setProperty('--pm-b',t.b);s.setProperty('--pm-fg',t.fg);s.setProperty('--pm-bg-grad','linear-gradient(135deg,'+t.a+','+t.b+')');s.setProperty('--pm-font',fonts[f]||fonts.funnel||'var(--font-funnel-display)');}catch(e){}})();`;
}
