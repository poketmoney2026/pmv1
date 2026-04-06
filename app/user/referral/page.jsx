"use client";

import { useEffect, useMemo, useState } from "react";
import { Funnel_Display } from "next/font/google";
import { Copy, Link2, Users, UserRound } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

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

async function copyText(value, label) {
  const text = String(value || "").trim();
  if (!text) return toast.error("Nothing to copy");
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      el.setSelectionRange(0, text.length);
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    toast.success(`${label} copied`);
  } catch {
    toast.error("Copy failed");
  }
}

function SquareAction({ onClick, icon: Icon, label, pm }) {
  return (
    <button type="button" onClick={onClick} className="grid h-12 w-12 shrink-0 place-items-center border transition-transform active:scale-[0.98]" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }} aria-label={label}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

function agoText(iso) {
  if (!iso) return "Joined";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs >= 1) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const mins = Math.max(1, Math.floor(diff / 60000));
  return `${mins} min ago`;
}

export default function ReferralPage() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/referral", { credentials: "include", cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!live) return;
        if (!res.ok) return toast.error(data?.message || "Failed to load referral");
        setReferralCode(String(data?.referralCode || ""));
        setReferralLink(String(data?.referralLink || ""));
        setReferrals(Array.isArray(data?.referrals) ? data.referrals : []);
      } catch {
        if (live) toast.error("Network error");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  return (
    <div className={`${funnelDisplay.className} mt-12 min-h-[100svh] px-3 py-5`} style={{ background: "var(--pm-bg-grad)", color: pm.fg, fontFamily: "var(--pm-font)" }}>
      <div className="mx-auto max-w-md space-y-3">
        <div className="border p-4" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="text-center text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: pm.fg85 }}>Referral</div>
          <div className="mt-2 text-center text-[12px]" style={{ color: pm.fg70 }}>Share your link or code to invite friends.</div>
        </div>

        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="mb-2 text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: pm.fg70 }}>Referral Link</div>
          <div className="flex items-center gap-2">
            <div className="flex h-12 min-w-0 flex-1 items-center overflow-hidden border px-3 text-[11px] font-black" style={{ borderColor: pm.b20, background: pm.bg08 }}>{loading ? "Loading..." : (referralLink || "N/A")}</div>
            <SquareAction onClick={() => referralLink && copyText(referralLink, "Referral link")} icon={Link2} label="Copy referral link" pm={pm} />
          </div>
        </div>

        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="mb-2 text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: pm.fg70 }}>Referral Code</div>
          <div className="flex items-center gap-2">
            <div className="flex h-12 min-w-0 flex-1 items-center overflow-hidden border px-3 text-[12px] font-black tracking-[0.18em] uppercase" style={{ borderColor: pm.b20, background: pm.bg08 }}>{loading ? "..." : (referralCode || "N/A")}</div>
            <SquareAction onClick={() => referralCode && copyText(referralCode, "Referral code")} icon={Copy} label="Copy referral code" pm={pm} />
          </div>
        </div>

        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="flex items-center justify-between gap-3 border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
            <div>
              <div className="text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: pm.fg70 }}>Total Referral</div>
              <div className="mt-1 text-[22px] font-black tabular-nums">{loading ? "..." : referrals.length}</div>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}>
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="mb-3 text-center text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: pm.fg70 }}>Referred Users</div>
          <div className="space-y-2">
            {loading ? <div className="border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>Loading...</div> : referrals.length ? referrals.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <div className="inline-flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><UserRound className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-black">{row.name}</div>
                    <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>{agoText(row.joinedAt)}</div>
                  </div>
                </div>
              </div>
            )) : <div className="border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg70 }}>No referrals yet.</div>}
          </div>
        </div>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
