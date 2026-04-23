"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import {
  Lock,
  Gift,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Loader2,
  Phone,
} from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });
const BD_PHONE_RE = /^01\d{9}$/;

function usePM() {
  return useMemo(
    () => ({
      fg: "var(--pm-fg)",
      fg60: "color-mix(in srgb, var(--pm-fg) 60%, transparent)",
      fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
      fg75: "color-mix(in srgb, var(--pm-fg) 75%, transparent)",
      fg80: "color-mix(in srgb, var(--pm-fg) 80%, transparent)",
      fg85: "color-mix(in srgb, var(--pm-fg) 85%, transparent)",
      fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
      b06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
      b10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
      b12: "color-mix(in srgb, var(--pm-fg) 12%, transparent)",
      b16: "color-mix(in srgb, var(--pm-fg) 16%, transparent)",
      b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
      b22: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
      b26: "color-mix(in srgb, var(--pm-fg) 26%, transparent)",
      b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
      b35: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
      bg05: "color-mix(in srgb, var(--pm-fg) 5%, transparent)",
      bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
      bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
      ok: "var(--pm-ok)",
      bad: "var(--pm-bad)",
    }),
    []
  );
}


function PMGlobals() {
  return (
    <style jsx global>{`
      :root {
        --pm-bg: #0b0b0b;
        --pm-fg: #ffffff;
        --pm-bg-grad: linear-gradient(180deg, #0b0b0b 0%, #050505 100%);
        --pm-font: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        --pm-ok: #22c55e;
        --pm-bad: #ef4444;
      }
      html,
      body {
        background: var(--pm-bg);
        color: var(--pm-fg);
      }
      button,
      input,
      a {
        font-family: var(--pm-font);
      }
    `}</style>
  );
}


function Block({ title, children, pm }) {
  return (
    <div
      className="select-none border p-3"
      style={{
        borderColor: pm.b28,
        background: pm.bg06,
        boxShadow: `0 0 0 1px ${pm.b22}`,
      }}
    >
      <div className="mb-2 text-center text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ icon: Icon, label, placeholder, value, onChange, type = "text", rightSlot, disabled = false, inputMode, maxLength, autoComplete, pm }) {
  return (
    <div className="select-none">
      <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg80 }}>
        {label}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: pm.fg70 }}>
          <Icon className="h-4 w-4" />
        </span>
        <input
          disabled={disabled}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={["w-full select-text border px-4 py-3 text-sm outline-none", "pl-10", rightSlot ? "pr-12" : ""].join(" ")}
          style={{
            borderColor: disabled ? pm.b12 : pm.b28,
            background: disabled ? pm.bg05 : pm.bg10,
            color: disabled ? pm.fg70 : pm.fg,
            opacity: disabled ? 0.75 : 1,
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
        {rightSlot ? <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div> : null}
        <style jsx>{`
          input::placeholder {
            color: ${pm.fg60};
          }
          input:focus {
            border-color: ${pm.b35};
            box-shadow: 0 0 0 4px ${pm.b12};
          }
        `}</style>
      </div>
    </div>
  );
}

function ValidateLine({ touched, ok, warnText, tipText, pm }) {
  if (!touched) return <div className="select-none text-[10px]" style={{ color: pm.fg60 }}>{tipText}</div>;
  if (ok) {
    return <div className="select-none inline-flex items-center gap-1.5 text-[10px] font-bold" style={{ color: pm.ok }}><CheckCircle2 className="h-3.5 w-3.5" />Good</div>;
  }
  return <div className="select-none inline-flex items-center gap-1.5 text-[10px] font-bold" style={{ color: pm.bad }}><AlertCircle className="h-3.5 w-3.5" />{warnText}</div>;
}

