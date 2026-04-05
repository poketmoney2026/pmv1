"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Loader2, Save, Settings2, Gift, Trophy, Percent, CalendarDays } from "lucide-react";

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

function Box({ title, icon: Icon, children, pm }) {
  return (
    <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
      <div className="mb-2 flex items-center gap-2 text-[11px] font-black tracking-widest uppercase">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        <span>{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, pm }) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>{label}</div>
      <input value={value} onChange={onChange} className="w-full border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} />
    </div>
  );
}

const EMPTY = {
  minDeposit: "",
  maxDeposit: "",
  minWithdraw: "",
  maxWithdraw: "",
  rechargeMinWithdraw: "20",
  rechargeMaxWithdraw: "",
  withdrawFee: "",
  dailyWithdrawLimit: "",
  dailyAmountLimit: "",
  claimCooldownSec: "120",
  noticeIntervalMin: "30",
  firstReferralBonus: "10",
  regularReferralBonus: "0",
  welcomeBonus: "5",
  giftBoxAmount: "5",
  firstPrize: "10000",
  secondPrize: "5000",
  thirdPrize: "3000",
  rank4to10Prize: "2000",
  rank11to50Prize: "1000",
  interestPercent: "",
  interestDay: "12",
};

export default function AdminGeneralPage() {
  const pm = usePM();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const setVal = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const [generalRes, interestRes] = await Promise.all([
          fetch("/api/admin/general-settings", { credentials: "include", cache: "no-store" }),
          fetch("/api/admin/interest", { credentials: "include", cache: "no-store" }),
        ]);
        const data = await generalRes.json().catch(() => ({}));
        const interestData = await interestRes.json().catch(() => ({}));
        if (!live) return;
        if (!generalRes.ok) return toast.error(data?.message || "Failed to load settings");
        if (!interestRes.ok) return toast.error(interestData?.message || "Failed to load interest settings");
        const next = data?.data || {};
        setForm({
          minDeposit: next.minDeposit ?? "",
          maxDeposit: next.maxDeposit ?? "",
          minWithdraw: next.minWithdraw ?? "",
          maxWithdraw: next.maxWithdraw ?? "",
          rechargeMinWithdraw: next.rechargeMinWithdraw ?? 20,
          rechargeMaxWithdraw: next.rechargeMaxWithdraw ?? "",
          withdrawFee: next.withdrawFee ?? "",
          dailyWithdrawLimit: next.dailyWithdrawLimit ?? "",
          dailyAmountLimit: next.dailyAmountLimit ?? "",
          claimCooldownSec: next.claimCooldownSec ?? 120,
          noticeIntervalMin: next.noticeIntervalMin ?? 30,
          firstReferralBonus: next.firstReferralBonus ?? 10,
          regularReferralBonus: next.regularReferralBonus ?? 0,
          welcomeBonus: next.welcomeBonus ?? 5,
          giftBoxAmount: next.giftBoxAmount ?? 5,
          firstPrize: next.firstPrize ?? 10000,
          secondPrize: next.secondPrize ?? 5000,
          thirdPrize: next.thirdPrize ?? 3000,
          rank4to10Prize: next.rank4to10Prize ?? 2000,
          rank11to50Prize: next.rank11to50Prize ?? 1000,
          interestPercent: interestData?.data?.valuePercent ?? "",
          interestDay: interestData?.data?.day ?? 12,
        });
      } catch {
        if (live) toast.error("Network error");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      const interestPayload = {
        valuePercent: Number(String(form.interestPercent || "").trim() || 0),
        day: Number(String(form.interestDay || "").trim() || 12),
      };
      delete payload.interestPercent;
      delete payload.interestDay;
      const [res, interestRes] = await Promise.all([
        fetch("/api/admin/general-settings", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch("/api/admin/interest", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(interestPayload),
        }),
      ]);
      const data = await res.json().catch(() => ({}));
      const interestData = await interestRes.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Save failed");
      if (!interestRes.ok) return toast.error(interestData?.message || "Interest save failed");
      toast.success(data?.message || "Saved");
      const next = data?.data || {};
      setForm({
        minDeposit: next.minDeposit ?? "",
        maxDeposit: next.maxDeposit ?? "",
        minWithdraw: next.minWithdraw ?? "",
        maxWithdraw: next.maxWithdraw ?? "",
        rechargeMinWithdraw: next.rechargeMinWithdraw ?? 20,
        rechargeMaxWithdraw: next.rechargeMaxWithdraw ?? "",
        withdrawFee: next.withdrawFee ?? "",
        dailyWithdrawLimit: next.dailyWithdrawLimit ?? "",
        dailyAmountLimit: next.dailyAmountLimit ?? "",
        claimCooldownSec: next.claimCooldownSec ?? 120,
        noticeIntervalMin: next.noticeIntervalMin ?? 30,
        firstReferralBonus: next.firstReferralBonus ?? 10,
        regularReferralBonus: next.regularReferralBonus ?? 0,
        welcomeBonus: next.welcomeBonus ?? 5,
        giftBoxAmount: next.giftBoxAmount ?? 5,
        firstPrize: next.firstPrize ?? 10000,
        secondPrize: next.secondPrize ?? 5000,
        thirdPrize: next.thirdPrize ?? 3000,
        rank4to10Prize: next.rank4to10Prize ?? 2000,
        rank11to50Prize: next.rank11to50Prize ?? 1000,
        interestPercent: interestData?.data?.valuePercent ?? form.interestPercent ?? "",
        interestDay: interestData?.data?.day ?? form.interestDay ?? 12,
      });
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto max-w-md space-y-3 font-mono">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">General Settings</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><Settings2 className="h-5 w-5" /></span>
          </div>
        </div>

        {loading ? (
          <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b28, background: pm.bg06 }}>Loading...</div>
        ) : (
          <>
            <Box title="Deposit Box" pm={pm}>
              <Field pm={pm} label="Minimum Deposit" value={form.minDeposit} onChange={(e) => setVal("minDeposit", e.target.value)} />
              <Field pm={pm} label="Maximum Deposit" value={form.maxDeposit} onChange={(e) => setVal("maxDeposit", e.target.value)} />
            </Box>

            <Box title="Withdraw Box" pm={pm}>
              <Field pm={pm} label="Minimum Withdraw (bKash / Nagad)" value={form.minWithdraw} onChange={(e) => setVal("minWithdraw", e.target.value)} />
              <Field pm={pm} label="Maximum Withdraw (bKash / Nagad)" value={form.maxWithdraw} onChange={(e) => setVal("maxWithdraw", e.target.value)} />
              <Field pm={pm} label="Minimum Withdraw (Mobile Recharge)" value={form.rechargeMinWithdraw} onChange={(e) => setVal("rechargeMinWithdraw", e.target.value)} />
              <Field pm={pm} label="Maximum Withdraw (Mobile Recharge)" value={form.rechargeMaxWithdraw} onChange={(e) => setVal("rechargeMaxWithdraw", e.target.value)} />
              <Field pm={pm} label="Withdraw Fee (%)" value={form.withdrawFee} onChange={(e) => setVal("withdrawFee", e.target.value)} />
            </Box>

            <Box title="Daily Limit Box" pm={pm}>
              <Field pm={pm} label="Daily Withdraw Limit" value={form.dailyWithdrawLimit} onChange={(e) => setVal("dailyWithdrawLimit", e.target.value)} />
              <Field pm={pm} label="Daily Withdraw Amount Limit" value={form.dailyAmountLimit} onChange={(e) => setVal("dailyAmountLimit", e.target.value)} />
              <Field pm={pm} label="Claim Cooldown (Seconds)" value={form.claimCooldownSec} onChange={(e) => setVal("claimCooldownSec", e.target.value)} />
              <Field pm={pm} label="Notice Timer (Minutes)" value={form.noticeIntervalMin} onChange={(e) => setVal("noticeIntervalMin", e.target.value)} />
            </Box>

            <Box title="Referral Bonus Box" icon={Gift} pm={pm}>
              <Field pm={pm} label="First Referral Bonus (%)" value={form.firstReferralBonus} onChange={(e) => setVal("firstReferralBonus", e.target.value)} />
              <Field pm={pm} label="Regular Referral Bonus (%)" value={form.regularReferralBonus} onChange={(e) => setVal("regularReferralBonus", e.target.value)} />
              <Field pm={pm} label="Welcome Bonus" value={form.welcomeBonus} onChange={(e) => setVal("welcomeBonus", e.target.value)} />
              <Field pm={pm} label="Gift Box Amount" value={form.giftBoxAmount} onChange={(e) => setVal("giftBoxAmount", e.target.value)} />
            </Box>

            <Box title="Prize Breakdown" icon={Trophy} pm={pm}>
              <Field pm={pm} label="First Prize" value={form.firstPrize} onChange={(e) => setVal("firstPrize", e.target.value)} />
              <Field pm={pm} label="Second Prize" value={form.secondPrize} onChange={(e) => setVal("secondPrize", e.target.value)} />
              <Field pm={pm} label="Third Prize" value={form.thirdPrize} onChange={(e) => setVal("thirdPrize", e.target.value)} />
              <Field pm={pm} label="Rank 4 to 10 Prize" value={form.rank4to10Prize} onChange={(e) => setVal("rank4to10Prize", e.target.value)} />
              <Field pm={pm} label="Rank 11 to 50 Prize" value={form.rank11to50Prize} onChange={(e) => setVal("rank11to50Prize", e.target.value)} />
            </Box>

            <Box title="Daily Interest Box" icon={Percent} pm={pm}>
              <Field pm={pm} label="Interest (%)" value={form.interestPercent} onChange={(e) => setVal("interestPercent", e.target.value)} />
              <Field pm={pm} label="Plan Days" value={form.interestDay} onChange={(e) => setVal("interestDay", e.target.value)} />
            </Box>

            <button type="button" onClick={save} disabled={saving} className="w-full border py-3 text-sm font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
              <span className="inline-flex items-center justify-center gap-2">{saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Save className="h-4 w-4" />Save Settings</>}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
