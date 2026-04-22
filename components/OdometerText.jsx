"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function pad2(n) {
  return String(Math.max(0, Math.floor(Number(n || 0)))).padStart(2, "0");
}

export function getCountdownParts(target, nowMs = 0) {
  if (!target || !Number.isFinite(nowMs) || nowMs <= 0) {
    return { totalMs: 0, totalSec: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const endMs = new Date(target).getTime();
  const diff = Math.max(0, endMs - nowMs);
  const totalSec = Math.floor(diff / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { totalMs: diff, totalSec, hours, minutes, seconds };
}

export function formatCountdownLabel(target, nowMs = 0) {
  const { totalMs, hours, minutes, seconds } = getCountdownParts(target, nowMs);
  if (totalMs <= 0) return "00:00:00";
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

export function OdometerStyles() {
  return (
    <style jsx global>{`
      .pm-odo{display:inline-flex;align-items:baseline;gap:1px;font-variant-numeric:tabular-nums;line-height:1;}
      .pm-odo-sep{font-size:1em;opacity:.95;transform:translateY(-.04em);margin:0 1px;}
      .pm-odo-col{display:inline-block;width:.78em;height:1.05em;overflow:hidden;position:relative;vertical-align:bottom;background: rgba(255,255,255,0.10);box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10);border-radius:0;}
      @supports (color: color-mix(in srgb, black, white)) {
        .pm-odo-col{background: color-mix(in srgb, var(--pm-fg) 10%, transparent);box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pm-fg) 14%, transparent);}
      }
      .pm-odo-strip{display:flex;flex-direction:column;transform: translateY(calc(-1 * var(--pm-odo-y)));transition: transform var(--pm-odo-ms) cubic-bezier(.18,.86,.25,1);will-change: transform;}
      .pm-odo-strip > span{height:1.05em;line-height:1.05em;display:grid;place-items:center;font-weight:900;}
      .pm-odo-plain{gap:1px;}
      .pm-odo-col-plain{background: transparent !important;box-shadow: none !important;}
      @keyframes pmGreenFlash {
        0% {box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10), 0 0 0 rgba(16,185,129,0); background: rgba(255,255,255,0.10);}
        40%{box-shadow: inset 0 0 0 1px rgba(16,185,129,0.75), 0 0 18px rgba(16,185,129,0.35); background: rgba(16,185,129,0.18);}
        100%{box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10), 0 0 0 rgba(16,185,129,0); background: rgba(255,255,255,0.10);}
      }
      @supports (color: color-mix(in srgb, black, white)) {
        @keyframes pmGreenFlash {
          0% {box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pm-fg) 14%, transparent), 0 0 0 rgba(16,185,129,0);background: color-mix(in srgb, var(--pm-fg) 10%, transparent);}
          40%{box-shadow: inset 0 0 0 1px rgba(16,185,129,0.75), 0 0 18px rgba(16,185,129,0.35);background: rgba(16,185,129,0.18);}
          100%{box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pm-fg) 14%, transparent), 0 0 0 rgba(16,185,129,0);background: color-mix(in srgb, var(--pm-fg) 10%, transparent);}
        }
      }
      .pm-odo-flash{animation: pmGreenFlash 420ms ease-out;}
      .pm-odo-col-plain.pm-odo-flash{animation:none !important;filter:drop-shadow(0 0 10px rgba(16,185,129,0.25));}
      @media (prefers-reduced-motion: reduce){.pm-odo-strip{transition:none;}.pm-odo-col-plain.pm-odo-flash{filter:none;}}
    `}</style>
  );
}

function DigitColumn({ digit, duration = 260, pulse = 0, variant = "boxed", flashMs = 420 }) {
  const d = Math.max(0, Math.min(9, Number(digit || 0)));
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (pulse <= 0) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), flashMs);
    return () => clearTimeout(t);
  }, [pulse, flashMs]);

  return (
    <span
      className={[
        "pm-odo-col",
        variant === "plain" ? "pm-odo-col-plain" : "",
        flash ? "pm-odo-flash" : "",
      ].join(" ")}
      style={{
        ["--pm-odo-y"]: `${d * 1.05}em`,
        ["--pm-odo-ms"]: `${duration}ms`,
      }}
      aria-hidden="true"
    >
      <span className="pm-odo-strip">
        <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>
        <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
      </span>
    </span>
  );
}

export function OdometerText({ value, pulse, variant = "boxed", durationBase = 230, durationSpread = 140, flashMs = 420, className = "" }) {
  const chars = String(value ?? "");
  return (
    <span className={["pm-odo", variant === "plain" ? "pm-odo-plain" : "", className].join(" ").trim()} aria-label={chars}>
      {chars.split("").map((ch, i) => {
        if (/\d/.test(ch)) {
          const ms = Number(durationBase) + ((i * 37) % Math.max(1, Number(durationSpread) || 1));
          return <DigitColumn key={`${ch}-${i}`} digit={ch} duration={ms} pulse={pulse} variant={variant} flashMs={flashMs} />;
        }
        return <span key={`${ch}-${i}`} className="pm-odo-sep">{ch}</span>;
      })}
    </span>
  );
}

export function useAnimatedCountdown(target) {
  const [nowMs, setNowMs] = useState(0);
  const [pulse, setPulse] = useState(0);
  const prevValue = useRef(null);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [target]);

  const value = useMemo(() => formatCountdownLabel(target, nowMs), [target, nowMs]);
  const parts = useMemo(() => getCountdownParts(target, nowMs), [target, nowMs]);

  useEffect(() => {
    if (prevValue.current === null) {
      prevValue.current = value;
      return;
    }
    if (value !== prevValue.current) {
      setPulse((p) => p + 1);
      prevValue.current = value;
    }
  }, [value]);

  return { nowMs, value, pulse, ...parts };
}