export default function Signup() {
  return (
    <Suspense fallback={<div className={`${funnelDisplay.className} select-none h-[100svh] overflow-hidden grid place-items-center px-3 font-medium`} style={{ background: "var(--pm-bg)", color: "var(--pm-fg)" }}><PMGlobals /><div className="text-[10px]" style={{ opacity: 0.9 }}>LOADING...</div></div>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const pm = usePM();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [passTouched, setPassTouched] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = String(searchParams?.get("ref") || "").trim().toUpperCase();
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  const fullNameValid = useMemo(() => fullName.trim().length >= 3, [fullName]);
  const phoneValid = useMemo(() => BD_PHONE_RE.test(phone.trim()), [phone]);
  const passwordValid = useMemo(() => password.length >= 8, [password]);
  const canSubmit = fullNameValid && phoneValid && passwordValid && !loading;

  const handleSignup = async () => {
    setFullNameTouched(true);
    setPhoneTouched(true);
    setPassTouched(true);
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          password,
          referralCode: referralCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const msg = data?.message || (res.ok ? "Account created successfully." : "Sign up failed.");
      if (!res.ok) return toast.error(msg);
      const welcomeBonus = Number(data?.data?.welcomeBonus || 0);
      try {
        const payload = JSON.stringify({ show: true, amount: welcomeBonus, at: Date.now() });
        sessionStorage.setItem("pm_signup_welcome", payload);
        localStorage.setItem("pm_signup_welcome", payload);
      } catch {}
      toast.success(msg);
      setTimeout(() => router.push("/"), 500);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${funnelDisplay.className} relative h-[100svh] overflow-hidden grid place-items-center px-4 py-6 font-medium`} style={{ background: "var(--pm-bg-grad)", color: pm.fg, fontFamily: "var(--pm-font)" }}>
      <PMGlobals />
      <div className="w-full max-w-md space-y-3 font-mono text-white">
          <Block title="SIGN UP" pm={pm}>
            <div className="space-y-3">
              <Field pm={pm} icon={User} label="FULL NAME" placeholder="Enter your full name" value={fullName} onChange={(e) => { setFullNameTouched(true); setFullName(e.target.value); }} autoComplete="name" disabled={loading} />
              <ValidateLine pm={pm} touched={fullNameTouched} ok={fullNameValid} warnText="Name too short" tipText="Minimum 3 characters." />

              <Field pm={pm} icon={Phone} label="MOBILE NUMBER" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => { setPhoneTouched(true); setPhone(String(e.target.value || "").replace(/\D/g, "").slice(0, 11)); }} inputMode="numeric" maxLength={11} autoComplete="tel" disabled={loading} />
              <ValidateLine pm={pm} touched={phoneTouched} ok={phoneValid} warnText="Invalid number" tipText="11 digits, starts with 01." />

              <Field pm={pm} icon={Lock} label="PASSWORD" placeholder="Minimum 8 characters" value={password} onChange={(e) => { setPassTouched(true); setPassword(e.target.value); }} type={showPass ? "text" : "password"} autoComplete="new-password" disabled={loading} rightSlot={<button type="button" disabled={loading} onClick={() => setShowPass((s) => !s)} className="border p-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed" style={{ borderColor: pm.b22, background: pm.bg10, color: pm.fg85 }} aria-label={showPass ? "Hide password" : "Show password"}>{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
              <ValidateLine pm={pm} touched={passTouched} ok={passwordValid} warnText="Password too short" tipText="Minimum 8 characters required." />

              <Field pm={pm} icon={Gift} label="REFERRAL CODE" placeholder="Optional referral code" value={referralCode} onChange={(e) => setReferralCode(String(e.target.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))} autoComplete="off" disabled={loading} />

              <button type="button" onClick={handleSignup} disabled={!canSubmit} className="w-full border py-3 text-[13px] font-black tracking-widest uppercase active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
                <span className="inline-flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />PROCESSING...</> : <>SIGN UP <ArrowRight className="h-4 w-4" /></>}
                </span>
              </button>
            </div>
          </Block>

          <div className="select-none text-[12px]" style={{ color: pm.fg80 }}>
            Already have an account? {" "}
            <Link href="/user/signin" className="font-black underline underline-offset-4" style={{ color: pm.fg }}>
              SIGN IN
            </Link>
          </div>
      </div>
    </div>
  );
}
