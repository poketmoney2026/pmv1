"use client";

import { useEffect, useMemo, useState } from "react";
import { Funnel_Display } from "next/font/google";
import { Bell } from "lucide-react";
import toast from "react-hot-toast";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(() => ({ fg: "var(--pm-fg)", fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)", b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)" }), []);
}

export default function UserNoticePage() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ title: "NOTICE", body: "", isActive: false });

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/notice", { credentials: "include", cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!live) return;
        if (!res.ok) return toast.error(data?.message || "Failed to load");
        setNotice(data?.data || { title: "NOTICE", body: "", isActive: false });
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
      <div className="mx-auto max-w-md space-y-3 font-mono">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>User</div><div className="mt-1 text-lg font-black tracking-widest uppercase">Notice</div></div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg08 }}><Bell className="h-5 w-5" /></span>
          </div>
        </div>
        <div className="border p-4" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          {loading ? <div className="text-sm">Loading...</div> : notice.isActive ? (
            <>
              <div className="text-[12px] font-black tracking-[0.25em] uppercase">{notice.title || "NOTICE"}</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-6" style={{ color: pm.fg }}>{notice.body || "No notice text."}</div>
            </>
          ) : <div className="text-sm" style={{ color: pm.fg70 }}>No active notice right now.</div>}
        </div>
      </div>
    </div>
  );
}
