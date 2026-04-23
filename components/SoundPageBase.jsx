
"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";

const SOUND_KEY = "pm_sound_enabled_v1";

function CardShell({ title, subtitle, children }) {
  return (
    <div className="border border-[color:var(--pm-fg)]/35 bg-white/10 p-3 md:p-5">
      <div className="text-center text-[11px] font-black tracking-widest uppercase text-[color:var(--pm-fg)]">{title}</div>
      <div className="mt-2 text-center text-[10px] text-[color:var(--pm-fg)]/75">{subtitle}</div>
      {children}
    </div>
  );
}

function SoundSwitch({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative inline-flex h-11 w-24 items-center rounded-full border px-2 transition-all active:scale-[0.98]"
      style={{
        borderColor: enabled ? "color-mix(in srgb, var(--pm-fg) 60%, transparent)" : "color-mix(in srgb, var(--pm-fg) 25%, transparent)",
        background: enabled ? "color-mix(in srgb, var(--pm-fg) 16%, transparent)" : "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
        justifyContent: enabled ? "flex-end" : "flex-start",
      }}
      aria-pressed={enabled}
      aria-label={enabled ? "Sound on" : "Sound off"}
    >
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 text-[10px] font-black tracking-[0.22em] uppercase text-[color:var(--pm-fg)]/75">
        <span>Off</span>
        <span>On</span>
      </span>
      <span className="relative z-[1] grid h-7 w-7 place-items-center rounded-full border border-[color:var(--pm-fg)]/30 bg-[color:var(--pm-fg)] text-[color:var(--pm-bg)] shadow-lg">
        <Volume2 className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

export default function SoundPageBase({ title = "Sound", subtitle = "Turn click sound on or off" }) {
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    try {
      const sound = localStorage.getItem(SOUND_KEY);
      setSoundOn(sound === null ? true : sound === "1");
    } catch {}
  }, []);

  const toggle = () => {
    const next = !soundOn;
    setSoundOn(next);
    try { localStorage.setItem(SOUND_KEY, next ? "1" : "0"); } catch {}
    try { window.dispatchEvent(new CustomEvent("pm-sound-change", { detail: { value: next } })); } catch {}
  };

  return (
    <div className="min-h-screen px-3 py-6 pt-16 font-mono md:px-4 md:pt-6" style={{ background: "var(--pm-bg-grad)", color: "var(--pm-fg)", fontFamily: "var(--pm-font)" }}>
      <div className="mx-auto w-full max-w-2xl space-y-3">
        <CardShell title={title} subtitle={subtitle}>
          <div className="mt-4 border border-[color:var(--pm-fg)]/25 bg-white/10 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-widest uppercase text-[color:var(--pm-fg)]">
                  <Volume2 className="h-4 w-4" />
                  <span>Click Sound</span>
                </div>
                <div className="mt-1 text-[10px] text-[color:var(--pm-fg)]/70">ক্লিক করলে সাউন্ড হবে কি না এখান থেকে নিয়ন্ত্রণ করুন।</div>
              </div>
              <SoundSwitch enabled={soundOn} onToggle={toggle} />
            </div>
          </div>
          <div className="border border-[color:var(--pm-fg)]/25 bg-white/10 px-3 py-2 text-[10px] text-[color:var(--pm-fg)]/80">
            Current status: <span className="font-black text-[color:var(--pm-fg)]">{soundOn ? "ON" : "OFF"}</span>
          </div>
        </CardShell>
      </div>
    </div>
  );
}
