"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { FiCopy, FiX, FiCheckCircle, FiLayers, FiFileText, FiClock, FiAlertTriangle } from "react-icons/fi";
import { OdometerStyles, OdometerText, useAnimatedCountdown } from "@/components/OdometerText";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

const fmtBDT0 = (n) => `Tk ${Number(n || 0).toFixed(0)}`;
const onlyDigits = (v) => String(v || "").replace(/\D/g, "");

async function copyText(txt) {
  const value = String(txt || "");
  if (!value) throw new Error("EMPTY");
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {}
  const ta = document.createElement("textarea");
  ta.value = value;
  ta.setAttribute("readonly", "true");
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  ta.style.left = "-9999px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, ta.value.length);
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  if (!ok) throw new Error("EXEC_COPY_FAILED");
  return true;
}

function statusPillClass(s) {
  const st = String(s || "").toLowerCase();
  if (st === "success") return "border-emerald-300/40 bg-emerald-500/15 text-emerald-100";
  if (st === "processing" || st === "pending") return "border-amber-300/40 bg-amber-500/15 text-amber-100";
  if (st === "reject" || st === "rejected") return "border-rose-300/40 bg-rose-500/15 text-rose-100";
  return "";
}

function formatDateTime(d) {
  const dt = new Date(d);
  const date = dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const time = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${date} • ${time}`;
}


function Block({ title, children }) {
  return (
    <div
      className="border p-4"
      style={{
        borderColor: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
        background: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
        color: "var(--pm-fg)",
      }}
    >
      <div
        className="mb-2 text-[12px] font-bold tracking-widest uppercase"
        style={{ color: "color-mix(in srgb, var(--pm-fg) 92%, transparent)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Modal({ open, onClose, title, children, closable = true }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/70" onClick={closable ? onClose : undefined} aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2">
        <div
          className="relative border shadow-2xl"
          style={{
            borderColor: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
            background: "var(--pm-bg)",
            color: "var(--pm-fg)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in srgb, var(--pm-fg) 10%, transparent), transparent 60%, transparent)",
            }}
          />
          <div
            className="relative flex items-center justify-between gap-3 border-b px-4 py-3"
            style={{
              borderColor: "color-mix(in srgb, var(--pm-fg) 25%, transparent)",
              background: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
            }}
          >
            <div className="min-w-0">
              <div className="text-[12px] font-black tracking-widest uppercase truncate">{title}</div>
            </div>
            {closable ? (
              <button
                type="button"
                onClick={onClose}
                className="border p-2 active:scale-[0.99]"
                style={{
                  borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
                  background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
                  color: "var(--pm-fg)",
                }}
                aria-label="Close"
              >
                <FiX className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="relative p-4" style={{ color: "var(--pm-fg)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyLine({ label, value, copyValue }) {
  return (
    <div
      className="flex items-stretch justify-between gap-2 border px-3 py-3"
      style={{
        borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
        background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
        color: "var(--pm-fg)",
      }}
    >
      <div className="min-w-0">
        <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>
          {label}
        </div>
        <div className="mt-1 text-[12px] font-black truncate tabular-nums" style={{ color: "var(--pm-fg)" }}>
          {value || "—"}
        </div>
      </div>
      <button
        type="button"
        onClick={async () => {
          const v = String(copyValue ?? value ?? "");
          if (!v) return toast.error("Not set");
          try {
            await copyText(v);
            toast.success("Copied");
          } catch {
            toast.error("Copy failed");
          }
        }}
        className="shrink-0 inline-flex items-center gap-2 border px-3 active:scale-[0.99]"
        style={{
          borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
          background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
          color: "var(--pm-fg)",
        }}
      >
        <FiCopy className="h-4 w-4" />
        <span className="text-[11px] font-black tracking-widest uppercase">Copy</span>
      </button>
    </div>
  );
}

function SegBtn({ active, label, onClick }) {
  const isBkash = String(label || "").toUpperCase() === "BKASH";
  const isNagad = String(label || "").toUpperCase() === "NAGAD";

  const activeCls = isBkash
    ? "border-pink-300/60 bg-pink-500/20 text-pink-50"
    : isNagad
    ? "border-amber-300/60 bg-amber-600/20 text-amber-50"
    : "";

  const idleCls = isBkash
    ? "border-pink-300/30 bg-pink-500/10 text-pink-100/80 hover:bg-pink-500/15"
    : isNagad
    ? "border-amber-300/30 bg-amber-600/10 text-amber-100/80 hover:bg-amber-600/15"
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "border px-3 py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] transition",
        isBkash || isNagad ? (active ? activeCls : idleCls) : "",
      ].join(" ")}
      style={
        isBkash || isNagad
          ? undefined
          : {
              borderColor: active
                ? "color-mix(in srgb, var(--pm-fg) 55%, transparent)"
                : "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
              background: active
                ? "color-mix(in srgb, var(--pm-fg) 18%, transparent)"
                : "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
              color: active ? "var(--pm-fg)" : "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
            }
      }
    >
      {label}
    </button>
  );
}

function VerifyOption({ id, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className="border px-3 py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] text-left transition"
      style={{
        borderColor: active
          ? "color-mix(in srgb, var(--pm-fg) 55%, transparent)"
          : "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
        background: active
          ? "color-mix(in srgb, var(--pm-fg) 18%, transparent)"
          : "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
        color: active ? "var(--pm-fg)" : "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
      }}
    >
      {label}
    </button>
  );
}

function KV({ label, value }) {
  return (
    <div
      className="flex items-center justify-between gap-3 border px-3 py-2"
      style={{
        borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
        background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
        color: "var(--pm-fg)",
      }}
    >
      <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>
        {label}
      </div>
      <div className="text-[11px] font-black tabular-nums truncate max-w-[62%] text-right" style={{ color: "var(--pm-fg)" }}>
        {value}
      </div>
    </div>
  );
}

function CountdownBadge({ target, compact = false }) {
  const { value, pulse, totalMs } = useAnimatedCountdown(target);
  return (
    <div
      className={["relative overflow-hidden border", compact ? "px-3 py-2" : "px-3 py-2.5"].join(" ")}
      style={{
        borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
        background: totalMs > 0 ? "color-mix(in srgb, var(--pm-fg) 12%, transparent)" : "color-mix(in srgb, var(--pm-fg) 7%, transparent)",
        color: "var(--pm-fg)",
      }}
    >
      <div className="absolute inset-y-0 left-0 w-20" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--pm-fg) 8%, transparent), transparent)" }} />
      <div className="relative flex items-center justify-between gap-3">
        <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 72%, transparent)" }}>
          TIMER
        </div>
        <div className="flex items-center gap-2 text-[15px] font-black tracking-[0.10em] tabular-nums leading-none">
          <FiClock className="h-4 w-4 shrink-0" />
          <OdometerText value={value} pulse={pulse} durationBase={460} durationSpread={180} flashMs={520} />
        </div>
      </div>
    </div>
  );
}

function DepositHistoryCard({ row, onOpenShot }) {
  const statusCls = statusPillClass(row.status);
  const isColored = !!statusCls;
  const via = String(row.verifyVia || "").toLowerCase();
  const shot = String(row.screenshotUrl || "").trim();
  const showShot = via === "screenshot" && !!shot;
  const showTimer = String(row.status || "").toLowerCase() === "processing" && !!row.processingExpiresAt;

  return (
    <div
      className="border p-4"
      style={{
        borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
        background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
        color: "var(--pm-fg)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-black truncate" style={{ color: "var(--pm-fg)" }}>
            {row.userName || "User"}{" "}
            <span style={{ color: "color-mix(in srgb, var(--pm-fg) 60%, transparent)" }}>•</span>{" "}
            <span style={{ color: "color-mix(in srgb, var(--pm-fg) 85%, transparent)" }}>#{row.userId || "—"}</span>
          </div>
          <div className="mt-1 text-[11px] truncate" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>
            {formatDateTime(row.createdAt)}
          </div>
        </div>

        <span
          className={[
            "shrink-0 inline-flex items-center gap-2 border px-3 py-1 text-[10px] font-black tracking-widest uppercase",
            statusCls,
          ].join(" ")}
          style={
            isColored
              ? undefined
              : {
                  borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
                  background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
                  color: "color-mix(in srgb, var(--pm-fg) 80%, transparent)",
                }
          }
        >
          <FiFileText className="h-4 w-4" />
          {String(row.status || "processing").toUpperCase()}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <KV label="MOBILE" value={row.mobile || "—"} />
        <KV label="METHOD" value={row.method || "—"} />
        <KV label="AMOUNT" value={fmtBDT0(row.amount)} />
        <KV label="VERIFY VIA" value={row.verifyVia || "—"} />
        {showTimer ? <CountdownBadge target={row.processingExpiresAt} /> : null}
      </div>

      {showShot ? (
        <div
          className="mt-3 border px-3 py-3"
          style={{
            borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
            background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
            color: "var(--pm-fg)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-14 w-14 overflow-hidden border" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 25%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 8%, transparent)" }}>
                <img src={shot} alt="preview" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>
                  REVIEW
                </div>
                <div className="mt-1 text-[11px] font-black truncate" style={{ color: "var(--pm-fg)" }}>
                  Screenshot
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenShot?.(shot)}
              className="shrink-0 border px-4 py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
              style={{
                borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
                background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
                color: "var(--pm-fg)",
              }}
            >
              FULL SCREEN
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Deposit() {
  const pathname = usePathname();
  const isAgentPanel = String(pathname || "").startsWith("/agent");
  const panelTitle = isAgentPanel ? "AGENT DEPOSIT" : "DEPOSIT";
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function uploadToCloudinary(file) {
    if (!file) throw new Error("NO_FILE");
    if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error("CLOUDINARY_ENV_MISSING");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error?.message || "UPLOAD_FAILED");
    const url = j?.secure_url || j?.url || "";
    if (!url) throw new Error("NO_PUBLIC_URL");
    return url;
  }

  const inputBase = "w-full border px-4 py-3 text-sm outline-none placeholder:opacity-40 focus:ring-4";
  const inputStyle = {
    borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
    background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
    color: "var(--pm-fg)",
    boxShadow: "0 0 0 0 transparent",
  };
  const inputFocusStyle = { borderColor: "color-mix(in srgb, var(--pm-fg) 45%, transparent)", outline: "none" };

  const [metaLoading, setMetaLoading] = useState(true);
  const [pay, setPay] = useState({ bkash: "", nagad: "" });

  const fetchPaymentNumbers = async () => {
    setMetaLoading(true);
    try {
      const res = await fetch("/api/user/payment-methods", { method: "GET", credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.message || "Failed to load payment numbers");
        setPay({ bkash: "", nagad: "" });
        return;
      }
      const d = j?.data || {};
      setPay({ bkash: String(d?.bkash || ""), nagad: String(d?.nagad || "") });
    } catch {
      toast.error("Network error while loading payment numbers");
      setPay({ bkash: "", nagad: "" });
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentNumbers();
  }, []);

  const [amount, setAmount] = useState("");
  const amountNum = useMemo(() => Number(String(amount || "").trim()), [amount]);
  const NOTES = useMemo(() => [5, 10, 20, 50, 100, 200, 500, 1000], []);

  const [method, setMethod] = useState("bkash");
  const methodTitle = method === "bkash" ? "bKash" : "Nagad";
  const paymentNumber = method === "bkash" ? pay.bkash : pay.nagad;

  const [openPay, setOpenPay] = useState(false);
  const [openVerify, setOpenVerify] = useState(false);
  const [processingBlockOpen, setProcessingBlockOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitModalText, setLimitModalText] = useState("");

  const openAgentLimitModal = (minimumAmount) => {
    const minValue = Number(minimumAmount || 0);
    setLimitModalText(`এই মেথডে ডিপোজিট করতে সর্বনিম্ন ${fmtBDT0(minValue)} প্রয়োজন। অনুগ্রহ করে নির্ধারিত লিমিট বা তার বেশি এমাউন্ট দিন।`);
    setLimitModalOpen(true);
  };

  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [depositRules, setDepositRules] = useState({ allowMultipleDeposits: true, depositTimerHours: 1, minDeposit: 0, agentMinDepositBkash: 0, agentMinDepositNagad: 0, role: "user" });

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/user/deposit/history?skip=0&limit=50", { method: "GET", credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.message || "Failed to load history");
        setHistory([]);
        return;
      }
      const items = j?.data?.items || [];
      setHistory(Array.isArray(items) ? items : []);
      setDepositRules({
        allowMultipleDeposits: j?.data?.settings?.allowMultipleDeposits !== false,
        depositTimerHours: Number(j?.data?.settings?.depositTimerHours ?? 1),
        minDeposit: Number(j?.data?.settings?.minDeposit ?? 0),
        agentMinDepositBkash: Number(j?.data?.settings?.agentMinDepositBkash ?? 0),
        agentMinDepositNagad: Number(j?.data?.settings?.agentMinDepositNagad ?? 0),
        role: String(j?.data?.settings?.role || "user").toLowerCase(),
      });
    } catch {
      toast.error("Network error while loading history");
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const latestProcessingDeposit = useMemo(
    () => history.find((item) => String(item?.status || "").toLowerCase() === "processing") || null,
    [history]
  );
  const minAmountForMethod = useMemo(() => {
    if (isAgentPanel || depositRules.role === "agent") {
      return Number(method === "nagad" ? depositRules.agentMinDepositNagad : depositRules.agentMinDepositBkash) || 0;
    }
    return Number(depositRules.minDeposit || 0) || 0;
  }, [depositRules, isAgentPanel, method]);

  const openPayment = () => {
    const a = Number(amountNum);
    if (!Number.isFinite(a) || a <= 0) return toast.error("Enter a valid amount");
    if (minAmountForMethod > 0 && a < minAmountForMethod) {
      if (isAgentPanel || depositRules.role === "agent") {
        openAgentLimitModal(minAmountForMethod);
        return;
      }
      return toast.error(`Minimum ${methodTitle} deposit is Tk ${minAmountForMethod}`);
    }
    if (metaLoading) return toast.error("Please wait...");
    const current = method === "bkash" ? pay.bkash || "" : pay.nagad || "";
    if (!String(current || "").trim()) return toast.error(`${methodTitle} number not set`);
    if (!depositRules.allowMultipleDeposits && latestProcessingDeposit) {
      setProcessingBlockOpen(true);
      return;
    }
    setOpenPay(true);
  };

  const [verifyMode, setVerifyMode] = useState("number");
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");

  const [shotFile, setShotFile] = useState(null);
  const [shotPreview, setShotPreview] = useState("");
  const [shotUploading, setShotUploading] = useState(false);
  const [shotUrl, setShotUrl] = useState("");

  const [historyShotOpen, setHistoryShotOpen] = useState(false);
  const [historyShotUrl, setHistoryShotUrl] = useState("");

  const senderDigits = useMemo(() => senderNumber.replace(/\D/g, ""), [senderNumber]);
  const canVerifyNumber = senderDigits.length === 11;
  const canVerifyTrx = String(trxId || "").trim().length >= 6;
  const canVerifyShot = !!shotUrl && !shotUploading;

  const canVerify = !verifyBusy && !shotUploading && (verifyMode === "number" ? canVerifyNumber : verifyMode === "trx" ? canVerifyTrx : canVerifyShot);

  const resetVerifyModal = () => {
    setSenderNumber("");
    setTrxId("");
    setVerifyMode("number");
    setShotFile(null);
    if (shotPreview) URL.revokeObjectURL(shotPreview);
    setShotPreview("");
    setShotUploading(false);
    setShotUrl("");
  };

  const runVerify = async () => {
    if (!canVerify) return;
    const a = Number(amountNum);
    if (!Number.isFinite(a) || a <= 0) return toast.error("Enter a valid amount");
    if (minAmountForMethod > 0 && a < minAmountForMethod) {
      if (isAgentPanel || depositRules.role === "agent") {
        openAgentLimitModal(minAmountForMethod);
        return;
      }
      return toast.error(`Minimum ${methodTitle} deposit is Tk ${minAmountForMethod}`);
    }

    setVerifyBusy(true);
    toast.loading("Submitting...", { id: "vfy" });

    try {
      const payload = {
        amount: a,
        paymentMethod: method,
        verifyMode,
        senderNumber: verifyMode === "number" ? senderDigits : "",
        trxId: verifyMode === "trx" ? String(trxId || "").trim() : "",
        screenshotUrl: verifyMode === "screenshot" ? shotUrl : "",
        note: "",
      };

      const res = await fetch("/api/user/deposit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (j?.code === "PROCESSING_DEPOSIT_EXISTS") setProcessingBlockOpen(true);
        toast.error(j?.message || "Submit failed", { id: "vfy" });
        setVerifyBusy(false);
        if (j?.data?.item) setHistory((prev) => [j.data.item, ...prev]);
        return;
      }

      toast.success(j?.message || "Deposit request successful", { id: "vfy" });
      const newItem = j?.data?.item;
      if (newItem) setHistory((prev) => [newItem, ...prev]);
      else await loadHistory();

      setOpenVerify(false);
      setOpenPay(false);
      resetVerifyModal();
    } catch {
      toast.error("Network error", { id: "vfy" });
    } finally {
      setVerifyBusy(false);
    }
  };

  const openHistoryShot = (url) => {
    const u = String(url || "").trim();
    if (!u) return;
    setHistoryShotUrl(u);
    setHistoryShotOpen(true);
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: "var(--pm-fg)" }}>
      <OdometerStyles />
      <div className="mx-auto w-full max-w-md space-y-3">
        <Block title={panelTitle}>
          <div className="text-[12px] font-black" style={{ color: "var(--pm-fg)" }}>
            How much do you want to deposit?
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 80%, transparent)" }}>
                AMOUNT
              </div>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputBase}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
              />
            </div>

            <div>
              <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 80%, transparent)" }}>
                SUGGESTED AMOUNTS
              </div>

              <div className="grid grid-cols-4 gap-2">
                {NOTES.map((v) => {
                  const active = String(amount || "") === String(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(String(v))}
                      className="w-full border py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
                      style={{
                        borderColor: active ? "color-mix(in srgb, var(--pm-fg) 55%, transparent)" : "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
                        background: active ? "color-mix(in srgb, var(--pm-fg) 18%, transparent)" : "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
                        color: active ? "var(--pm-fg)" : "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 80%, transparent)" }}>
                METHOD
              </div>

              <div className="grid grid-cols-2 gap-2">
                <SegBtn active={method === "bkash"} label="BKASH" onClick={() => setMethod("bkash")} />
                <SegBtn active={method === "nagad"} label="NAGAD" onClick={() => setMethod("nagad")} />
              </div>

              <div className="mt-2 text-[10px]" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>
                {metaLoading ? "Loading payment numbers..." : paymentNumber ? `${methodTitle} ready` : `${methodTitle} not set`}
              </div>

              <div className="mt-2 text-[11px]" style={{ color: "color-mix(in srgb, var(--pm-fg) 82%, transparent)" }}>
                Minimum {methodTitle}: <span className="font-black" style={{ color: "var(--pm-fg)" }}>{minAmountForMethod > 0 ? fmtBDT0(minAmountForMethod) : "No minimum"}</span>
              </div>
            </div>

            {!depositRules.allowMultipleDeposits && latestProcessingDeposit ? (
              <div
                className="border px-3 py-3 text-[11px]"
                style={{
                  borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
                  background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
                  color: "color-mix(in srgb, var(--pm-fg) 88%, transparent)",
                }}
              >
                <div className="flex items-center gap-2 font-black tracking-widest uppercase">
                  <FiAlertTriangle className="h-4 w-4" />
                  Processing deposit found
                </div>
                <div className="mt-2 text-[12px]">
                  প্রসেসিং সম্পন্ন হলে আপনি আবার নতুন ডিপোজিট তৈরি করতে পারবেন।
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={openPayment}
              className="w-full border py-3 text-sm font-black tracking-widest uppercase active:scale-[0.99]"
              style={{
                borderColor: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
                background: "color-mix(in srgb, var(--pm-fg) 12%, transparent)",
                color: "var(--pm-fg)",
              }}
            >
              {metaLoading ? "LOADING..." : "DEPOSIT NOW"}
            </button>
          </div>
        </Block>

        <Modal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} title="মিনিমাম ডিপোজিট লিমিট" closable>
          <div className="space-y-3">
            <div
              className="border px-3 py-3 text-[12px] leading-6"
              style={{
                borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
                background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
                color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
              }}
            >
              {limitModalText || "এই মেথডে ডিপোজিট করার জন্য নির্ধারিত সর্বনিম্ন লিমিট পূরণ করতে হবে।"}
            </div>
            <button
              type="button"
              onClick={() => setLimitModalOpen(false)}
              className="w-full border py-3 text-sm font-black tracking-widest uppercase active:scale-[0.99]"
              style={{
                borderColor: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
                background: "color-mix(in srgb, var(--pm-fg) 12%, transparent)",
                color: "var(--pm-fg)",
              }}
            >
              OK
            </button>
          </div>
        </Modal>

        <Modal open={processingBlockOpen} onClose={() => setProcessingBlockOpen(false)} title="ডিপোজিট প্রসেসিং" closable>
          <div className="space-y-3">
            <div
              className="border px-3 py-3 text-[12px] leading-6"
              style={{
                borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)",
                background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
                color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
              }}
            >
              আপনার একটি ডিপোজিট বর্তমানে প্রসেসিং অবস্থায় আছে। প্রসেসিং সফল হয়ে গেলে আপনি আবার নতুন করে ডিপোজিট তৈরি করতে পারবেন।
            </div>
            {latestProcessingDeposit?.processingExpiresAt ? <CountdownBadge target={latestProcessingDeposit.processingExpiresAt} /> : null}
            <button
              type="button"
              onClick={() => setProcessingBlockOpen(false)}
              className="w-full border py-3 text-sm font-black tracking-widest uppercase active:scale-[0.99]"
              style={{
                borderColor: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
                background: "color-mix(in srgb, var(--pm-fg) 12%, transparent)",
                color: "var(--pm-fg)",
              }}
            >
              OK
            </button>
          </div>
        </Modal>

        <Modal open={openPay} onClose={() => setOpenPay(false)} title={`${methodTitle} PAYMENT`}>
          <div className="space-y-3">
            <CopyLine label={`${methodTitle} NUMBER`} value={paymentNumber || "01XXXXXXXXX"} copyValue={onlyDigits(paymentNumber)} />
            <CopyLine label="AMOUNT" value={fmtBDT0(amountNum || 0)} />

            <div className="border px-3 py-3 text-[11px]" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "color-mix(in srgb, var(--pm-fg) 92%, transparent)" }}>
              <div className="font-black tracking-widest uppercase">WARNING</div>
              <div className="mt-1 opacity-95">• You must use <span className="font-black">CASH IN</span> or <span className="font-black">SEND MONEY</span></div>
              <div className="mt-1 opacity-95">• Do not use <span className="font-black">CASH OUT</span> or <span className="font-black">RECHARGE</span></div>
              <div className="mt-1 opacity-95">• Send exactly <span className="font-black">{fmtBDT0(amountNum || 0)}</span> — <span className="font-black">no more, no less</span></div>
            </div>

            <div className="border px-3 py-3 text-[11px]" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "color-mix(in srgb, var(--pm-fg) 92%, transparent)" }}>
              <div className="inline-flex items-center gap-2 font-black tracking-widest uppercase">
                <FiCheckCircle className="h-4 w-4" /> NOTE
              </div>
              <div className="mt-2 space-y-1" style={{ color: "color-mix(in srgb, var(--pm-fg) 85%, transparent)" }}>
                <div>• Verify within 10 minutes</div>
                <div>• If not received, contact admin</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpenPay(false);
                setOpenVerify(true);
              }}
              className="w-full border py-3 text-sm font-black tracking-widest uppercase active:scale-[0.99]"
              style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 35%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 12%, transparent)", color: "var(--pm-fg)" }}
            >
              VERIFY NOW
            </button>
          </div>
        </Modal>

        <Modal open={openVerify} onClose={() => { setOpenVerify(false); resetVerifyModal(); }} title="DEPOSIT VERIFICATION">
          <div className="space-y-3">
            <div className="border px-3 py-3 text-[11px]" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "color-mix(in srgb, var(--pm-fg) 92%, transparent)" }}>
              <div className="font-black tracking-widest uppercase">How do you want to verify?</div>
              <div className="mt-2 grid grid-cols-1 gap-2">
                <VerifyOption id="number" label="MOBILE NUMBER" active={verifyMode === "number"} onClick={setVerifyMode} />
                <VerifyOption id="trx" label="TRANSACTION ID" active={verifyMode === "trx"} onClick={setVerifyMode} />
                <VerifyOption id="screenshot" label="SCREENSHOT" active={verifyMode === "screenshot"} onClick={setVerifyMode} />
              </div>
            </div>

            {verifyMode === "number" ? (
              <div className="space-y-2">
                <div className="text-[11px]" style={{ color: "color-mix(in srgb, var(--pm-fg) 85%, transparent)" }}>Enter the number you sent from</div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="01XXXXXXXXX"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  className={inputBase}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
                <div className="text-[10px]" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>{senderDigits.length}/11</div>
              </div>
            ) : verifyMode === "trx" ? (
              <div className="space-y-2">
                <div className="text-[11px]" style={{ color: "color-mix(in srgb, var(--pm-fg) 85%, transparent)" }}>Enter your Transaction ID</div>
                <input
                  type="text"
                  placeholder="e.g. A1B2C3D4"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className={inputBase}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
                <div className="text-[10px]" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>Min 6 chars</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px]" style={{ color: "color-mix(in srgb, var(--pm-fg) 85%, transparent)" }}>Upload your payment screenshot</div>

                <label className="block border px-4 py-4 cursor-pointer" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "var(--pm-fg)" }}>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0] || null;
                      setShotFile(f);
                      setShotUrl("");
                      if (shotPreview) URL.revokeObjectURL(shotPreview);
                      setShotPreview("");
                      if (!f) return;
                      try { setShotPreview(URL.createObjectURL(f)); } catch {}
                      setShotUploading(true);
                      toast.loading("Uploading screenshot...", { id: "upshot" });
                      try {
                        const url = await uploadToCloudinary(f);
                        setShotUrl(url);
                        toast.success("Screenshot uploaded", { id: "upshot" });
                      } catch (err) {
                        setShotFile(null);
                        if (shotPreview) URL.revokeObjectURL(shotPreview);
                        setShotPreview("");
                        setShotUrl("");
                        toast.error(err?.message === "CLOUDINARY_ENV_MISSING" ? "Cloudinary env missing" : "Upload failed", { id: "upshot" });
                      } finally {
                        setShotUploading(false);
                      }
                    }}
                  />
                  <div className="text-[11px] font-black tracking-widest uppercase">CHOOSE FILE</div>
                  <div className="mt-1 text-[11px] truncate" style={{ color: "color-mix(in srgb, var(--pm-fg) 75%, transparent)" }}>
                    {shotFile ? shotFile.name : "No file selected"}
                  </div>
                </label>

                {shotPreview ? (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden border" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)" }}>
                      <img src={shotPreview} alt="preview" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: "var(--pm-fg)" }}>
                        {shotUploading ? "UPLOADING..." : shotUrl ? "UPLOADED" : "NOT UPLOADED"}
                      </div>
                      <div className="mt-1 text-[10px] truncate max-w-[240px]" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>
                        {shotUrl || "Waiting for upload..."}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <button
              type="button"
              disabled={!canVerify}
              onClick={runVerify}
              className="w-full border py-3 text-sm font-black tracking-widest uppercase"
              style={{
                borderColor: canVerify ? "color-mix(in srgb, var(--pm-fg) 35%, transparent)" : "color-mix(in srgb, var(--pm-fg) 15%, transparent)",
                background: canVerify ? "color-mix(in srgb, var(--pm-fg) 12%, transparent)" : "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
                color: canVerify ? "var(--pm-fg)" : "color-mix(in srgb, var(--pm-fg) 40%, transparent)",
                cursor: canVerify ? "pointer" : "not-allowed",
              }}
            >
              {verifyBusy ? "SUBMITTING..." : shotUploading ? "UPLOADING..." : "VERIFY"}
            </button>
          </div>
        </Modal>

        <Modal open={historyShotOpen} onClose={() => { setHistoryShotOpen(false); setHistoryShotUrl(""); }} title="SCREENSHOT">
          <div className="border p-2" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)" }}>
            <div className="w-full overflow-hidden border" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 8%, transparent)" }}>
              <div className="max-h-[70vh] w-full">
                <img src={historyShotUrl} alt="Full screenshot" className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
        </Modal>

        <Block title="DEPOSIT HISTORY">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-widest uppercase" style={{ color: "var(--pm-fg)" }}>
              <FiLayers className="h-4 w-4" /> RECORDS
            </div>
            <span className="inline-flex items-center gap-2 border px-3 py-1 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)" }}>
              {history.length} ITEMS
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {historyLoading ? (
              <div className="border px-3 py-3 text-[11px]" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>
                Loading history…
              </div>
            ) : history.length ? (
              history.map((row) => <DepositHistoryCard key={row._id || row.id} row={row} onOpenShot={openHistoryShot} />)
            ) : (
              <div className="border px-3 py-3 text-[11px]" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>
                No deposits yet.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={loadHistory}
            className="mt-3 w-full border py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
            style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 30%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)" }}
          >
            REFRESH HISTORY
          </button>
        </Block>
      </div>
    </div>
  );
}
