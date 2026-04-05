"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Filter,
  Search,
  Wallet,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  Image as ImageIcon,
  Pencil,
  Save,
  X,
} from "lucide-react";

const fmtBDT0 = (n) => `Tk ${Number(n || 0).toFixed(0)}`;
const fmtBDT2 = (n) =>
  `Tk ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

function formatDateTime(d) {
  const dt = new Date(d);
  const date = dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const time = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${date} • ${time}`;
}

function statusBadgeStyle(s, pm) {
  const k = String(s || "").toLowerCase();
  if (k === "successful")
    return { borderColor: "rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.14)", color: "rgba(167,243,208,0.95)" };
  if (k === "pending")
    return { borderColor: "rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.14)", color: "rgba(253,230,138,0.95)" };
  if (k === "reject")
    return { borderColor: "rgba(244,63,94,0.38)", background: "rgba(244,63,94,0.12)", color: "rgba(254,205,211,0.95)" };
  if (k === "processing")
    return { borderColor: "rgba(56,189,248,0.38)", background: "rgba(56,189,248,0.12)", color: "rgba(186,230,253,0.95)" };
  return { borderColor: pm.b28, background: pm.bg10, color: pm.fg85 };
}

function Block({ title, children, pm }) {
  return (
    <div className="select-none border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}`, color: pm.fg }}>
      <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function MiniBox({ icon: Icon, label, value, pm }) {
  return (
    <div className="border px-3 py-3" style={{ borderColor: pm.b28, background: pm.bg08 }}>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase min-w-0" style={{ color: pm.fg80 }}>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <span className="text-[11px] font-black tabular-nums shrink-0" style={{ color: pm.fg }}>
          {value}
        </span>
      </div>
    </div>
  );
}

function KV({ label, value, rightSlot = null, pm }) {
  return (
    <div className="flex items-center justify-between gap-3 border px-3 py-2" style={{ borderColor: pm.b28, background: pm.bg08 }}>
      <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>
        {label}
      </div>
      <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
        <div className="text-[11px] font-black tabular-nums truncate text-right min-w-0" style={{ color: pm.fg }}>
          {value}
        </div>
        {rightSlot}
      </div>
    </div>
  );
}

function Pill({ active, onClick, label, pm }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border px-3 py-2 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
      style={{
        borderColor: active ? "rgba(16,185,129,0.38)" : pm.b28,
        background: active ? "rgba(16,185,129,0.14)" : pm.bg10,
        color: active ? "rgba(167,243,208,0.95)" : pm.fg85,
      }}
    >
      {label}
    </button>
  );
}

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

function ImageViewModal({ open, url, onClose, pm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" />
      <div className="relative w-full max-w-3xl border" style={{ borderColor: pm.b28, background: "var(--pm-bg)" }}>
        <div className="flex items-center justify-between border-b p-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg }}>
            PAYMENT PROOF
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border p-2 active:scale-[0.99]"
            style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3">
          <div className="border" style={{ borderColor: pm.b28, background: pm.bg10 }}>
            <img src={url} alt="Payment proof" className="w-full h-auto block" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessProofModal({ open, item, pm, confirming, onCancel, onConfirm }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [localPreview, setLocalPreview] = useState("");

  useEffect(() => {
    if (!open) return;
    setUploading(false);
    setProofUrl("");
    setLocalPreview("");
  }, [open]);

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const canConfirm = !!proofUrl && !uploading && !confirming;

  const pickFile = () => {
    if (uploading || confirming) return;
    fileRef.current?.click();
  };

  const uploadToCloudinary = async (file) => {
    if (!cloud || !preset) throw new Error("Cloudinary env missing");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error?.message || "Upload failed");
    return String(j?.secure_url || j?.url || "");
  };

  const onFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const local = URL.createObjectURL(f);
    setLocalPreview(local);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(f);
      if (!url) throw new Error("Upload failed");
      setProofUrl(url);
      toast.success("Uploaded");
    } catch (err) {
      toast.error(err?.message || "Upload failed");
      setLocalPreview("");
      setProofUrl("");
    } finally {
      setUploading(false);
      try {
        e.target.value = "";
      } catch {}
    }
  };

  if (!open) return null;

  const title = "CONFIRM SUCCESS";
  const netAmount = Number(item?.amount ?? 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative w-full max-w-md border" style={{ borderColor: pm.b28, background: "var(--pm-bg)", color: pm.fg }}>
        <div className="border-b p-4" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <div className="text-[12px] font-black tracking-widest uppercase">{title}</div>
          <div className="mt-2 text-[11px]" style={{ color: pm.fg75 }}>
            Payable Amount: <span className="font-black" style={{ color: pm.fg }}>{fmtBDT2(netAmount)}</span>
          </div>
        </div>

        <div className="p-4">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={pickFile}
              disabled={uploading || confirming}
              className="border active:scale-[0.99] disabled:opacity-60"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg, aspectRatio: "1 / 1" }}
            >
              <div className="h-full w-full grid place-items-center p-3">
                <div className="text-center">
                  <div className="mx-auto grid h-10 w-10 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg08 }}>
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                  </div>
                  <div className="mt-3 text-[11px] font-black tracking-widest uppercase">{uploading ? "UPLOADING..." : "SELECT IMAGE"}</div>
                  <div className="mt-1 text-[10px]" style={{ color: pm.fg70 }}>Tap to choose</div>
                </div>
              </div>
            </button>

            <div className="border overflow-hidden" style={{ borderColor: pm.b28, background: pm.bg10, aspectRatio: "1 / 1" }}>
              {localPreview || proofUrl ? (
                <img src={proofUrl || localPreview} alt="Preview" className="h-full w-full object-cover block" />
              ) : (
                <div className="h-full w-full grid place-items-center p-3 text-center">
                  <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg75 }}>PREVIEW</div>
                  <div className="mt-1 text-[10px]" style={{ color: pm.fg70 }}>No image</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 text-[11px]" style={{ color: pm.fg75 }}>Payment proof is required to confirm success.</div>
        </div>

        <div className="border-t p-4" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={confirming || uploading}
              className="w-full border px-4 py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] disabled:opacity-60"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={() => onConfirm(proofUrl)}
              disabled={!canConfirm}
              className="w-full border px-4 py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] disabled:opacity-60"
              style={{
                borderColor: "rgba(16,185,129,0.38)",
                background: canConfirm ? "rgba(16,185,129,0.20)" : "rgba(255,255,255,0.06)",
                color: canConfirm ? "rgba(167,243,208,0.95)" : pm.fg70,
              }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                CONFIRM {(confirming || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ open, item, confirming, onCancel, onConfirm, pm }) {
  if (!open) return null;
  const netAmount = Number(item?.amount ?? 0);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative w-full max-w-md border" style={{ borderColor: pm.b28, background: "var(--pm-bg)", color: pm.fg }}>
        <div className="border-b p-4" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <div className="text-[12px] font-black tracking-widest uppercase">CONFIRM REJECT</div>
          <div className="mt-2 text-[11px]" style={{ color: pm.fg75 }}>
            Reject this withdrawal? Amount: <span className="font-black" style={{ color: pm.fg }}>{fmtBDT2(netAmount)}</span>
          </div>
        </div>
        <div className="p-4 text-[12px]" style={{ color: pm.fg85 }}>This will reject the request and refund the user.</div>
        <div className="border-t p-4" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={confirming}
              className="w-full border px-4 py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] disabled:opacity-60"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirming}
              className="w-full border px-4 py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] disabled:opacity-60"
              style={{ borderColor: "rgba(244,63,94,0.38)", background: "rgba(244,63,94,0.14)", color: "rgba(254,205,211,0.95)" }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                REJECT {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserHistoryModal({ open, pm, userId, mobile, onClose }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [totals, setTotals] = useState({ depositAmount: 0, withdrawAmount: 0 });

  useEffect(() => {
    if (!open || !userId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/withdraws`, { method: "GET", credentials: "include" });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.message || "Failed to load history");
        const got = Array.isArray(j?.data?.items) ? j.data.items : [];
        setItems(got);
        setTotals({
          depositAmount: Number(j?.data?.totals?.depositAmount || 0),
          withdrawAmount: Number(j?.data?.totals?.withdrawAmount || 0),
        });
      } catch (e) {
        toast.error(e?.message || "Load failed");
        setItems([]);
        setTotals({ depositAmount: 0, withdrawAmount: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, userId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/85" />
      <div
        className="relative w-full max-w-md border flex flex-col"
        style={{ borderColor: pm.b28, background: "var(--pm-bg)", color: pm.fg, maxHeight: "70vh" }}
      >
        <div className="border-b p-4" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[12px] font-black tracking-widest uppercase">USER HISTORY</div>
              <div className="mt-2 text-[11px] truncate" style={{ color: pm.fg75 }}>
                {mobile || userId}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="border p-2 active:scale-[0.99]"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto" style={{ flex: 1, overscrollBehavior: "contain" }}>
          <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg08 }}>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>TOTALS</div>
            <div className="mt-2 space-y-1.5">
              <KV pm={pm} label="TOTAL DEPOSIT" value={fmtBDT2(totals.depositAmount)} />
              <KV pm={pm} label="TOTAL WITHDRAW" value={fmtBDT2(totals.withdrawAmount)} />
            </div>
          </div>

          {loading ? (
            <div className="border px-3 py-3 text-[12px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg75 }}>
              Loading history...
            </div>
          ) : !items.length ? (
            <div className="border px-3 py-3 text-[12px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg75 }}>
              No history found.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((h) => (
                <div key={h._id} className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] font-black" style={{ color: pm.fg }}>
                        {fmtBDT0(h.netAmount ?? h.amount)} <span className="font-bold" style={{ color: pm.fg70 }}>• PAYABLE</span>
                      </div>
                      <div className="mt-1 text-[11px]" style={{ color: pm.fg75 }}>{formatDateTime(h.createdAt)}</div>
                    </div>
                    <span className="shrink-0 border px-3 py-1 text-[10px] font-black tracking-widest uppercase" style={statusBadgeStyle(h.status, pm)}>
                      {String(h.status || "pending").toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <KV pm={pm} label="MOBILE" value={h.mobile || "—"} />
                    <KV pm={pm} label="AMOUNT" value={fmtBDT2(h.netAmount ?? h.amount)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <button
            type="button"
            onClick={onClose}
            className="w-full border px-4 py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
            style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminWithdrawsPage() {
  const pm = usePM();

  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [feePercent, setFeePercent] = useState(0);

  const [modal, setModal] = useState({ open: false, action: null, item: null });
  const [confirming, setConfirming] = useState(false);
  const [imgModal, setImgModal] = useState({ open: false, url: "" });
  const [editMobileModal, setEditMobileModal] = useState({ open: false, item: null, value: "", saving: false });
  const [userHist, setUserHist] = useState({ open: false, userId: "", mobile: "" });

  const inputBase = "w-full border px-4 py-3 text-sm outline-none placeholder:opacity-60 focus:ring-4 focus:ring-white/10";
  const inputStyle = { borderColor: pm.b28, background: pm.bg10, color: pm.fg };

  const openEditMobile = (item) => {
    setEditMobileModal({ open: true, item, value: String(item?.mobile || ""), saving: false });
  };

  const saveEditedMobile = async () => {
    const item = editMobileModal.item;
    if (!item?._id) return;
    const mobile = String(editMobileModal.value || "").replace(/\D/g, "").slice(0, 11);
    if (!/^01\d{9}$/.test(mobile)) return toast.error("Invalid mobile number");
    setEditMobileModal((p) => ({ ...p, saving: true, value: mobile }));
    try {
      const res = await fetch(`/api/admin/withdraws/${item._id}/mobile`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mobile }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j?.message || "Update failed");
      toast.success(j?.message || "Mobile updated");
      setItems((prev) => prev.map((row) => String(row._id) === String(item._id) ? { ...row, mobile } : row));
      setEditMobileModal({ open: false, item: null, value: "", saving: false });
    } catch {
      toast.error("Network error");
      setEditMobileModal((p) => ({ ...p, saving: false }));
    }
  };

  const loadSummary = async () => {
    const res = await fetch("/api/admin/withdraws/summary", { method: "GET", credentials: "include" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.message || "Failed to load summary");
    return j?.data || null;
  };

  const loadList = async ({ reset = false, add = 0 } = {}) => {
    const skip = reset ? 0 : items.length;
    const limit = reset ? 50 : add || 50;
    const url = `/api/admin/withdraws?status=${encodeURIComponent(status)}&skip=${skip}&limit=${limit}&q=${encodeURIComponent(q.trim())}`;
    const res = await fetch(url, { method: "GET", credentials: "include" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.message || "Failed to load withdraws");
    const got = Array.isArray(j?.data?.items) ? j.data.items : [];
    const more = Boolean(j?.data?.hasMore);
    setFeePercent(Number(j?.data?.feePercent ?? 0));
    setHasMore(more);
    setItems((p) => (reset ? got : [...p, ...got]));
  };

  const refreshAll = async () => {
    setLoading(true);
    setListLoading(true);
    try {
      const s = await loadSummary();
      setSummary(s);
      await loadList({ reset: true });
    } catch (e) {
      toast.error(e?.message || "Load failed");
    } finally {
      setListLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    (async () => {
      setListLoading(true);
      try {
        await loadList({ reset: true });
      } catch (e) {
        toast.error(e?.message || "Failed to load");
      } finally {
        setListLoading(false);
      }
    })();
  }, [status]);

  const runSearch = async () => {
    setListLoading(true);
    try {
      await loadList({ reset: true });
    } catch (e) {
      toast.error(e?.message || "Search failed");
    } finally {
      setListLoading(false);
    }
  };

  const openActionModal = (item, action) => setModal({ open: true, action, item });
  const closeModal = () => {
    if (confirming) return;
    setModal({ open: false, action: null, item: null });
  };

  const confirmReject = async () => {
    if (!modal?.item?._id) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/admin/withdraws/${modal.item._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reject" }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.message || "Action failed");
        return;
      }
      toast.success(j?.message || "Done");
      setModal({ open: false, action: null, item: null });
      const s = await loadSummary();
      setSummary(s);
      await loadList({ reset: true });
    } catch {
      toast.error("Network error");
    } finally {
      setConfirming(false);
    }
  };

  const confirmSuccess = async (paymentProof) => {
    if (!modal?.item?._id) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/admin/withdraws/${modal.item._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "success", paymentProof }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.message || "Action failed");
        return;
      }
      toast.success(j?.message || "Done");
      setModal({ open: false, action: null, item: null });
      const s = await loadSummary();
      setSummary(s);
      await loadList({ reset: true });
    } catch {
      toast.error("Network error");
    } finally {
      setConfirming(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || moreLoading) return;
    setMoreLoading(true);
    try {
      await loadList({ reset: false, add: 50 });
    } catch (e) {
      toast.error(e?.message || "Load more failed");
    } finally {
      setMoreLoading(false);
    }
  };

  const totals = useMemo(() => {
    const s = summary || {};
    const counts = s.counts || {};
    const amounts = s.amounts || {};
    const today = s.today || {};
    return {
      totalCount: Number(s.totalCount || 0),
      totalAmount: Number(s.totalAmount || 0),
      pending: Number(counts.pending || 0),
      processing: Number(counts.processing || 0),
      successful: Number(counts.successful || 0),
      reject: Number(counts.reject || 0),
      pendingAmt: Number(amounts.pending || 0),
      processingAmt: Number(amounts.processing || 0),
      successfulAmt: Number(amounts.successful || 0),
      rejectAmt: Number(amounts.reject || 0),
      todayCount: Number(today.totalCount || 0),
      todayAmount: Number(today.totalAmount || 0),
    };
  }, [summary]);

  const methodLabel = (m) => ({ bkash: "bKash", nagad: "Nagad", recharge: "Mobile Recharge" }[String(m || "").toLowerCase()] || String(m || "").toUpperCase());
  const typeLabel = (t) => ({ personal: "Personal", agent: "Agent", merchant: "Merchant", gp: "Grameenphone", bl: "Banglalink", robi: "Robi", airtel: "Airtel", teletalk: "Teletalk" }[String(t || "").toLowerCase()] || String(t || "").toUpperCase());

  return (
    <div className="min-h-screen font-mono px-4 py-6 pt-16 md:pt-6 text-white overflow-x-hidden" style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <style jsx global>{`
        :root{--pm-bg:#0b0b0b;--pm-fg:#ffffff;--pm-bg-grad:linear-gradient(180deg,#0b0b0b 0%,#050505 100%);--pm-font:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;}
        html,body{background:var(--pm-bg);color:var(--pm-fg);}
        input,button,select{font-family:var(--pm-font);}
      `}</style>

      <ImageViewModal open={imgModal.open} url={imgModal.url} onClose={() => setImgModal({ open: false, url: "" })} pm={pm} />

      {editMobileModal.open ? (
        <div className="fixed inset-0 z-[81] grid place-items-center bg-black/80 p-4">
          <div className="w-full max-w-sm border" style={{ borderColor: pm.b28, background: "var(--pm-bg)" }}>
            <div className="border-b px-4 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
              <div className="text-[12px] font-black tracking-widest uppercase">Edit Mobile</div>
            </div>
            <div className="p-4 space-y-3">
              <input value={editMobileModal.value} onChange={(e) => setEditMobileModal((p) => ({ ...p, value: String(e.target.value || "").replace(/\D/g, "").slice(0, 11) }))} className="w-full border px-4 py-3 text-sm outline-none" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }} />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setEditMobileModal({ open: false, item: null, value: "", saving: false })} className="border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>Cancel</button>
                <button type="button" onClick={saveEditedMobile} disabled={editMobileModal.saving} className="border px-3 py-3 text-[11px] font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>{editMobileModal.saving ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Saving</span> : <span className="inline-flex items-center gap-2"><Save className="h-4 w-4" />Save</span>}</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}


      <UserHistoryModal
        open={userHist.open}
        pm={pm}
        userId={userHist.userId}
        mobile={userHist.mobile}
        onClose={() => setUserHist({ open: false, userId: "", mobile: "" })}
      />

      <SuccessProofModal open={modal.open && modal.action === "success"} item={modal.item} pm={pm} confirming={confirming} onCancel={closeModal} onConfirm={confirmSuccess} />
      <RejectModal open={modal.open && modal.action === "reject"} item={modal.item} pm={pm} confirming={confirming} onCancel={closeModal} onConfirm={confirmReject} />

      <div className="mx-auto w-full max-w-3xl space-y-3">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] tracking-widest uppercase" style={{ color: pm.fg80 }}>Admin Panel</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase" style={{ color: pm.fg }}>WITHDRAW MANAGER</div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg75 }}>Latest 50 • Fee: {Number(feePercent || 0)}%</div>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}>
              <ShieldCheck className="h-6 w-6" />
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>

            <button
              type="button"
              onClick={refreshAll}
              disabled={loading}
              className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] disabled:opacity-60"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        </div>

        <Block pm={pm} title="ANALYTICS OVERVIEW">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <MiniBox pm={pm} icon={Wallet} label="TOTAL WITHDRAWS" value={String(totals.totalCount)} />
            <MiniBox pm={pm} icon={Wallet} label="TOTAL AMOUNT" value={fmtBDT2(totals.totalAmount)} />
            <MiniBox pm={pm} icon={Clock} label="PENDING" value={`${totals.pending} • ${fmtBDT2(totals.pendingAmt)}`} />
            <MiniBox pm={pm} icon={AlertTriangle} label="PROCESSING" value={`${totals.processing} • ${fmtBDT2(totals.processingAmt)}`} />
            <MiniBox pm={pm} icon={CheckCircle2} label="SUCCESSFUL" value={`${totals.successful} • ${fmtBDT2(totals.successfulAmt)}`} />
            <MiniBox pm={pm} icon={XCircle} label="REJECTED" value={`${totals.reject} • ${fmtBDT2(totals.rejectAmt)}`} />
            <MiniBox pm={pm} icon={Layers} label="TODAY COUNT" value={String(totals.todayCount)} />
            <MiniBox pm={pm} icon={Layers} label="TODAY AMOUNT" value={fmtBDT2(totals.todayAmount)} />
          </div>
          {!summary ? <div className="mt-3 text-[11px]" style={{ color: pm.fg70 }}>Loading summary...</div> : null}
        </Block>

        <Block pm={pm} title="FILTER + SEARCH">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2">
              <div className="mb-2 text-[11px] font-bold tracking-widest uppercase inline-flex items-center gap-2" style={{ color: pm.fg80 }}>
                <Search className="h-4 w-4" /> SEARCH BY MOBILE
              </div>
              <input className={inputBase} style={inputStyle} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 017, 0189, 01XXXXXXXXX" />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={runSearch}
                className="w-full border px-3 py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
                style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
              >
                RUN SEARCH
              </button>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-2 text-[11px] font-bold tracking-widest uppercase inline-flex items-center gap-2" style={{ color: pm.fg80 }}>
              <Filter className="h-4 w-4" /> STATUS FILTER
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill pm={pm} active={status === "all"} onClick={() => setStatus("all")} label="ALL" />
              <Pill pm={pm} active={status === "pending"} onClick={() => setStatus("pending")} label="PENDING" />
              <Pill pm={pm} active={status === "processing"} onClick={() => setStatus("processing")} label="PROCESSING" />
              <Pill pm={pm} active={status === "successful"} onClick={() => setStatus("successful")} label="SUCCESS" />
              <Pill pm={pm} active={status === "reject"} onClick={() => setStatus("reject")} label="REJECT" />
            </div>
          </div>
        </Block>

        <Block pm={pm} title={`WITHDRAW LIST (LATEST • FILTER: ${status.toUpperCase()})`}>
          {listLoading ? (
            <div className="border px-3 py-3 text-[12px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg75 }}>
              Loading withdraws...
            </div>
          ) : !items.length ? (
            <div className="border px-3 py-3 text-[12px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg75 }}>
              No withdraws found.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((w) => (
                <div key={w._id} className="border p-4" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] font-black" style={{ color: pm.fg }}>
                        <span className="border px-3 py-1 text-[10px] font-black tracking-widest uppercase" style={statusBadgeStyle(w.status, pm)}>{fmtBDT0(w.amount)}</span>
                      </div>
                      <div className="mt-2 text-[11px] truncate" style={{ color: pm.fg80 }}>
                        {w.user?.mobile ? <span className="font-black" style={{ color: pm.fg }}>{w.user.mobile}</span> : <span style={{ color: pm.fg70 }}>User: {w.userId}</span>}
                      </div>
                    </div>

                    <span className="shrink-0 border px-3 py-1 text-[10px] font-black tracking-widest uppercase" style={statusBadgeStyle(w.status, pm)}>
                      {String(w.status).toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <KV
                      pm={pm}
                      label="MOBILE"
                      value={w.mobile || "—"}
                      rightSlot={
                        w.mobile ? (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await copyText(w.mobile);
                                  toast.success("Copied");
                                } catch {
                                  toast.error("Copy failed");
                                }
                              }}
                              className="shrink-0 inline-flex items-center justify-center gap-1 border px-2 py-1 text-[10px] font-black tracking-widest uppercase active:scale-[0.99] min-w-[70px]"
                              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
                              aria-label="Copy mobile"
                              title="Copy mobile"
                            >
                              <Copy className="h-3.5 w-3.5" /> COPY
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditMobile(w)}
                              className="shrink-0 inline-flex items-center justify-center gap-1 border px-2 py-1 text-[10px] font-black tracking-widest uppercase active:scale-[0.99] min-w-[70px]"
                              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
                            >
                              <Pencil className="h-3.5 w-3.5" /> EDIT
                            </button>
                          </>
                        ) : null
                      }
                    />
                    <KV pm={pm} label="TIME" value={formatDateTime(w.createdAt)} />
                    <KV pm={pm} label="METHOD" value={methodLabel(w.paymentMethod)} />
                    <KV pm={pm} label="TYPE" value={typeLabel(w.accountType)} />
                    <KV pm={pm} label="AMOUNT" value={fmtBDT2(w.amount)} />
                    <KV pm={pm} label="FEE" value={fmtBDT2(w.feeAmount || 0)} />

                    <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg08 }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>USER DETAILS</div>
                        <button
                          type="button"
                          onClick={() => setUserHist({ open: true, userId: String(w.userId || ""), mobile: String(w.user?.mobile || "") })}
                          className="border px-3 py-2 text-[10px] font-black tracking-widest uppercase active:scale-[0.99]"
                          style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
                        >
                          VIEW HISTORY
                        </button>
                      </div>
                      <div className="mt-2 text-[11px] truncate" style={{ color: pm.fg75 }}>
                        {w.user?.mobile ? w.user.mobile : String(w.userId || "")}
                      </div>
                    </div>

                    {w.note ? <KV pm={pm} label="NOTE" value={w.note} /> : null}

                    {w.paymentProof ? (
                      <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg08 }}>
                        <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>PAYMENT PROOF</div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="border overflow-hidden" style={{ borderColor: pm.b28, background: pm.bg10, aspectRatio: "1/1" }}>
                            <img src={w.paymentProof} alt="proof" className="w-full h-full object-cover block" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setImgModal({ open: true, url: w.paymentProof })}
                            className="border px-3 py-2 text-[11px] font-black tracking-widest uppercase active:scale-[0.99] grid place-items-center"
                            style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg, aspectRatio: "1/1" }}
                          >
                            FULL VIEW
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {String(w.status) === "pending" ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openActionModal(w, "success")}
                        className="w-full border px-4 py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
                        style={{ borderColor: "rgba(16,185,129,0.38)", background: "rgba(16,185,129,0.14)", color: "rgba(167,243,208,0.95)" }}
                      >
                        SUCCESS
                      </button>
                      <button
                        type="button"
                        onClick={() => openActionModal(w, "reject")}
                        className="w-full border px-4 py-3 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
                        style={{ borderColor: "rgba(244,63,94,0.38)", background: "rgba(244,63,94,0.12)", color: "rgba(254,205,211,0.95)" }}
                      >
                        REJECT
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {!listLoading && hasMore ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={moreLoading}
              className="mt-3 w-full border py-3 text-sm font-black tracking-widest uppercase active:scale-[0.99] disabled:opacity-60"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {moreLoading ? (
                  <>
                    LOADING <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  "LOAD MORE (+50)"
                )}
              </span>
            </button>
          ) : null}
        </Block>
      </div>
    </div>
  );
}
