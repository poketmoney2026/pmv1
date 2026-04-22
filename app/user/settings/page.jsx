"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, MoonStar, SunMedium, Volume2 } from "lucide-react";
import { DARK_THEMES, LIGHT_THEMES, THEME_COUNT, THEMES, bgCss } from "@/lib/themes";
import useThemeStore from "@/stores/useThemeStore";

const SOUND_KEY = "pm_sound_enabled_v1";

function CardShell({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="border border-[color:var(--pm-fg)]/35 bg-white/10 p-3 md:p-5">
      <div className="flex items-center justify-center gap-2 text-center text-[11px] font-black tracking-widest uppercase text-[color:var(--pm-fg)]">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        <span>{title}</span>
      </div>
      <div className="mt-2 text-center text-[10px] text-[color:var(--pm-fg)]/75">{subtitle}</div>
      {children}
    </div>
  );
}

function ToggleRow({ label, sub, enabled, onToggle, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-[color:var(--pm-fg)]/25 bg-white/10 px-3 py-3">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-widest uppercase text-[color:var(--pm-fg)]">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          <span>{label}</span>
        </div>
        <div className="mt-1 text-[10px] text-[color:var(--pm-fg)]/70">{sub}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="border px-3 py-2 text-[10px] font-black tracking-[0.22em] uppercase"
        style={{
          borderColor: enabled ? "color-mix(in srgb, var(--pm-fg) 55%, transparent)" : "color-mix(in srgb, var(--pm-fg) 25%, transparent)",
          background: enabled ? "color-mix(in srgb, var(--pm-fg) 18%, transparent)" : "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
          color: "var(--pm-fg)",
        }}
      >
        {enabled ? "ON" : "OFF"}
      </button>
    </div>
  );
}

function ThemeGrid({ themes, activeThemeId, onSelect }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {themes.map((theme) => {
        const on = theme.id === activeThemeId;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onSelect(theme.id)}
            className={[
              "relative aspect-square w-full overflow-hidden border p-2 text-left active:scale-[0.99]",
              "focus:outline-none focus:ring-2 focus:ring-[color:var(--pm-fg)]/20",
              on ? "border-[color:var(--pm-fg)]/90 ring-2 ring-[color:var(--pm-fg)]/50" : "border-[color:var(--pm-fg)]/25 hover:border-[color:var(--pm-fg)]/45",
            ].join(" ")}
            style={{ background: bgCss(theme) }}
            aria-label={theme.label}
            title={theme.label}
          >
            <div className="text-[8px] font-black tracking-[0.18em] uppercase" style={{ color: theme.fg }}>
              {theme.mode}
            </div>
            <div className="mt-2 min-h-[2rem] text-[10px] font-black tracking-[0.12em] uppercase leading-4" style={{ color: theme.fg }}>
              {theme.label.replace(/\s+(DEEP|SOFT)$/i, "")}
            </div>
            <div className="mt-1 text-[9px] font-medium uppercase" style={{ color: theme.fg, opacity: 0.85 }}>
              {theme.label}
            </div>
            {on ? (
              <span className="absolute bottom-2 right-2 grid h-6 w-6 place-items-center border border-white/30 bg-black/25">
                <Check className="h-4 w-4" style={{ color: theme.fg }} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsThemesPage() {
  const themeId = useThemeStore((state) => state.themeId);
  const initTheme = useThemeStore((state) => state.initTheme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    initTheme();
    try {
      const sound = localStorage.getItem(SOUND_KEY);
      setSoundOn(sound === null ? true : sound === "1");
    } catch {}
  }, [initTheme]);

  const activeTheme = useMemo(() => THEMES.find((item) => item.id === themeId) || THEMES[0], [themeId]);

  const updateBool = (key, value, setter, eventName) => {
    setter(value);
    try { localStorage.setItem(key, value ? "1" : "0"); } catch {}
    try { window.dispatchEvent(new CustomEvent(eventName, { detail: { value } })); } catch {}
  };

  return (
    <div className="min-h-screen px-3 py-6 pt-16 font-mono md:px-4 md:pt-6" style={{ background: "var(--pm-bg-grad)", color: "var(--pm-fg)", fontFamily: "var(--pm-font)" }}>
      <div className="mx-auto w-full max-w-6xl space-y-3">
        <CardShell title="User Settings" subtitle={`${THEME_COUNT} curated themes with sound and vibration controls`}>
          <div className="grid gap-3">
            <CardShell title="Interaction" subtitle="Control click sound">
              <div className="mt-4 space-y-2">
                <ToggleRow label="Sound" sub="By default sound is ON for clicks." enabled={soundOn} onToggle={() => updateBool(SOUND_KEY, !soundOn, setSoundOn, "pm-sound-change")} icon={Volume2} />
              </div>
            </CardShell>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <CardShell title="Dark Theme" subtitle={`All Deep themes • ${DARK_THEMES.length} items`} icon={MoonStar}>
              <ThemeGrid themes={DARK_THEMES} activeThemeId={themeId} onSelect={setTheme} />
            </CardShell>
            <CardShell title="Light Theme" subtitle={`All Soft themes • ${LIGHT_THEMES.length} items`} icon={SunMedium}>
              <ThemeGrid themes={LIGHT_THEMES} activeThemeId={themeId} onSelect={setTheme} />
            </CardShell>
          </div>
          <div className="mt-3 border border-[color:var(--pm-fg)]/25 bg-white/10 px-3 py-2 text-[10px] text-[color:var(--pm-fg)]/85">
            <span className="font-black text-[color:var(--pm-fg)]">{activeTheme.label}</span>
            <span className="ml-2 text-[color:var(--pm-fg)]/60">• {THEME_COUNT} total</span>
          </div>
        </CardShell>
      </div>
    </div>
  );
}
