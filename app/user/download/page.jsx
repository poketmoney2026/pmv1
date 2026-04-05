"use client";

import React, { useMemo, useState } from "react";
import { Funnel_Display } from "next/font/google";
import { Download, Loader2 } from "lucide-react";
import { FaAndroid } from "react-icons/fa";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });
const FILE_PATH = "/apps/app.apk";

function usePM() {
  return useMemo(() => ({
    bg: "var(--pm-bg)",
    fg: "var(--pm-fg)",
    fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
    fg85: "color-mix(in srgb, var(--pm-fg) 85%, transparent)",
    fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
    b06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
    b10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
    b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
    b26: "color-mix(in srgb, var(--pm-fg) 26%, transparent)",
    ok: "var(--pm-ok)",
  }), []);
}

function PMGlobals() {
  return (
    <style jsx global>{`
      :root {
        --pm-bg: #0b0b0b;
        --pm-fg: #ffffff;
        --pm-font: ${funnelDisplay.style.fontFamily}, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          "Liberation Mono", "Courier New", monospace;
        --pm-ok: #22c55e;
      }
      html, body { background: var(--pm-bg); color: var(--pm-fg); }
      button, input, a { font-family: var(--pm-font); }
    `}</style>
  );
}

function Block({ title, children, pm }) {
  return (
    <div className="select-none border p-3" style={{ borderColor: pm.b20, background: pm.b06, boxShadow: `0 0 0 1px ${pm.b10}` }}>
      <div className="mb-2 text-center text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>{title}</div>
      {children}
    </div>
  );
}

export default function DownloadPage() {
  const pm = usePM();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const link = document.createElement("a");
      link.href = `${FILE_PATH}?v=static`;
      link.setAttribute("download", "app.apk");
      link.setAttribute("target", "_self");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      window.setTimeout(() => setDownloading(false), 600);
    }
  };

  return (
    <div className={`${funnelDisplay.className} select-none min-h-[100svh] px-3 font-medium`} style={{ background: 'var(--pm-bg)', color: 'var(--pm-fg)', fontFamily: 'var(--pm-font)' }}>
      <PMGlobals />
      <div className="min-h-[100svh] grid place-items-center py-3">
        <div className="w-full max-w-sm space-y-2">
          <Block pm={pm} title="DOWNLOAD ANDROID">
            <div className="space-y-3">
              <div className="mx-auto grid place-items-center border" style={{ width: 96, height: 96, borderColor: pm.b20, background: pm.b10, boxShadow: `0 0 0 1px ${pm.b10}` }}>
                <FaAndroid size={46} style={{ color: pm.ok }} />
              </div>
              <div className="text-center">
                <div className="text-sm font-black">app.apk</div>
                <div className="mt-1 text-[11px]" style={{ color: pm.fg70 }}>Downloads the fixed public file: /public/apps/app.apk</div>
              </div>
              <button type="button" onClick={handleDownload} disabled={downloading} className="w-full border py-2.5 text-[13px] font-black active:scale-[0.99] disabled:opacity-60" style={{ borderColor: pm.b26, background: pm.b10, color: pm.fg }}>
                <span className="inline-flex items-center justify-center gap-2">{downloading ? <><Loader2 className="h-4 w-4 animate-spin" />DOWNLOADING...</> : <><Download className="h-4 w-4" />DOWNLOAD APP</>}</span>
              </button>
            </div>
          </Block>
        </div>
      </div>
    </div>
  );
}
