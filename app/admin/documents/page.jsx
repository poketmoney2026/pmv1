"use client";

import { useEffect, useMemo, useState } from "react";
import { Funnel_Display } from "next/font/google";
import toast from "react-hot-toast";
import { Download, Search, Files, UserRound, Database, ArrowDownToLine } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(
    () => ({
      fg: "var(--pm-fg)",
      fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
      b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
      b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
      bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
      bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
      bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
    }),
    []
  );
}

function DownloadCard({ href, title, subtitle, icon: Icon, pm }) {
  return (
    <a href={href} className="border p-3 transition hover:brightness-110" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black tracking-widest uppercase">{title}</div>
          <div className="mt-1 text-[10px] leading-5" style={{ color: pm.fg70 }}>{subtitle}</div>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg10 }}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>
        <Download className="h-4 w-4" /> Download TXT
      </div>
    </a>
  );
}

export default function AdminDocumentsPage() {
  const pm = usePM();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const searchUsers = async (text) => {
    try {
      const res = await fetch(`/api/admin/documents?mode=users&q=${encodeURIComponent(text || "")}`, { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Failed to search users");
      setUsers(data?.data || []);
    } catch {
      toast.error("Network error");
    }
  };

  useEffect(() => { searchUsers(""); }, []);

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto max-w-md space-y-3 font-mono md:max-w-4xl">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">Documents</div>
              <div className="mt-2 text-[10px]" style={{ color: pm.fg70 }}>Download unique numbers as TXT files. No duplicate numbers will be included.</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><Files className="h-5 w-5" /></span>
          </div>
        </div>

        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black tracking-widest uppercase"><Database className="h-4 w-4" /> Global Number Downloads</div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            <DownloadCard href="/api/admin/documents?mode=all-user-numbers" title="All User" subtitle="All unique user mobile numbers" icon={Download} pm={pm} />
            <DownloadCard href="/api/admin/documents?mode=all-deposit-numbers" title="All Deposit Number" subtitle="All unique deposit sender numbers" icon={ArrowDownToLine} pm={pm} />
            <DownloadCard href="/api/admin/documents?mode=all-withdraw-numbers" title="All Withdraw Number" subtitle="All unique withdraw receive numbers" icon={ArrowDownToLine} pm={pm} />
            <DownloadCard href="/api/admin/documents?mode=all-refund-numbers" title="All Refund Number" subtitle="User numbers with refund transactions" icon={ArrowDownToLine} pm={pm} />
            <DownloadCard href="/api/admin/documents?mode=all-claim-numbers" title="All Claim Number" subtitle="User numbers with claim transactions" icon={ArrowDownToLine} pm={pm} />
            <DownloadCard href="/api/admin/documents?mode=all-bonus-numbers" title="All Bonus Number" subtitle="User numbers with bonus / gift / profit transactions" icon={ArrowDownToLine} pm={pm} />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.1fr_.9fr]">
          <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-black tracking-widest uppercase"><Search className="h-4 w-4" /> Search User</div>
            <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by mobile or name" className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
              <button type="button" onClick={() => searchUsers(query)} className="border px-4 py-3 text-sm font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>Search</button>
              <button type="button" onClick={() => { setQuery(""); setSelectedUser(null); searchUsers(""); }} className="border px-4 py-3 text-sm font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg }}>Reset</button>
            </div>
            <div className="mt-3 grid gap-2 max-h-[360px] overflow-y-auto pr-1">
              {users.map((user) => {
                const active = selectedUser?.id === user.id;
                return (
                  <button key={user.id} type="button" onClick={() => setSelectedUser(user)} className="w-full border p-3 text-left" style={{ borderColor: active ? "color-mix(in srgb, var(--pm-fg) 48%, transparent)" : pm.b20, background: active ? pm.bg10 : pm.bg08, color: pm.fg }}>
                    <div className="text-[12px] font-black uppercase tracking-widest">{user.fullName || "Unknown"}</div>
                    <div className="mt-1 text-[11px]" style={{ color: pm.fg70 }}>{user.mobile || "—"}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-black tracking-widest uppercase"><UserRound className="h-4 w-4" /> Selected User Downloads</div>
            {selectedUser ? (
              <>
                <div className="border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                  <div className="font-black uppercase tracking-widest">{selectedUser.fullName || "Unknown"}</div>
                  <div className="mt-1 text-[11px]" style={{ color: pm.fg70 }}>{selectedUser.mobile || "—"}</div>
                </div>
                <div className="mt-3 grid gap-2">
                  <DownloadCard href={`/api/admin/documents?mode=user-all-numbers&userId=${selectedUser.id}`} title="User All Number" subtitle="All unique numbers for this user" icon={Download} pm={pm} />
                  <DownloadCard href={`/api/admin/documents?mode=user-deposit-numbers&userId=${selectedUser.id}`} title="User Deposit Number" subtitle="This user's unique deposit sender numbers" icon={ArrowDownToLine} pm={pm} />
                  <DownloadCard href={`/api/admin/documents?mode=user-withdraw-numbers&userId=${selectedUser.id}`} title="User Withdraw Number" subtitle="This user's unique withdraw receive numbers" icon={ArrowDownToLine} pm={pm} />
                </div>
              </>
            ) : (
              <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>Search and select one user first.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
