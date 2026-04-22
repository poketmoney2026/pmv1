"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Search, Receipt, Filter, RefreshCw, Wallet, ChevronDown } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(() => ({ fg: "var(--pm-fg)", fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)", b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)", bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)" }), []);
}

const money = (n) => `Tk ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDateTime = (v) => new Date(v).toLocaleString();

function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "successful" || s === "success") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
  if (s === "processing" || s === "pending" || s === "verifying") return "border-amber-400/25 bg-amber-500/10 text-amber-200";
  if (s === "reject") return "border-rose-400/25 bg-rose-500/10 text-rose-200";
  return "";
}

function Field({ value, onChange, placeholder, pm, icon: Icon }) {
  return <div className="relative">{Icon ? <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: pm.fg70 }} /> : null}<input value={value} onChange={onChange} placeholder={placeholder} className="w-full border px-3 py-3 text-sm outline-none" style={{ paddingLeft: Icon ? 38 : 12, borderColor: pm.b20, background: pm.bg08, color: pm.fg }} /></div>;
}

function Select({ value, onChange, options, pm, placeholder }) {
  return <select value={value} onChange={onChange} className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}><option value="">{placeholder}</option>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select>;
}

export default function AdminTransactionsPage() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [items, setItems] = useState([]);
  const [facets, setFacets] = useState({ types: [], statuses: [], sources: [] });
  const [filters, setFilters] = useState({ q: "", type: "", status: "", source: "" });
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = async (nextFilters = filters, nextOffset = 0, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(nextFilters).forEach(([key, value]) => value && params.set(key, value));
      params.set("limit", "50");
      params.set("offset", String(nextOffset));
      const res = await fetch(`/api/admin/transactions?${params.toString()}`, { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Failed to load transactions");
      const nextItems = data?.data?.items || [];
      setItems((prev) => append ? [...prev, ...nextItems] : nextItems);
      setFacets(data?.data?.facets || { types: [], statuses: [], sources: [] });
      setHasMore(Boolean(data?.data?.hasMore));
      setOffset(nextOffset);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchPage(filters, 0, false); }, []);

  const applyFilters = () => fetchPage(filters, 0, false);
  const resetFilters = () => { const next = { q: "", type: "", status: "", source: "" }; setFilters(next); fetchPage(next, 0, false); };
  const loadMore = () => fetchPage(filters, offset + 50, true);


  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto max-w-md space-y-3 font-mono md:max-w-3xl">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">Transactions</div>
              <div className="mt-2 text-[10px]" style={{ color: pm.fg70 }}>Latest 50 first • নিচে load more • filters দিয়ে search করা যাবে</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><Wallet className="h-5 w-5" /></span>
          </div>
        </div>

        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black tracking-widest uppercase"><Filter className="h-4 w-4" /> Filters</div>
          <div className="grid gap-2 md:grid-cols-2">
            <Field pm={pm} icon={Search} value={filters.q} onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))} placeholder="Search by name, mobile, bKash, Nagad, Grameenphone..." />
            <Select pm={pm} value={filters.type} onChange={(e) => setFilters((s) => ({ ...s, type: e.target.value }))} options={facets.types} placeholder="All types" />
            <Select pm={pm} value={filters.status} onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))} options={facets.statuses} placeholder="All status" />
            <Select pm={pm} value={filters.source} onChange={(e) => setFilters((s) => ({ ...s, source: e.target.value }))} options={facets.sources} placeholder="All sources" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={resetFilters} className="w-full border py-3 text-sm font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg }}>Reset</button>
            <button type="button" onClick={applyFilters} className="w-full border py-3 text-sm font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}><span className="inline-flex items-center justify-center gap-2"><RefreshCw className="h-4 w-4" />Apply</span></button>
          </div>
        </div>

        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black tracking-widest uppercase"><Receipt className="h-4 w-4" /> Results</div>
          {loading ? (
            <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>Loading transactions...</div>
          ) : items.length ? (
            <div className="space-y-2">
              {items.map((row) => {
                const tone = statusTone(row.status);
                return (
                  <div key={row.id} className="border p-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[12px] font-black uppercase tracking-widest" style={{ color: pm.fg }}>{row.user?.fullName || "Unknown user"}</div>
                        <div className="mt-1 text-[11px]" style={{ color: pm.fg70 }}>{row.user?.mobile || "—"} • {formatDateTime(row.createdAt)}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border px-2 py-1 text-[10px] font-black uppercase tracking-widest" style={{ borderColor: pm.b20, background: pm.bg10 }}>{row.type}</span>
                        <span className={["border px-2 py-1 text-[10px] font-black uppercase tracking-widest", tone].join(" ")} style={tone ? undefined : { borderColor: pm.b20, background: pm.bg10 }}>{row.status}</span>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-4">
                      <div className="border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg10 }}><div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Amount</div><div className="mt-1 text-[12px] font-black">{money(row.amount)}</div></div>
                      <div className="border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg10 }}><div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Source</div><div className="mt-1 text-[12px] font-black">{row.source}</div></div>
                      <div className="border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg10 }}><div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Method</div><div className="mt-1 text-[12px] font-black">{row.methodLabel || row.accountTypeLabel || row.verifyMode || "—"}</div></div>
                      <div className="border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg10 }}><div className="text-[10px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Ref</div><div className="mt-1 text-[12px] font-black break-all">{row.mobileRef || "—"}</div></div>
                    </div>
                    <div className="mt-2 border px-3 py-2 text-[11px]" style={{ borderColor: pm.b20, background: pm.bg10, color: pm.fg70 }}>{row.note || "No note"}</div>
                  </div>
                );
              })}
              {hasMore ? <button type="button" onClick={loadMore} disabled={loadingMore} className="w-full border px-3 py-3 text-[11px] font-black uppercase tracking-widest disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}><span className="inline-flex items-center gap-2">{loadingMore ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}More transactions</span></button> : null}
            </div>
          ) : (
            <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>No transactions found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
