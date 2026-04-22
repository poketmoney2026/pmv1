"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { FiCheckCircle, FiFileText, FiShield, FiX } from "react-icons/fi";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(() => ({
    fg: "var(--pm-fg)", fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)", fg75: "color-mix(in srgb, var(--pm-fg) 75%, transparent)", fg80: "color-mix(in srgb, var(--pm-fg) 80%, transparent)", fg85: "color-mix(in srgb, var(--pm-fg) 85%, transparent)", fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)", b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", b22: "color-mix(in srgb, var(--pm-fg) 22%, transparent)", b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)", bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
  }), []);
}

function Modal({ open, title, onClose, children, pm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 border" style={{ borderColor: pm.b28, background: "var(--pm-bg)" }}>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <div className="text-[12px] font-black tracking-widest uppercase">{title}</div>
          <button type="button" onClick={onClose} className="border p-2" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}><FiX className="h-4 w-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

const fmtBDT0 = (n) => `Tk ${Number(n || 0).toFixed(0)}`;
const formatDateTime = (d) => new Date(d).toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function KV({ label, value, pm }) {
  return (
    <div className="flex items-start justify-between gap-3 border px-3 py-2" style={{ borderColor: pm.b28, background: pm.bg08 }}>
      <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>{label}</div>
      <div className="max-w-[70%] break-all text-right text-[11px] font-black" style={{ color: pm.fg }}>{value}</div>
    </div>
  );
}

function DepositCard({ row, busy, onApprove, onViewScreenshot, pm }) {
  const hasScreenshot = !!row.screenshotUrl;
  return (
    <div className="border p-4" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-black truncate">{row.userName || "User"} <span style={{ color: pm.fg70 }}>• #{row.userId || "—"}</span></div>
          <div className="mt-1 text-[11px] truncate" style={{ color: pm.fg75 }}>{formatDateTime(row.createdAt)}</div>
          <div className="mt-1 text-[11px] truncate" style={{ color: pm.fg75 }}>Method: <span className="font-black" style={{ color: pm.fg }}>{String(row.method || "—").toUpperCase()}</span></div>
        </div>
        <span className="inline-flex items-center gap-2 border px-3 py-1 text-[10px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg90 }}><FiFileText className="h-4 w-4" /> PENDING</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border px-3 py-2" style={{ borderColor: "rgba(16,185,129,0.40)", background: "rgba(16,185,129,0.14)" }}>
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(167,243,208,0.95)" }}>AMOUNT</span>
        <span className="text-[14px] font-black tabular-nums" style={{ color: "rgba(236,253,245,0.98)" }}>{fmtBDT0(row.amount)}</span>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <KV pm={pm} label="PAYMENT METHOD" value={String(row.method || "—").toUpperCase()} />
        <KV pm={pm} label="VERIFY VIA" value={row.verifyVia || "—"} />
        <KV pm={pm} label="MOBILE" value={row.mobile || "—"} />
        <KV pm={pm} label="TRX ID" value={row.trxId || "—"} />
      </div>

      <div className="mt-3 border p-2 flex items-center gap-3" style={{ borderColor: pm.b28, background: pm.bg08 }}>
        <div className="aspect-square w-16 overflow-hidden border" style={{ borderColor: pm.b20, background: "rgba(0,0,0,0.25)" }}>
          {hasScreenshot ? <img src={row.screenshotUrl} alt="screenshot preview" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-[10px]" style={{ color: pm.fg70 }}>—</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] truncate" style={{ color: pm.fg80 }}>{hasScreenshot ? "Screenshot attached" : "No screenshot"}</div>
          {hasScreenshot ? <button type="button" onClick={() => onViewScreenshot(row.screenshotUrl)} className="mt-1 inline-flex items-center gap-2 border px-2 py-1 text-[10px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}><FiFileText className="h-3.5 w-3.5" /> FULL VIEW</button> : null}
        </div>
      </div>

      <div className="mt-3">
        <button type="button" disabled={busy} onClick={onApprove} className="inline-flex w-full items-center justify-center gap-2 border py-3 text-[11px] font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: "rgba(16,185,129,0.40)", background: busy ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.14)", color: pm.fg }}><FiCheckCircle className="h-4 w-4" /> SUCCESS</button>
      </div>
    </div>
  );
}

export default function AgentDepositVerifyPage() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState("");

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/deposits/pending", { credentials: "include", cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        toast.error(j?.message || "Failed to load pending deposits");
        setItems([]);
        return;
      }
      setItems(Array.isArray(j?.data?.items) ? j.data.items : []);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPending(); }, []);

  const confirmSuccess = async () => {
    const id = selected?._id ? String(selected._id) : "";
    if (!id) return;
    setBusyId(id);
    setConfirmOpen(false);
    try {
      const res = await fetch(`/api/agent/deposits/${id}`, { method: "PATCH", credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        toast.error(j?.message || "Action failed");
        return;
      }
      toast.success(j?.message || "Deposit successful");
      setItems((prev) => prev.filter((x) => String(x._id) !== id));
    } catch {
      toast.error("Network error");
    } finally {
      setBusyId("");
      setSelected(null);
    }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-[100svh] mt-14 px-3 py-4 font-medium`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto w-full max-w-sm space-y-2" style={{ fontFamily: "var(--pm-font, ui-monospace)" }}>
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] tracking-widest uppercase" style={{ color: pm.fg80 }}>Agent Panel</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">DEPOSIT VERIFY</div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg75 }}>শুধু success করা যাবে। success করলে আপনার balance থেকে amount কাটা হবে।</div>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><FiShield className="h-6 w-6" /></span>
          </div>
        </div>

        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg90 }}>Pending Deposits</div>
            <span className="inline-flex items-center gap-2 border px-3 py-1 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>{items.length} ITEMS</span>
          </div>
          <div className="space-y-2">
            {loading ? <div className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg70 }}>Loading pending deposits…</div> : items.length ? items.map((row) => <DepositCard key={row._id} row={row} busy={busyId===row._id} onApprove={() => { setSelected(row); setConfirmOpen(true); }} onViewScreenshot={(url)=>{ setViewImageUrl(url); setViewImageOpen(true); }} pm={pm} />) : <div className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg70 }}>No pending deposits.</div>}
          </div>
        </div>

        <Modal open={confirmOpen} title="CONFIRM SUCCESS" onClose={() => { setConfirmOpen(false); setSelected(null); }} pm={pm}>
          <div className="border px-3 py-3 text-[11px] leading-6" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg85 }}>
            এই ডিপোজিট success করলে <span className="font-black" style={{ color: pm.fg }}>{fmtBDT0(selected?.amount)}</span> আপনার agent balance থেকে কাটা হবে। আপনি কি এগোতে চান?
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setConfirmOpen(false); setSelected(null); }} className="border py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg }}>CANCEL</button>
            <button type="button" disabled={!!busyId} onClick={confirmSuccess} className="border py-3 text-[11px] font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: "rgba(16,185,129,0.40)", background: "rgba(16,185,129,0.14)", color: pm.fg }}>CONFIRM</button>
          </div>
        </Modal>

        <Modal open={viewImageOpen} title="SCREENSHOT FULL VIEW" onClose={() => { setViewImageOpen(false); setViewImageUrl(""); }} pm={pm}>
          <div className="border p-2" style={{ borderColor: pm.b28, background: pm.bg08 }}>
            <div className="w-full max-h-[70vh] overflow-auto border" style={{ borderColor: pm.b20, background: "rgba(0,0,0,0.25)" }}>
              {viewImageUrl ? <img src={viewImageUrl} alt="screenshot full" className="w-full h-auto" /> : null}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
