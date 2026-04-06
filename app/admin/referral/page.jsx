"use client";

import { useEffect, useMemo, useState } from "react";
import { Funnel_Display } from "next/font/google";
import { Loader2, Search, Users2, X } from "lucide-react";
import toast from "react-hot-toast";

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
  }), []);
}

function money(n) {
  return `Tk ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Modal({ open, onClose, data, loading, pm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[85] grid place-items-center bg-black/80 p-4">
      <div className="w-full max-w-sm border p-4" style={{ borderColor: pm.b28, background: "var(--pm-bg)", color: pm.fg }}>
        <div className="flex items-center justify-between gap-3 border-b pb-3" style={{ borderColor: pm.b20 }}>
          <div>
            <div className="text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: pm.fg70 }}>Referral Details</div>
            <div className="mt-1 text-base font-black tracking-widest uppercase">{data?.fullName || "User"}</div>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg08 }}><X className="h-4 w-4" /></button>
        </div>
        {loading ? <div className="py-8 text-center text-sm">Loading...</div> : data ? (
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Mobile</div><div className="mt-1 font-black">{data.mobile}</div></div>
              <div className="border px-3 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Balance</div><div className="mt-1 font-black">{money(data.balance)}</div></div>
            </div>
            <div className="border p-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Referred Users</div>
              <div className="mt-2 space-y-2 max-h-[320px] overflow-y-auto">
                {data.referredUsers?.length ? data.referredUsers.map((row) => (
                  <div key={row._id} className="border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg06 }}>
                    <div className="text-[12px] font-black">{row.fullName}</div>
                    <div className="mt-1 text-[11px]" style={{ color: pm.fg70 }}>{row.mobile}</div>
                  </div>
                )) : <div className="text-sm" style={{ color: pm.fg70 }}>No referred users.</div>}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminReferralPage() {
  const pm = usePM();
  const [users, setUsers] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = async ({ append = false, q = searchValue, nextOffset = 0 } = {}) => {
    const res = await fetch(`/api/admin/referral?offset=${nextOffset}&limit=5&q=${encodeURIComponent(q || "")}`, { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load referral users");
    const rows = Array.isArray(data?.data) ? data.data : [];
    setUsers((prev) => append ? [...prev, ...rows] : rows);
    setOffset(nextOffset + rows.length);
    setHasMore(Boolean(data?.hasMore));
  };

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true);
        await load({ append: false, q: "", nextOffset: 0 });
      } catch (e) {
        if (live) toast.error(e?.message || "Load failed");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const onSearch = async () => {
    try {
      setLoading(true);
      setSearchValue(query.trim());
      await load({ append: false, q: query.trim(), nextOffset: 0 });
    } catch (e) {
      toast.error(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    try {
      setLoadingMore(true);
      await load({ append: true, q: searchValue, nextOffset: offset });
    } catch (e) {
      toast.error(e?.message || "Load failed");
    } finally {
      setLoadingMore(false);
    }
  };

  const openDetail = async (userId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/referral/${userId}`, { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load details");
      setDetail(data?.data || null);
    } catch (e) {
      toast.error(e?.message || "Load failed");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg, fontFamily: "var(--pm-font)" }}>
      <div className="mx-auto max-w-md space-y-3">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div><div className="mt-1 text-lg font-black tracking-widest uppercase">Referral</div></div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><Users2 className="h-5 w-5" /></span>
          </div>
        </div>
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="mb-2 text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: pm.fg70 }}>Search by Mobile</div>
          <div className="flex gap-2">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: pm.fg70 }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="01XXXXXXXXX" className="w-full border py-3 pl-10 pr-3 text-sm outline-none" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }} /></div>
            <button type="button" onClick={onSearch} className="border px-4 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>Search</button>
          </div>
        </div>
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="mb-3 text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: pm.fg70 }}>Top Referral Users</div>
          <div className="space-y-2">
            {loading ? <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>Loading...</div> : users.length ? users.map((row, idx) => (
              <button key={row._id} type="button" onClick={() => openDetail(row._id)} className="w-full border px-3 py-3 text-left" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Rank {idx + 1}</div>
                    <div className="mt-1 text-sm font-black">{row.fullName}</div>
                    <div className="mt-1 text-[11px]" style={{ color: pm.fg70 }}>{row.mobile}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Referrals</div>
                    <div className="mt-1 font-black">{row.referralsCount}</div>
                    <div className="mt-1 text-[11px]" style={{ color: pm.fg70 }}>{money(row.balance)}</div>
                  </div>
                </div>
              </button>
            )) : <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg70 }}>No referral users found.</div>}
          </div>
          {hasMore ? <button type="button" onClick={loadMore} disabled={loadingMore} className="mt-3 w-full border py-3 text-[11px] font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>{loadingMore ? <span className="inline-flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading...</span> : "Show More Users"}</button> : null}
        </div>
      </div>
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} data={detail} loading={detailLoading} pm={pm} />
    </div>
  );
}
