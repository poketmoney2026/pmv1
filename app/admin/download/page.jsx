"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Download, Upload, Loader2, FileArchive } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(() => ({
    fg: "var(--pm-fg)",
    fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
    fg85: "color-mix(in srgb, var(--pm-fg) 85%, transparent)",
    b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
    b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
    bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
    bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
    bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
  }), []);
}

function Block({ title, children, pm }) {
  return <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}><div className="mb-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg85 }}>{title}</div>{children}</div>;
}

function fmtBytes(bytes) {
  const n = Number(bytes || 0);
  if (!n) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminDownloadPage() {
  const pm = usePM();
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/download", { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Failed to load");
      setMeta(data?.data || null);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const upload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/download", { method: "POST", credentials: "include", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Upload failed");
      toast.success(data?.message || "Uploaded");
      setMeta(data?.data || null);
      setFile(null);
      await load();
    } catch {
      toast.error("Network error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto max-w-md space-y-3 font-mono">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">Download Upload</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><Download className="h-5 w-5" /></span>
          </div>
        </div>

        <Block title="Current App File" pm={pm}>
          {loading ? <div className="text-sm">Loading...</div> : meta ? (
            <div className="space-y-2">
              <div className="border px-3 py-2 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <div className="font-black">{meta.originalName || meta.fileName}</div>
                <div className="mt-1 text-[11px]" style={{ color: pm.fg70 }}>{fmtBytes(meta.size)}{meta.updatedAt ? ` • ${new Date(meta.updatedAt).toLocaleString()}` : ""}</div>
              </div>
              <a href={`/api/download/app?filename=${encodeURIComponent(meta.originalName || meta.fileName || "app.apk")}`} className="flex items-center justify-center gap-2 border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
                <Download className="h-4 w-4" /> DOWNLOAD CURRENT FILE
              </a>
            </div>
          ) : <div className="text-sm" style={{ color: pm.fg70 }}>No file uploaded yet.</div>}
        </Block>

        <Block title="Upload New File" pm={pm}>
          <div className="space-y-3">
            <label className="block border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>
              <div className="mb-2 text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Select file</div>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
            </label>
            {file ? <div className="flex items-center gap-2 border px-3 py-2 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}><FileArchive className="h-4 w-4" /> {file.name}</div> : null}
            <button type="button" onClick={upload} disabled={!file || uploading} className="w-full border py-3 text-sm font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
              <span className="inline-flex items-center justify-center gap-2">{uploading ? <><Loader2 className="h-4 w-4 animate-spin" />UPLOADING...</> : <><Upload className="h-4 w-4" />UPLOAD FILE</>}</span>
            </button>
          </div>
        </Block>
      </div>
    </div>
  );
}
