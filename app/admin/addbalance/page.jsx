"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Phone,
  Coins,
  Plus,
  Minus,
  Gift,
  Send,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

function usePM() {
  return useMemo(
    () => ({
      fg: "var(--pm-fg)",
      fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
      fg75: "color-mix(in srgb, var(--pm-fg) 75%, transparent)",
      fg80: "color-mix(in srgb, var(--pm-fg) 80%, transparent)",
      fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
      b18: "color-mix(in srgb, var(--pm-fg) 18%, transparent)",
      b22: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
      b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
      b35: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
      bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
      bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
      bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
      bg12: "color-mix(in srgb, var(--pm-fg) 12%, transparent)",
      greenBg: "rgba(34,197,94,0.16)",
    }),
    []
  );
}

function Block({ title, children, pm }) {
  return (
    <div className="select-none border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}`, color: pm.fg }}>
      <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ icon: Icon, label, placeholder, value, onChange, type = "text", pm }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg80 }}>{label}</div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: pm.fg75 }}><Icon className="h-4 w-4" /></span>
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} className="w-full border px-4 py-3 pl-10 text-sm outline-none" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }} />
      </div>
    </div>
  );
}

function ValidateLine({ touched, ok, warnText, tipText, pm }) {
  if (!touched) return <div className="text-[11px]" style={{ color: pm.fg70 }}>{tipText}</div>;
  if (ok) return <div className="inline-flex items-center gap-2 text-[11px] font-bold" style={{ color: pm.fg }}><CheckCircle2 className="h-4 w-4" /> Looks good</div>;
  return <div className="inline-flex items-center gap-2 text-[11px] font-bold" style={{ color: pm.fg80 }}><AlertCircle className="h-4 w-4" /> {warnText}</div>;
}

function ModeBtn({ active, onClick, icon: Icon, label, pm }) {
  const activeBg = pm.bg12;
  const activeBd = pm.b35;
  return (
    <button type="button" onClick={onClick} className="border px-3 py-3 font-black active:scale-[0.99]" style={{ borderColor: active ? activeBd : pm.b28, background: active ? activeBg : pm.bg10, color: pm.fg, boxShadow: active ? `inset 0 0 0 2px ${activeBd}` : "none" }}>
      <span className="inline-flex items-center justify-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
    </button>
  );
}

function GiftModal({ open, pm, formAmount, defaultAmount, selected, setSelected, onConfirm, onClose }) {
  if (!open) return null;
  const customAmount = Number(formAmount || 0);
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-sm border p-4" style={{ borderColor: pm.b28, background: 'var(--pm-bg)', color: pm.fg }}>
        <div className="flex items-center justify-between gap-3 border-b pb-3" style={{ borderColor: pm.b20 }}>
          <div>
            <div className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: pm.fg70 }}>Gift</div>
            <div className="mt-1 text-base font-black tracking-widest uppercase">Choose Gift Amount</div>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg08 }}><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-3 space-y-2">
          <button type="button" onClick={() => setSelected('default')} className="w-full border px-3 py-3 text-left" style={{ borderColor: selected === 'default' ? pm.b35 : pm.b20, background: selected === 'default' ? pm.bg12 : pm.bg08 }}>
            <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Default</div>
            <div className="mt-1 font-black">Tk {Number(defaultAmount || 0).toFixed(2)}</div>
          </button>
          <button type="button" onClick={() => setSelected('custom')} className="w-full border px-3 py-3 text-left" style={{ borderColor: selected === 'custom' ? pm.b35 : pm.b20, background: selected === 'custom' ? pm.bg12 : pm.bg08 }}>
            <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Custom</div>
            <div className="mt-1 font-black">Tk {customAmount > 0 ? customAmount.toFixed(2) : '0.00'}</div>
          </button>
        </div>
        <button type="button" onClick={onConfirm} className="mt-4 w-full border py-3 text-sm font-black tracking-widest uppercase" style={{ borderColor: pm.b35, background: pm.bg12, color: pm.fg }}>Confirm Gift</button>
      </div>
    </div>
  );
}

