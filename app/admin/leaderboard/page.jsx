"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Gift, Loader2, Trophy, X } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(() => ({
    fg: "var(--pm-fg)",
    fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
    b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
    b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
    bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
    bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
    bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
    violetBd: "rgba(139,92,246,0.42)",
    violetBg: "rgba(139,92,246,0.18)",
  }), []);
}

function money(n) {
  return `Tk ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PrizeCard({ title, amount, pm }) {
  return <div className="border p-3" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>{title}</div><div className="mt-1 font-black">{money(amount)}</div></div>;
}

function Countdown({ nextGiveawayAt }) {
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => { const t = setInterval(() => setNowMs(Date.now()), 1000); setNowMs(Date.now()); return () => clearInterval(t); }, []);
  const diff = nowMs > 0 ? Math.max(0, Number(nextGiveawayAt || 0) - nowMs) : 0;
  const total = Math.floor(diff / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return <div className="font-black tabular-nums tracking-widest">{String(days).padStart(2, '0')}:{String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</div>;
}

function ConfirmModal({ open, onClose, onConfirm, pm, busy }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-sm border p-4" style={{ borderColor: pm.b28, background: 'var(--pm-bg)', color: pm.fg }}>
        <div className="flex items-center justify-between gap-3 border-b pb-3" style={{ borderColor: pm.b20 }}>
          <div>
            <div className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: pm.fg70 }}>Giveaway</div>
            <div className="mt-1 text-base font-black tracking-widest uppercase">Confirm Giveaway</div>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg08 }}><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 text-sm leading-6" style={{ color: pm.fg }}>This will distribute leaderboard giveaway rewards based on the current claim ranking.</div>
        <button type="button" onClick={onConfirm} disabled={busy} className="mt-4 w-full border py-3 text-sm font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.violetBd, background: pm.violetBg, color: pm.fg }}>
          <span className="inline-flex items-center justify-center gap-2">{busy ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <>Confirm Giveaway</>}</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminLeaderboardPage() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState([]);
  const [prizeConfig, setPrizeConfig] = useState(null);
  const [cycle, setCycle] = useState({ nextGiveawayAt: 0, giveawayEnabled: false });
  const [openConfirm, setOpenConfirm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leaderboard', { credentials: 'include', cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || 'Failed to load leaderboard');
      setUsers(Array.isArray(data?.users) ? data.users : []);
      setPrizeConfig(data?.prizeConfig || null);
      setCycle(data?.cycle || { nextGiveawayAt: 0, giveawayEnabled: false });
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const giveAway = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/leaderboard', { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || 'Giveaway failed');
      toast.success(data?.message || 'Giveaway completed');
      setOpenConfirm(false);
      await load();
    } catch {
      toast.error('Network error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: 'var(--pm-bg-grad)', color: pm.fg }}>
      <div className="mx-auto max-w-md space-y-3 font-mono">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div><div className="mt-1 text-lg font-black tracking-widest uppercase">Leaderboard</div></div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.violetBd, background: pm.violetBg }}><Trophy className="h-5 w-5" /></span>
          </div>
        </div>

        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Giveaway Countdown</div>
          <div className="mt-2 text-lg"><Countdown nextGiveawayAt={cycle?.nextGiveawayAt || 0} /></div>
          <button type="button" onClick={() => setOpenConfirm(true)} disabled={!cycle?.giveawayEnabled || busy || loading} className="mt-3 w-full border py-3 text-sm font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.violetBd, background: pm.violetBg, color: pm.fg }}>
            <span className="inline-flex items-center justify-center gap-2"><Gift className="h-4 w-4" /> Giveaway</span>
          </button>
        </div>

        {prizeConfig ? (
          <div className="grid grid-cols-2 gap-2">
            <PrizeCard pm={pm} title="1st Prize" amount={prizeConfig.firstPrize} />
            <PrizeCard pm={pm} title="2nd Prize" amount={prizeConfig.secondPrize} />
            <PrizeCard pm={pm} title="3rd Prize" amount={prizeConfig.thirdPrize} />
            <PrizeCard pm={pm} title="4th to 10th" amount={prizeConfig.rank4to10Prize} />
            <div className="col-span-2"><PrizeCard pm={pm} title="11th to 50th" amount={prizeConfig.rank11to50Prize} /></div>
          </div>
        ) : null}

        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Claim Ranking (Last 30 Days)</div>
          <div className="mt-3 space-y-2 max-h-[520px] overflow-auto pr-1">
            {loading ? <div className="text-sm">Loading...</div> : users.length === 0 ? <div className="text-sm" style={{ color: pm.fg70 }}>No ranked users yet.</div> : users.map((user) => (
              <div key={user.id} className="border p-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Rank {user.rank}</div>
                    <div className="mt-1 text-sm font-black truncate">{user.name}</div>
                    <div className="mt-1 text-[11px] truncate" style={{ color: pm.fg70 }}>{user.mobile}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Last 30 Days Claim</div>
                    <div className="mt-1 font-black">{money(user.claimTotal)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ConfirmModal open={openConfirm} onClose={() => setOpenConfirm(false)} onConfirm={giveAway} pm={pm} busy={busy} />
    </div>
  );
}
