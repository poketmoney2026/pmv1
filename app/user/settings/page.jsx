"use client";

import { useEffect, useMemo } from "react";
import { Check } from "lucide-react";
import { THEMES, bgCss } from "@/lib/themes";
import useThemeStore from "@/stores/useThemeStore";

function CardShell({ title, subtitle, children }) {
  return (
    <div className="border border-[color:var(--pm-fg)]/35 bg-white/10 p-3 md:p-5">
      <div className="text-center text-[11px] font-black tracking-widest uppercase text-[color:var(--pm-fg)]">{title}</div>
      <div className="mt-2 text-center text-[10px] text-[color:var(--pm-fg)]/75">{subtitle}</div>
      {children}
    </div>
  );
}

export default function SettingsThemesPage() {
  const themeId = useThemeStore((state) => state.themeId);
  const initTheme = useThemeStore((state) => state.initTheme);
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const activeTheme = useMemo(() => THEMES.find((item) => item.id === themeId) || THEMES[0], [themeId]);

  return (
    <div className="min-h-screen px-3 py-6 pt-16 font-mono md:px-4 md:pt-6" style={{ background: "var(--pm-bg-grad)", color: "var(--pm-fg)", fontFamily: "var(--pm-font)" }}>
      <div className="mx-auto w-full max-w-5xl space-y-3">
        <CardShell title="Theme Settings" subtitle="5 premium themes">
          <div className="mt-4 grid grid-cols-5 gap-1.5 md:gap-2">
            {THEMES.map((theme) => {
              const on = theme.id === themeId;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setTheme(theme.id)}
                  className={[
                    "relative h-16 w-full overflow-hidden border active:scale-[0.99] md:h-20",
                    "focus:outline-none focus:ring-2 focus:ring-[color:var(--pm-fg)]/20",
                    on ? "border-[color:var(--pm-fg)]/90 ring-2 ring-[color:var(--pm-fg)]/50" : "border-[color:var(--pm-fg)]/25 hover:border-[color:var(--pm-fg)]/45",
                  ].join(" ")}
                  style={{ background: bgCss(theme) }}
                  aria-label={theme.label}
                  title={theme.label}
                >
                  <span className="absolute left-1.5 top-1.5 text-[7px] font-black tracking-wider uppercase md:left-2 md:top-2 md:text-[9px]" style={{ color: theme.fg }}>{theme.label}</span>
                  {on ? <span className="absolute bottom-1.5 right-1.5 grid h-5 w-5 place-items-center border border-white/30 bg-black/25 md:h-7 md:w-7"><Check className="h-3 w-3 md:h-4 md:w-4" style={{ color: theme.fg }} /></span> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-3 border border-[color:var(--pm-fg)]/25 bg-white/10 px-3 py-2 text-[10px] text-[color:var(--pm-fg)]/85">
            Active Theme: <span className="font-black text-[color:var(--pm-fg)]">{activeTheme.label}</span>
          </div>
        </CardShell>

      </div>
    </div>
  );
}
