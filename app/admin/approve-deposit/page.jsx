// app/admin/approve-deposit/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import {
  FiShield,
  FiArrowLeft,
  FiFileText,
  FiLayers,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(
    () => ({
      fg: "var(--pm-fg)",
      fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
      fg75: "color-mix(in srgb, var(--pm-fg) 75%, transparent)",
      fg80: "color-mix(in srgb, var(--pm-fg) 80%, transparent)",
      fg85: "color-mix(in srgb, var(--pm-fg) 85%, transparent)",
      fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
      b18: "color-mix(in srgb, var(--pm-fg) 18%, transparent)",
      b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
      b22: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
      b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
      b35: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
      bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
      bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
      bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
      bg12: "color-mix(in srgb, var(--pm-fg) 12%, transparent)",
    }),
    []
  );
}

function Block({ title, children, pm }) {
  return (
    <div
      className="select-none border p-3"
      style={{
        borderColor: pm.b28,
        background: pm.bg06,
        boxShadow: `0 0 0 1px ${pm.b22}`,
        color: pm.fg,
      }}
    >
      <div className="mb-2 text-center text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Modal({ open, title, onClose, children, pm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className="relative border shadow-2xl" style={{ borderColor: pm.b28, background: "var(--pm-bg)" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.10), transparent 45%)" }}
          />
          <div
            className="relative flex items-center justify-between gap-3 border-b px-4 py-3"
            style={{ borderColor: pm.b20, background: pm.bg08 }}
          >
            <div className="min-w-0">
              <div className="text-[12px] font-black tracking-widest uppercase truncate" style={{ color: pm.fg }}>
                {title}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="border p-2 active:scale-[0.99]"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
              aria-label="Close"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
          <div className="relative p-4" style={{ color: pm.fg }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

const fmtBDT0 = (n) => `Tk ${Number(n || 0).toFixed(0)}`;

function statusPill(s) {
  const st = String(s || "").toLowerCase();
  if (st === "success") return "SUCCESS";
  if (st === "processing" || st === "pending") return "PENDING";
  if (st === "reject" || st === "rejected") return "REJECT";
  return String(s || "UNKNOWN").toUpperCase();
}

function statusStyle(st, pm) {
  const s = String(st || "").toLowerCase();
  if (s === "success")
    return {
      borderColor: "rgba(16,185,129,0.35)",
      background: "rgba(16,185,129,0.15)",
      color: "rgba(167,243,208,0.95)",
    };
  if (s === "processing" || s === "pending")
    return { borderColor: "rgba(255,255,255,0.28)", background: pm.bg10, color: pm.fg90 };
  if (s === "reject" || s === "rejected")
    return {
      borderColor: "rgba(244,63,94,0.35)",
      background: "rgba(244,63,94,0.12)",
      color: "rgba(254,205,211,0.95)",
    };
  return { borderColor: pm.b28, background: pm.bg10, color: pm.fg85 };
}

function formatDateTime(d) {
  const dt = new Date(d);
  const date = dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const time = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${date} • ${time}`;
}

function KV({ label, value, pm }) {
  return (
    <div className="flex items-start justify-between gap-3 border px-3 py-2" style={{ borderColor: pm.b28, background: pm.bg08 }}>
      <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>
        {label}
      </div>
      <div
        className="text-[11px] font-black tabular-nums text-right break-all"
        style={{ color: pm.fg, maxWidth: "70%" }}
      >
        {value}
      </div>
    </div>
  );
}

function DepositCard({ row, busy, onApprove, onReject, onViewScreenshot, pm }) {
  const mobile = String(row.mobile || "").trim();
  const trxId = String(row.trxId || "").trim();
  const hasScreenshot = !!row.screenshotUrl;
  const methodText = String(row.method || "—").toUpperCase();

  const pill = statusPill(row.status);
  const pillStyle = statusStyle(row.status, pm);

  return (
    <div
      className="border p-4"
      style={{
        borderColor: pm.b28,
        background: pm.bg06,
        boxShadow: `0 0 0 1px ${pm.b22}`,
        color: pm.fg,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-black truncate" style={{ color: pm.fg }}>
            {row.userName || "User"} <span style={{ color: pm.fg70 }} className="font-bold">•</span>{" "}
            <span style={{ color: pm.fg85 }}>#{row.userId || "—"}</span>
          </div>
          <div className="mt-1 text-[11px] truncate" style={{ color: pm.fg75 }}>
            {formatDateTime(row.createdAt)}
          </div>
          <div className="mt-1 text-[11px] truncate" style={{ color: pm.fg75 }}>
            Method:{" "}
            <span className="font-black" style={{ color: pm.fg }}>
              {methodText}
            </span>
          </div>
        </div>

        <span
          className="shrink-0 inline-flex items-center gap-2 border px-3 py-1 text-[10px] font-black tracking-widest uppercase"
          style={pillStyle}
        >
          <FiFileText className="h-4 w-4" />
          {pill}
        </span>
      </div>

      <div
        className="mt-3 border px-3 py-2 flex items-center justify-between gap-3"
        style={{ borderColor: "rgba(16,185,129,0.40)", background: "rgba(16,185,129,0.14)" }}
      >
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(167,243,208,0.95)" }}>
          AMOUNT
        </span>
        <span className="text-[14px] font-black tabular-nums" style={{ color: "rgba(236,253,245,0.98)" }}>
          {fmtBDT0(row.amount)}
        </span>
      </div>

      {/* Show the actual data instead of a simple YES/NO flag */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <KV pm={pm} label="PAYMENT METHOD" value={methodText || "—"} />
        <KV pm={pm} label="VERIFY VIA" value={row.verifyVia || "—"} />
        <KV pm={pm} label="MOBILE" value={mobile || "—"} />
        <KV pm={pm} label="TRX ID" value={trxId || "—"} />
      </div>

      {/* Show the screenshot when available, otherwise show a placeholder */}
      <div className="mt-3 border p-2 flex items-center gap-3" style={{ borderColor: pm.b28, background: pm.bg08 }}>
        <div className="aspect-square w-16 overflow-hidden border" style={{ borderColor: pm.b20, background: "rgba(0,0,0,0.25)" }}>
          {hasScreenshot ? (
            <img src={row.screenshotUrl} alt="screenshot preview" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center text-[10px]" style={{ color: pm.fg70 }}>
              —
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[11px] truncate" style={{ color: pm.fg80 }}>
            {hasScreenshot ? "Screenshot attached" : "No screenshot"}
          </div>

          {hasScreenshot ? (
            <button
              type="button"
              onClick={() => onViewScreenshot(row.screenshotUrl)}
              className="mt-1 inline-flex items-center gap-2 border px-2 py-1 text-[10px] font-black tracking-widest uppercase active:scale-[0.99]"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
            >
              <FiFileText className="h-3.5 w-3.5" />
              FULL VIEW
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          className="inline-flex items-center justify-center gap-2 border py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            borderColor: "rgba(16,185,129,0.40)",
            background: busy ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.14)",
            color: pm.fg,
          }}
        >
          <FiCheckCircle className="h-4 w-4" />
          SUCCESS
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          className="inline-flex items-center justify-center gap-2 border py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            borderColor: "rgba(244,63,94,0.40)",
            background: busy ? "rgba(244,63,94,0.06)" : "rgba(244,63,94,0.12)",
            color: pm.fg,
          }}
        >
          <FiXCircle className="h-4 w-4" />
          REJECT
        </button>
      </div>
    </div>
  );
}

export default function ApproveDepositPage() {
  const pm = usePM();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState("");
  const total = useMemo(() => items.length, [items]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState("");

  const loadPending = async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const res = await fetch("/api/admin/deposits/pending", { method: "GET", credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setForbidden(true);
        toast.error(j?.message || "Access denied");
        setItems([]);
        return;
      }
      if (!res.ok) {
        toast.error(j?.message || "Failed to load pending deposits");
        setItems([]);
        return;
      }
      const list = j?.data?.items || [];
      setItems(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Network error while loading");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const act = async (id, action) => {
    if (!id || busyId) return;
    setBusyId(id);
    toast.loading("Processing...", { id: "act" });
    try {
      const res = await fetch(`/api/admin/deposits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        toast.error(j?.message || "Access denied", { id: "act" });
        setForbidden(true);
        setItems([]);
        return;
      }
      if (!res.ok) {
        toast.error(j?.message || "Action failed", { id: "act" });
        return;
      }
      toast.success(j?.message || (action === "approve" ? "Deposit successful" : "Deposit rejected"), { id: "act" });
      setItems((prev) => prev.filter((x) => String(x._id) !== String(id)));
    } catch {
      toast.error("Network error", { id: "act" });
    } finally {
      setBusyId("");
    }
  };

  const openReject = (row) => {
    if (busyId) return;
    setSelected(row);
    setRejectOpen(true);
  };

  const openSuccess = (row) => {
    if (busyId) return;
    setSelected(row);
    setSuccessOpen(true);
  };

  const confirmReject = async () => {
    const id = selected?._id ? String(selected._id) : "";
    if (!id) return;
    setRejectOpen(false);
    await act(id, "reject");
    setSelected(null);
  };

  const confirmSuccess = async () => {
    const id = selected?._id ? String(selected._id) : "";
    if (!id) return;
    setSuccessOpen(false);
    await act(id, "approve");
    setSelected(null);
  };

  const openViewImage = (url) => {
    if (!url) return;
    setViewImageUrl(url);
    setViewImageOpen(true);
  };

  return (
    <div
      className={`${funnelDisplay.className} select-none min-h-[100svh] mt-14 px-3 py-4 font-medium`}
      style={{ background: "var(--pm-bg-grad)", color: pm.fg }}
    >
      <style jsx global>{`
        :root {
          --pm-bg: #0b0b0b;
          --pm-fg: #ffffff;
          --pm-bg-grad: linear-gradient(180deg, #0b0b0b 0%, #050505 100%);
          --pm-font: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        html,
        body {
          background: var(--pm-bg);
          color: var(--pm-fg);
        }
        input,
        button,
        select {
          font-family: var(--pm-font);
        }
      `}</style>

      <div className="mx-auto w-full max-w-sm space-y-2" style={{ fontFamily: "var(--pm-font)" }}>
        <div
          className="border p-3"
          style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] tracking-widest uppercase" style={{ color: pm.fg80 }}>
                Admin Panel
              </div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase" style={{ color: pm.fg }}>
                APPROVE DEPOSIT
              </div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg75 }}>
                {forbidden ? "You are not allowed to view this page." : "Pending deposits list (latest first)."}
              </div>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}>
              <FiShield className="h-6 w-6" />
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
            >
              <FiArrowLeft className="h-4 w-4" /> Back
            </Link>

            <button
              type="button"
              onClick={loadPending}
              disabled={loading}
              className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] disabled:opacity-60"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
            >
              <FiRefreshCw className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")} />
              Refresh
            </button>
          </div>
        </div>

        <Block pm={pm} title="PENDING DEPOSITS">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg90 }}>
              <FiLayers className="h-4 w-4" /> RECORDS
            </div>
            <span
              className="inline-flex items-center gap-2 border px-3 py-1 text-[11px] font-black tracking-widest uppercase"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
            >
              {total} ITEMS
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {loading ? (
              <div className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg70 }}>
                Loading pending deposits…
              </div>
            ) : forbidden ? (
              <div className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg70 }}>
                Access denied.{" "}
                <button type="button" onClick={() => router.push("/")} className="underline font-black" style={{ color: pm.fg }}>
                  Go home
                </button>
              </div>
            ) : items.length ? (
              items.map((row) => (
                <DepositCard
                  key={row._id}
                  row={row}
                  busy={busyId === row._id}
                  onApprove={() => openSuccess(row)}
                  onReject={() => openReject(row)}
                  onViewScreenshot={openViewImage}
                  pm={pm}
                />
              ))
            ) : (
              <div className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg70 }}>
                No pending deposits.
              </div>
            )}
          </div>
        </Block>

        <Modal
          pm={pm}
          open={rejectOpen}
          title="CONFIRM REJECT"
          onClose={() => {
            setRejectOpen(false);
            setSelected(null);
          }}
        >
          <div className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg85 }}>
            Are you sure you want to <span className="font-black" style={{ color: "rgba(254,205,211,0.95)" }}>REJECT</span> this deposit?
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!!busyId}
              onClick={confirmReject}
              className="border py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                borderColor: "rgba(244,63,94,0.40)",
                background: busyId ? "rgba(244,63,94,0.06)" : "rgba(244,63,94,0.12)",
                color: pm.fg,
              }}
            >
              CONFIRM
            </button>
            <button
              type="button"
              onClick={() => {
                setRejectOpen(false);
                setSelected(null);
              }}
              className="border py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
              style={{
                borderColor: "rgba(16,185,129,0.40)",
                background: "rgba(16,185,129,0.14)",
                color: pm.fg,
              }}
            >
              CANCEL
            </button>
          </div>
        </Modal>

        <Modal
          pm={pm}
          open={successOpen}
          title="CONFIRM SUCCESS"
          onClose={() => {
            setSuccessOpen(false);
            setSelected(null);
          }}
        >
          <div className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg85 }}>
            Are you sure you want to mark this deposit as <span className="font-black" style={{ color: "rgba(167,243,208,0.95)" }}>SUCCESS</span>?
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSuccessOpen(false);
                setSelected(null);
              }}
              className="border py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
              style={{
                borderColor: "rgba(244,63,94,0.40)",
                background: "rgba(244,63,94,0.12)",
                color: pm.fg,
              }}
            >
              CANCEL
            </button>
            <button
              type="button"
              disabled={!!busyId}
              onClick={confirmSuccess}
              className="border py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                borderColor: "rgba(16,185,129,0.40)",
                background: busyId ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.14)",
                color: pm.fg,
              }}
            >
              CONFIRM
            </button>
          </div>
        </Modal>

        <Modal
          pm={pm}
          open={viewImageOpen}
          title="SCREENSHOT FULL VIEW"
          onClose={() => {
            setViewImageOpen(false);
            setViewImageUrl("");
          }}
        >
          <div className="border p-2" style={{ borderColor: pm.b28, background: pm.bg08 }}>
            <div
              className="w-full max-h-[70vh] overflow-auto border"
              style={{ borderColor: pm.b20, background: "rgba(0,0,0,0.25)" }}
            >
              {viewImageUrl ? <img src={viewImageUrl} alt="screenshot full" className="w-full h-auto" /> : null}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}