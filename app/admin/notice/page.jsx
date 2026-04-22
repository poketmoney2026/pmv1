
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Bell, Loader2, Save, Pencil, Trash2, Power, RotateCcw, PlusCircle } from "lucide-react";
import ThemedModal from "@/components/ThemedModal";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

const emptyForm = {
  id: "",
  title: "NOTICE",
  body: "",
  isActive: true,
  type: "modal",
  intervalMin: 30,
  maxShows: 0,
  targetMobile: "",
};

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

function NoticeCard({ item, pm, onEdit, onToggle, onDelete }) {
  return (
    <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>
            {item.type === "news" ? "News" : "Modal"} • {item.targetMobile ? item.targetMobile : "All users"}
          </div>
          <div className="mt-1 truncate text-base font-black uppercase tracking-widest">{item.title || "NOTICE"}</div>
          <div className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm" style={{ color: pm.fg70 }}>
            {item.body || "No text"}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
            <span className="border px-2 py-1" style={{ borderColor: item.isActive ? "rgba(34,197,94,0.45)" : pm.b20, background: item.isActive ? "rgba(34,197,94,0.12)" : pm.bg08 }}>
              {item.isActive ? "Active" : "Inactive"}
            </span>
            <span className="border px-2 py-1" style={{ borderColor: pm.b20, background: pm.bg08 }}>
              Every {item.intervalMin || 30} min
            </span>
            <span className="border px-2 py-1" style={{ borderColor: pm.b20, background: pm.bg08 }}>
              Max {Number(item.maxShows || 0) || "∞"}
            </span>
          </div>
        </div>
        <div className="grid shrink-0 gap-2">
          <button type="button" onClick={() => onEdit(item)} className="grid h-10 w-10 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg08 }}>
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onToggle(item)} className="grid h-10 w-10 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg08 }}>
            <Power className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onDelete(item)} className="grid h-10 w-10 place-items-center border" style={{ borderColor: "rgba(248,113,113,0.45)", background: "rgba(248,113,113,0.10)" }}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>


      <ThemedModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Notice"
        subtitle="This notice will be removed from the reusable notice list."
      >
        <div className="space-y-3">
          <div className="border px-3 py-3 text-sm leading-6" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg70 }}>
            <div className="font-black" style={{ color: pm.fg }}>{deleteTarget?.title || "NOTICE"}</div>
            <div className="mt-1 whitespace-pre-wrap">{deleteTarget?.body || ""}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setDeleteTarget(null)} className="w-full border py-3 text-[11px] font-black uppercase tracking-widest" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}>Cancel</button>
            <button type="button" onClick={deleteItem} className="w-full border py-3 text-[11px] font-black uppercase tracking-widest" style={{ borderColor: "rgba(248,113,113,0.45)", background: "rgba(248,113,113,0.10)", color: pm.fg }}>Delete</button>
          </div>
        </div>
      </ThemedModal>
    </div>
  );
}

export default function AdminNoticePage() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notice", { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) return toast.error(data?.message || "Failed to load notices");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ ...emptyForm });

  const save = async () => {
    if (!String(form.body || "").trim()) return toast.error("Write a notice first");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notice", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) return toast.error(data?.message || "Save failed");
      toast.success(data?.message || "Saved");
      resetForm();
      await load();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = async (item) => {
    try {
      const res = await fetch("/api/admin/notice", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) return toast.error(data?.message || "Status update failed");
      toast.success(data?.message || "Updated");
      await load();
    } catch {
      toast.error("Network error");
    }
  };

  const requestDeleteItem = (item) => setDeleteTarget(item);

  const deleteItem = async () => {
    const item = deleteTarget;
    if (!item?.id) return;
    try {
      const res = await fetch(`/api/admin/notice?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) return toast.error(data?.message || "Delete failed");
      toast.success(data?.message || "Deleted");
      if (form.id === item.id) resetForm();
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto max-w-5xl space-y-3 font-mono">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">Notice Manager</div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg70 }}>Create, edit, reactivate, deactivate, and delete reusable notices.</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}>
              <Bell className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.05fr_1.2fr]">
          <div className="border p-3 space-y-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>
                {form.id ? "Edit Notice" : "Create Notice"}
              </div>
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 border px-3 py-2 text-[10px] font-black tracking-widest uppercase" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}>
                {form.id ? <RotateCcw className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                {form.id ? "New Notice" : "Reset"}
              </button>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Title</div>
              <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
            </div>
            <div>
              <div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Target Mobile (optional)</div>
              <input value={form.targetMobile} onChange={(e) => setForm((s) => ({ ...s, targetMobile: e.target.value }))} placeholder="Leave empty for all users" className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Type</div>
                <select value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}>
                  <option value="modal">Modal</option>
                  <option value="news">News</option>
                </select>
              </div>
              <div>
                <div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Interval Min</div>
                <input type="number" min="1" value={form.intervalMin} onChange={(e) => setForm((s) => ({ ...s, intervalMin: e.target.value }))} className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
              </div>
              <div>
                <div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Max Shows</div>
                <input type="number" min="0" value={form.maxShows} onChange={(e) => setForm((s) => ({ ...s, maxShows: e.target.value }))} className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
              </div>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Notice Text</div>
              <textarea rows={9} value={form.body} onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))} className="w-full resize-none border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
            </div>
            <label className="flex items-center gap-3 border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))} />
              <span>Notice active</span>
            </label>
            <button type="button" onClick={save} disabled={saving} className="w-full border py-3 text-sm font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
              <span className="inline-flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Save className="h-4 w-4" />{form.id ? "Update Notice" : "Create Notice"}</>}
              </span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg06, color: pm.fg70 }}>
              Saved Notices • {items.length}
            </div>
            {loading ? (
              <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b28, background: pm.bg06 }}>Loading...</div>
            ) : !items.length ? (
              <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b28, background: pm.bg06 }}>No saved notices yet.</div>
            ) : (
              items.map((item) => (
                <NoticeCard
                  key={item.id}
                  item={item}
                  pm={pm}
                  onEdit={(row) => setForm({ ...row })}
                  onToggle={toggleItem}
                  onDelete={requestDeleteItem}
                />
              ))
            )}
          </div>
        </div>
      </div>


      <ThemedModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Notice"
        subtitle="This notice will be removed from the reusable notice list."
      >
        <div className="space-y-3">
          <div className="border px-3 py-3 text-sm leading-6" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg70 }}>
            <div className="font-black" style={{ color: pm.fg }}>{deleteTarget?.title || "NOTICE"}</div>
            <div className="mt-1 whitespace-pre-wrap">{deleteTarget?.body || ""}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setDeleteTarget(null)} className="w-full border py-3 text-[11px] font-black uppercase tracking-widest" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}>Cancel</button>
            <button type="button" onClick={deleteItem} className="w-full border py-3 text-[11px] font-black uppercase tracking-widest" style={{ borderColor: "rgba(248,113,113,0.45)", background: "rgba(248,113,113,0.10)", color: pm.fg }}>Delete</button>
          </div>
        </div>
      </ThemedModal>
    </div>
  );
}
