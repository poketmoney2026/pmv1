"use client";

import { useEffect, useMemo, useState } from "react";
import { Funnel_Display } from "next/font/google";
import { ChevronDown, Gift, Loader2, Trophy, X } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });
const SHOW_COUNT = 50;

function usePM() {
  return useMemo(() => ({
    fg: "var(--pm-fg)",
    fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
    fg75: "color-mix(in srgb, var(--pm-fg) 75%, transparent)",
    fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
    b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
    b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
    bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
    bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
    green: "rgba(34,197,94,0.95)",
    greenBorder: "rgba(34,197,94,0.55)",
    greenBg: "rgba(34,197,94,0.14)",
    greenGlow: "0 0 0 1px rgba(34,197,94,0.22), 0 0 18px rgba(34,197,94,0.10)",
    gold: "rgba(255,215,0,0.95)",
    goldBorder: "rgba(255,215,0,0.55)",
    goldBg: "rgba(255,215,0,0.12)",
    goldGlow: "0 0 0 1px rgba(255,215,0,0.18), 0 0 18px rgba(255,215,0,0.10)",
  }), []);
}

function money(n) {
  return `Tk ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PrizeCard({ title, amount, pm, big = false }) {
  return (
    <div className={["border", big ? "p-3.5" : "p-3"].join(" ")} style={{ borderColor: pm.b28, background: pm.bg08 }}>
      <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>{title}</div>
      <div className={["mt-1 font-black tabular-nums", big ? "text-[14px]" : "text-[13px]"].join(" ")} style={{ color: pm.fg }}>{money(amount)}</div>
    </div>
  );
}

function MiniAvatar({ name, rank, pm, isMe }) {
  const letter = String(name || "?").trim().charAt(0).toUpperCase() || "?";
  const top3 = rank <= 3;
  const ring = isMe ? pm.goldBorder : top3 ? pm.greenBorder : pm.b20;
  const bg = isMe ? pm.goldBg : top3 ? pm.greenBg : pm.bg08;
  const glow = isMe ? pm.goldGlow : top3 ? pm.greenGlow : `0 0 0 1px ${pm.b20}`;
  const badgeBg = isMe ? "rgba(255,215,0,0.95)" : top3 ? pm.green : "rgba(255,255,255,0.9)";
  const badgeText = isMe || top3 ? "#fff" : "#111";

  return (
    <div className="relative grid place-items-center border" style={{ width: 42, height: 42, borderColor: ring, background: bg, boxShadow: glow, borderRadius: 999 }}>
      <span className="text-[12px] font-black" style={{ color: pm.fg }}>{letter}</span>
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 grid place-items-center border" style={{ width: 22, height: 22, borderColor: pm.b20, background: badgeBg, color: badgeText, borderRadius: 999 }}>
        <span className="text-[11px] font-black">{rank}</span>
      </span>
    </div>
  );
}

function Row({ rank, name, claimTotal, pm, isMe, onClick }) {
  const top3 = rank <= 3;
  const base = { borderColor: pm.b28, background: pm.bg08, boxShadow: `0 0 0 1px ${pm.b20}` };
  const top = { borderColor: pm.greenBorder, background: pm.greenBg, boxShadow: pm.greenGlow };
  const me = { borderColor: pm.goldBorder, background: pm.goldBg, boxShadow: pm.goldGlow };
  const cardStyle = isMe ? me : top3 ? top : base;

  return (
    <button type="button" onClick={onClick} className="w-full border px-3 py-2 text-left" style={{ ...cardStyle, transformOrigin: "center", animation: isMe ? "pmMePulse 1.25s ease-in-out infinite" : "none" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <MiniAvatar name={name} rank={rank} pm={pm} isMe={isMe} />
          <div className="min-w-0">
            <div className="text-[12px] font-black truncate" style={{ color: pm.fg }}>{name}</div>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: isMe ? pm.gold : pm.fg70 }}>Position {rank}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>Claim Total</div>
          <div className="text-[13px] font-black tabular-nums" style={{ color: isMe ? pm.gold : pm.fg }}>{money(claimTotal)}</div>
        </div>
      </div>
    </button>
  );
}

function Countdown({ nextGiveawayAt }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((v) => v + 1), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, Number(nextGiveawayAt || 0) - Date.now());
  const total = Math.floor(diff / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const value = `${String(days).padStart(2, "0")}:${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return <div key={tick} className="font-black tabular-nums tracking-widest text-[24px] md:text-[30px]">{value}</div>;
}

function DetailModal({ open, onClose, detail, loading, pm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4">
      <div className="w-full max-w-sm border p-4" style={{ borderColor: pm.b28, background: "var(--pm-bg)", color: pm.fg }}>
        <div className="flex items-center justify-between gap-3 border-b pb-3" style={{ borderColor: pm.b20 }}>
          <div>
            <div className="text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: pm.fg70 }}>Leaderboard User</div>
            <div className="mt-1 text-base font-black tracking-widest uppercase">User Info</div>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg08 }}><X className="h-4 w-4" /></button>
        </div>
        {loading ? <div className="py-8 text-center text-sm">Loading...</div> : detail ? (
          <div className="mt-4 space-y-2">
            <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>User</div><div className="mt-1 text-sm font-black">{detail.name}</div></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Position</div><div className="mt-1 font-black">{detail.position || "-"}</div></div>
              <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Referred</div><div className="mt-1 font-black">{detail.totalReferred || 0}</div></div>
            </div>
            <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Total Earning</div><div className="mt-1 text-lg font-black">{money(detail.totalEarning)}</div></div>
            <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Total Deposited</div><div className="mt-1 font-black">{money(detail.totalDeposited)}</div></div>
            <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Joined</div><div className="mt-1 font-black">{detail.joinedDaysAgo} day{Number(detail.joinedDaysAgo || 0) === 1 ? "" : "s"} ago</div></div>
          </div>
        ) : <div className="py-8 text-center text-sm">No data found.</div>}
        <button type="button" onClick={onClose} className="mt-4 w-full border py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg }}>Close</button>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const pm = usePM();
  const [totalUsers, setTotalUsers] = useState(null);
  const [myPosition, setMyPosition] = useState(null);
  const [users, setUsers] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [prizeConfig, setPrizeConfig] = useState(null);
  const [cycle, setCycle] = useState({ nextGiveawayAt: 0 });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const fetchPage = async (offset, append) => {
    const res = await fetch(`/api/leaderboard?offset=${offset}&limit=${SHOW_COUNT}`, { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed");
    setTotalUsers(Number(data.totalUsers || 0));
    setMyPosition(Number(data.myPosition || 0));
    setHasMore(Boolean(data.hasMore));
    setPrizeConfig(data?.prizeConfig || null);
    setCycle(data?.cycle || { nextGiveawayAt: 0 });
    const next = Array.isArray(data.users) ? data.users : [];
    setUsers((prev) => (append ? [...prev, ...next] : next));
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        await fetchPage(0, false);
      } catch {
        if (!alive) return;
        setUsers([]);
        setHasMore(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try { await fetchPage(users.length, true); } finally { setLoadingMore(false); }
  };

  const openDetail = async (userId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/leaderboard/${userId}`, { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load user details");
      setDetail(data?.data || null);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalText = totalUsers == null ? "..." : totalUsers.toLocaleString("en-US");
  const posText = myPosition == null ? "..." : myPosition.toLocaleString("en-US");

  return (
    <div className={`${funnelDisplay.className} select-none min-h-[100svh] px-3 py-5`} style={{ background: "var(--pm-bg-grad)", color: pm.fg, fontFamily: "var(--pm-font)" }}>
      <style>{`@keyframes pmMePulse{0%,100%{transform:scale(.985)}50%{transform:scale(1.03)}} @keyframes pmSheen{0%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(260%) skewX(-18deg)}} @keyframes pmPulseGlow{0%,100%{opacity:.55}50%{opacity:1}} @keyframes pmFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}} @keyframes pmSpark{0%{opacity:.08}50%{opacity:.24}100%{opacity:.08}}`}</style>
      <div className="mx-auto mt-12 w-full max-w-md space-y-2">
        <div className="border p-3 relative overflow-hidden" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}, 0 28px 90px rgba(0,0,0,.62)` }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.95]" style={{ background: "radial-gradient(circle at 10% 0%, rgba(34,197,94,0.20), transparent 55%), radial-gradient(circle at 92% 35%, rgba(255,215,0,0.10), transparent 55%)" }} />
          <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), rgba(34,197,94,0.95), rgba(255,215,0,0.75), rgba(255,255,255,0.18), transparent)" }} />
          <div className="relative grid grid-cols-2 gap-2">
            <div className="border px-3 py-4 relative overflow-hidden" style={{ borderColor: "rgba(34,197,94,0.75)", background: "linear-gradient(180deg, rgba(34,197,94,0.22), rgba(34,197,94,0.10))", boxShadow: "0 0 0 1px rgba(34,197,94,0.18), 0 18px 60px rgba(0,0,0,.48), 0 0 26px rgba(34,197,94,.10)" }}>
              <div className="relative text-center"><div className="text-[9px] font-black tracking-[0.30em] uppercase" style={{ color: pm.fg75 }}>Total Users</div><div className="mt-1 text-[30px] font-black tabular-nums leading-none" style={{ color: "rgba(34,197,94,0.98)", textShadow: "0 0 22px rgba(34,197,94,0.22)" }}>{totalText}</div></div>
            </div>
            <div className="border px-3 py-4 relative overflow-hidden" style={{ borderColor: "rgba(255,215,0,0.55)", background: "linear-gradient(180deg, rgba(255,215,0,0.18), rgba(255,215,0,0.08))", boxShadow: "0 0 0 1px rgba(255,215,0,0.12), 0 18px 60px rgba(0,0,0,.48), 0 0 26px rgba(255,215,0,.08)" }}>
              <div className="relative text-center"><div className="text-[9px] font-black tracking-[0.30em] uppercase" style={{ color: pm.fg75 }}>My Position</div><div className="mt-1 text-[30px] font-black tabular-nums leading-none" style={{ color: "rgba(255,215,0,0.95)", textShadow: "0 0 22px rgba(255,215,0,0.22)" }}>{posText}</div></div>
            </div>
          </div>
        </div>

        <div className="select-none border p-4" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="mb-3 text-center text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>Next Prize Countdown</div>
          <div className="border p-4 text-center" style={{ borderColor: pm.b28, background: pm.bg08 }}>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>Time Left (DD:HH:MM:SS)</div>
            <div className="mt-2" style={{ color: pm.fg }}><Countdown nextGiveawayAt={cycle?.nextGiveawayAt || 0} /></div>
          </div>
          {prizeConfig ? <div className="mt-3 border p-3" style={{ borderColor: pm.b28, background: pm.bg08 }}><div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}><Gift className="h-4 w-4" /> Prize Breakdown</div><div className="mt-2 grid grid-cols-3 gap-2"><PrizeCard pm={pm} title="1st" amount={prizeConfig.firstPrize} /><PrizeCard pm={pm} title="2nd" amount={prizeConfig.secondPrize} /><PrizeCard pm={pm} title="3rd" amount={prizeConfig.thirdPrize} /><div className="col-span-3 grid grid-cols-2 gap-2"><PrizeCard pm={pm} big title="4th - 10th" amount={prizeConfig.rank4to10Prize} /><PrizeCard pm={pm} big title="11th - 50th" amount={prizeConfig.rank11to50Prize} /></div></div></div> : null}
        </div>

        <div className="select-none border p-4" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="mb-3 text-center text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>Ranking List</div>
          <div className="space-y-2 max-h-[560px] overflow-auto pr-1">
            {loading ? <div className="border px-4 py-3 text-center text-[10px] font-bold tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg70 }}>Loading...</div> : users.length ? users.map((u) => <Row key={u.id} rank={u.rank} name={u.name} claimTotal={u.claimTotal} pm={pm} isMe={myPosition != null && u.rank === myPosition} onClick={() => openDetail(u.id)} />) : <div className="border px-4 py-3 text-center text-[10px] font-bold tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg70 }}>No users</div>}
            {hasMore ? <button type="button" onClick={loadMore} disabled={loadingMore} className="mt-2 flex w-full items-center justify-center gap-2 border px-4 py-3 text-[11px] font-black tracking-widest uppercase transition active:scale-[0.99] disabled:opacity-70" style={{ borderColor: pm.b28, background: pm.bg08, boxShadow: `0 0 0 1px ${pm.b20}`, color: pm.fg90 }}>{loadingMore ? <><Loader2 className="h-4 w-4 animate-spin" />Loading...</> : <>Load More <ChevronDown className="h-4 w-4" /></>}</button> : null}
          </div>
        </div>
      </div>
      <DetailModal open={detailOpen} onClose={() => setDetailOpen(false)} detail={detail} loading={detailLoading} pm={pm} />
    </div>
  );
}
