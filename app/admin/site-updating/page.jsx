"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { BellRing, Loader2, Save, Wrench, Clock3, CheckCircle2, CalendarClock } from "lucide-react";
import ThemedModal from "@/components/ThemedModal";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });
const PRESET_MINUTES = [5, 10, 15, 20, 30, 45, 60, 90, 120];

function usePM() {
  return useMemo(
    () => ({
      fg: "var(--pm-fg)",
      fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
      b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
      b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
      bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
      bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
      bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
    }),
    []
  );
}

function toParts(value) {
  if (!value) return { date: "", hour: "00", minute: "00" };
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return { date: "", hour: "00", minute: "00" };
  const offsetMs = dt.getTimezoneOffset() * 60 * 1000;
  const local = new Date(dt.getTime() - offsetMs);
  return {
    date: local.toISOString().slice(0, 10),
    hour: local.toISOString().slice(11, 13),
    minute: local.toISOString().slice(14, 16),
  };
}

function partsToIso(parts) {
  const date = String(parts?.date || "").trim();
  const hour = String(parts?.hour || "").trim();
  const minute = String(parts?.minute || "").trim();
  if (!date) return null;
  const h = Math.max(0, Math.min(23, Number(hour || 0)));
  const m = Math.max(0, Math.min(59, Number(minute || 0)));
  const dt = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

function formatLocal(value) {
  if (!value) return "Not set";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "Invalid time";
  return dt.toLocaleString();
}

function ScheduleCard({ label, value, onOpen, pm }) {
  return (
    <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>{label}</div>
          <div className="mt-1 text-sm font-black break-words">{formatLocal(value)}</div>
        </div>
        <button type="button" onClick={onOpen} className="shrink-0 border px-3 py-3 text-[11px] font-black uppercase tracking-widest" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
          Edit
        </button>
      </div>
    </div>
  );
}

function SchedulePickerModal({ open, onClose, title, value, onSave, pm }) {
  const [form, setForm] = useState({ date: "", hour: "00", minute: "00" });

  useEffect(() => {
    if (!open) return;
    setForm(toParts(value));
  }, [open, value]);

  const submit = () => {
    const iso = partsToIso(form);
    if (!iso) {
      toast.error("সঠিক তারিখ ও সময় দিন");
      return;
    }
    onSave(iso);
    onClose();
  };

  return (
    <ThemedModal open={open} onClose={onClose} title={title} subtitle="এখানে custom date ও time দিন। mobile-এর default picker আর open হবে না.">
      <div className="space-y-3">
        <div>
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: pm.fg70 }}>Date</div>
          <input value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} placeholder="YYYY-MM-DD" className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: pm.fg70 }}>Hour</div>
            <input value={form.hour} onChange={(e) => setForm((s) => ({ ...s, hour: e.target.value.replace(/[^0-9]/g, "").slice(0, 2) }))} placeholder="00-23" className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
          </div>
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: pm.fg70 }}>Minute</div>
            <input value={form.minute} onChange={(e) => setForm((s) => ({ ...s, minute: e.target.value.replace(/[^0-9]/g, "").slice(0, 2) }))} placeholder="00-59" className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="w-full border py-3 text-[11px] font-black uppercase tracking-widest" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}>Cancel</button>
          <button type="button" onClick={submit} className="w-full border py-3 text-[11px] font-black uppercase tracking-widest" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>Apply</button>
        </div>
      </div>
    </ThemedModal>
  );
}