export default function AdminAddBalancePage() {
  const pm = usePM();
  const [identifier, setIdentifier] = useState("");
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [mode, setMode] = useState("plus");
  const [loading, setLoading] = useState(false);
  const [giftModal, setGiftModal] = useState(false);
  const [giftChoice, setGiftChoice] = useState("default");
  const [confirmedGiftChoice, setConfirmedGiftChoice] = useState("default");
  const [defaultGiftAmount, setDefaultGiftAmount] = useState(0);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/general-settings', { credentials: 'include', cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!live || !res.ok) return;
        setDefaultGiftAmount(Number(data?.data?.giftBoxAmount || 0));
      } catch {}
    })();
    return () => { live = false; };
  }, []);

  const identifierValid = useMemo(() => /^01\d{9}$/.test(identifier.trim().replace(/\D/g, '').slice(0, 11)), [identifier]);
  const amountNumber = useMemo(() => Number(amount || 0), [amount]);
  const amountValid = useMemo(() => Number.isFinite(amountNumber) && amountNumber > 0, [amountNumber]);
  const canSubmit = identifierValid && (mode === 'gift' ? true : amountValid) && !loading;

  const openGiftChooser = () => {
    setGiftChoice(confirmedGiftChoice || 'default');
    setGiftModal(true);
  };

  const confirmGiftChoice = () => {
    if (giftChoice === 'custom' && !amountValid) {
      toast.error('Enter a valid custom amount first');
      return;
    }
    setConfirmedGiftChoice(giftChoice);
    setGiftModal(false);
    toast.success(giftChoice === 'default' ? 'Default gift selected' : 'Custom gift selected');
  };

  const handleSend = async () => {
    setIdentifierTouched(true);
    setAmountTouched(true);
    if (!canSubmit || loading) return;
    if (mode === 'gift' && confirmedGiftChoice === 'custom' && !amountValid) return;

    setLoading(true);
    try {
      const payload = {
        identifier: identifier.trim(),
        amount: mode === 'gift' && confirmedGiftChoice === 'default' ? Number(defaultGiftAmount || 0) : amountNumber,
        mode,
        giftOption: mode === 'gift' ? confirmedGiftChoice : undefined,
      };
      const res = await fetch('/api/admin/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || 'Request failed');
      toast.success(data?.message || 'Success');
      setAmount('');
      setAmountTouched(false);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 pt-16 md:pt-6 overflow-x-hidden" style={{ background: 'var(--pm-bg-grad)', color: pm.fg, fontFamily: 'var(--pm-font)' }}>
      <div className="mx-auto w-full max-w-md space-y-3 font-mono">
        <div className="border p-4" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] tracking-widest uppercase" style={{ color: pm.fg80 }}>Admin</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">Add and Gift</div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg75 }}>Plus adds balance, minus deducts balance, gift credits a gift amount directly.</div>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><ShieldCheck className="h-6 w-6" /></span>
          </div>
          <div className="mt-3">
            <Link href="/" className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg90 }}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
        </div>

        <Block pm={pm} title="Balance Form">
          <div className="space-y-3">
            <Field pm={pm} icon={Phone} label="User Mobile" placeholder="01XXXXXXXXX" value={identifier} onChange={(e) => { setIdentifierTouched(true); setIdentifier(e.target.value); }} />
            <ValidateLine pm={pm} touched={identifierTouched} ok={identifierValid} warnText="Please enter a valid mobile number." tipText="Use 11 digit mobile number." />

            <Field pm={pm} icon={Coins} label="Amount" placeholder="e.g. 100" value={amount} onChange={(e) => { setAmountTouched(true); setAmount(e.target.value.replace(/[^\d.]/g, '')); }} />
            <ValidateLine pm={pm} touched={amountTouched} ok={amountValid} warnText="Amount must be greater than 0." tipText={mode === 'gift' ? 'Custom amount is optional if you use the default gift amount.' : 'Enter a positive amount.'} />

            <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
              <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg80 }}>Mode</div>
              <div className="grid grid-cols-3 gap-2">
                <ModeBtn pm={pm} active={mode === 'plus'} onClick={() => setMode('plus')} icon={Plus} label="PLUS" />
                <ModeBtn pm={pm} active={mode === 'minus'} onClick={() => setMode('minus')} icon={Minus} label="MINUS" />
                <ModeBtn pm={pm} active={mode === 'gift'} onClick={() => setMode('gift')} icon={Gift} label="GIFT" />
              </div>
              {mode === 'gift' ? (
                <div className="mt-3 space-y-2">
                  <button type="button" onClick={openGiftChooser} className="w-full border px-3 py-3 text-left text-sm font-black tracking-widest uppercase" style={{ borderColor: pm.b35, background: pm.bg12, color: pm.fg }}>
                    Choose Gift Amount
                  </button>
                  <div className="text-[11px]" style={{ color: pm.fg75 }}>
                    Active Gift: <span className="font-black" style={{ color: pm.fg }}>{confirmedGiftChoice === 'default' ? `Default (Tk ${Number(defaultGiftAmount || 0).toFixed(2)})` : `Custom (Tk ${Number(amount || 0).toFixed(2)})`}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-[11px]" style={{ color: pm.fg75 }}>Selected mode: <span className="font-black" style={{ color: pm.fg }}>{mode.toUpperCase()}</span></div>
              )}
            </div>

            <button type="button" onClick={handleSend} disabled={!canSubmit} className="w-full border py-3 text-sm font-black active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed" style={{ borderColor: mode === 'gift' ? pm.b35 : pm.b28, background: mode === 'gift' ? pm.bg12 : pm.bg10, color: pm.fg }}>
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> PROCESSING...</> : <><Send className="h-4 w-4" /> SEND</>}
              </span>
            </button>
          </div>
        </Block>
      </div>

      <GiftModal open={giftModal} pm={pm} formAmount={amount} defaultAmount={defaultGiftAmount} selected={giftChoice} setSelected={setGiftChoice} onConfirm={confirmGiftChoice} onClose={() => setGiftModal(false)} />
    </div>
  );
}
