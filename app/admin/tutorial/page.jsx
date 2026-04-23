"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { BookOpen, Plus, Save, Trash2, Video, FileText } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(() => ({
    fg: "var(--pm-fg)", fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)", b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)", bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
  }), []);
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function AdminTutorialPage() {
  const pm = usePM();
  const [audience, setAudience] = useState("user");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [videos, setVideos] = useState([]);
  const [sections, setSections] = useState([]);

  const load = async (current = audience) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tutorial?audience=${current}`, { credentials: "include", cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.message || "Failed to load tutorial");
      setTitle(json.data?.title || "");
      setIsActive(json.data?.isActive !== false);
      setVideos(Array.isArray(json.data?.videos) ? json.data.videos.map((v, i) => ({ ...v, _localId: v._id || uid(), order: Number(v.order) || i + 1 })) : []);
      setSections(Array.isArray(json.data?.sections) ? json.data.sections.map((s, i) => ({ ...s, _localId: uid(), order: Number(s.order) || i + 1 })) : []);
    } catch (e) {
      toast.error(e?.message || "Failed to load tutorial");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(audience); }, [audience]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        audience,
        title,
        isActive,
        videos: videos
          .map((v, i) => ({ title: v.title || "", url: v.url || "", order: Number.isFinite(Number(v.order)) ? Number(v.order) : i + 1, isActive: v.isActive !== false }))
          .filter((v) => v.title && v.url),
        sections: sections
          .map((s, i) => ({ heading: s.heading || "", content: s.content || "", order: Number.isFinite(Number(s.order)) ? Number(s.order) : i + 1, isActive: s.isActive !== false }))
          .filter((s) => s.heading || s.content),
      };
      const res = await fetch("/api/admin/tutorial", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.message || "Failed to save tutorial");
      toast.success("Tutorial saved");
      await load(audience);
    } catch (e) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addVideo = () => setVideos((prev) => [...prev, { _localId: uid(), title: "", url: "", order: prev.length + 1, isActive: true }]);
  const updateVideo = (id, patch) => setVideos((prev) => prev.map((v) => v._localId === id ? { ...v, ...patch } : v));
  const removeVideo = (id) => setVideos((prev) => prev.filter((v) => v._localId !== id).map((v, i) => ({ ...v, order: i + 1 })));

  const addSection = () => setSections((prev) => [...prev, { _localId: uid(), heading: "", content: "", order: prev.length + 1, isActive: true }]);
  const updateSection = (id, patch) => setSections((prev) => prev.map((s) => s._localId === id ? { ...s, ...patch } : s));
  const removeSection = (id) => setSections((prev) => prev.filter((s) => s._localId !== id).map((s, i) => ({ ...s, order: i + 1 })));

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto w-full max-w-6xl space-y-3 font-mono">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">TUTORIAL MANAGER</div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg70 }}>প্রথমে ভিডিও যোগ করুন, তারপর চাইলে টেক্সট সেকশন যোগ করুন। delete করলে save দেওয়ার পরে সেটি সত্যিই মুছে যাবে।</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><BookOpen className="h-5 w-5" /></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {["user", "agent"].map((a) => {
            const active = audience === a;
            return <button key={a} type="button" onClick={() => setAudience(a)} className="border px-3 py-3 text-sm font-black tracking-widest uppercase" style={{ borderColor: active ? "#fff" : pm.b20, background: active ? pm.bg10 : pm.bg08, color: pm.fg }}>{a === "agent" ? "Agent Tutorial" : "User Tutorial"}</button>;
          })}
        </div>

        {loading ? <div className="text-sm" style={{ color: pm.fg70 }}>Loading...</div> : (
          <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-3 border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
              <div>
                <div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Title</div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
              </div>
              <label className="flex items-center gap-3 border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>{audience === "agent" ? "Agent tutorial active" : "User tutorial active"}</span>
              </label>

              <div className="space-y-3 border p-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Videos First</div>
                  <button type="button" onClick={addVideo} className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b20, background: pm.bg10, color: pm.fg }}><Plus className="h-4 w-4" /> Add Video</button>
                </div>
                <div className="space-y-3">
                  {videos.map((video, idx) => (
                    <div key={video._localId} className="space-y-2 border p-3" style={{ borderColor: pm.b20, background: pm.bg10 }}>
                      <div className="flex items-center justify-between gap-2"><div className="inline-flex items-center gap-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}><Video className="h-4 w-4" /> Video {idx + 1}</div><button type="button" onClick={() => removeVideo(video._localId)} className="inline-flex items-center gap-1 border px-2 py-1 text-[11px]" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}><Trash2 className="h-4 w-4" /> Delete</button></div>
                      <input value={video.title || ""} onChange={(e) => updateVideo(video._localId, { title: e.target.value })} placeholder="Video title" className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
                      <input value={video.url || ""} onChange={(e) => updateVideo(video._localId, { url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
                    </div>
                  ))}
                  {!videos.length ? <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b20, background: pm.bg10, color: pm.fg70 }}>No videos yet. চাইলে এখনই Add Video দিন।</div> : null}
                </div>
              </div>
            </div>

            <div className="space-y-3 border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Text Sections</div>
                <button type="button" onClick={addSection} className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}><Plus className="h-4 w-4" /> Add Text</button>
              </div>
              <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                {sections.map((section, idx) => (
                  <div key={section._localId} className="space-y-2 border p-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                    <div className="flex items-center justify-between gap-2"><div className="inline-flex items-center gap-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}><FileText className="h-4 w-4" /> Text {idx + 1}</div><button type="button" onClick={() => removeSection(section._localId)} className="inline-flex items-center gap-1 border px-2 py-1 text-[11px]" style={{ borderColor: pm.b20, background: pm.bg10, color: pm.fg }}><Trash2 className="h-4 w-4" /> Delete</button></div>
                    <input value={section.heading || ""} onChange={(e) => updateSection(section._localId, { heading: e.target.value })} placeholder="Title / Heading" className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg10, color: pm.fg }} />
                    <textarea rows={6} value={section.content || ""} onChange={(e) => updateSection(section._localId, { content: e.target.value })} placeholder="Content / বিস্তারিত লেখা" className="w-full resize-y border px-3 py-3 text-sm leading-6 outline-none" style={{ borderColor: pm.b20, background: pm.bg10, color: pm.fg }} />
                  </div>
                ))}
                {!sections.length ? <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg70 }}>No text section yet. চাইলে পরে Add Text দিয়ে section যোগ করুন।</div> : null}
              </div>
              <button type="button" onClick={save} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 border px-3 py-3 text-sm font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Tutorial"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
