// app/user/dashboard/page.jsx
"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import {
  TrendingUp,
  Users,
  BadgeDollarSign,
  ArrowDownToLine,
  CalendarDays,
  PieChart,
  Activity,
  Timer,
  Percent,
} from "lucide-react";
import useLiveAppStore from "@/stores/useLiveAppStore";

const funnelDisplay = Funnel_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const SCALE = 100000;

const fmt2 = (n) =>
  `Tk ${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function fmtPercent2(n) {
  return `${Number(n || 0).toFixed(2)}%`;
}

function formatUnits5(units, scale = SCALE) {
  const v = Number(units || 0) / scale;
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  });
}

function integerDigitsFromFormatted(value) {
  const raw = String(value ?? "");
  const intPart = raw.split(".")[0].replace(/,/g, "").replace(/\D/g, "");
  return Math.max(1, intPart.length);
}

function getResponsiveOdoSize(value) {
  const digits = integerDigitsFromFormatted(value);
  if (digits <= 2) return "clamp(3.4rem,15vw,6.2rem)";
  if (digits === 3) return "clamp(3rem,13vw,5.5rem)";
  if (digits === 4) return "clamp(2.55rem,11vw,4.75rem)";
  return "clamp(2.05rem,9vw,4.1rem)";
}

function useLiveUnitsOdometer({
  initialUnits = 0,
  unitsPerSecond = 0,
  enabled = true,
}) {
  const [units, setUnits] = useState(() =>
    Math.max(0, Math.floor(Number(initialUnits || 0))),
  );
  const carryRef = useRef(0);

  useEffect(() => {
    setUnits(Math.max(0, Math.floor(Number(initialUnits || 0))));
    carryRef.current = 0;
  }, [initialUnits]);

  useEffect(() => {
    if (!enabled) return;
    const add = Number(unitsPerSecond || 0);
    if (!Number.isFinite(add) || add <= 0) return;

    const t = setInterval(() => {
      carryRef.current += add;
      const inc = Math.floor(carryRef.current);
      if (inc > 0) {
        setUnits((prev) => prev + inc);
        carryRef.current -= inc;
      }
    }, 1000);

    return () => clearInterval(t);
  }, [unitsPerSecond, enabled]);

  return { units, setUnits };
}

function DigitColumn({ digit, duration = 320, pulse = 0, variant = "boxed" }) {
  const d = Math.max(0, Math.min(9, Number(digit || 0)));
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (pulse <= 0) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 420);
    return () => clearTimeout(t);
  }, [pulse]);

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
        <span>0</span>
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
        <span>6</span>
        <span>7</span>
        <span>8</span>
        <span>9</span>
      </span>
    </span>
  );
}

function OdometerText({ value, pulse, variant = "boxed" }) {
  const chars = String(value ?? "");
  return (
    <span
      className={["pm-odo", variant === "plain" ? "pm-odo-plain" : ""].join(
        " ",
      )}
      aria-label={String(value ?? "")}
    >
      {chars.split("").map((ch, i) => {
        if (/\d/.test(ch)) {
          const ms = 260 + ((i * 37) % 140);
          return (
            <DigitColumn
              key={i}
              digit={ch}
              duration={ms}
              pulse={pulse}
              variant={variant}
            />
          );
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
    <div
      className="select-none border p-3"
      style={{
        borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
        background: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
        boxShadow:
          "0 0 0 1px color-mix(in srgb, var(--pm-fg) 10%, transparent)",
        color: "var(--pm-fg)",
      }}
    >
      <div
        className="mb-2 text-[11px] font-bold tracking-widest uppercase"
        style={{ color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ icon: Icon, label, value, valueNode }) {
  return (
    <div
      className="flex items-center justify-between gap-3 border px-3 py-2"
      style={{
        borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
        background: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
        color: "var(--pm-fg)",
      }}
    >
      <span
        className="inline-flex items-center gap-2 text-[12px] min-w-0"
        style={{ color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)" }}
      >
        <Icon
          className="h-4 w-4 shrink-0"
          style={{ color: "color-mix(in srgb, var(--pm-fg) 80%, transparent)" }}
        />
        <span className="truncate">{label}</span>
      </span>
      {valueNode ? (
        valueNode
      ) : (
        <span
          className="font-black tabular-nums shrink-0"
          style={{ color: "var(--pm-fg)" }}
        >
          {value}
        </span>
      )}
    </div>
  );
}

function WelcomeModal({ open, amount, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-black/82 px-4">
      <div
        className="w-full max-w-sm border p-5 text-center"
        style={{
          borderColor: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
          background: "var(--pm-bg)",
          color: "var(--pm-fg)",
          boxShadow: "0 0 0 1px color-mix(in srgb, var(--pm-fg) 10%, transparent), 0 32px 90px rgba(0,0,0,.68)",
        }}
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center border" style={{ borderColor: "rgba(139,92,246,0.42)", background: "rgba(139,92,246,0.16)" }}>
          <BadgeDollarSign className="h-7 w-7" />
        </div>
        <div className="text-[11px] font-black tracking-[0.3em] uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 72%, transparent)" }}>
          Welcome Bonus
        </div>
        <div className="mt-3 text-[15px] font-black uppercase tracking-[0.14em]">Account Created</div>
        <div className="mt-4 text-[clamp(2rem,8vw,2.6rem)] font-black leading-none">Tk {Number(amount || 0).toFixed(0)}</div>
        <div className="mt-2 text-sm font-bold tracking-wide" style={{ color: "color-mix(in srgb, var(--pm-fg) 84%, transparent)" }}>added as welcome bonus</div>
        <button
          type="button"
          onClick={onClose}
          className="mx-auto mt-6 inline-flex items-center justify-center border px-4 py-2 text-[11px] font-black tracking-[0.24em] uppercase active:scale-[0.98]"
          style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 22%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 8%, transparent)", color: "var(--pm-fg)" }}
          aria-label="Close welcome bonus modal"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const setBalanceLocal = useLiveAppStore((state) => state.setBalanceLocal);
  const refreshLiveSync = useLiveAppStore((state) => state.refreshLiveSync);

  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeBonusAmount, setWelcomeBonusAmount] = useState(0);

  const [interestPercent, setInterestPercent] = useState(0);
  const [planDays, setPlanDays] = useState(0);
  const [runningCount, setRunningCount] = useState(0);

  const [streamUnitsStart, setStreamUnitsStart] = useState(0);
  const [streamUnitsPerSecond, setStreamUnitsPerSecond] = useState(0);

  const [todayIncomeUnitsStart, setTodayIncomeUnitsStart] = useState(0);
  const [todayIncomeUnitsPerSecond, setTodayIncomeUnitsPerSecond] = useState(0);

  const [speed, setSpeed] = useState({ hourlyIncrease: 0, dailyIncrease: 0 });

  const [stats, setStats] = useState({
    todayIncome: 0,
    yesterdayIncome: 0,
    last7DaysIncome: 0,
    last30DaysIncome: 0,
    referralIncome: 0,
    totalWithdraw: 0,
    referrals: 0,
  });

  const { units: liveStreamUnits, setUnits: setLiveStreamUnits } =
    useLiveUnitsOdometer({
      initialUnits: streamUnitsStart,
      unitsPerSecond: streamUnitsPerSecond,
      enabled: !unauthorized,
    });

  const { units: liveTodayIncomeUnits } = useLiveUnitsOdometer({
    initialUnits: todayIncomeUnitsStart,
    unitsPerSecond: todayIncomeUnitsPerSecond,
    enabled: !unauthorized,
  });

  const formattedStream = useMemo(
    () => formatUnits5(liveStreamUnits, SCALE),
    [liveStreamUnits],
  );

  const formattedTodayIncomeLive = useMemo(
    () => formatUnits5(liveTodayIncomeUnits, SCALE),
    [liveTodayIncomeUnits],
  );

  const streamFontSize = useMemo(
    () => getResponsiveOdoSize(formattedStream),
    [formattedStream],
  );

  const [pulseStream, setPulseStream] = useState(0);
  const prevStream = useRef(null);

  useEffect(() => {
    if (prevStream.current === null) {
      prevStream.current = formattedStream;
      return;
    }
    if (formattedStream !== prevStream.current) {
      setPulseStream((p) => p + 1);
      prevStream.current = formattedStream;
    }
  }, [formattedStream]);

  const [pulseToday, setPulseToday] = useState(0);
  const prevToday = useRef(null);

  useEffect(() => {
    if (prevToday.current === null) {
      prevToday.current = formattedTodayIncomeLive;
      return;
    }
    if (formattedTodayIncomeLive !== prevToday.current) {
      setPulseToday((p) => p + 1);
      prevToday.current = formattedTodayIncomeLive;
    }
  }, [formattedTodayIncomeLive]);

  const [cooldown, setCooldown] = useState(0);
  const [claimCooldownSec, setClaimCooldownSec] = useState(120);
  const [claiming, setClaiming] = useState(false);
  const lastLoadRef = useRef(0);
  const inFlightRef = useRef(false);

  const canClaim =
    !unauthorized && !claiming && cooldown <= 0 && runningCount > 0;

  const cdText = useMemo(
    () => String(Math.max(0, cooldown)).padStart(2, "0"),
    [cooldown],
  );

  const [pulseCd, setPulseCd] = useState(0);
  const prevCd = useRef(null);

  useEffect(() => {
    if (prevCd.current === null) {
      prevCd.current = cdText;
      return;
    }
    if (cdText !== prevCd.current) {
      setPulseCd((p) => p + 1);
      prevCd.current = cdText;
    }
  }, [cdText]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const loadData = useCallback(async ({ background = false, force = false } = {}) => {
    const now = Date.now();
    const minGap = background ? 15000 : 0;
    if (!force && background && now - lastLoadRef.current < minGap) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (!background) setLoading(true);
    setUnauthorized(false);

    try {
      const res = await fetch("/api/user/dashboard", {
        method: "GET",
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setUnauthorized(true);
        if (!background) toast.error(j?.message || "Unauthorized");
        return;
      }

      if (!res.ok || !j?.ok) {
        if (!background) toast.error(j?.message || "Failed to load");
        return;
      }

      const d = j?.data || {};
      const bal = Number(d?.userBalance || 0);

      setInterestPercent(Number(d?.interestPercent || 0));
      setPlanDays(Number(d?.planDays || 0));
      setRunningCount(Number(d?.runningCount || 0));
      setClaimCooldownSec(Math.max(1, Number(d?.claimCooldownSec || 120)));

      setBalanceLocal(bal);

      const s = d?.stream || {};
      setStreamUnitsStart(Math.max(0, Math.floor(Number(s?.unitsStart || 0))));
      setStreamUnitsPerSecond(Number(s?.unitsPerSecond || 0));

      const st = d?.stats || {};
      setStats({
        todayIncome: Number(st?.todayIncome || 0),
        yesterdayIncome: Number(st?.yesterdayIncome || 0),
        last7DaysIncome: Number(st?.last7DaysIncome || 0),
        last30DaysIncome: Number(st?.last30DaysIncome || 0),
        referralIncome: Number(st?.referralIncome || 0),
        totalWithdraw: Number(st?.totalWithdraw || 0),
        referrals: Number(st?.referrals || 0),
      });

      setSpeed({
        hourlyIncrease: Number(d?.speed?.hourlyIncrease || 0),
        dailyIncrease: Number(d?.speed?.dailyIncrease || 0),
      });

      setTodayIncomeUnitsStart(
        Math.floor(Number(st?.todayIncome || 0) * SCALE),
      );
      setTodayIncomeUnitsPerSecond(Number(s?.unitsPerSecond || 0));

      const cd = Number(d?.cooldownRemainingSec || 0);
      setCooldown(cd > 0 ? cd : 0);
      lastLoadRef.current = Date.now();
    } catch {
      if (!background) toast.error("Network error");
    } finally {
      inFlightRef.current = false;
      if (!background) setLoading(false);
    }
  }, [setBalanceLocal]);

  useEffect(() => {
    loadData({ force: true });
  }, [loadData]);

  useEffect(() => {
    const syncDashboard = () => loadData({ background: true });
    const forceSyncDashboard = () => loadData({ background: true, force: true });

    const onVisibility = () => {
      if (!document.hidden) syncDashboard();
    };

    const t = setInterval(() => {
      if (!document.hidden) syncDashboard();
    }, 30000);

    window.addEventListener("focus", syncDashboard);
    window.addEventListener("pm-live-refresh", forceSyncDashboard);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(t);
      window.removeEventListener("focus", syncDashboard);
      window.removeEventListener("pm-live-refresh", forceSyncDashboard);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadData]);

  useEffect(() => {
    let t1;
    try {
      const raw = sessionStorage.getItem("pm_signup_welcome") || localStorage.getItem("pm_signup_welcome");
      if (!raw) return;
      const data = JSON.parse(raw || "{}");
      if (!data?.show) return;
      const amount = Number(data?.amount || 0);
      setWelcomeBonusAmount(amount);
      t1 = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 280);
    } catch {}

    return () => {
      clearTimeout(t1);
    };
  }, []);

  const handleClaimAll = async () => {
    if (!canClaim) return;

    setClaiming(true);
    toast.loading("Claiming all...", { id: "claimAll" });

    try {
      const res = await fetch("/api/user/dashboard/claim-all", {
        method: "POST",
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));

      if (res.status === 429) {
        const remain = Number(j?.data?.remainingSec || 0);
        setCooldown(remain > 0 ? remain : claimCooldownSec);
        toast.error(j?.message || "Wait", { id: "claimAll" });
        return;
      }

      if (!res.ok || !j?.ok) {
        toast.error(j?.message || "Claim failed", { id: "claimAll" });
        return;
      }

      const claimed = Number(j?.data?.claimedAmount || 0);

      setStreamUnitsStart(0);
      setLiveStreamUnits(0);

      setCooldown(Number(j?.data?.cooldownSec || claimCooldownSec));
      toast.success(j?.message || `Claimed Tk ${claimed.toFixed(5)}`, {
        id: "claimAll",
      });

      refreshLiveSync({ force: true });

      try {
        window.dispatchEvent(new CustomEvent("pm-live-refresh"));
      } catch {}

      await loadData({ force: true });
    } catch {
      toast.error("Network error", { id: "claimAll" });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div
      className={`${funnelDisplay.className} select-none min-h-[100svh] mt-14 px-3 py-4 font-medium`}
      style={{ background: "var(--pm-bg-grad)", color: "var(--pm-fg)" }}
    >
      <style>{`
        .pm-odo{display:inline-flex;align-items:baseline;gap:1px;font-variant-numeric:tabular-nums;line-height:1;}
        .pm-odo-sep{font-size:1em;opacity:.95;transform:translateY(-.06em);margin:0 1px;}
        .pm-odo-col{display:inline-block;width:.75em;height:1.05em;overflow:hidden;position:relative;border-radius:0;background: rgba(255,255,255,0.10);box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10);}
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
        @keyframes pmClaimBreath {0% { transform: scale(1); }12% { transform: scale(0.965); }24% { transform: scale(1.035); }36% { transform: scale(1); }100% { transform: scale(1); }}
        .pm-claim-breath{animation: pmClaimBreath 3s ease-in-out infinite;}
      `}</style>

      <WelcomeModal
        open={showWelcomeModal}
        amount={welcomeBonusAmount}
        onClose={() => {
          setShowWelcomeModal(false);
          try {
            sessionStorage.removeItem("pm_signup_welcome");
            localStorage.removeItem("pm_signup_welcome");
          } catch {}
        }}
      />

      <div className="mx-auto w-full max-w-sm space-y-2">
        <Block title="LIVE CLAIM">
          <div className="min-w-0">
            <div
              className="text-[10px]"
              style={{
                color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
              }}
            >
              {unauthorized ? "UNAUTHORIZED" : "TODAY INCREASE BALANCE"}
            </div>

            <div
              className="mt-2 flex max-w-full justify-center overflow-hidden text-center font-black tabular-nums whitespace-nowrap leading-none"
              style={{ color: "var(--pm-fg)", fontSize: streamFontSize }}
            >
              <OdometerText value={formattedStream} pulse={pulseStream} />
            </div>


            <div className="mt-3">
              <button
                type="button"
                onClick={handleClaimAll}
                disabled={!canClaim}
                className={[
                  "w-full select-none py-2 text-[12px] font-black",
                  "border active:scale-[0.99]",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                  canClaim ? "pm-claim-breath" : "",
                ].join(" ")}
                style={{
                  borderWidth: "0.5px",
                  borderColor: canClaim
                    ? "rgba(34,197,94,0.75)"
                    : "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
                  background: canClaim
                    ? "rgba(34,197,94,0.16)"
                    : "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
                  boxShadow: "none",
                  color: "var(--pm-fg)",
                }}
              >
                {cooldown > 0 ? (
                  <span className="inline-flex items-center justify-center gap-2 leading-none">
                    <span
                      className="text-2xl font-black tabular-nums leading-none"
                      style={{ color: "var(--pm-fg)" }}
                    >
                      <OdometerText
                        value={cdText}
                        pulse={pulseCd}
                        variant="plain"
                      />
                    </span>
                    <span
                      className="text-[11px] font-black tracking-widest"
                      style={{
                        color:
                          "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
                      }}
                    >
                      SECONDS WAIT FOR CLAIM
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    CLAIM MY BALANCE
                  </span>
                )}
              </button>
            </div>

            {unauthorized ? (
              <div
                className="mt-3 text-[10px]"
                style={{
                  color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
                }}
              >
                Please sign in to see your dashboard.
              </div>
            ) : null}
          </div>
        </Block>

        <Block title="LIVE STATUS">
          <div className="grid grid-cols-3 gap-2">
            <div className="border px-2 py-3 text-center" style={{ borderColor: "rgba(16,185,129,0.45)", background: "rgba(16,185,129,0.12)", boxShadow: "0 0 0 1px rgba(16,185,129,0.18) inset" }}>
              <div className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: "rgba(167,243,208,0.95)" }}>Running</div>
              <div className="mt-2 text-[1.45rem] font-black leading-none md:text-[1.6rem]" style={{ color: "var(--pm-fg)" }}>{runningCount}</div>
              <div className="mt-1 text-[9px] tracking-wide" style={{ color: "color-mix(in srgb, var(--pm-fg) 72%, transparent)" }}>Deposits</div>
            </div>
            <div className="border px-2 py-3 text-center" style={{ borderColor: "rgba(59,130,246,0.45)", background: "rgba(59,130,246,0.12)", boxShadow: "0 0 0 1px rgba(59,130,246,0.18) inset" }}>
              <div className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: "rgba(191,219,254,0.95)" }}>Rate</div>
              <div className="mt-2 text-[1.45rem] font-black leading-none md:text-[1.6rem]" style={{ color: "var(--pm-fg)" }}>{Number(interestPercent || 0)}%</div>
              <div className="mt-1 text-[9px] tracking-wide" style={{ color: "color-mix(in srgb, var(--pm-fg) 72%, transparent)" }}>Daily</div>
            </div>
            <div className="border px-2 py-3 text-center" style={{ borderColor: "rgba(234,179,8,0.45)", background: "rgba(234,179,8,0.12)", boxShadow: "0 0 0 1px rgba(234,179,8,0.18) inset" }}>
              <div className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: "rgba(254,240,138,0.95)" }}>Plan</div>
              <div className="mt-2 text-[1.45rem] font-black leading-none md:text-[1.6rem]" style={{ color: "var(--pm-fg)" }}>{planDays || 0}</div>
              <div className="mt-1 text-[9px] tracking-wide" style={{ color: "color-mix(in srgb, var(--pm-fg) 72%, transparent)" }}>Days</div>
            </div>
          </div>
        </Block>

        <Block title="SPEED">
          <div className="space-y-2">
            <Row
              icon={Timer}
              label="PER HOUR INCREASE"
              value={fmt2(speed.hourlyIncrease)}
            />
            <Row
              icon={CalendarDays}
              label="PER DAY INCREASE (24H)"
              value={fmt2(speed.dailyIncrease)}
            />
            <Row
              icon={Percent}
              label="DAILY RATE"
              value={fmtPercent2(interestPercent)}
            />
            <Row
              icon={CalendarDays}
              label="PLAN DAYS"
              value={`${Number(planDays || 0)} DAYS`}
            />
          </div>
        </Block>

        <Block title="STATS">
          <div className="space-y-2">
            <Row
              icon={TrendingUp}
              label="TODAY INCOME (LIVE)"
              valueNode={
                <span
                  className="font-black tabular-nums shrink-0"
                  style={{ color: "var(--pm-fg)" }}
                >
                  Tk
                  <OdometerText
                    value={formattedTodayIncomeLive}
                    pulse={pulseToday}
                  />
                </span>
              }
            />
            <Row
              icon={Activity}
              label="YESTERDAY INCOME"
              value={fmt2(stats.yesterdayIncome)}
            />
            <Row
              icon={PieChart}
              label="LAST 7 DAYS INCOME"
              value={fmt2(stats.last7DaysIncome)}
            />
            <Row
              icon={CalendarDays}
              label="LAST 30 DAYS INCOME"
              value={fmt2(stats.last30DaysIncome)}
            />
            <Row
              icon={Users}
              label="REFERRAL INCOME"
              value={fmt2(stats.referralIncome)}
            />
            <Row
              icon={ArrowDownToLine}
              label="TOTAL WITHDRAW"
              value={fmt2(stats.totalWithdraw)}
            />
            <Row
              icon={Users}
              label="TOTAL REFERRALS"
              value={`${stats.referrals}`}
            />
          </div>
        </Block>
      </div>
    </div>
  );
}