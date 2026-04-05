"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  User,
  BadgeDollarSign,
  ArrowDownToLine,
  BadgeCheck,
  KeyRound,
  CalendarDays,
  Users,
  Copy,
  Receipt,
  Phone,
  IdCard,
  Eye,
  EyeOff,
  Pencil,
  Save,
  Loader2,
  X,
} from "lucide-react";

const fmtBDT0 = (n) => `Tk ${Number(n || 0).toFixed(0)}`;

function formatJoinDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

async function copyText(txt) {
  const value = String(txt || "");
  if (!value) throw new Error("EMPTY");
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const ta = document.createElement("textarea");
  ta.value = value;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

const pm = {
  fg: "var(--pm-fg)",
  fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
  fg80: "color-mix(in srgb, var(--pm-fg) 80%, transparent)",
  fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
  b20: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
  b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
  b35: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
  bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
  bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
  bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
};

function Block({ title, children }) {
  return <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}`, color: pm.fg }}><div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>{title}</div>{children}</div>;
}
function MiniBox({ icon: Icon, label, value }) {
  return <div className="border px-3 py-3" style={{ borderColor: pm.b28, background: pm.bg08 }}><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg80 }}><Icon className="h-4 w-4" />{label}</span><span className="text-[11px] font-black tabular-nums" style={{ color: pm.fg }}>{value}</span></div></div>;
}
function Row({ icon: Icon, label, value, right }) {
  return <div className="flex items-center justify-between gap-3 border px-3 py-2" style={{ borderColor: pm.b28, background: pm.bg08 }}><span className="inline-flex items-center gap-2 text-[12px]" style={{ color: pm.fg90 }}><Icon className="h-4 w-4" style={{ color: pm.fg80 }} />{label}</span><span className="inline-flex items-center gap-2 font-black"><span className="tabular-nums" style={{ color: pm.fg }}>{value || "—"}</span>{right || null}</span></div>;
}
function Field({ label, value, onChange, type = "text", rightSlot }) {
  return <div><div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg80 }}>{label}</div><div className="relative"><input type={type} value={value} onChange={onChange} className={["w-full border px-3 py-2 text-sm outline-none", rightSlot ? "pr-12" : ""].join(" ")} style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg, boxShadow: `0 0 0 1px ${pm.b20}` }} />{rightSlot ? <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div> : null}</div></div>;
}
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4"><div className="w-full max-w-md border" style={{ borderColor: pm.b28, background: "var(--pm-bg)" }}><div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="text-[12px] font-black tracking-widest uppercase">{title}</div><button type="button" onClick={onClose} className="border p-2" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}><X className="h-4 w-4" /></button></div><div className="p-4">{children}</div></div></div>;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [pwOpen, setPwOpen] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/user/profile", { credentials: "include", cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.message || "Failed to load profile");
        if (!alive) return;
        setProfile(j?.data || null);
        setNameDraft(String(j?.data?.user?.fullName || ""));
      } catch (e) {
        if (alive) toast.error(e?.message || "Load failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const u = profile?.user || {};
  const totals = profile?.totals || {};
  const referralIncome = Number(profile?.referralIncome || 0);
  const changed = useMemo(() => String(nameDraft || "").trim().replace(/\s+/g, " ") !== String(u.fullName || ""), [nameDraft, u.fullName]);

  const saveProfile = async () => {
    if (!changed || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: nameDraft }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j?.message || "Save failed");
      toast.success(j?.message || "Saved");
      setProfile((p) => ({ ...p, user: { ...(p?.user || {}), fullName: j?.data?.fullName || nameDraft } }));
      setEditName(false);
    } catch { toast.error("Network error"); } finally { setSaving(false); }
  };

  const updatePassword = async () => {
    if (!curPass || String(newPass).length < 8 || pwSaving) return toast.error("Enter valid passwords");
    setPwSaving(true);
    try {
      const res = await fetch("/api/user/profile", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: curPass, newPassword: newPass }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j?.message || "Password update failed");
      toast.success(j?.message || "Password updated");
      setPwOpen(false);
      setCurPass("");
      setNewPass("");
    } catch { toast.error("Network error"); } finally { setPwSaving(false); }
  };

  if (loading) return <div className="min-h-screen mt-14 px-3 py-4" style={{ background: "var(--pm-bg-grad)", color: pm.fg }}><div className="mx-auto max-w-sm"><Block title="PROFILE"><div className="inline-flex items-center gap-2 text-[12px] font-black tracking-widest uppercase"><Loader2 className="h-4 w-4 animate-spin" />Loading profile...</div></Block></div></div>;
  if (!profile) return <div className="min-h-screen mt-14 px-3 py-4" style={{ background: "var(--pm-bg-grad)", color: pm.fg }}><div className="mx-auto max-w-sm"><Block title="PROFILE">Profile not available.</Block></div></div>;

  return (
    <div className="min-h-screen mt-14 px-3 py-4 font-medium" style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto w-full max-w-sm space-y-2">
        <Block title="PROFILE OVERVIEW">
          <div className="flex items-start justify-between gap-3"><div><div className="text-[10px]" style={{ color: pm.fg70 }}>ACCOUNT</div><div className="mt-1 text-lg font-black tracking-widest uppercase">{u.role === "admin" ? "ADMIN" : "USER"}</div><div className="mt-2 inline-flex items-center gap-2 text-[11px]" style={{ color: pm.fg90 }}><CalendarDays className="h-4 w-4" style={{ color: pm.fg80 }} />Joined: <span className="font-black">{formatJoinDate(u.joinDate)}</span></div><div className="mt-3 inline-flex items-center gap-2 border px-3 py-1 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg08 }}><BadgeCheck className="h-4 w-4" />PROFILE</div></div><span className="grid h-12 w-12 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg08 }}><User className="h-6 w-6" /></span></div>
        </Block>

        <Block title="ACCOUNT DETAILS">
          <div className="space-y-2">
            <div className="border px-3 py-2" style={{ borderColor: pm.b28, background: pm.bg08 }}>
              <div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-[12px]" style={{ color: pm.fg90 }}><IdCard className="h-4 w-4" style={{ color: pm.fg80 }} />NAME</span><button type="button" onClick={() => setEditName((v) => !v)} className="inline-flex items-center gap-2 border px-2 py-1 text-[10px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}><Pencil className="h-3.5 w-3.5" />EDIT</button></div>
              <div className="mt-2">{editName ? <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="w-full border px-3 py-2 text-sm outline-none" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg, boxShadow: `0 0 0 1px ${pm.b20}` }} /> : <div className="text-[12px] font-black">{u.fullName || "—"}</div>}</div>
            </div>
            <div className="border px-3 py-2" style={{ borderColor: pm.b28, background: pm.bg08 }}>
              <div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-[12px]" style={{ color: pm.fg90 }}><Phone className="h-4 w-4" style={{ color: pm.fg80 }} />MOBILE</span><button type="button" onClick={() => copyText(u.mobile).then(() => toast.success("Mobile copied")).catch(() => toast.error("Copy failed"))} className="inline-flex items-center gap-2 border px-2 py-1 text-[10px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}><Copy className="h-3.5 w-3.5" />COPY</button></div>
              <div className="mt-2 text-[12px] font-black tabular-nums">{u.mobile || "—"}</div>
            </div>
            <Row icon={KeyRound} label="PASSWORD" value="••••••••••" right={<button type="button" onClick={() => setPwOpen(true)} className="inline-flex items-center gap-2 border px-2 py-1 text-[10px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}><Pencil className="h-3.5 w-3.5" />CHANGE</button>} />
            <Row icon={Users} label="REFERRAL CODE" value={u.referralCode} right={<button type="button" onClick={() => copyText(u.referralCode).then(() => toast.success("Referral code copied")).catch(() => toast.error("Copy failed"))} className="inline-flex items-center gap-2 border px-2 py-1 text-[10px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}><Copy className="h-3.5 w-3.5" />COPY</button>} />
            <Row icon={Users} label="TOTAL REFERRALS" value={String(u.referralsCount || 0)} />
          </div>
        </Block>

        {(editName && changed) ? <Block title="SAVE"><button type="button" onClick={saveProfile} disabled={saving} className="w-full border py-2 text-[12px] font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.b35, background: pm.bg10, color: pm.fg }}>{saving ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />SAVING...</span> : <span className="inline-flex items-center gap-2"><Save className="h-4 w-4" />SAVE CHANGES</span>}</button></Block> : null}

        <Block title="WALLET SNAPSHOT">
          <div className="space-y-2">
            <MiniBox icon={BadgeDollarSign} label="TODAY INCOME" value={fmtBDT0(totals.todayIncome || 0)} />
            <MiniBox icon={Users} label="REFERRALS" value={String(u.referralsCount || 0)} />
            <MiniBox icon={Receipt} label="TOTAL DEPOSIT" value={fmtBDT0(totals.totalDeposit || 0)} />
            <MiniBox icon={ArrowDownToLine} label="TOTAL WITHDRAW" value={fmtBDT0(totals.totalWithdraw || 0)} />
            <MiniBox icon={Receipt} label="TOTAL TRANSACTIONS" value={String(totals.totalTransactions || 0)} />
            <MiniBox icon={BadgeDollarSign} label="REFERRAL INCOME" value={fmtBDT0(referralIncome)} />
          </div>
        </Block>
      </div>

      <Modal open={pwOpen} title="CHANGE PASSWORD" onClose={() => (pwSaving ? null : setPwOpen(false))}>
        <div className="space-y-3">
          <Field label="CURRENT PASSWORD" value={curPass} onChange={(e) => setCurPass(e.target.value)} type={showCur ? "text" : "password"} rightSlot={<button type="button" onClick={() => setShowCur((s) => !s)} className="border p-2" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>{showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
          <Field label="NEW PASSWORD" value={newPass} onChange={(e) => setNewPass(e.target.value)} type={showNewPw ? "text" : "password"} rightSlot={<button type="button" onClick={() => setShowNewPw((s) => !s)} className="border p-2" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>{showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
          <div className="text-[11px] font-bold" style={{ color: newPass ? (String(newPass).length >= 8 ? "rgba(209,250,229,0.98)" : "rgba(255,228,230,0.98)") : pm.fg70 }}>{newPass ? (String(newPass).length >= 8 ? "Looks good." : "Password must be at least 8 characters.") : "Password must be at least 8 characters."}</div>
          <button type="button" onClick={updatePassword} disabled={pwSaving || !curPass || String(newPass).length < 8} className="w-full border py-2 text-[12px] font-black tracking-widest uppercase disabled:opacity-60" style={{ borderColor: pm.b35, background: pm.bg10, color: pm.fg }}>{pwSaving ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />PROCESSING...</span> : <span className="inline-flex items-center gap-2"><Save className="h-4 w-4" />UPDATE PASSWORD</span>}</button>
        </div>
      </Modal>
    </div>
  );
}
