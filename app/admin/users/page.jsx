"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Search,Users, Filter, ArrowUpDown, ShieldCheck, Wallet, ArrowDownToLine, CheckCircle2, XCircle, Loader2, Eye } from "lucide-react";

function usePM() {
  return useMemo(
    () => ({
      fg: "var(--pm-fg)",
      fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
      fg75: "color-mix(in srgb, var(--pm-fg) 75%, transparent)",
      fg80: "color-mix(in srgb, var(--pm-fg) 80%, transparent)",
      fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
      b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
      b22: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
      b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
      bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
      bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
      bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
      greenBg: "color-mix(in srgb, #22c55e 16%, transparent)",
      greenBd: "color-mix(in srgb, #22c55e 42%, transparent)",
      redBg: "color-mix(in srgb, #ef4444 16%, transparent)",
      redBd: "color-mix(in srgb, #ef4444 42%, transparent)",
      yellowBg: "color-mix(in srgb, #eab308 16%, transparent)",
      yellowBd: "color-mix(in srgb, #eab308 42%, transparent)",
    }),
    []
  );
}

function Block({ title, children, pm }) {
  return (
    <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
      <div className="mb-2 text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>{title}</div>
      {children}
    </div>
  );
}

function fmt2(n) {
  return `Tk ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Field({ icon: Icon, value, onChange, placeholder, pm }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: pm.fg75 }}><Icon className="h-4 w-4" /></span>
      <input className="w-full border px-4 py-3 pl-10 text-sm outline-none" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

function Select({ icon: Icon, value, onChange, options, pm }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: pm.fg75 }}><Icon className="h-4 w-4" /></span>
      <select className="w-full border px-4 py-3 pl-10 text-sm outline-none" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }} value={value} onChange={onChange}>
        {options.map((o) => <option key={o.value} value={o.value} className="text-black">{o.label}</option>)}
      </select>
    </div>
  );
}

function Modal({ open, onClose, children, pm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl border" style={{ borderColor: pm.b28, background: "var(--pm-bg)" }}>
        {children}
      </div>
    </div>
  );
}

const INACTIVE_REASONS = [
  "আপনি বারবার স্ক্যাম ডিপোজিট করার কারণে আপনার অ্যাকাউন্ট ডিএক্টিভ করা হয়েছে। অ্যাকাউন্ট ফিরে পেতে কন্টাক্ট করুন।",
  "আপনি নিজে নিজে একাধিক অ্যাকাউন্টে রেফার করার কারণে আপনার অ্যাকাউন্ট ডিএক্টিভ করা হয়েছে। অ্যাকাউন্ট ফিরে পেতে কন্টাক্ট করুন।",
  "আপনার অ্যাকাউন্টে আনইউজুয়াল অ্যাক্টিভিটি শনাক্ত হয়েছে। বিস্তারিত জানতে কন্টাক্ট করুন।",
  "আপনার অ্যাকাউন্টে সন্দেহজনক ব্যবহার দেখা গেছে। সাপোর্টে যোগাযোগ করুন।",
  "পলিসি ভায়োলেশনের কারণে আপনার অ্যাকাউন্ট ডিএক্টিভ করা হয়েছে। সাপোর্টে যোগাযোগ করুন।",
];

export default function AdminUserManagementPage() {
  const pm = usePM();
  const [totals, setTotals] = useState(null);
  const [users, setUsers] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("latest");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [inactiveModal, setInactiveModal] = useState({ open: false, userId: "", reason: INACTIVE_REASONS[0] });
  const [deleteModal, setDeleteModal] = useState({ open: false, userId: "" });
  const limit = 15;

  const sortOptions = useMemo(() => [
    { value: "latest", label: "Latest users" },
    { value: "balance_desc", label: "Balance: high → low" },
    { value: "balance_asc", label: "Balance: low → high" },
    { value: "tx_desc", label: "Most transactions" },
    { value: "withdraw_desc", label: "Most withdraw amount" },
    { value: "deposit_desc", label: "Most deposit amount" },
    { value: "referral_desc", label: "Most referrals" },
  ], []);

  const roleOptions = useMemo(() => [
    { value: "", label: "All roles" },
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" },
    { value: "agent", label: "Agent" },
  ], []);

  const statusOptions = useMemo(() => [
    { value: "", label: "All status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ], []);

  const buildUrl = (p) => {
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    sp.set("page", String(p));
    sp.set("sort", sort);
    if (q.trim()) sp.set("q", q.trim());
    if (role) sp.set("role", role);
    if (status) sp.set("status", status);
    return `/api/admin/user-management?${sp.toString()}`;
  };

  const loadFirst = async () => {
    setLoading(true);
    setPage(0);
    try {
      const res = await fetch(buildUrl(0), { method: "GET", credentials: "include", cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.message || "Failed to load");
        setTotals(null); setUsers([]); setHasMore(false); return;
      }
      setTotals(j?.totals || null);
      setUsers(Array.isArray(j?.users) ? j.users : []);
      setHasMore(!!j?.hasMore);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(next), { method: "GET", credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j?.message || "Failed to load more");
      setUsers((prev) => [...prev, ...(Array.isArray(j?.users) ? j.users : [])]);
      setHasMore(!!j?.hasMore);
      setPage(next);
    } catch {
      toast.error("Network error");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadFirst(); }, [sort, role, status]);
  useEffect(() => { const t = setTimeout(() => loadFirst(), 450); return () => clearTimeout(t); }, [q]);

  const changeStatus = async (userId, nextStatus, reason = "") => {
    try {
      const res = await fetch("/api/admin/user-management", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, status: nextStatus, inactiveReason: reason }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j?.message || "Failed to update status");
      toast.success(j?.message || "Status updated");
      setUsers((prev) => prev.map((u) => String(u._id) === String(userId) ? { ...u, accountStatus: nextStatus, status: nextStatus } : u));
      if (details?.user?._id === userId) setDetails((prev) => prev ? { ...prev, user: { ...prev.user, status: nextStatus } } : prev);
    } catch {
      toast.error("Network error");
    }
  };

  const deleteUser = async (userId) => {
    try {
      const res = await fetch("/api/admin/user-management", { method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j?.message || "Failed to delete user");
      toast.success(j?.message || "User deleted");
      setUsers((prev) => prev.filter((u) => String(u._id) !== String(userId)));
      setDeleteModal({ open: false, userId: "" });
    } catch {
      toast.error("Network error");
    }
  };

  const openDetails = async (userId) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetails(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/details`, { credentials: "include", cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j?.message || "Failed to load details");
      setDetails(j?.data || null);
    } catch {
      toast.error("Network error");
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 font-mono pt-16 md:pt-6 text-white overflow-x-hidden" style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto w-full max-w-md space-y-3">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] tracking-widest uppercase" style={{ color: pm.fg80 }}>Admin</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase" style={{ color: pm.fg }}>USER MANAGEMENT</div>
              <div className="mt-2 text-[10px]" style={{ color: pm.fg70 }}>Analytics + filters + user list + status control.</div>
            </div>
            <span className="grid h-12 w-12 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><ShieldCheck className="h-6 w-6" /></span>
          </div>
        </div>

        <Block pm={pm} title="FILTERS">
          <div className="space-y-2">
            <Field pm={pm} icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name/mobile/referral" />
            <div className="grid grid-cols-2 gap-2">
              <Select pm={pm} icon={ArrowUpDown} value={sort} onChange={(e) => setSort(e.target.value)} options={sortOptions} />
              <Select pm={pm} icon={Filter} value={role} onChange={(e) => setRole(e.target.value)} options={roleOptions} />
            </div>
            <Select pm={pm} icon={Filter} value={status} onChange={(e) => setStatus(e.target.value)} options={statusOptions} />
          </div>
        </Block>

        <Block pm={pm} title="ANALYTICS">
          {loading ? <div className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg75 }}>Loading analytics...</div> : totals ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}><span className="inline-flex items-center gap-2 text-[10px]"><Users className="h-4 w-4" /> TOTAL USERS</span><span className="text-[12px] font-black">{totals.totalUsers || 0}</span></div>
              <div className="flex items-center justify-between border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}><span className="inline-flex items-center gap-2 text-[10px]"><Wallet className="h-4 w-4" /> TOTAL BALANCE</span><span className="text-[12px] font-black">{fmt2(totals.totalBalance || 0)}</span></div>
              <div className="flex items-center justify-between border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}><span className="inline-flex items-center gap-2 text-[10px]"><ArrowDownToLine className="h-4 w-4" /> TOTAL WITHDRAW AMOUNT</span><span className="text-[12px] font-black">{fmt2(totals.totalWithdrawAmount || 0)}</span></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>SUCCESS</div><div className="mt-1 font-black">{totals.successfulTx || 0}</div></div>
                <div className="border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>REJECT</div><div className="mt-1 font-black">{totals.rejectedTx || 0}</div></div>
              </div>
            </div>
          ) : <div className="text-sm">No data.</div>}
        </Block>

        <Block pm={pm} title="USERS">
          {loading ? <div className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg75 }}>Loading users...</div> : users.length === 0 ? <div className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg75 }}>No users found.</div> : (
            <div className="space-y-2">
              {users.map((u) => {
                const userStatus = String(u.accountStatus || u.status || "active").toLowerCase();
                return (
                  <div key={String(u._id)} className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="border px-2 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                        <div className="text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>User</div>
                        <div className="mt-1 text-[12px] font-black truncate">{u.fullName || "Unnamed"}</div>
                        <div className="text-[10px] truncate" style={{ color: pm.fg70 }}>{u.mobile || "-"}</div>
                      </div>
                      <div className="border px-2 py-2" style={{ borderColor: userStatus === "active" ? pm.greenBd : pm.redBd, background: userStatus === "active" ? pm.greenBg : pm.redBg }}>
                        <div className="text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>Active</div>
                        <div className="mt-1 text-[12px] font-black uppercase">{userStatus}</div>
                        <div className="text-[10px]" style={{ color: pm.fg70 }}>{String(u.role || "user")}</div>
                      </div>
                      <button type="button" onClick={() => openDetails(String(u._id))} className="border px-2 py-2 active:scale-[0.99]" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                        <div className="text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>Details</div>
                        <div className="mt-2 flex justify-center"><Eye className="h-5 w-5" /></div>
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => changeStatus(String(u._id), "active")} className="border px-2.5 py-2 text-[10px] font-black tracking-widest uppercase active:scale-[0.99]" style={{ borderColor: pm.greenBd, background: pm.greenBg, color: pm.fg }}>MAKE ACTIVE</button>
                      <button type="button" onClick={() => setInactiveModal({ open: true, userId: String(u._id), reason: INACTIVE_REASONS[0] })} className="border px-2.5 py-2 text-[10px] font-black tracking-widest uppercase active:scale-[0.99]" style={{ borderColor: pm.yellowBd, background: pm.yellowBg, color: pm.fg }}>MAKE INACTIVE</button>
                      <button type="button" onClick={() => setDeleteModal({ open: true, userId: String(u._id) })} className="border px-2.5 py-2 text-[10px] font-black tracking-widest uppercase active:scale-[0.99]" style={{ borderColor: pm.redBd, background: pm.redBg, color: pm.fg }}>DELETE</button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="border px-2.5 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>Balance</div><div className="mt-1 text-[12px] font-black tabular-nums">{fmt2(u.balance || 0)}</div></div>
                      <div className="border px-2.5 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>Transactions</div><div className="mt-1 text-[12px] font-black tabular-nums">{Number(u.txCount || 0)}</div></div>
                    </div>
                  </div>
                );
              })}
              <button type="button" onClick={loadMore} disabled={!hasMore || loadingMore} className="w-full border py-3 text-sm font-black tracking-widest uppercase disabled:opacity-60 disabled:cursor-not-allowed" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
                <span className="inline-flex items-center justify-center gap-2">{loadingMore ? <><Loader2 className="h-4 w-4 animate-spin" />LOADING...</> : hasMore ? "LOAD MORE (15)" : "NO MORE USERS"}</span>
              </button>
            </div>
          )}
        </Block>
      </div>


      <Modal open={inactiveModal.open} onClose={() => setInactiveModal({ open: false, userId: "", reason: INACTIVE_REASONS[0] })} pm={pm}>
        <div className="border-b px-4 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <div className="text-[12px] font-black tracking-widest uppercase">Select Inactive Reason</div>
        </div>
        <div className="p-4 space-y-3">
          <select value={inactiveModal.reason} onChange={(e) => setInactiveModal((p) => ({ ...p, reason: e.target.value }))} className="w-full border px-4 py-3 text-sm outline-none" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
            {INACTIVE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setInactiveModal({ open: false, userId: "", reason: INACTIVE_REASONS[0] })} className="border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>Cancel</button>
            <button type="button" onClick={async () => { const { userId, reason } = inactiveModal; setInactiveModal({ open: false, userId: "", reason: INACTIVE_REASONS[0] }); await changeStatus(userId, "inactive", reason); }} className="border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.redBd, background: pm.redBg, color: pm.fg }}>Confirm</button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, userId: "" })} pm={pm}>
        <div className="border-b px-4 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <div className="text-[12px] font-black tracking-widest uppercase">Delete User</div>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-sm" style={{ color: pm.fg }}>Are you sure you want to delete this user?</div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setDeleteModal({ open: false, userId: "" })} className="border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>Cancel</button>
            <button type="button" onClick={() => deleteUser(deleteModal.userId)} className="border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.redBd, background: pm.redBg, color: pm.fg }}>Confirm</button>
          </div>
        </div>
      </Modal>

      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} pm={pm}>
        <div className="border-b px-4 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <div className="text-[12px] font-black tracking-widest uppercase">User Details</div>
        </div>
        <div className="p-4">
          {detailsLoading ? <div className="text-sm">Loading...</div> : details ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>Name</div><div className="mt-1 font-black">{details.user?.fullName || "User"}</div></div>
                <div className="border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>Mobile</div><div className="mt-1 font-black">{details.user?.mobile || "-"}</div></div>
                <div className="border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>Status</div><div className="mt-1 font-black uppercase">{details.user?.status || "active"}</div></div>
                <div className="border px-3 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>Balance</div><div className="mt-1 font-black">{fmt2(details.user?.balance || 0)}</div></div>
              </div>
              <div className="border p-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
                <div className="text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>Transaction History</div>
                <div className="mt-2 max-h-[360px] space-y-2 overflow-y-auto">
                  {details.transactions?.length ? details.transactions.map((row) => (
                    <div key={row._id} className="border px-3 py-2 text-sm" style={{ borderColor: pm.b20, background: pm.bg06 }}>
                      <div className="flex items-center justify-between gap-2"><span className="font-black uppercase">{row.type}</span><span className="font-black">{fmt2(row.amount || 0)}</span></div>
                      <div className="mt-1 text-[11px] uppercase" style={{ color: pm.fg70 }}>{row.status}</div>
                      <div className="mt-1 whitespace-pre-wrap text-[12px]">{row.note || "No note"}</div>
                      <div className="mt-1 text-[10px]" style={{ color: pm.fg70 }}>{row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</div>
                    </div>
                  )) : <div className="text-sm" style={{ color: pm.fg70 }}>No transactions.</div>}
                </div>
              </div>
              <button type="button" onClick={() => setDetailsOpen(false)} className="w-full border py-3 text-sm font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>Close</button>
            </div>
          ) : <div className="text-sm">No details found.</div>}
        </div>
      </Modal>
    </div>
  );
}
