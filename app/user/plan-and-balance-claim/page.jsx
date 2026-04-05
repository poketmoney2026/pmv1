// app/user/plan-and-balance-claim/page.jsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { FiLayers, FiRefreshCw } from "react-icons/fi";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

const DAY_MS = 24 * 60 * 60 * 1000;
const SCALE = 100000;

function fmtBDT0(n) {
  const x = Number(n || 0);
  return `Tk ${Number.isFinite(x) ? x.toFixed(0) : "0"}`;
}
function fmtBDT2(n) {
  const x = Number(n || 0);
  return `Tk ${Number.isFinite(x) ? x.toFixed(2) : "0.00"}`;
}
function formatUnits5(units) {
  const v = Number(units || 0) / SCALE;
  return v.toLocaleString("en-US", { minimumFractionDigits: 5, maximumFractionDigits: 5 });
}
const toDayLabel = (d) => (d === 1 ? "1 DAY" : `${d} DAYS`);

function DigitColumn({ digit, duration = 260, pulse = 0 }) {
  const d = Math.max(0, Math.min(9, Number(digit || 0)));
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (pulse <= 0) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 360);
    return () => clearTimeout(t);
  }, [pulse]);
  return (
    <span className={["pm-odo-col", flash ? "pm-odo-flash" : ""].join(" ")} style={{ "--pm-odo-y": `${d * 1.05}em`, "--pm-odo-ms": `${duration}ms` }} aria-hidden="true">
      <span className="pm-odo-strip">
        <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>
        <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
      </span>
    </span>
  );
}

function OdometerText({ value, pulse = 0 }) {
  const chars = String(value || "");
  return (
    <span className="pm-odo" aria-label={value}>
      {chars.split("").map((ch, i) => {
        if (/\d/.test(ch)) {
          const ms = 220 + ((i * 29) % 110);
          return <DigitColumn key={i} digit={ch} duration={ms} pulse={pulse} />;
        }
        return (
          <span key={i} className="pm-odo-sep">
            {ch}
          </span>
        );
      })}
    </span>
  );
}

function Block({ title, children }) {
  return (
    <div className="border p-4" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 35%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 8%, transparent)", color: "var(--pm-fg)" }}>
      <div className="mb-2 text-[12px] font-bold tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 92%, transparent)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function MiniKV({ label, valueNode, labelClassName = "" }) {
  return (
    <div className="border px-3 py-2" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "var(--pm-fg)" }}>
      <div className={["text-[11px] font-black tracking-widest uppercase", labelClassName].join(" ")} style={!labelClassName ? { color: "color-mix(in srgb, var(--pm-fg) 80%, transparent)" } : undefined}>
        {label}
      </div>
      <div className="mt-1 text-[12px] font-black tabular-nums truncate" style={{ color: "var(--pm-fg)" }}>
        {valueNode}
      </div>
    </div>
  );
}

function DayBox({ label, state, onClaim }) {
  const isClosed = state === "closed";
  const isRunning = state === "running";
  const baseStyle = { borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "var(--pm-fg)" };
  const closedStyle = { borderColor: "rgba(251,113,133,0.55)", background: "rgba(225,29,72,0.18)", color: "var(--pm-fg)" };
  const runningStyle = { borderColor: "rgba(110,231,183,0.55)", background: "rgba(5,150,105,0.16)", color: "var(--pm-fg)" };

  return (
    <button
      type="button"
      onClick={() => {
        if (isClosed) return onClaim?.();
        return toast.error(isRunning ? "THIS DAY IS RUNNING" : "THIS DAY IS NOT AVAILABLE");
      }}
      className={["relative border text-center overflow-hidden active:scale-[0.99] transition", "focus:outline-none focus:ring-4 focus:ring-white/10", "aspect-square grid place-items-center", isRunning ? "pm-running" : ""].join(" ")}
      style={isClosed ? closedStyle : isRunning ? runningStyle : baseStyle}
      aria-label={`${label} ${isClosed ? "CLAIM" : isRunning ? "RUNNING" : "LOCKED"}`}
    >
      <div className="relative z-[5] text-[10px] font-black tracking-wide px-1" style={{ color: "var(--pm-fg)" }}>
        {label}
      </div>
    </button>
  );
}

function splitDayRows(daysTotal) {
  const n = Math.max(1, Math.floor(Number(daysTotal || 1)));
  if (n <= 6) return [n];
  if (n <= 12) {
    const a = Math.min(6, Math.ceil(n / 2));
    return [a, n - a];
  }
  if (n === 13) return [5, 4, 4];
  if (n === 14) return [5, 5, 4];
  if (n === 15) return [5, 5, 5];
  if (n === 16) return [5, 5, 6];
  if (n === 17) return [6, 6, 5];
  if (n === 18) return [6, 6, 6];
  const rows = Math.ceil(n / 6);
  const base = Math.floor(n / rows);
  const rem = n % rows;
  const sizes = Array.from({ length: rows }, (_, i) => base + (i < rem ? 1 : 0));
  return sizes.map((x) => Math.min(6, x));
}

