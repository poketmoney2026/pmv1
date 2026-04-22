"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { HelpCircle } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(() => ({
    fg: "var(--pm-fg)", fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)", b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)", bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
  }), []);
}

export default function AgentHelpPage() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ title: "", points: [] });

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/help?audience=agent", { credentials: "include", cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!live) return;
        if (!res.ok || !json?.ok) return toast.error(json?.message || "Failed to load help");
        setData({ title: json?.data?.title || "এজেন্ট সহায়তা নির্দেশিকা", points: Array.isArray(json?.data?.points) ? json.data.points : [] });
      } catch {
        if (live) toast.error("Network error");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto max-w-4xl space-y-3 font-mono">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Agent</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">{data.title || "এজেন্ট সহায়তা নির্দেশিকা"}</div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg70 }}>এখানে এজেন্ট প্যানেলের প্রতিটি কাজ ধাপে ধাপে বুঝিয়ে দেওয়া হয়েছে।</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><HelpCircle className="h-5 w-5" /></span>
          </div>
        </div>

        <div className="border p-3 md:p-4" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          {loading ? (
            <div className="text-sm" style={{ color: pm.fg70 }}>Loading help...</div>
          ) : (
            <div className="space-y-3">
              {(data.points || []).map((item, idx) => (
                <div key={`${idx}-${item.slice(0, 24)}`} className="flex items-start gap-3 border p-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                  <span className="grid h-7 w-7 shrink-0 place-items-center border text-[11px] font-black" style={{ borderColor: pm.b20, background: pm.bg10, color: pm.fg }}>{idx + 1}</span>
                  <p className="min-w-0 text-sm leading-6" style={{ color: pm.fg70 }}>{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
