"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Activity, Users, Clock3, BarChart3, Ban, Gift, RefreshCw, Send } from "lucide-react";
import ThemedModal from "@/components/ThemedModal";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });
const PERIODS = [
  { value: 1, label: "Last 24 Hours" },
  { value: 7, label: "Last 7 Days" },
  { value: 15, label: "Last 15 Days" },
  { value: 30, label: "Last 30 Days" },
];

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

function Card({ title, children, pm, icon: Icon, action }) {
  return (
    <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
      <div className="mb-3 flex items-center justify-between gap-2 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>
        <div className="inline-flex items-center gap-2">{Icon ? <Icon className="h-4 w-4" /> : null}<span>{title}</span></div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SummaryBox({ label, value, pm }) {
  return (
    <div className="border px-3 py-3 text-center" style={{ borderColor: pm.b20, background: pm.bg08 }}>
      <div className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: pm.fg70 }}>{label}</div>
      <div className="mt-2 text-lg font-black leading-none break-words" style={{ color: pm.fg }}>{value}</div>
    </div>
  );
}

function UserRow({ row, pm, onOpen }) {
  return (
    <button type="button" onClick={() => row.userId && onOpen(row.userId)} className="w-full border px-3 py-3 text-left" style={{ borderColor: pm.b20, background: pm.bg08 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-black uppercase tracking-widest truncate">{row.fullName || "User"}</div>
          <div className="mt-1 text-[11px]" style={{ color: pm.fg70 }}>{row.mobile || "—"} • Tk {Number(row.balance || 0).toLocaleString()}</div>
          <div className="mt-1 text-[11px] break-all" style={{ color: pm.fg70 }}>{row.currentPath || "/"}</div>
        </div>
        <div className="shrink-0 text-right text-[10px]" style={{ color: pm.fg70 }}>
          <div>{row.periodViews || 0} views</div>
          <div>{row.periodClicks || 0} clicks</div>
        </div>
      </div>
    </button>
  );
}

function DetailModal({ open, detail, pm, closing, onClose, onBanToggle, onGift }) {
  if (!open || !detail) return null;
  return (
    <ThemedModal open={open} onClose={onClose} title="User Details" subtitle="Click the actions below to gift or change account status." widthClass="max-w-lg">
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Selected User</div>
            <div className="mt-1 text-lg font-black uppercase tracking-widest">{detail.fullName || "User"}</div>
            <div className="mt-1 text-[12px]" style={{ color: pm.fg70 }}>{detail.mobile || "—"}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SummaryBox label="Balance" value={`Tk ${Number(detail.balance || 0).toLocaleString()}`} pm={pm} />
          <SummaryBox label="Status" value={String(detail.status || "active").toUpperCase()} pm={pm} />
          <SummaryBox label="24H Clicks" value={detail.clicks24h || 0} pm={pm} />
          <SummaryBox label="Yesterday" value={detail.clicksYesterday || 0} pm={pm} />
          <SummaryBox label="Views" value={detail.viewsPeriod || 0} pm={pm} />
          <SummaryBox label="Clicks" value={detail.clicksPeriod || 0} pm={pm} />
        </div>

        <div className="border px-3 py-3 text-[12px]" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <div className="font-black uppercase tracking-widest">Current Path</div>
          <div className="mt-1 break-all" style={{ color: pm.fg70 }}>{detail.currentPath || "/"}</div>
          <div className="mt-1" style={{ color: pm.fg70 }}>Last Seen: {detail.lastSeenAt ? new Date(detail.lastSeenAt).toLocaleString() : "—"}</div>
          {detail.inactiveReason ? <div className="mt-2 whitespace-pre-wrap" style={{ color: pm.fg70 }}>{detail.inactiveReason}</div> : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={closing} onClick={onGift} className="border px-3 py-3 text-[11px] font-black uppercase tracking-widest disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg }}><span className="inline-flex items-center gap-2"><Gift className="h-4 w-4" />Gift</span></button>
          <button type="button" disabled={closing} onClick={onBanToggle} className="border px-3 py-3 text-[11px] font-black uppercase tracking-widest disabled:opacity-60" style={{ borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.12)", color: pm.fg }}><span className="inline-flex items-center gap-2"><Ban className="h-4 w-4" />{detail.status === "inactive" ? "Activate" : "Ban"}</span></button>
        </div>

        <div className="border p-3" style={{ borderColor: pm.b20, background: pm.bg08 }}>
          <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: pm.fg70 }}>Top Pages</div>
          <div className="mt-2 space-y-2 max-h-48 overflow-auto">
            {!detail.pageRows?.length ? <div className="text-sm">No page data.</div> : detail.pageRows.map((row) => <div key={row.path} className="border px-3 py-2 text-[11px]" style={{ borderColor: pm.b20, background: pm.bg06 }}><div className="font-black break-all">{row.path}</div><div className="mt-1" style={{ color: pm.fg70 }}>Views {row.views} • Clicks {row.clicks} • Users {row.users}</div></div>)}
          </div>
        </div>
      </div>
    </ThemedModal>
  );
}

const fmtMoney = (n) => `Tk ${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export default function AdminAnalyticsPage() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState(1);
  const [data, setData] = useState({ summary: {}, onlineRows: [], activeRows: [], pageRows: [], livePageRows: [], detail: null });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBusy, setDetailBusy] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftSaving, setGiftSaving] = useState(false);
  const [giftForm, setGiftForm] = useState({ amount: "100", note: "" });
  const [banOpen, setBanOpen] = useState(false);
  const [banSaving, setBanSaving] = useState(false);
  const [banReason, setBanReason] = useState("আপনার অ্যাকাউন্ট সাময়িকভাবে বন্ধ করা হয়েছে।");

  const load = async (nextPeriod = period, silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${nextPeriod}`, { credentials: "include", cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) return toast.error(j?.message || "Failed to load analytics");
      setData((prev) => ({ ...prev, ...(j.data || {}), detail: prev.detail }));
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openDetail = async (userId) => {
    if (!userId) return;
    setDetailBusy(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}&userId=${encodeURIComponent(userId)}`, { credentials: "include", cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok || !j?.data?.detail) return toast.error(j?.message || "Failed to load user details");
      setData((prev) => ({ ...prev, detail: j.data.detail }));
    } catch {
      toast.error("Network error");
    } finally {
      setDetailBusy(false);
    }
  };

  const openGiftModal = () => {
    if (!data.detail?.mobile) return;
    setGiftForm({ amount: "100", note: "" });
    setGiftOpen(true);
  };

  const giftUser = async () => {
    const detail = data.detail;
    if (!detail?.mobile) return;
    const amountNum = Number(giftForm.amount || 0);
    if (!(amountNum > 0)) {
      toast.error("Valid gift amount লিখুন");
      return;
    }
    setGiftSaving(true);
    try {
      const res = await fetch("/api/admin/balance", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: detail.mobile, mode: "gift", amount: amountNum, sendNotice: Boolean(giftForm.note.trim()), noticeText: giftForm.note.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) return toast.error(j?.message || "Gift failed");
      toast.success(j?.message || "Gift sent");
      setGiftOpen(false);
      await Promise.all([load(period, true), openDetail(detail.userId)]);
    } catch {
      toast.error("Network error");
    } finally {
      setGiftSaving(false);
    }
  };

  const openBanModal = () => {
    const detail = data.detail;
    if (!detail?.userId) return;
    if (detail.status === "inactive") {
      void toggleBan();
      return;
    }
    setBanReason(detail.inactiveReason || "আপনার অ্যাকাউন্ট সাময়িকভাবে বন্ধ করা হয়েছে।");
    setBanOpen(true);
  };

  const toggleBan = async () => {
    const detail = data.detail;
    if (!detail?.userId) return;
    const nextStatus = detail.status === "inactive" ? "active" : "inactive";
    const reason = nextStatus === "inactive" ? String(banReason || "").trim() : "";
    if (nextStatus === "inactive" && !reason) {
      toast.error("Ban reason লিখুন");
      return;
    }
    setBanSaving(true);
    try {
      const res = await fetch("/api/admin/user-management", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: detail.userId, status: nextStatus, inactiveReason: reason }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) return toast.error(j?.message || "Status update failed");
      toast.success(j?.message || "Updated");
      setBanOpen(false);
      await Promise.all([load(period, true), openDetail(detail.userId)]);
    } catch {
      toast.error("Network error");
    } finally {
      setBanSaving(false);
    }
  };

  useEffect(() => {
    load(period, false);
    const t = setInterval(() => load(period, true), 30000);
    return () => clearInterval(t);
  }, [period]);

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto max-w-5xl space-y-3 font-mono">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">Activity</div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg70 }}>Live users, page clicks, visits, deposits, withdraws, and detailed user activity.</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg08 }}><BarChart3 className="h-5 w-5" /></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {PERIODS.map((item) => <button key={item.value} type="button" onClick={() => setPeriod(item.value)} className="border px-3 py-3 text-[11px] font-black uppercase tracking-widest" style={{ borderColor: pm.b28, background: period === item.value ? pm.bg08 : "transparent", color: pm.fg }}>{item.label}</button>)}
        </div>

        {loading ? <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b28, background: pm.bg06 }}>Loading activity...</div> : (<>
          <Card title="Quick Data" pm={pm} icon={Activity} action={refreshing ? <span className="inline-flex items-center gap-2 text-[10px]"><RefreshCw className="h-3 w-3 animate-spin" />Updating</span> : null}>
            <div className="grid grid-cols-2 gap-2">
              <SummaryBox label="Online Now" value={data.summary.onlineNow || 0} pm={pm} />
              <SummaryBox label="Visitors 24H" value={data.summary.visitors24h || 0} pm={pm} />
              <SummaryBox label={`Active ${period === 1 ? '24H' : `${period}D`}`} value={data.summary.activePeriod || 0} pm={pm} />
              <SummaryBox label={`New ${period === 1 ? '24H' : `${period}D`}`} value={data.summary.newUsersPeriod || 0} pm={pm} />
              <SummaryBox label="Views" value={data.summary.viewsPeriod || 0} pm={pm} />
              <SummaryBox label="Clicks" value={data.summary.clicksPeriod || 0} pm={pm} />
              <SummaryBox label="Deposits" value={data.summary.depositsPeriod || 0} pm={pm} />
              <SummaryBox label="Withdraws" value={data.summary.withdrawsPeriod || 0} pm={pm} />
              <SummaryBox label="Deposit Amt" value={fmtMoney(data.summary.depositAmountPeriod || 0)} pm={pm} />
              <SummaryBox label="Withdraw Amt" value={fmtMoney(data.summary.withdrawAmountPeriod || 0)} pm={pm} />
            </div>
          </Card>

          <div className="grid gap-3 xl:grid-cols-2">
            <Card title="Currently Online Users" pm={pm} icon={Clock3}>
              <div className="space-y-2 max-h-[420px] overflow-auto">
                {!data.onlineRows?.length ? <div className="border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>No user is online right now.</div> : data.onlineRows.map((row, index) => <UserRow key={`${row.userId || row.mobile}-${index}`} row={row} pm={pm} onOpen={openDetail} />)}
              </div>
            </Card>

            <Card title="Recent Active Users" pm={pm} icon={Users}>
              <div className="space-y-2 max-h-[420px] overflow-auto">
                {!data.activeRows?.length ? <div className="border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>No recent active user found.</div> : data.activeRows.map((row, index) => <UserRow key={`${row.userId || row.mobile}-${index}`} row={row} pm={pm} onOpen={openDetail} />)}
              </div>
            </Card>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <Card title="Live Pages Now" pm={pm} icon={Activity}>
              <div className="space-y-2 max-h-[360px] overflow-auto">
                {!data.livePageRows?.length ? <div className="border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>No live page data.</div> : data.livePageRows.map((row) => <div key={row.path} className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="font-black break-all uppercase tracking-widest">{row.path}</div><div className="mt-1" style={{ color: pm.fg70 }}>Users {row.users}</div><div className="mt-1 text-[10px]" style={{ color: pm.fg70 }}>{row.usersList?.slice(0, 4).map((u) => u.fullName || u.mobile).join(" • ") || "—"}</div></div>)}
              </div>
            </Card>

            <Card title={`Top Pages ${period === 1 ? '24H' : `${period}D`}`} pm={pm} icon={Activity}>
              <div className="space-y-2 max-h-[360px] overflow-auto">
                {!data.pageRows?.length ? <div className="border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08 }}>No page data.</div> : data.pageRows.map((row) => <div key={row.path} className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="font-black break-all uppercase tracking-widest">{row.path}</div><div className="mt-1" style={{ color: pm.fg70 }}>Users {row.users} • Views {row.views} • Clicks {row.clicks}</div></div>)}
              </div>
            </Card>
          </div>
        </>)}
      </div>

      <DetailModal open={detailOpen} detail={data.detail} pm={pm} closing={detailBusy} onClose={() => setDetailOpen(false)} onBanToggle={openBanModal} onGift={openGiftModal} />

      <ThemedModal
        open={giftOpen}
        onClose={() => (giftSaving ? null : setGiftOpen(false))}
        title="Gift User"
        subtitle={data.detail?.mobile ? `Selected user: ${data.detail.mobile}` : "Enter gift amount and optional notice text."}
      >
        <div className="space-y-3">
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: pm.fg70 }}>Gift Amount</div>
            <input value={giftForm.amount} onChange={(e) => setGiftForm((s) => ({ ...s, amount: e.target.value }))} inputMode="decimal" className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} placeholder="100" />
          </div>
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: pm.fg70 }}>Optional Notice</div>
            <textarea rows={4} value={giftForm.note} onChange={(e) => setGiftForm((s) => ({ ...s, note: e.target.value }))} className="w-full resize-none border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} placeholder="Gift-এর সাথে modal notice পাঠাতে চাইলে এখানে লিখুন" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setGiftOpen(false)} disabled={giftSaving} className="w-full border py-3 text-[11px] font-black uppercase tracking-widest" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}>Cancel</button>
            <button type="button" onClick={giftUser} disabled={giftSaving} className="w-full border py-3 text-[11px] font-black uppercase tracking-widest disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
              <span className="inline-flex items-center justify-center gap-2">{giftSaving ? <><RefreshCw className="h-4 w-4 animate-spin" />Sending...</> : <><Send className="h-4 w-4" />Send Gift</>}</span>
            </button>
          </div>
        </div>
      </ThemedModal>

      <ThemedModal
        open={banOpen}
        onClose={() => (banSaving ? null : setBanOpen(false))}
        title={data.detail?.status === "inactive" ? "Activate User" : "Ban User"}
        subtitle={data.detail?.status === "inactive" ? "This account will be activated again." : "Write a clear reason before you disable this account."}
      >
        <div className="space-y-3">
          {data.detail?.status === "inactive" ? (
            <div className="border px-3 py-3 text-sm" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg70 }}>
              Current inactive reason: {data.detail?.inactiveReason || "No reason saved."}
            </div>
          ) : (
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: pm.fg70 }}>Ban Reason</div>
              <textarea rows={5} value={banReason} onChange={(e) => setBanReason(e.target.value)} className="w-full resize-none border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} placeholder="User inactive হওয়ার কারণ লিখুন" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setBanOpen(false)} disabled={banSaving} className="w-full border py-3 text-[11px] font-black uppercase tracking-widest" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}>Cancel</button>
            <button type="button" onClick={toggleBan} disabled={banSaving} className="w-full border py-3 text-[11px] font-black uppercase tracking-widest disabled:opacity-60" style={{ borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.12)", color: pm.fg }}>
              <span className="inline-flex items-center justify-center gap-2">{banSaving ? <><RefreshCw className="h-4 w-4 animate-spin" />Saving...</> : <><Ban className="h-4 w-4" />{data.detail?.status === "inactive" ? "Activate" : "Ban User"}</>}</span>
            </button>
          </div>
        </div>
      </ThemedModal>
    </div>
  );
}
