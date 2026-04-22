"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { OdometerText, useAnimatedCountdown } from "@/components/OdometerText";
import {
  Wallet,
  Clock,
  Smartphone,
  History,
  Receipt,
  Banknote,
  BadgeDollarSign,
  Layers,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";

const fmtBDT = (n) =>
  `Tk ${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtBDT0 = (n) => `Tk ${Number(n || 0).toFixed(0)}`;

function formatDateTime(d) {
  const dt = new Date(d);
  const date = dt.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const time = dt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} • ${time}`;
}

const methodLabel = (m) => {
  if (m === "bkash") return "bKash";
  if (m === "nagad") return "Nagad";
  if (m === "recharge") return "Mobile Recharge";
  return String(m || "").toUpperCase();
};

const typeLabel = (t) => {
  if (t === "personal") return "Personal";
  if (t === "agent") return "Agent";
  if (t === "merchant") return "Merchant";
  if (t === "gp") return "Grameen";
  if (t === "bl") return "Banglalink";
  if (t === "robi") return "Robi";
  if (t === "airtel") return "Airtel";
  if (t === "teletalk") return "Teletalk";
  return String(t || "").toUpperCase();
};

const statusBadge = (s) => {
  const k = String(s || "").toLowerCase();
  if (k === "successful" || k === "success")
    return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
  if (k === "pending")
    return "border-amber-400/25 bg-amber-500/10 text-amber-200";
  if (k === "reject" || k === "rejected")
    return "border-rose-400/25 bg-rose-500/10 text-rose-200";
  return "pm-soft-border pm-soft-bg pm-soft-text";
};

function Block({ title, children }) {
  return (
    <div
      className="border p-4 pm-soft-border pm-soft-bg"
      style={{ color: "var(--pm-fg)" }}
    >
      <div className="mb-2 text-[12px] font-bold tracking-widest uppercase pm-title">
        {title}
      </div>
      {children}
    </div>
  );
}

function Tag({ icon: Icon, text, className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 border px-3 py-1 text-[11px] font-black tracking-widest uppercase",
        "pm-soft-border pm-soft-bg pm-soft-text",
        className,
      ].join(" ")}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {text}
    </span>
  );
}