export default function AdminSiteUpdatingPage() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [form, setForm] = useState({ startAt: "", endAt: "", notifyEveryMin: "30", isActive: false });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/site-update", { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Failed to load");
      const next = data?.data || {};
      setForm({
        startAt: next.startAt || "",
        endAt: next.endAt || "",
        notifyEveryMin: String(next.notifyEveryMin || 30),
        isActive: Boolean(next.isActive),
      });
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        startAt: form.startAt || null,
        endAt: form.endAt || null,
        notifyEveryMin: Number(form.notifyEveryMin || 30),
      };
      const res = await fetch("/api/admin/site-update", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Save failed");
      toast.success(data?.message || "Saved");
      const next = data?.data || {};
      setForm({
        startAt: next.startAt || "",
        endAt: next.endAt || "",
        notifyEveryMin: String(next.notifyEveryMin || 30),
        isActive: Boolean(next.isActive),
      });
      setNotifyModalOpen(false);
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const statusText = form.startAt && form.endAt ? "Schedule ready" : "No active schedule";

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto max-w-md space-y-3 font-mono md:max-w-3xl">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">Update</div>
              <div className="mt-2 text-[10px]" style={{ color: pm.fg70 }}>Set update window and control how often users see the pre-update warning.</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}>
              <Wrench className="h-5 w-5" />
            </span>
          </div>
        </div>

        {loading ? (
          <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b28, background: pm.bg06 }}>Loading...</div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="border p-3 space-y-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
              <ScheduleCard label="Update Starting" value={form.startAt} onOpen={() => setStartModalOpen(true)} pm={pm} />
              <ScheduleCard label="Update Ending" value={form.endAt} onOpen={() => setEndModalOpen(true)} pm={pm} />

              <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Notify Interval</div>
                    <div className="mt-1 text-sm font-black">Every {form.notifyEveryMin} minute{Number(form.notifyEveryMin) === 1 ? "" : "s"}</div>
                  </div>
                  <button type="button" onClick={() => setNotifyModalOpen(true)} className="inline-flex items-center gap-2 border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
                    <BellRing className="h-4 w-4" />
                    Notify
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm((s) => ({ ...s, startAt: "", endAt: "" }))} className="w-full border py-3 text-sm font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg }}>
                  Clear
                </button>
                <button type="button" onClick={save} disabled={saving} className="w-full border py-3 text-sm font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
                  <span className="inline-flex items-center justify-center gap-2">{saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Save className="h-4 w-4" />Save</>}</span>
                </button>
              </div>
            </div>

            <div className="border p-3 space-y-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
              <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <div className="flex items-center gap-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}><CheckCircle2 className="h-4 w-4" /> Status</div>
                <div className="mt-2 text-sm font-black">{statusText}</div>
              </div>
              <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <div className="flex items-center gap-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}><Clock3 className="h-4 w-4" /> Preview</div>
                <div className="mt-2 text-[11px] leading-6" style={{ color: pm.fg70 }}>
                  Users will get a closable warning modal before update starts. During active update, a full blocking modal will stay visible until the end time.
                </div>
              </div>
              <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <div className="flex items-center gap-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}><CalendarClock className="h-4 w-4" /> Current Window</div>
                <div className="mt-2 text-[11px] leading-6" style={{ color: pm.fg70 }}>
                  Start: {formatLocal(form.startAt)}
                  <br />
                  End: {formatLocal(form.endAt)}
                </div>
              </div>
            </div>
          </div>
        )}

        <ThemedModal open={notifyModalOpen} onClose={() => setNotifyModalOpen(false)} title="Select notify time" subtitle="Choose how often the warning modal appears before update starts.">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {PRESET_MINUTES.map((mins) => {
                const active = String(mins) === String(form.notifyEveryMin);
                return (
                  <button key={mins} type="button" onClick={() => setForm((s) => ({ ...s, notifyEveryMin: String(mins) }))} className="border px-2 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: active ? "color-mix(in srgb, var(--pm-fg) 55%, transparent)" : pm.b20, background: active ? pm.bg10 : pm.bg08, color: pm.fg }}>
                    {mins}m
                  </button>
                );
              })}
            </div>
            <div>
              <div className="mb-2 text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Custom minutes</div>
              <input type="number" min="1" value={form.notifyEveryMin} onChange={(e) => setForm((s) => ({ ...s, notifyEveryMin: e.target.value }))} className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
            </div>
            <button type="button" onClick={() => setNotifyModalOpen(false)} className="w-full border py-3 text-sm font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>Done</button>
          </div>
        </ThemedModal>

        <SchedulePickerModal open={startModalOpen} onClose={() => setStartModalOpen(false)} title="Update Starting" value={form.startAt} onSave={(iso) => setForm((s) => ({ ...s, startAt: iso }))} pm={pm} />
        <SchedulePickerModal open={endModalOpen} onClose={() => setEndModalOpen(false)} title="Update Ending" value={form.endAt} onSave={(iso) => setForm((s) => ({ ...s, endAt: iso }))} pm={pm} />
      </div>
    </div>
  );
}
