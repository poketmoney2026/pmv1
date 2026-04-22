"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Save, HelpCircle, RotateCcw } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(() => ({
    fg: "var(--pm-fg)", fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)", b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)", bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
  }), []);
}

export default function AdminHelpPage() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [audience, setAudience] = useState("user");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [points, setPoints] = useState([]);

  const load = async (currentAudience = audience) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/help?audience=${currentAudience}`, { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) return toast.error(data?.message || "Failed to load help content");
      setTitle(data?.data?.title || "");
      setText(data?.data?.text || "");
      setIsActive(data?.data?.isActive !== false);
      setPoints(Array.isArray(data?.data?.points) ? data.data.points : []);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(audience); }, [audience]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/help", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, title, text, isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) return toast.error(data?.message || "Save failed");
      toast.success(data?.message || "Saved");
      setTitle(data?.data?.title || "");
      setText(data?.data?.text || "");
      setIsActive(data?.data?.isActive !== false);
      setPoints(Array.isArray(data?.data?.points) ? data.data.points : []);
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto max-w-6xl space-y-3 font-mono">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">Help Page Manager</div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg70 }}>এখান থেকে user এবং agent—দুই ধরনের help text আলাদাভাবে save করতে পারবেন।</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><HelpCircle className="h-5 w-5" /></span>
          </div>
        </div>

        {loading ? (
          <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b28, background: pm.bg06 }}>Loading...</div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-[1.05fr_1fr]">
            <div className="space-y-3 border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
              <div>
                <div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Target Panel</div>
                <div className="grid grid-cols-2 gap-2">
                  {[["user","User Help"],["agent","Agent Help"]].map(([key,label]) => (
                    <button key={key} type="button" onClick={() => setAudience(key)} className="border px-3 py-3 text-sm font-black tracking-widest uppercase" style={{ borderColor: pm.b20, background: audience===key ? pm.bg10 : pm.bg08, color: pm.fg }}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Help Title</div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
              </div>
              <div>
                <div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Help Text</div>
                <textarea rows={22} value={text} onChange={(e) => setText(e.target.value)} className="w-full resize-y border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
                <div className="mt-2 text-[11px]" style={{ color: pm.fg70 }}>প্রতি লাইন আলাদা point হিসেবে show হবে।</div>
              </div>
              <label className="flex items-center gap-3 border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>{audience === "agent" ? "Agent help active" : "User help active"}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => load(audience)} className="inline-flex items-center justify-center gap-2 border px-3 py-3 text-sm font-black tracking-widest uppercase" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}><RotateCcw className="h-4 w-4" /> Reload</button>
                <button type="button" onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 border px-3 py-3 text-sm font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Help"}</button>
              </div>
            </div>

            <div className="space-y-3 border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Preview</div>
              <div className="border p-4" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <div className="text-lg font-black tracking-widest uppercase">{title || (audience === "agent" ? "এজেন্ট সহায়তা নির্দেশিকা" : "ব্যবহার নির্দেশিকা")}</div>
                <div className="mt-3 space-y-3 text-sm leading-6" style={{ color: pm.fg70 }}>
                  {points.length ? points.map((item, idx) => (
                    <div key={`${idx}-${item.slice(0, 24)}`} className="flex items-start gap-3">
                      <span className="mt-[2px] grid h-6 w-6 shrink-0 place-items-center border text-[11px] font-black" style={{ borderColor: pm.b20, background: pm.bg10, color: pm.fg }}>{idx + 1}</span>
                      <p className="min-w-0">{item}</p>
                    </div>
                  )) : <div>No points yet.</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
