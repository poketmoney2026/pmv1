"use client";

import { useEffect, useMemo, useState } from "react";
import { Funnel_Display } from "next/font/google";
import { Link2, Copy, Users, User } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(
    () => ({
      fg: "var(--pm-fg)",
      fg60: "color-mix(in srgb, var(--pm-fg) 60%, transparent)",
      fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
      fg75: "color-mix(in srgb, var(--pm-fg) 75%, transparent)",
      fg80: "color-mix(in srgb, var(--pm-fg) 80%, transparent)",
      fg85: "color-mix(in srgb, var(--pm-fg) 85%, transparent)",
      fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
      b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
      b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
      b35: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
      bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
      bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
      bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
      ok: "var(--pm-ok)",
      bad: "var(--pm-bad)",
    }),
    []
  );
}

function PMGlobals() {
  return (
    <style jsx global>{`
      :root {
        --pm-bg: #0b0b0b;
        --pm-fg: #ffffff;
        --pm-bg-grad: linear-gradient(180deg, #0b0b0b 0%, #050505 100%);
        --pm-font: ${funnelDisplay.style.fontFamily}, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          "Liberation Mono", "Courier New", monospace;
        --pm-ok: #22c55e;
        --pm-bad: #ef4444;
      }
      html,
      body {
        background: var(--pm-bg);
        color: var(--pm-fg);
      }
      button,
      input,
      a {
        font-family: var(--pm-font);
      }
    `}</style>
  );
}

function Block({ title, children, pm }) {
  return (
    <div className="select-none border p-4" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}`, color: pm.fg }}>
      <div className="mb-3 text-center text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Avatar({ name, pm }) {
  const letter = String(name || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="grid place-items-center border"
      style={{ width: 38, height: 38, borderRadius: 999, borderColor: pm.b28, background: pm.bg10, boxShadow: `0 0 0 1px ${pm.b20}`, color: pm.fg }}
      aria-label={`Avatar ${letter}`}
      title={letter}
    >
      <span className="text-[13px] font-black tracking-widest">{letter}</span>
    </div>
  );
}

function agoText(iso) {
  if (!iso) return "Joined";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "Joined";
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day >= 30) return `Joined • ${Math.floor(day / 30)} month${Math.floor(day / 30) > 1 ? "s" : ""} ago`;
  if (day >= 7) return `Joined • ${Math.floor(day / 7)} week${Math.floor(day / 7) > 1 ? "s" : ""} ago`;
  if (day >= 1) return `Joined • ${day} day${day > 1 ? "s" : ""} ago`;
  if (hr >= 1) return `Joined • ${hr} hour${hr > 1 ? "s" : ""} ago`;
  return `Joined • ${Math.max(1, min)} min ago`;
}

function RefRow({ name, joinedAt, pm }) {
  return (
    <div className="border px-3 py-3" style={{ borderColor: pm.b28, background: pm.bg08 }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={name} pm={pm} />
          <div className="min-w-0">
            <div className="text-[12px] font-black truncate" style={{ color: pm.fg }}>
              {name}
            </div>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>
              {agoText(joinedAt)}
            </div>
          </div>
        </div>
        <span className="grid h-10 w-10 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
          <User className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default function ReferralPage() {
  const pm = usePM();

  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("https://poketmoney.online/user/signup?");
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/referral", { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) {
          toast.error(data?.message || "Failed to load referral");
          setReferralCode("");
          setReferralLink("https://poketmoney.online/user/signup?");
          setReferrals([]);
          return;
        }
        setReferralCode(String(data?.referralCode || ""));
        setReferralLink(String(data?.referralLink || "https://poketmoney.online/user/signup?"));
        setReferrals(Array.isArray(data?.referrals) ? data.referrals : []);
      } catch {
        if (!alive) return;
        toast.error("Network error");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const copyNow = async () => {
    if (!referralLink) return toast.error("No link");
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Copied");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = referralLink;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        toast.success("Copied");
      } catch {
        toast.error("Copy failed");
      }
    }
  };

  return (
    <div className={`${funnelDisplay.className} select-none mt-12 min-h-[100svh] px-3 py-5`} style={{ background: "var(--pm-bg-grad)", color: pm.fg, fontFamily: "var(--pm-font)" }}>
      <PMGlobals />

      <style>{`
        @keyframes pmCopyPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        .pm-copy-btn{animation:pmCopyPulse 1.9s ease-in-out infinite;transform-origin:center}
        .pm-copy-btn:active{animation:none;transform:scale(.98)}
        @media (prefers-reduced-motion: reduce){.pm-copy-btn{animation:none}}
      `}</style>

      <Toaster position="top-center" toastOptions={{ style: { background: "rgba(10,10,10,0.92)", color: "white", border: "1px solid rgba(255,255,255,0.12)" } }} />

      <div className="mx-auto w-full max-w-md space-y-2">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>
                Referral
              </div>
              <div className="mt-1 text-[18px] font-black tracking-widest uppercase" style={{ color: pm.fg }}>
                SHARE YOUR LINK
              </div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg75, lineHeight: 1.7 }}>
                Copy your referral link and share it with friends.
              </div>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg08 }}>
              <Link2 className="h-6 w-6" />
            </span>
          </div>
        </div>

        <Block pm={pm} title="YOUR REFERRAL LINK">
          <div className="mb-3 border px-3 py-2 text-center text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg90 }}>
            Referral bonus • Share your link and earn rewards when your friends join
          </div>

          <div className="border p-3 flex items-center justify-between gap-2" style={{ borderColor: pm.b28, background: pm.bg08 }}>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>
                LINK
              </div>
              <div className="mt-1 text-[12px] font-black truncate" style={{ color: pm.fg }}>
                {loading ? "Loading..." : referralLink}
              </div>
              <div className="mt-1 text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>
                Code: <span style={{ color: pm.fg }}>{loading ? "..." : referralCode || "N/A"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={copyNow}
              disabled={loading}
              className="pm-copy-btn grid place-items-center border disabled:opacity-60"
              style={{
                width: 44,
                height: 44,
                borderRadius: 0,
                borderColor: pm.b28,
                background: pm.bg10,
                color: pm.fg,
                boxShadow: `0 0 0 1px ${pm.b20}, 0 16px 45px rgba(0,0,0,.45)`,
              }}
              aria-label="Copy referral link"
              title="Copy"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
        </Block>

        <Block pm={pm} title="YOUR REFERRALS">
          <div className="border p-3 flex items-center justify-between gap-2" style={{ borderColor: pm.b28, background: pm.bg08 }}>
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>
                TOTAL REFERRED
              </div>
              <div className="mt-1 text-[16px] font-black tabular-nums" style={{ color: pm.fg }}>
                {loading ? "..." : referrals.length}
              </div>
            </div>
            <span className="grid h-12 w-12 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
              <Users className="h-6 w-6" />
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {loading ? (
              <div className="border px-3 py-3 text-center text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg70 }}>
                Loading...
              </div>
            ) : referrals.length ? (
              referrals.map((r) => <RefRow key={r.id} name={r.name} joinedAt={r.joinedAt} pm={pm} />)
            ) : (
              <div className="border px-3 py-3 text-center text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg70 }}>
                No referrals
              </div>
            )}
          </div>
        </Block>
      </div>
    </div>
  );
}