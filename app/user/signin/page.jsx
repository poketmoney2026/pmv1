"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Phone, Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import useLiveAppStore from "@/stores/useLiveAppStore";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });
const MOBILE_RE = /^01\d{9}$/;

function usePM() {
  return useMemo(() => ({
    fg: "var(--pm-fg)",
    fg60: "color-mix(in srgb, var(--pm-fg) 60%, transparent)",
    fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
    fg80: "color-mix(in srgb, var(--pm-fg) 80%, transparent)",
    fg85: "color-mix(in srgb, var(--pm-fg) 85%, transparent)",
    fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
    b12: "color-mix(in srgb, var(--pm-fg) 12%, transparent)",
    b22: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
    b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
    b35: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
    bg05: "color-mix(in srgb, var(--pm-fg) 5%, transparent)",
    bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
    bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
  }), []);
}

function Block({ title, children, pm }) {
  return <div className="border p-4" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}><div className="mb-2 text-center text-[12px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>{title}</div>{children}</div>;
}

function ValidateLine({ touched, ok, warnText, tipText, pm }) {
  if (!touched) return <div className="text-[11px]" style={{ color: pm.fg70 }}>{tipText}</div>;
  if (ok) return <div className="inline-flex items-center gap-2 text-[11px] font-bold" style={{ color: "color-mix(in srgb, #34d399 85%, white)" }}><CheckCircle2 className="h-4 w-4" />Looks good</div>;
  return <div className="inline-flex items-center gap-2 text-[11px] font-bold" style={{ color: "color-mix(in srgb, #fb7185 85%, white)" }}><AlertCircle className="h-4 w-4" />{warnText}</div>;
}

function Field({ icon: Icon, label, placeholder, value, onChange, type = "text", rightSlot, disabled, pm, inputMode, maxLength }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg80 }}>{label}</div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: pm.fg70 }}><Icon className="h-4 w-4" /></span>
        <input disabled={disabled} type={type} placeholder={placeholder} value={value} onChange={onChange} inputMode={inputMode} maxLength={maxLength} className={["w-full border px-4 py-3 text-sm outline-none", "pl-10", rightSlot ? "pr-12" : ""].join(" ")} style={{ borderColor: disabled ? pm.b12 : pm.b28, background: disabled ? pm.bg05 : pm.bg10, color: disabled ? pm.fg70 : pm.fg }} />
        {rightSlot ? <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div> : null}
      </div>
      <style jsx>{`
        input::placeholder { color: ${pm.fg60}; }
        input:focus { box-shadow: 0 0 0 4px ${pm.b12}; border-color: ${pm.b35}; }
      `}</style>
    </div>
  );
}

export default function SigninPage() {
  const pm = usePM();
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [mobileTouched, setMobileTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [passTouched, setPassTouched] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const waLink = useLiveAppStore((state) => state.support?.contactWhatsApp || "#");

  const mobileValid = useMemo(() => MOBILE_RE.test(mobile.trim()), [mobile]);
  const passwordValid = useMemo(() => password.length >= 8, [password]);
  const canSubmit = mobileValid && passwordValid && !loading;

  const handleSignin = async () => {
    setMobileTouched(true);
    setPassTouched(true);
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobile.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      const msg = data?.message || (res.ok ? "Sign in successful." : "Sign in failed.");
      if (!res.ok) return toast.error(msg);
      toast.success(msg);
      setTimeout(() => router.push("/"), 500);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${funnelDisplay.className} relative h-[100svh] overflow-hidden grid place-items-center px-4 pb-20`} style={{ background: "var(--pm-bg-grad)", color: pm.fg, fontFamily: "var(--pm-font)" }}>
      <style jsx global>{`
        :root {
          --pm-bg: #0b0b0b;
          --pm-fg: #ffffff;
          --pm-bg-grad: linear-gradient(180deg, #0b0b0b 0%, #050505 100%);
          --pm-font: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        html, body { background: var(--pm-bg); color: var(--pm-fg); }
        button, input, a { font-family: var(--pm-font); }
      `}</style>

      <div className="w-full max-w-md space-y-3 font-mono text-white">
        <Block pm={pm} title="SIGN IN">
          <div className="space-y-3">
            <Field pm={pm} icon={Phone} label="MOBILE NUMBER" placeholder="01XXXXXXXXX" value={mobile} disabled={loading} onChange={(e) => { setMobileTouched(true); setMobile(String(e.target.value || "").replace(/\D/g, "").slice(0, 11)); }} type="text" inputMode="numeric" maxLength={11} />
            <ValidateLine pm={pm} touched={mobileTouched} ok={mobileValid} warnText="Please enter a valid mobile number." tipText="Use your 11 digit mobile number." />

            <Field pm={pm} icon={Lock} label="PASSWORD" placeholder="Minimum 8 characters" value={password} disabled={loading} onChange={(e) => { setPassTouched(true); setPassword(e.target.value); }} type={showPass ? "text" : "password"} rightSlot={<button type="button" disabled={loading} onClick={() => setShowPass((s) => !s)} className="border p-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed" style={{ borderColor: pm.b22, background: pm.bg10, color: pm.fg85 }} aria-label={showPass ? "Hide password" : "Show password"}>{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
            <ValidateLine pm={pm} touched={passTouched} ok={passwordValid} warnText="Password must be at least 8 characters." tipText="Minimum 8 characters required." />

            <button type="button" onClick={handleSignin} disabled={!canSubmit} className="w-full border py-3 text-sm font-black active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />PROCESSING...</> : <>SIGN IN <ArrowRight className="h-4 w-4" /></>}
              </span>
            </button>

            <div className="text-xs" style={{ color: pm.fg85 }}>
              Don&apos;t have an account? {" "}
              <Link href="/user/signup" className="font-black underline underline-offset-4" style={{ color: pm.fg }}>
                SIGN UP
              </Link>
            </div>
          </div>
        </Block>
      </div>

      <Link href={waLink} target="_blank" rel="noreferrer" className="fixed bottom-4 right-4 inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black tracking-widest uppercase active:scale-[0.98] z-50" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg, pointerEvents: waLink === "#" ? "none" : "auto", opacity: waLink === "#" ? 0.6 : 1 }} aria-label="Forget password on WhatsApp" title="Forget password on WhatsApp">
        <FaWhatsapp className="h-4 w-4" />
        FORGET PASSWORD
      </Link>
    </div>
  );
}