function DayGrid({ boxes, dayState, depositId }) {
  const rows = splitDayRows(boxes.length);
  let cursor = 0;
  return (
    <div className="space-y-2">
      {rows.map((sz, r) => {
        const rowBoxes = boxes.slice(cursor, cursor + sz);
        cursor += sz;
        return (
          <div key={r} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${rowBoxes.length}, minmax(0, 1fr))` }}>
            {rowBoxes.map(({ dayIndex, label }) => {
              const state = dayIndex <= dayState.fullDays ? "closed" : dayIndex === dayState.runningIndex ? "running" : "locked";
              return <DayBox key={dayIndex} label={label} state={state} onClaim={() => toast(`Day ${dayIndex} claim (ID: ${depositId})`)} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

function toMsSafe(v) {
  const t = v ? new Date(v).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

function DepositCard({ row, idx, interestPercent, daysTotal, claimBusy, onClaim, claimCooldownSec }) {
  const depositId = String(row?._id || "");
  const deposit = Number(row?.amount || 0);
  const createdMs = useMemo(() => toMsSafe(row?.createdDate) || toMsSafe(row?.createdAt), [row?.createdDate, row?.createdAt]);
  const claimMs = useMemo(() => toMsSafe(row?.claimDate), [row?.claimDate]);

  const isDone = String(row?.type || "none") === "done";
  const dailyEarn = useMemo(() => (!isDone ? (deposit * Number(interestPercent || 0)) / 100 : 0), [deposit, interestPercent, isDone]);
  const perSecond = useMemo(() => dailyEarn / 86400, [dailyEarn]);
  const perSecondUnits = useMemo(() => perSecond * SCALE, [perSecond]);

  const [cooldownSec, setCooldownSec] = useState(0);
  useEffect(() => {
    if (isDone) return setCooldownSec(0);
    const last = claimMs || 0;
    if (!last) return setCooldownSec(0);
    const passed = Math.floor((Date.now() - last) / 1000);
    setCooldownSec(Math.max(0, Number(claimCooldownSec || 120) - passed));
  }, [claimMs, isDone, claimCooldownSec]);

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const t = setInterval(() => setCooldownSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldownSec]);

  const unitsRef = useRef(0);
  const carryRef = useRef(0);
  const [units, setUnits] = useState(0);
  const [pulse, setPulse] = useState(0);
  const prevText = useRef(null);

  useEffect(() => {
    if (isDone) return;
    const base = claimMs && claimMs >= createdMs ? claimMs : createdMs;
    const now = Date.now();
    const diffSec = base ? Math.max(0, (now - base) / 1000) : 0;
    const initialUnitsFloat = diffSec * perSecond * SCALE;
    unitsRef.current = Math.floor(initialUnitsFloat);
    carryRef.current = initialUnitsFloat - unitsRef.current;
    setUnits(unitsRef.current);
    setPulse((p) => p + 1);
  }, [depositId, perSecond, claimMs, createdMs, isDone]);

  useEffect(() => {
    if (isDone) return;
    if (!Number.isFinite(perSecondUnits) || perSecondUnits <= 0) return;
    const t = setInterval(() => {
      carryRef.current += perSecondUnits;
      const inc = Math.floor(carryRef.current);
      if (inc > 0) {
        unitsRef.current += inc;
        carryRef.current -= inc;
        setUnits(unitsRef.current);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [perSecondUnits, isDone]);

  const claimText = useMemo(() => formatUnits5(units), [units]);

  useEffect(() => {
    if (isDone) return;
    if (prevText.current === null) {
      prevText.current = claimText;
      return;
    }
    if (claimText !== prevText.current) {
      setPulse((p) => p + 1);
      prevText.current = claimText;
    }
  }, [claimText, isDone]);

  const totalClaimed = useMemo(() => {
    if (!createdMs) return 0;
    const end = claimMs || 0;
    if (!end || end <= createdMs) return 0;
    const diffSec = (end - createdMs) / 1000;
    const daily = (deposit * Number(interestPercent || 0)) / 100;
    return diffSec * (daily / 86400);
  }, [createdMs, claimMs, deposit, interestPercent]);

  const boxes = useMemo(() => Array.from({ length: daysTotal }, (_, i) => ({ dayIndex: i + 1, label: toDayLabel(i + 1) })), [daysTotal]);

  const dayState = useMemo(() => {
    if (isDone) return { fullDays: daysTotal, runningIndex: -1 };
    if (!createdMs) return { fullDays: 0, runningIndex: 1 };
    const diffDays = Math.max(0, (Date.now() - createdMs) / DAY_MS);
    const fullDays = Math.min(daysTotal, Math.floor(diffDays));
    const runningIndex = fullDays < daysTotal ? fullDays + 1 : -1;
    return { fullDays, runningIndex };
  }, [createdMs, daysTotal, isDone]);

  const todayEarning = useMemo(() => (!isDone ? dailyEarn : 0), [dailyEarn, isDone]);
  const canClaim = !isDone && !claimBusy && cooldownSec <= 0;

  return (
    <div className="border p-4" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "var(--pm-fg)" }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-black tracking-widest uppercase truncate" style={{ color: "var(--pm-fg)" }}>
            DEPOSIT BOX #{idx + 1}
          </div>
          <div className="mt-1 text-[10px] font-bold tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>
            ID: {depositId || "—"}
          </div>
        </div>
        {isDone ? (
          <span className="inline-flex items-center border px-3 py-1 text-[10px] font-black tracking-widest uppercase" style={{ borderColor: "rgba(251,113,133,0.55)", background: "rgba(225,29,72,0.18)", color: "rgba(254,205,211,0.95)" }}>
            DONE
          </span>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <MiniKV label="DEPOSIT BALANCE" labelClassName="text-sky-200" valueNode={<span style={{ color: "var(--pm-fg)" }}>{fmtBDT0(deposit)}</span>} />
          <MiniKV label="DAILY RATE" labelClassName="text-amber-200" valueNode={<span style={{ color: "var(--pm-fg)" }}><span className="font-black">{Number(interestPercent || 0)}</span>%</span>} />
        </div>

        {!isDone ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!canClaim}
              onClick={() => onClaim?.(depositId)}
              className="border px-3 py-3 grid place-items-center active:scale-[0.99] transition disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ borderColor: "rgba(110,231,183,0.45)", background: "rgba(16,185,129,0.12)", color: "var(--pm-fg)" }}
            >
              <span className="inline-flex items-center gap-2 text-[12px] font-black tracking-widest uppercase" style={{ color: "var(--pm-fg)" }}>
                {claimBusy ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : null}
                {claimBusy ? "CLAIMING..." : cooldownSec > 0 ? `WAIT ${String(cooldownSec).padStart(2, "0")} SEC` : "CLAIM"}
              </span>
            </button>

            <div className="border px-3 py-3 grid place-items-center" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)" }}>
              <span className="text-[13px] font-black tabular-nums" style={{ color: "var(--pm-fg)" }}>
                <OdometerText value={claimText} pulse={pulse} />
              </span>
            </div>
          </div>
        ) : null}

        <DayGrid boxes={boxes} dayState={dayState} depositId={depositId} />

        <div className="mt-2 border px-3 py-2 flex items-center justify-between gap-2 shadow-sm" style={{ borderColor: "rgba(110,231,183,0.80)", background: "rgba(16,185,129,0.15)", color: "var(--pm-fg)" }}>
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)" }}>
            TOTAL CLAIMED
          </span>
          <span className="text-[13px] font-black tabular-nums" style={{ color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)" }}>
            {fmtBDT2(totalClaimed)}
          </span>
        </div>

        <div className="border px-3 py-2 flex items-center justify-between gap-2" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "var(--pm-fg)" }}>
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 85%, transparent)" }}>
            TODAY EARNING
          </span>
          <span className="text-[13px] font-black tabular-nums" style={{ color: "var(--pm-fg)" }}>
            {fmtBDT2(todayEarning)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PlanAndBalanceClaimPage() {
  const [loading, setLoading] = useState(true);
  const [interestPercent, setInterestPercent] = useState(0);
  const [daysTotal, setDaysTotal] = useState(12);
  const [items, setItems] = useState([]);
  const [claimBusyId, setClaimBusyId] = useState("");
  const [claimCooldownSec, setClaimCooldownSec] = useState(120);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/plan-and-balance-claim", { method: "GET", credentials: "include", cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        toast.error(j?.message || "Failed to load");
        setItems([]);
        return;
      }
      const d = j?.data || {};
      setInterestPercent(Number(d?.interestPercent || 0));
      setDaysTotal(Math.max(1, Math.min(30, Number(d?.daysTotal || 12))));
      setClaimCooldownSec(Math.max(1, Number(d?.claimCooldownSec || 120)));
      setItems(Array.isArray(d?.items) ? d.items : []);
    } catch {
      toast.error("Network error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onClaim = async (depositId) => {
    const id = String(depositId || "").trim();
    if (!id || claimBusyId) return;

    setClaimBusyId(id);
    toast.loading("Claiming...", { id: "claim" });

    try {
      const res = await fetch("/api/user/plan-and-balance-claim/claim", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId: id }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        toast.error(j?.message || "Claim failed", { id: "claim" });
        return;
      }

      const newClaimDate = j?.data?.claimDate || new Date().toISOString();
      const newType = String(j?.data?.type || "");
      if (j?.data?.claimCooldownSec) setClaimCooldownSec(Math.max(1, Number(j?.data?.claimCooldownSec || 120)));

      toast.success(j?.message || "Claimed", { id: "claim" });

      setItems((prev) => prev.map((x) => (String(x?._id) === String(id) ? { ...x, claimDate: newClaimDate, ...(newType ? { type: newType } : {}) } : x)));
    } catch {
      toast.error("Network error", { id: "claim" });
    } finally {
      setClaimBusyId("");
    }
  };

  const totalBoxes = useMemo(() => items.length, [items]);

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: "var(--pm-fg)" }}>
      <style>{`
        .pm-odo{display:inline-flex;align-items:baseline;gap:1px;font-variant-numeric:tabular-nums;line-height:1;}
        .pm-odo-sep{font-size:1em;opacity:.95;transform:translate3d(0,-.06em,0);margin:0 1px;}
        .pm-odo-col{display:inline-block;width:.75em;height:1.05em;overflow:hidden;position:relative;border-radius:0;background: rgba(255,255,255,0.10);box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10);contain: layout paint;transform: translateZ(0);backface-visibility: hidden;}
        @supports (color: color-mix(in srgb, black, white)) {.pm-odo-col{background: color-mix(in srgb, var(--pm-fg) 10%, transparent);box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pm-fg) 14%, transparent);}}
        .pm-odo-strip{display:flex;flex-direction:column;transform: translate3d(0, calc(-1 * var(--pm-odo-y)), 0);transition: transform var(--pm-odo-ms) cubic-bezier(.16,.9,.22,1);will-change: transform;}
        .pm-odo-strip > span{height:1.05em;display:grid;place-items:center;font-weight:900;}
        @keyframes pmGreenFlash{0%{box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10), 0 0 0 rgba(16,185,129,0); background: rgba(255,255,255,0.10);}40%{box-shadow: inset 0 0 0 1px rgba(16,185,129,0.75), 0 0 14px rgba(16,185,129,0.28); background: rgba(16,185,129,0.14);}100%{box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10), 0 0 0 rgba(16,185,129,0); background: rgba(255,255,255,0.10);}}
        @supports (color: color-mix(in srgb, black, white)) {@keyframes pmGreenFlash{0%{box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pm-fg) 14%, transparent), 0 0 0 rgba(16,185,129,0); background: color-mix(in srgb, var(--pm-fg) 10%, transparent);}40%{box-shadow: inset 0 0 0 1px rgba(16,185,129,0.75), 0 0 14px rgba(16,185,129,0.28); background: rgba(16,185,129,0.14);}100%{box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pm-fg) 14%, transparent), 0 0 0 rgba(16,185,129,0); background: color-mix(in srgb, var(--pm-fg) 10%, transparent);}}}
        .pm-odo-flash{animation: pmGreenFlash 360ms ease-out;}
        @media (prefers-reduced-motion: reduce){.pm-odo-strip{transition:none;}.pm-odo-flash{animation:none;}}
        @keyframes pmRunning{0%{transform:scale(1);}50%{transform:scale(1.06);}100%{transform:scale(1);}}
        .pm-running{animation: pmRunning 1.05s ease-in-out infinite;}
        @media (prefers-reduced-motion: reduce){.pm-running{animation:none;}}
      `}</style>

      <div className="mx-auto w-full max-w-md space-y-3">
        <Block title="PLAN & BALANCE CLAIM">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-widest uppercase" style={{ color: "var(--pm-fg)" }}>
              <FiLayers className="h-4 w-4" /> DEPOSIT BOXES
            </div>
            <span className="inline-flex items-center gap-2 border px-3 py-1 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)" }}>
              {loading ? "LOADING..." : `${totalBoxes} BOXES`}
            </span>
          </div>

          <div className="mt-2 text-[10px] font-bold tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>
            DAILY RATE: {Number(interestPercent || 0)}% • DAYS: {daysTotal}
          </div>

          <button type="button" onClick={loadData} className="mt-3 w-full border py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)" }}>
            REFRESH
          </button>
        </Block>

        <div className="space-y-3">
          {loading ? (
            <div className="border px-3 py-3 text-[11px]" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>
              Loading…
            </div>
          ) : items.length ? (
            items.map((row, idx) => (
              <DepositCard key={row?._id || idx} row={row} idx={idx} interestPercent={interestPercent} daysTotal={daysTotal} claimBusy={claimBusyId === String(row?._id)} onClaim={onClaim} claimCooldownSec={claimCooldownSec} />
            ))
          ) : (
            <div className="border px-3 py-3 text-[11px]" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>
              No success deposits found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}