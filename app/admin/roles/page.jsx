
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Search, RefreshCcw, ShieldCheck } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(() => ({
    fg: "var(--pm-fg)",
    fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
    fg82: "color-mix(in srgb, var(--pm-fg) 82%, transparent)",
    b22: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
    b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
    bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
    bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
  }), []);
}

function Card({ title, subtitle, children, pm }) {
  return (
    <section className="border p-4" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
      <div className="text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: pm.fg70 }}>{title}</div>
      {subtitle ? <div className="mt-2 text-[12px] leading-6" style={{ color: pm.fg82 }}>{subtitle}</div> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function AdminRolesPage() {
  const pm = usePM();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const loadRows = async (query = q) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/roles?q=${encodeURIComponent(query || "")}&limit=50`, { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.message || "Failed to load roles");
      setRows(Array.isArray(data?.users) ? data.users : []);
    } catch (err) {
      toast.error(err?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRows(""); }, []);

  const updateRole = async (userId, nextRole) => {
    setBusyId(String(userId));
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: nextRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'Role update failed');
      toast.success(data?.message || 'Role updated');
      setRows((prev) => prev.map((row) => String(row._id) === String(userId) ? { ...row, role: nextRole } : row));
    } catch (err) {
      toast.error(err?.message || 'Role update failed');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 font-mono pt-16 md:pt-6`} style={{ background: 'var(--pm-bg-grad)', color: pm.fg }}>
      <div className="mx-auto w-full max-w-md space-y-3">
        <Card pm={pm} title="Admin" subtitle="From this page you can switch only USER ↔ AGENT. Admin accounts cannot be changed from here.">
          <div className="text-lg font-black tracking-widest uppercase">Role Management</div>
        </Card>

        <Card pm={pm} title="Search" subtitle="Search by full name, mobile number or referral code.">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: pm.fg70 }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user or agent" className="w-full border py-3 pl-10 pr-3 text-sm outline-none" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }} />
            </div>
            <button type="button" onClick={() => loadRows(q)} className="border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>Load</button>
          </div>
        </Card>

        <Card pm={pm} title="Accounts" subtitle="Latest matched users and agents are shown below.">
          <div className="space-y-3">
            {loading ? <div className="border px-3 py-3 text-[12px]" style={{ borderColor: pm.b22, background: pm.bg10, color: pm.fg70 }}>Loading role list...</div> : null}
            {!loading && !rows.length ? <div className="border px-3 py-3 text-[12px]" style={{ borderColor: pm.b22, background: pm.bg10, color: pm.fg70 }}>No user found.</div> : null}
            {rows.map((row) => {
              const current = String(row?.role || 'user').toLowerCase();
              const isBusy = String(busyId) === String(row?._id);
              return (
                <div key={String(row?._id)} className="border p-3" style={{ borderColor: pm.b28, background: pm.bg10 }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-black uppercase tracking-wide">{row?.fullName || 'Unnamed user'}</div>
                      <div className="mt-1 text-[12px]" style={{ color: pm.fg82 }}>{row?.mobile || '-'}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-widest" style={{ color: pm.fg70 }}>Current Role: {current}</div>
                    </div>
                    <div className="shrink-0 border px-2 py-1 text-[10px] font-black uppercase tracking-widest" style={{ borderColor: pm.b22, background: pm.bg06 }}>
                      {row?.status || 'active'}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" disabled={isBusy || current === 'user'} onClick={() => updateRole(row?._id, 'user')} className="border px-3 py-3 text-[11px] font-black uppercase tracking-widest disabled:opacity-50" style={{ borderColor: pm.b28, background: pm.bg06, color: pm.fg }}>
                      <span className="inline-flex items-center gap-2"><RefreshCcw className="h-4 w-4" /> Make User</span>
                    </button>
                    <button type="button" disabled={isBusy || current === 'agent'} onClick={() => updateRole(row?._id, 'agent')} className="border px-3 py-3 text-[11px] font-black uppercase tracking-widest disabled:opacity-50" style={{ borderColor: pm.b28, background: pm.bg06, color: pm.fg }}>
                      <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Make Agent</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
