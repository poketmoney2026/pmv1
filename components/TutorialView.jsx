"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { BookOpen, PlayCircle } from "lucide-react";

const YouTube = dynamic(() => import("react-youtube"), { ssr: false });
const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(() => ({
    fg: "var(--pm-fg)", fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)", b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)", bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
  }), []);
}

function MarqueeTitle({ text, pm }) {
  return (
    <div className="overflow-hidden whitespace-nowrap border px-3 py-2 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}>
      <div className="inline-block min-w-full animate-[tutorial-marquee_14s_linear_infinite] pr-8">{text}</div>
    </div>
  );
}

function extractYouTubeId(url = "") {
  const raw = String(url || "").trim();
  if (!raw) return "";
  const short = raw.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
  if (short?.[1]) return short[1];
  const embed = raw.match(/youtube\.com\/(?:embed|shorts)\/([A-Za-z0-9_-]{6,})/i);
  if (embed?.[1]) return embed[1];
  try {
    const u = new URL(raw);
    const v = u.searchParams.get("v");
    if (v) return v;
  } catch {}
  return raw;
}

function YouTubeCard({ video, idx, pm }) {
  const videoId = extractYouTubeId(video?.url);
  const opts = {
    width: "100%",
    height: "100%",
    playerVars: {
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
    },
  };

  return (
    <div className="space-y-2 border p-3 min-w-0" style={{ borderColor: pm.b28, background: pm.bg06 }}>
      <MarqueeTitle text={video.title || `ভিডিও ${idx + 1}`} pm={pm} />
      <div className="overflow-hidden rounded-2xl border min-w-0" style={{ borderColor: pm.b20, background: pm.bg08 }}>
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          {videoId ? (
            <YouTube
              videoId={videoId}
              opts={opts}
              className="absolute inset-0 h-full w-full [&_iframe]:h-full [&_iframe]:w-full"
              iframeClassName="h-full w-full"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center px-4 text-center text-sm" style={{ color: pm.fg70 }}>
              <div className="space-y-2">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border" style={{ borderColor: pm.b20, background: pm.bg10 }}><PlayCircle className="h-6 w-6" /></div>
                <p>ভিডিও লিংক ঠিক নেই। admin panel থেকে valid YouTube link দিন।</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TutorialView({ audience = "user", introLabel = "User" }) {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ title: "", sections: [], videos: [] });

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tutorial?audience=${audience}`, { credentials: "include", cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!live) return;
        if (!res.ok || !json?.ok) return toast.error(json?.message || "Failed to load tutorial");
        setData({
          title: json?.data?.title || "টিউটোরিয়াল",
          sections: Array.isArray(json?.data?.sections) ? json.data.sections.filter((s) => s?.isActive !== false) : [],
          videos: Array.isArray(json?.data?.videos) ? json.data.videos.filter((v) => v?.isActive !== false) : [],
        });
      } catch (e) {
        if (live) toast.error(e?.message || "Failed to load tutorial");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [audience]);

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <style jsx global>{`
        @keyframes tutorial-marquee { 0% { transform: translateX(100%);} 100% { transform: translateX(-100%);} }
      `}</style>
      <div className="mx-auto w-full max-w-6xl space-y-3 font-mono">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>{introLabel}</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">{data.title || "টিউটোরিয়াল"}</div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg70 }}>প্রথমে ভিডিও দেখুন, তারপর নিচের লিখিত section পড়ে প্রতিটি page-এর কাজ বুঝে নিন।</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><BookOpen className="h-5 w-5" /></span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 min-w-0">
          {(data.videos || []).map((video, idx) => (
            <YouTubeCard key={video._id || idx} video={video} idx={idx} pm={pm} />
          ))}
          {!loading && !(data.videos || []).length ? (
            <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b28, background: pm.bg06, color: pm.fg70 }}>এখনও কোনো tutorial video যোগ করা হয়নি। admin panel থেকে video add করলে এখানে দেখাবে।</div>
          ) : null}
        </div>

        <div className="space-y-3 border p-3 md:p-4" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          {loading ? <div className="text-sm" style={{ color: pm.fg70 }}>Loading tutorial...</div> : (
            <div className="space-y-3">
              {(data.sections || []).map((section, idx) => (
                <div key={`${idx}-${section.heading}`} className="border p-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                  <div className="text-sm font-black tracking-widest uppercase" style={{ color: pm.fg }}>{section.heading}</div>
                  <div className="mt-3 text-sm leading-7 whitespace-pre-wrap" style={{ color: pm.fg70 }}>{section.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