function MiniBox({ icon: Icon, label, value }) {
  return (
    <div
      className="border px-3 py-3 pm-soft-border pm-soft-bg"
      style={{ color: "var(--pm-fg)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase pm-muted min-w-0">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <span
          className="text-[11px] font-black tabular-nums shrink-0"
          style={{ color: "var(--pm-fg)" }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div
      className="flex items-center justify-between gap-3 border px-3 py-2 pm-soft-border pm-soft-bg"
      style={{ color: "var(--pm-fg)" }}
    >
      <div className="text-[10px] font-bold tracking-widest uppercase pm-muted">
        {label}
      </div>
      <div
        className="text-[11px] font-black tabular-nums truncate max-w-[65%] text-right"
        style={{ color: "var(--pm-fg)" }}
      >
        {value}
      </div>
    </div>
  );
}

function CountdownOdo({
  secondsLeft = 0,
  autoTick = false,
  fullSize = false,
  label = "COUNTDOWN",
}) {
  const [target, setTarget] = useState(() => new Date(Date.now() + Math.max(0, Number(secondsLeft || 0)) * 1000).toISOString());

  useEffect(() => {
    setTarget(new Date(Date.now() + Math.max(0, Number(secondsLeft || 0)) * 1000).toISOString());
  }, [secondsLeft, autoTick]);

  const { value, pulse } = useAnimatedCountdown(target);

  if (fullSize) {
    return (
      <div className="w-full">
        <div
          className="flex min-h-[124px] w-full flex-col items-center justify-center border px-4 py-5 text-center pm-soft-border pm-soft-bg"
          style={{ color: "var(--pm-fg)" }}
        >
          <div className="text-[10px] font-bold tracking-[0.32em] uppercase pm-muted">
            {label}
          </div>
          <div className="mt-3 text-[clamp(34px,10vw,56px)] font-black tabular-nums leading-none">
            <OdometerText value={value} pulse={pulse} durationBase={460} durationSpread={180} flashMs={520} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={["border px-3 py-2 pm-soft-border pm-soft-bg", label ? "" : "px-0 py-0 border-0 bg-transparent"].join(" ")}
      style={{ color: "var(--pm-fg)" }}
    >
      {label ? (
        <div className="text-[10px] font-bold tracking-widest uppercase pm-muted">
          {label}
        </div>
      ) : null}
      <div className={[label ? "mt-1 text-[24px]" : "text-[16px]", "font-black tabular-nums leading-none"].join(" ")}>
        <OdometerText value={value} pulse={pulse} durationBase={460} durationSpread={180} flashMs={520} />
      </div>
    </div>
  );
}

function LimitModal({ open, onClose, data }) {
  const [secLeft, setSecLeft] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSecLeft(Math.max(0, Number(data?.retryAfterSec || 0)));
  }, [open, data?.retryAfterSec]);

  useEffect(() => {
    if (!open) return;
    if (secLeft <= 0) return;
    const t = setInterval(() => setSecLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [open, secLeft]);

  if (!open) return null;

  const isAmount = data?.code === "LIMIT_AMOUNT_24H";
  const limitAmount = data?.dailyAmountLimit ?? null;
  const limitCount = data?.dailyWithdrawLimit ?? null;

  const usedAmount = Number(data?.usedAmount || 0);
  const usedCount = Number(data?.usedCount || 0);
  const tryAmount = Number(data?.tryAmount || 0);

  const headline = isAmount
    ? "Withdraw Amount Limit Reached"
    : "Withdraw Count Limit Reached";
  const subline =
    secLeft > 0
      ? "You can withdraw again when the timer hits 00:00:00."
      : "You can withdraw now.";

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/70" onClick={onClose} />
      <div className="fixed inset-0 z-[90] grid place-items-center px-4">
        <div
          className="w-full max-w-md border p-4 pm-soft-border"
          style={{ background: "var(--pm-bg)", color: "var(--pm-fg)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center border pm-soft-border pm-soft-bg">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <div
                    className="text-[12px] font-black tracking-widest uppercase"
                    style={{ color: "var(--pm-fg)" }}
                  >
                    {headline}
                  </div>
                  <div
                    className="mt-1 text-[11px]"
                    style={{
                      color:
                        "color-mix(in srgb, var(--pm-fg) 75%, transparent)",
                    }}
                  >
                    {subline}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="border p-2 active:scale-95 pm-soft-border pm-soft-bg"
              style={{ color: "var(--pm-fg)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            <div className="border p-3 pm-soft-border pm-soft-bg">
              <div className="text-[10px] font-bold tracking-widest uppercase pm-muted">
                LIVE STATUS
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div
                  className="text-[12px] font-black"
                  style={{ color: "var(--pm-fg)" }}
                >
                  Remaining time
                </div>
                <div
                  className="text-[12px] font-black tabular-nums"
                  style={{
                    color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
                  }}
                >
                  {secLeft > 0 ? "RUNNING" : "READY"}
                </div>
              </div>

              <div className="mt-3">
                <CountdownOdo secondsLeft={secLeft} />
              </div>
            </div>

            <div className="border p-3 pm-soft-border pm-soft-bg">
              <div className="text-[10px] font-bold tracking-widest uppercase pm-muted">
                LIMIT DETAILS (PENDING + SUCCESS • LAST 24H)
              </div>

              <div className="mt-2 space-y-2">
                {isAmount ? (
                  <>
                    <KV
                      label="MAX (LAST 24H)"
                      value={
                        limitAmount === null
                          ? "Unlimited"
                          : fmtBDT0(limitAmount)
                      }
                    />
                    <KV label="USED (LAST 24H)" value={fmtBDT0(usedAmount)} />
                    <KV label="YOUR REQUEST" value={fmtBDT0(tryAmount)} />
                    <KV
                      label="WILL EXCEED"
                      value={
                        limitAmount === null
                          ? "No"
                          : usedAmount + tryAmount > Number(limitAmount)
                            ? "Yes"
                            : "No"
                      }
                    />
                  </>
                ) : (
                  <>
                    <KV
                      label="MAX (LAST 24H)"
                      value={
                        limitCount === null ? "Unlimited" : String(limitCount)
                      }
                    />
                    <KV label="USED (LAST 24H)" value={String(usedCount)} />
                    <KV label="NEXT REQUEST" value="1" />
                    <KV
                      label="WILL EXCEED"
                      value={
                        limitCount === null
                          ? "No"
                          : usedCount + 1 > Number(limitCount)
                            ? "Yes"
                            : "No"
                      }
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full border py-3 text-[12px] font-black tracking-widest uppercase pm-soft-border pm-soft-bg active:scale-[0.99]"
            style={{ color: "var(--pm-fg)" }}
          >
            OK
          </button>
        </div>
      </div>
    </>
  );
}

export default function WithdrawPage() {
  const METHOD_OPTIONS = [
    { k: "bkash", label: "BKASH" },
    { k: "nagad", label: "NAGAD" },
    { k: "recharge", label: "RECHARGE" },
  ];
  const STANDARD_TYPES = [
    { k: "personal", label: "PERSONAL", title: "Personal account" },
    { k: "agent", label: "AGENT", title: "Agent account" },
    { k: "merchant", label: "MERCHANT", title: "Merchant account" },
  ];
  const RECHARGE_TYPES = [
    { k: "gp", label: "GP", title: "Grameenphone" },
    { k: "bl", label: "BL", title: "Banglalink" },
    { k: "robi", label: "RB", title: "Robi" },
    { k: "airtel", label: "AT", title: "Airtel" },
    { k: "teletalk", label: "TT", title: "Teletalk" },
  ];

  const [metaLoading, setMetaLoading] = useState(true);
  const [meta, setMeta] = useState({
    withdrawFee: 0,
    minWithdraw: 0,
    maxWithdraw: null,
    rechargeMinWithdraw: 20,
    rechargeMaxWithdraw: null,
    methodLimits: {
      bkash: { min: 0, max: null },
      nagad: { min: 0, max: null },
      recharge: { min: 20, max: null },
    },
    dailyWithdrawLimit: null,
    dailyAmountLimit: null,
    etaText: "5–30 minutes",
    usedWithdrawCount24h: 0,
    usedWithdrawAmount24h: 0,
    retryAfterSec: 0,
    resetAt: null,
  });

  const [balLoading, setBalLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [items, setItems] = useState([]);
  const [limitOpen, setLimitOpen] = useState(false);
  const [limitData, setLimitData] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [accountType, setAccountType] = useState("personal");
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadMeta = async () => {
    try {
      setMetaLoading(true);
      const res = await fetch("/api/user/withdraw-meta", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.message || "Failed to load settings");
        return;
      }
      setMeta((p) => ({ ...p, ...(j?.data || {}) }));
    } catch {
      toast.error("Network error while loading settings");
    } finally {
      setMetaLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      setBalLoading(true);
      const res = await fetch("/api/user/balance", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBalance(0);
        return;
      }
      setBalance(Number(j?.data?.balance || 0));
    } catch {
      setBalance(0);
    } finally {
      setBalLoading(false);
    }
  };

  const loadHistory = async ({ reset = false, add = 0 } = {}) => {
    const current = reset ? 0 : items.length;
    const limit = reset ? 5 : add || 10;
    try {
      if (reset) setHistoryLoading(true);
      else setLoadingMore(true);
      const res = await fetch(
        `/api/user/withdraw-history?skip=${current}&limit=${limit}`,
        { method: "GET", credentials: "include" },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.message || "Failed to load history");
        return;
      }
      const got = Array.isArray(j?.data?.items) ? j.data.items : [];
      setHasMore(Boolean(j?.data?.hasMore));
      setItems((p) => (reset ? got : [...p, ...got]));
    } catch {
      toast.error("Network error while loading history");
    } finally {
      if (reset) setHistoryLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      await loadMeta();
      if (!alive) return;
      await loadBalance();
      if (!alive) return;
      await loadHistory({ reset: true });
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (paymentMethod === "recharge") {
      if (!["gp", "bl", "robi", "airtel", "teletalk"].includes(accountType))
        setAccountType("gp");
    } else if (!["personal", "agent", "merchant"].includes(accountType)) {
      setAccountType("personal");
    }
  }, [paymentMethod, accountType]);

  const methodMeta = meta?.methodLimits?.[paymentMethod] || {
    min: paymentMethod === "recharge" ? 20 : Number(meta.minWithdraw || 0),
    max:
      paymentMethod === "recharge"
        ? meta.rechargeMaxWithdraw
        : meta.maxWithdraw,
  };
  const minW = Number(methodMeta?.min || 0);
  const maxW =
    methodMeta?.max === null || methodMeta?.max === undefined
      ? null
      : Number(methodMeta.max);
  const mobileDigits = useMemo(() => mobile.replace(/\D/g, ""), [mobile]);
  const amountNum = useMemo(() => Number(amount || 0), [amount]);
  const feePercent = paymentMethod === "recharge" ? 0 : Number(meta.withdrawFee || 0);
  const feeAmount = useMemo(
    () =>
      !Number.isFinite(amountNum) || amountNum <= 0
        ? 0
        : Number(((amountNum * feePercent) / 100).toFixed(2)),
    [amountNum, feePercent],
  );
  const receiveAmount = useMemo(() => (!Number.isFinite(amountNum) || amountNum <= 0 ? 0 : Number(amountNum.toFixed(2))), [amountNum]);
  const totalDebit = useMemo(() => (!Number.isFinite(amountNum) || amountNum <= 0 ? 0 : Number((amountNum + feeAmount).toFixed(2))), [amountNum, feeAmount]);
  const validMobile = /^01\d{9}$/.test(mobileDigits);
  const validAmount =
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    (minW ? amountNum >= minW : true) &&
    (maxW !== null ? amountNum <= maxW : true) &&
    totalDebit <= Number(balance || 0);
  const canSubmit = validMobile && validAmount && !submitting;
  const inputBase =
    "w-full border px-4 py-3 text-sm outline-none placeholder:opacity-60 focus:ring-4 pm-soft-border pm-soft-bg pm-soft-text";
  const ETA_TEXT = meta.etaText || "5–30 minutes";
  const usedCount = Number(meta.usedWithdrawCount24h || 0);
  const usedAmount = Number(meta.usedWithdrawAmount24h || 0);
  const remainingCount =
    meta.dailyWithdrawLimit === null
      ? null
      : Math.max(0, Number(meta.dailyWithdrawLimit || 0) - usedCount);
  const remainingAmount =
    meta.dailyAmountLimit === null
      ? null
      : Math.max(0, Number(meta.dailyAmountLimit || 0) - usedAmount);
  const countLimitReached =
    meta.dailyWithdrawLimit !== null &&
    usedCount >= Number(meta.dailyWithdrawLimit || 0);
  const amountLimitReached =
    meta.dailyAmountLimit !== null &&
    usedAmount >= Number(meta.dailyAmountLimit || 0);
  const countProgress =
    meta.countProgress === null || meta.countProgress === undefined
      ? (meta.dailyWithdrawLimit === null ? null : Math.max(0, Math.min(100, (usedCount / Math.max(1, Number(meta.dailyWithdrawLimit || 0))) * 100)))
      : Number(meta.countProgress || 0);
  const amountProgress =
    meta.amountProgress === null || meta.amountProgress === undefined
      ? (meta.dailyAmountLimit === null ? null : Math.max(0, Math.min(100, (usedAmount / Math.max(1, Number(meta.dailyAmountLimit || 0))) * 100)))
      : Number(meta.amountProgress || 0);
  const selectedTypeOptions =
    paymentMethod === "recharge" ? RECHARGE_TYPES : STANDARD_TYPES;

  const setAllAmount = () => {
    const cap =
      maxW !== null
        ? Math.min(Number(balance || 0), Number(maxW || 0))
        : Number(balance || 0);
    setAmount(String(Number(cap || 0).toFixed(2)));
  };

  const openLimitModal = (payload) => {
    setLimitData(payload || null);
    setLimitOpen(true);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (!validMobile)
        toast.error("Mobile must be 11 digits and start with 01");
      else if (totalDebit > Number(balance || 0))
        toast.error(`You need ${fmtBDT(totalDebit)} balance`);
      else if (amountNum < minW)
        toast.error(`Minimum withdraw is Tk ${Number(minW || 0).toFixed(0)}`);
      else if (maxW !== null && amountNum > maxW)
        toast.error(`Maximum withdraw is Tk ${Number(maxW || 0).toFixed(0)}`);
      else toast.error("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: amountNum,
          paymentMethod,
          accountType,
          mobile: mobileDigits,
          note: note.trim(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (j?.code === "LIMIT_AMOUNT_24H" || j?.code === "LIMIT_COUNT_24H") {
          openLimitModal({ ...j?.data, code: j?.code });
          await loadMeta();
          return;
        }
        toast.error(j?.message || "Withdraw failed");
        return;
      }
      toast.success(j?.message || "Withdraw request successful");
      setAmount("");
      setNote("");
      await loadMeta();
      await loadBalance();
      await loadHistory({ reset: true });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-6 font-mono pt-16 md:pt-6 pm-withdraw-scope"
      style={{ background: "var(--pm-bg-grad)", color: "var(--pm-fg)" }}
    >
      <style>{`
        .pm-withdraw-scope .pm-soft-border{border-color: color-mix(in srgb, var(--pm-fg) 30%, transparent) !important;}
        .pm-withdraw-scope .pm-soft-bg{background: color-mix(in srgb, var(--pm-fg) 10%, transparent) !important;}
        .pm-withdraw-scope .pm-soft-text{color: color-mix(in srgb, var(--pm-fg) 88%, transparent) !important;}
        .pm-withdraw-scope .pm-muted{color: color-mix(in srgb, var(--pm-fg) 70%, transparent) !important;}
        .pm-withdraw-scope .pm-title{color: color-mix(in srgb, var(--pm-fg) 92%, transparent) !important;}
        .pm-odo{display:inline-flex;align-items:baseline;gap:1px;font-variant-numeric:tabular-nums;line-height:1;}
        .pm-odo-sep{font-size:1em;opacity:.95;margin:0 1px;}
        .pm-odo-col{display:inline-block;width:.78em;height:1.05em;overflow:hidden;position:relative;vertical-align:bottom;background: rgba(255,255,255,0.10);box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10);}
        @supports (color: color-mix(in srgb, black, white)) {.pm-odo-col{background: color-mix(in srgb, var(--pm-fg) 10%, transparent);box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pm-fg) 14%, transparent);}}
        .pm-odo-strip{display:flex;flex-direction:column;transform: translateY(calc(-1 * var(--pm-odo-y)));transition: transform var(--pm-odo-ms) cubic-bezier(.18,.86,.25,1);will-change: transform;}
        .pm-odo-strip > span{height:1.05em;display:grid;place-items:center;font-weight:900;line-height:1;}
        @keyframes pmFlash {0%{background: rgba(255,255,255,0.10);}40%{background: rgba(16,185,129,0.18);}100%{background: rgba(255,255,255,0.10);}}
        @supports (color: color-mix(in srgb, black, white)) {@keyframes pmFlash {0%{background: color-mix(in srgb, var(--pm-fg) 10%, transparent);}40%{background: rgba(16,185,129,0.18);}100%{background: color-mix(in srgb, var(--pm-fg) 10%, transparent);}}}
        .pm-odo-flash{animation: pmFlash 320ms ease-out;}
      `}</style>

      <LimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        data={limitData}
      />

      <div className="mx-auto w-full max-w-md space-y-3">
        <Block title="WITHDRAW REQUEST">
          <div className="flex items-center justify-between">
            <div
              className="text-[12px] font-black tracking-widest uppercase"
              style={{ color: "var(--pm-fg)" }}
            >
              FORM
            </div>
            <Tag icon={Layers} text="24H LIMIT" />
          </div>

          <div className="mt-3 space-y-3">
         <div className="border p-3 pm-soft-border pm-soft-bg">
  <div className="mb-2 text-[11px] font-bold tracking-widest uppercase pm-muted">
    PAYMENT METHOD
  </div>

  <div className="grid grid-cols-3 gap-2">
    {METHOD_OPTIONS.map((m) => {
      const limits = meta?.methodLimits?.[m.k] || { min: 0, max: null };
      const minText = `MIN Tk ${Number(limits?.min || 0).toFixed(0)}`;

      return (
        <div key={m.k} className="min-w-0 space-y-1">
          <div className="w-full border px-1 py-1 text-center text-[8px] font-medium tracking-[0.12em] uppercase pm-soft-border pm-soft-bg pm-muted rounded-none">
            {minText}
          </div>

          <button
            type="button"
            onClick={() => setPaymentMethod(m.k)}
            className={[
              "w-full border px-2 py-3 text-[10px] font-black tracking-widest uppercase rounded-none active:scale-[0.99]",
              paymentMethod === m.k
                ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                : "pm-soft-border pm-soft-bg pm-soft-text",
            ].join(" ")}
          >
            {m.label}
          </button>
        </div>
      );
    })}
  </div>
</div>

            <div className="border p-3 pm-soft-border pm-soft-bg">
              <div className="mb-2 text-[11px] font-bold tracking-widest uppercase pm-muted">
                ACCOUNT TYPE
              </div>

              <div
                className={`grid gap-2 ${
                  paymentMethod === "recharge" ? "grid-cols-5" : "grid-cols-3"
                }`}
              >
                {selectedTypeOptions.map((t) => (
                  <div key={t.k} className="min-w-0 space-y-1">
                    {paymentMethod === "recharge" ? (
                      <div className="w-full border px-1 py-1 text-center text-[7px] font-medium tracking-[0.06em] uppercase pm-soft-border pm-soft-bg pm-muted rounded-none truncate">
                        {t.title}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      title={t.title}
                      onClick={() => setAccountType(t.k)}
                      className={[
                        "w-full border px-1 py-3 text-[10px] font-black tracking-widest uppercase rounded-none active:scale-[0.99]",
                        accountType === t.k
                          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                          : "pm-soft-border pm-soft-bg pm-soft-text",
                      ].join(" ")}
                    >
                      {t.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border p-3 pm-soft-border pm-soft-bg">
              <div className="mb-2 text-[11px] font-bold tracking-widest uppercase pm-muted">
                MOBILE NUMBER (11 DIGITS)
              </div>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={11}
                placeholder="01XXXXXXXXX"
                value={mobileDigits}
                onChange={(e) =>
                  setMobile(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                className={inputBase}
              />
              <div className="mt-2 text-[11px] pm-soft-text inline-flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                {mobileDigits.length}/11{" "}
                {validMobile ? "" : "• must start with 01"}
              </div>
            </div>

            <div className="border p-3 pm-soft-border pm-soft-bg">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-[11px] font-bold tracking-widest uppercase pm-muted">
                  WITHDRAW AMOUNT
                </div>
                <div className="text-[10px] font-black tracking-widest uppercase pm-soft-text">
                  {maxW === null
                    ? `MIN ${fmtBDT0(minW)}`
                    : `${fmtBDT0(minW)} → ${fmtBDT0(maxW)}`}
                </div>
              </div>
              <input
                type="number"
                placeholder={`min ${minW}${maxW !== null ? `, max ${maxW}` : ""}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputBase}
              />
              <div className="mt-2 grid grid-cols-5 gap-2">
                {[20, 50, 100, 200].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAmount(String(c))}
                    className="border px-2 py-3 text-[11px] font-black tracking-widest uppercase pm-soft-border pm-soft-bg active:scale-[0.99]"
                    style={{ color: "var(--pm-fg)" }}
                  >
                    {c}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={setAllAmount}
                  className="border px-2 py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                >
                  ALL
                </button>
              </div>

              <div className="mt-3 border p-3 pm-soft-border pm-soft-bg">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-bold tracking-widest uppercase pm-muted">
                    FEE ({Number(meta.withdrawFee || 0)}%)
                  </div>
                  <div
                    className="text-[12px] font-black tabular-nums"
                    style={{ color: "var(--pm-fg)" }}
                  >
                    {fmtBDT(feeAmount)}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-[11px] font-bold tracking-widest uppercase pm-muted">
                    YOU RECEIVE
                  </div>
                  <div
                    className="text-[12px] font-black tabular-nums"
                    style={{ color: "var(--pm-fg)" }}
                  >
                    {fmtBDT(receiveAmount)}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-[11px] font-bold tracking-widest uppercase pm-muted">TOTAL BALANCE DEDUCT</div>
                  <div className="text-[12px] font-black tabular-nums" style={{ color: "var(--pm-fg)" }}>{fmtBDT(totalDebit)}</div>
                </div>
                {totalDebit > Number(balance || 0) ? (
                  <div className="mt-2 text-[11px] text-rose-200 font-bold">
                    Balance is not enough.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border p-3 pm-soft-border pm-soft-bg">
              <div className="mb-2 text-[11px] font-bold tracking-widest uppercase pm-muted">
                NOTE (OPTIONAL, 100 CHAR)
              </div>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 100))}
                placeholder="Example: urgent, please update if number is wrong..."
                className={inputBase + " resize-none"}
              />
              <div className="mt-2 text-[11px] pm-muted">{note.length}/100</div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full border py-3 text-sm font-black tracking-widest uppercase hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                borderColor: canSubmit
                  ? "rgba(16,185,129,0.35)"
                  : "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
                background: canSubmit
                  ? "rgba(16,185,129,0.18)"
                  : "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
                color: canSubmit ? "rgb(167 243 208)" : "var(--pm-fg)",
              }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    PROCESSING <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  "REQUEST WITHDRAW"
                )}
              </span>
            </button>
          </div>
        </Block>

        <Block title="LIMIT STATUS">
          <div className="grid gap-2">
            <KV
              label="USED COUNT (24H)"
              value={
                meta.dailyWithdrawLimit === null
                  ? `${usedCount} / Unlimited`
                  : `${usedCount} / ${Number(meta.dailyWithdrawLimit || 0)}`
              }
            />
            {countProgress !== null ? (
              <div className="border p-3 pm-soft-border pm-soft-bg">
                <div className="flex items-center justify-between gap-3 text-[10px] font-bold tracking-widest uppercase">
                  <span className="pm-muted">Count Progress</span>
                  <span style={{ color: "var(--pm-fg)" }}>{Math.round(countProgress)}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden border pm-soft-border" style={{ background: "color-mix(in srgb, var(--pm-fg) 8%, transparent)" }}>
                  <div className="h-full" style={{ width: `${Math.max(0, Math.min(100, countProgress))}%`, background: "rgb(34 197 94)" }} />
                </div>
              </div>
            ) : null}
            <KV
              label="USED AMOUNT (24H)"
              value={
                meta.dailyAmountLimit === null
                  ? `${fmtBDT0(usedAmount)} / Unlimited`
                  : `${fmtBDT0(usedAmount)} / ${fmtBDT0(meta.dailyAmountLimit || 0)}`
              }
            />
            {amountProgress !== null ? (
              <div className="border p-3 pm-soft-border pm-soft-bg">
                <div className="flex items-center justify-between gap-3 text-[10px] font-bold tracking-widest uppercase">
                  <span className="pm-muted">Amount Progress</span>
                  <span style={{ color: "var(--pm-fg)" }}>{Math.round(amountProgress)}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden border pm-soft-border" style={{ background: "color-mix(in srgb, var(--pm-fg) 8%, transparent)" }}>
                  <div className="h-full" style={{ width: `${Math.max(0, Math.min(100, amountProgress))}%`, background: "rgb(34 197 94)" }} />
                </div>
              </div>
            ) : null}
            <KV
              label="REMAINING COUNT"
              value={
                remainingCount === null ? "Unlimited" : String(remainingCount)
              }
            />
            <KV
              label="REMAINING AMOUNT"
              value={
                remainingAmount === null
                  ? "Unlimited"
                  : fmtBDT0(remainingAmount)
              }
            />
          </div>
          {countLimitReached || amountLimitReached ? (
            <div className="mt-3 border p-3 pm-soft-border pm-soft-bg">
              <div className="text-[10px] font-bold tracking-widest uppercase pm-muted">
                LIMIT TIMER
              </div>
              <div className="mt-3">
                <CountdownOdo secondsLeft={Number(meta.retryAfterSec || 0)} autoTick fullSize label="LIMIT COUNTDOWN" />
              </div>
              <div className="mt-2 text-[11px] pm-soft-text">
                Your last 24-hour limit is fully used. Pending and successful requests are counted until the timer ends.
              </div>
            </div>
          ) : (
            <div className="mt-3 text-[11px] pm-soft-text">
              Your last 24-hour pending and successful requests are within the limit.
            </div>
          )}
        </Block>

        <Block title="WALLET OVERVIEW">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] pm-muted">CURRENT BALANCE</div>
              <div
                className="mt-2 flex items-end gap-2 text-[30px] font-black tabular-nums whitespace-nowrap leading-none"
                style={{ color: "var(--pm-fg)" }}
              >
                <span className="leading-none">{fmtBDT(balance)}</span>
                {balLoading ? (
                  <span className="text-[11px] pm-muted">Loading...</span>
                ) : null}
              </div>
              <div className="mt-2 text-[11px] pm-soft-text">
                Selected method:{" "}
                <span className="font-black" style={{ color: "var(--pm-fg)" }}>
                  {methodLabel(paymentMethod)}
                </span>{" "}
                • Type:{" "}
                <span className="font-black" style={{ color: "var(--pm-fg)" }}>
                  {typeLabel(accountType)}
                </span>
              </div>
            </div>
            <Wallet
              className="h-6 w-6 shrink-0"
              style={{
                color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
              }}
            />
          </div>
          <div className="mt-3 space-y-2">
            <MiniBox
              icon={Receipt}
              label="FEE"
              value={paymentMethod === "recharge" ? "0%" : `${Number(meta.withdrawFee || 0)}%`}
            />
            <MiniBox
              icon={Banknote}
              label="MIN WITHDRAW"
              value={fmtBDT0(minW || 0)}
            />
            <MiniBox
              icon={BadgeDollarSign}
              label="MAX WITHDRAW"
              value={maxW === null ? "Unlimited" : fmtBDT0(maxW)}
            />
            <MiniBox
              icon={Layers}
              label="COUNT LIMIT (24H)"
              value={
                meta.dailyWithdrawLimit === null
                  ? "Unlimited"
                  : String(meta.dailyWithdrawLimit)
              }
            />
            <MiniBox
              icon={BadgeDollarSign}
              label="AMOUNT LIMIT (24H)"
              value={
                meta.dailyAmountLimit === null
                  ? "Unlimited"
                  : fmtBDT0(meta.dailyAmountLimit)
              }
            />
            <MiniBox icon={Clock} label="PROCESSING ETA" value={ETA_TEXT} />
          </div>
          {metaLoading ? (
            <div className="mt-2 text-[11px] pm-muted">Loading settings...</div>
          ) : null}
        </Block>

        <Block title="WITHDRAW HISTORY">
          <div className="flex items-center justify-between">
            <div
              className="inline-flex items-center gap-2 text-[12px] font-black tracking-widest uppercase"
              style={{ color: "var(--pm-fg)" }}
            >
              <History className="h-4 w-4" /> RECORDS
            </div>
            <Tag text={historyLoading ? "..." : String(items.length)} />
          </div>
          <div className="mt-3 space-y-2">
            {historyLoading ? (
              <div className="border px-3 py-3 text-[12px] pm-soft-border pm-soft-bg pm-soft-text">
                Loading history...
              </div>
            ) : !items.length ? (
              <div className="border px-3 py-3 text-[12px] pm-soft-border pm-soft-bg pm-soft-text">
                No withdraw history found.
              </div>
            ) : (
              items.map((h) => (
                <div
                  key={h._id}
                  className="border p-4 pm-soft-border pm-soft-bg"
                  style={{ color: "var(--pm-fg)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="text-[11px] font-black tabular-nums"
                      style={{ color: "var(--pm-fg)" }}
                    >
                      {fmtBDT(h.amount)}
                    </div>
                    <span
                      className={[
                        "shrink-0 border px-3 py-1 text-[10px] font-black tracking-widest uppercase",
                        statusBadge(h.status),
                      ].join(" ")}
                    >
                      {String(h.status || "pending").toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <KV label="NUMBER" value={h.mobile} />
                    <KV label="METHOD" value={methodLabel(h.paymentMethod)} />
                    <KV label="TYPE" value={typeLabel(h.accountType)} />
                    <KV label="NOTE" value={h.note ? h.note : "—"} />
                    <KV label="TIME" value={formatDateTime(h.createdAt)} />
                    {(["pending", "processing"].includes(String(h.status || "").toLowerCase()) && h.processingExpiresAt) ? (
                      <div className="pt-1">
                        <div className="flex items-center justify-between gap-3 border px-3 py-2 pm-soft-border pm-soft-bg" style={{ color: "var(--pm-fg)" }}>
                          <div className="text-[10px] font-bold tracking-widest uppercase pm-muted">TIMER</div>
                          <div className="inline-flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <CountdownOdo secondsLeft={Math.max(0, Math.floor((new Date(h.processingExpiresAt).getTime() - Date.now()) / 1000))} autoTick label={null} />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {h.paymentProof ? (
                    <div className="mt-3 border p-2 pm-soft-border pm-soft-bg">
                      <div className="text-[10px] font-bold tracking-widest uppercase pm-muted mb-2">
                        PAYMENT PROOF
                      </div>
                      <div
                        className="aspect-square w-full overflow-hidden border pm-soft-border"
                        style={{
                          background:
                            "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
                        }}
                      >
                        <img
                          src={h.paymentProof}
                          alt="payment proof"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}
            {!historyLoading && hasMore ? (
              <button
                type="button"
                onClick={() => loadHistory({ reset: false, add: 10 })}
                disabled={loadingMore}
                className="w-full border py-3 text-sm font-black tracking-widest uppercase hover:brightness-110 active:scale-[0.99] disabled:opacity-60 pm-soft-border pm-soft-bg"
                style={{ color: "var(--pm-fg)" }}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {loadingMore ? (
                    <>
                      LOADING <Loader2 className="h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    "SEE MORE"
                  )}
                </span>
              </button>
            ) : null}
          </div>
        </Block>
      </div>
    </div>
  );
}
