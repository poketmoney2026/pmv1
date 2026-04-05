"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Bell, Loader2, Save } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(() => ({ fg: "var(--pm-fg)", fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)", b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)", bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)" }), []);
}

export default function AdminNoticePage() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "NOTICE", body: "", isActive: true });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notice", { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Failed to load");
      setForm(data?.data || { title: "NOTICE", body: "", isActive: true });
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
      const res = await fetch("/api/admin/notice", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Save failed");
      toast.success(data?.message || "Saved");
      setForm(data?.data || form);
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto max-w-md space-y-3 font-mono">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div><div className="mt-1 text-lg font-black tracking-widest uppercase">Notice</div></div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><Bell className="h-5 w-5" /></span>
          </div>
        </div>

        {loading ? <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b28, background: pm.bg06 }}>Loading...</div> : (
          <div className="border p-3 space-y-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
            <div>
              <div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Title</div>
              <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
            </div>
            <div>
              <div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Notice Text</div>
              <textarea rows={9} value={form.body} onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))} className="w-full border px-3 py-3 text-sm outline-none resize-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
            </div>
            <label className="flex items-center gap-3 border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))} />
              <span>Notice active</span>
            </label>
            <button type="button" onClick={save} disabled={saving} className="w-full border py-3 text-sm font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
              <span className="inline-flex items-center justify-center gap-2">{saving ? <><Loader2 className="h-4 w-4 animate-spin" />SAVING...</> : <><Save className="h-4 w-4" />SAVE NOTICE</>}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
