"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PhoneCall, Send, ArrowUpRight, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { FiArrowLeft } from "react-icons/fi";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(
    () => ({
      fg: "var(--pm-fg)",
      fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
      fg80: "color-mix(in srgb, var(--pm-fg) 80%, transparent)",
      fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
      b18: "color-mix(in srgb, var(--pm-fg) 18%, transparent)",
      b22: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
      b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
      b35: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
      bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
      bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
      bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
    }),
    []
  );
}

function Block({ title, children, pm }) {
  return (
    <div className="select-none border p-3 overflow-hidden" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}`, color: pm.fg }}>
      <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ActionLink({ href, label, sub, icon: Icon, disabled, pm, ctaText = "GO" }) {
  return (
    <a
      href={disabled ? "#" : href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => disabled && e.preventDefault()}
      className={[
        "select-none flex items-center justify-between gap-3 border px-3 py-3 active:scale-[0.99]",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
      aria-disabled={disabled}
      style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg }}
    >
      <span className="inline-flex items-center gap-3 min-w-0">
        <span className="grid h-10 w-10 shrink-0 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}>
          <Icon className="h-5 w-5" style={{ color: pm.fg }} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-black truncate" style={{ color: pm.fg }}>
            {label}
          </span>
          <span className="block text-[11px] truncate" style={{ color: pm.fg70 }}>
            {sub}
          </span>
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-black tracking-widest" style={{ color: pm.fg90 }}>
        {ctaText} <ArrowUpRight className="h-4 w-4" />
      </span>
    </a>
  );
}

const normalizeWa = (v) => {
  const d = String(v || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("01")) return `https://wa.me/${"880" + d.slice(1)}?text=I%20need%20support`;
  if (d.length === 13 && d.startsWith("8801")) return `https://wa.me/${d}?text=I%20need%20support`;
  if (String(v || "").startsWith("https://wa.me/")) return String(v);
  return "";
};

const normalizeTg = (v) => {
  const s = String(v || "").trim();
  if (!s) return "";
  const m = s.match(/t\.me\/([A-Za-z0-9_]{3,})/i);
  if (m?.[1]) return `https://t.me/${m[1]}`;
  const u = s.replace(/^@+/, "");
  if (!/^[A-Za-z0-9_]{3,32}$/.test(u)) return "";
  return `https://t.me/${u}`;
};

const normalizeTgGroup = (v) => {
  const s = String(v || "").trim();
  if (!s) return "";
  const t = s.replace(/^http:\/\//i, "https://");
  if (/^https:\/\/t\.me\/\+/.test(t)) return t;
  if (/^https:\/\/t\.me\/joinchat\//i.test(t)) return t;
  if (/^https:\/\/t\.me\//i.test(t)) return t;
  const m = s.match(/t\.me\/(.+)/i);
  if (m?.[1]) return `https://t.me/${m[1].trim()}`;
  const u = s.replace(/^@+/, "");
  if (!/^[A-Za-z0-9_]{3,64}$/.test(u)) return "";
  return `https://t.me/${u}`;
};

export default function Contact() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ whatsappLink: "", telegramLink: "", telegramGroupLink: "" });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/contact-links", { method: "GET", credentials: "include" });
        const j = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) {
          toast.error(j?.message || "Failed to load contact links");
          setData({ whatsappLink: "", telegramLink: "", telegramGroupLink: "" });
          return;
        }
        const d = j?.data || {};
        setData({
          whatsappLink: normalizeWa(d?.contactWhatsApp || d?.whatsappLink || ""),
          telegramLink: normalizeTg(d?.contactTelegram || d?.telegramLink || ""),
          telegramGroupLink: normalizeTgGroup(d?.contactTelegramGroup || d?.telegramGroupLink || ""),
        });
      } catch {
        if (!alive) return;
        toast.error("Network error");
        setData({ whatsappLink: "", telegramLink: "", telegramGroupLink: "" });
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const whatsappDisabled = !data.whatsappLink || loading;
  const telegramDisabled = !data.telegramLink || loading;
  const telegramGroupDisabled = !data.telegramGroupLink || loading;

  return (
    <div className={`${funnelDisplay.className} select-none min-h-[100svh] mt-14 px-3 py-4 font-medium`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <style jsx global>{`
        :root {
          --pm-bg: #0b0b0b;
          --pm-fg: #ffffff;
          --pm-bg-grad: linear-gradient(180deg, #0b0b0b 0%, #050505 100%);
          --pm-font: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        html,
        body {
          background: var(--pm-bg);
          color: var(--pm-fg);
        }
        input,
        button {
          font-family: var(--pm-font);
        }
      `}</style>

      <div className="mx-auto w-full max-w-sm space-y-2" style={{ fontFamily: "var(--pm-font)" }}>
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
            >
              <FiArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg90 }}>
              CONTACT SUPPORT
            </div>
            <span className="w-[64px]" />
          </div>
        </div>

        <Block title="QUICK CONTACT" pm={pm}>
          <div className="grid grid-cols-1 gap-2">
            <ActionLink
              pm={pm}
              href={data.whatsappLink}
              label="WhatsApp Support"
              sub={loading ? "Loading..." : data.whatsappLink ? "Opens chat in a new tab" : "Not configured"}
              icon={PhoneCall}
              disabled={whatsappDisabled}
              ctaText="GO"
            />
            <ActionLink
              pm={pm}
              href={data.telegramLink}
              label="Telegram Support"
              sub={loading ? "Loading..." : data.telegramLink ? "Opens chat in a new tab" : "Not configured"}
              icon={Send}
              disabled={telegramDisabled}
              ctaText="GO"
            />
            <ActionLink
              pm={pm}
              href={data.telegramGroupLink}
              label="Telegram Group"
              sub={loading ? "Loading..." : data.telegramGroupLink ? "Opens group in a new tab" : "Not configured"}
              icon={Users}
              disabled={telegramGroupDisabled}
              ctaText="JOIN"
            />
          </div>

          <div className="mt-3 text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>
            Support links are loaded from server.
          </div>
        </Block>
      </div>
    </div>
  );
}