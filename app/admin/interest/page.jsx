"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { FiArrowLeft } from "react-icons/fi";
import { Percent, CalendarDays, Pencil, Check, Loader2, Save } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(
    () => ({
      fg: "var(--pm-fg)",
      fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
      fg75: "color-mix(in srgb, var(--pm-fg) 75%, transparent)",
      fg80: "color-mix(in srgb, var(--pm-fg) 80%, transparent)",
      fg85: "color-mix(in srgb, var(--pm-fg) 85%, transparent)",
      fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
      b18: "color-mix(in srgb, var(--pm-fg) 18%, transparent)",
      b22: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
      b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
      b35: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
      bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
      bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
      bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
      bg12: "color-mix(in srgb, var(--pm-fg) 12%, transparent)",
    }),
    []
  );
}

function TopBar({ pm }) {
  return (
    <div className="border px-3 py-2" style={{ borderColor: pm.b22, background: pm.bg06 }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg90 }}>
          INTEREST RATE
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black tracking-widest uppercase active:scale-[0.99]"
          style={{ borderColor: pm.b22, background: pm.bg10, color: pm.fg90 }}
        >
          <FiArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>
    </div>
  );
}

function Block({ title, children, pm }) {
  return (
    <div className="select-none border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}`, color: pm.fg }}>
      <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function IconBtn({ title, onClick, disabled, children, pm }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="border p-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg90 }}
    >
      {children}
    </button>
  );
}

function InputRow({ icon: Icon, label, value, onChange, placeholder, locked, pm }) {
  const base = "w-full border px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-white/10 pl-10";
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg80 }}>
        {label}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: pm.fg75 }}>
          <Icon className="h-4 w-4" />
        </span>
        <input
          value={value}
          readOnly={locked}
          inputMode="numeric"
          type="number"
          min="0"
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={base}
          style={{
            borderColor: locked ? pm.b18 : pm.b28,
            background: locked ? pm.bg06 : pm.bg10,
            color: locked ? pm.fg70 : pm.fg,
          }}
        />
      </div>
    </div>
  );
}

export default function AdminInterestPage() {
  const pm = usePM();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [day, setDay] = useState("");

  const busy = loading || saving;
  const locked = !editing;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/interest", { method: "GET", credentials: "include" });
        const j = await res.json().catch(() => ({}));
        if (!alive) return;

        if (!res.ok) {
          toast.error(j?.message || "Failed to load");
          setValue("");
          setDay("");
          setEditing(true);
          return;
        }

        const v = j?.data?.valuePercent;
        const d = j?.data?.day;
        const has = typeof v === "number" && Number.isFinite(v) && typeof d === "number" && Number.isFinite(d);

        setValue(typeof v === "number" && Number.isFinite(v) ? String(v) : "");
        setDay(typeof d === "number" && Number.isFinite(d) ? String(d) : "");
        setEditing(!has);
      } catch {
        if (!alive) return;
        toast.error("Network error");
        setValue("");
        setDay("");
        setEditing(true);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const valid = useMemo(() => {
    const n = Number(String(value || "").trim());
    const d = Number(String(day || "").trim());
    return Number.isFinite(n) && n >= 0 && Number.isFinite(d) && d >= 0;
  }, [value, day]);

  const save = async () => {
    if (busy) return;
    if (!valid) return toast.error("Enter valid numbers");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/interest", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valuePercent: Number(String(value || "").trim()), day: Number(String(day || "").trim()) }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.message || "Save failed");
        return;
      }
      const v = j?.data?.valuePercent;
      const d = j?.data?.day;
      setValue(typeof v === "number" && Number.isFinite(v) ? String(v) : String(value || "").trim());
      setDay(typeof d === "number" && Number.isFinite(d) ? String(d) : String(day || "").trim());
      setEditing(false);
      toast.success(j?.message || "Saved");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6 text-white overflow-x-hidden`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <style jsx global>{`
        :root {
          --pm-bg: #0b0b0b;
          --pm-fg: #ffffff;
          --pm-bg-grad: linear-gradient(180deg, #0b0b0b 0%, #050505 100%);
          --pm-font: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        html,
        body {
          background: var(--pm-bg);
          color: var(--pm-fg);
        }
        input,
        select,
        button {
          font-family: var(--pm-font);
        }
      `}</style>

      <div className="mx-auto w-full max-w-md space-y-3">
        <TopBar pm={pm} />

        <Block pm={pm} title="SET INTEREST">
          <div className="space-y-3">
            <InputRow pm={pm} icon={Percent} label="INTEREST (%)" value={value} onChange={setValue} placeholder={loading ? "Loading..." : "10"} locked={locked} />
            <InputRow pm={pm} icon={CalendarDays} label="DAY" value={day} onChange={setDay} placeholder={loading ? "Loading..." : "10"} locked={locked} />

            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px]" style={{ color: pm.fg75 }}>
                {loading ? "Loading..." : locked ? "Locked. Click Edit to change." : "Edit both fields then press SET."}
              </div>

              {locked ? (
                <IconBtn pm={pm} title="Edit" disabled={busy} onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" style={{ color: pm.fg85 }} />
                </IconBtn>
              ) : (
                <IconBtn pm={pm} title="Lock" disabled={busy} onClick={() => setEditing(false)}>
                  <Check className="h-4 w-4" style={{ color: pm.fg85 }} />
                </IconBtn>
              )}
            </div>

            <button
              type="button"
              onClick={save}
              disabled={busy || locked || !valid}
              className="w-full border py-3 text-sm font-black active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "PROCESSING..." : "SET"}
              </span>
            </button>
          </div>
        </Block>
      </div>
    </div>
  );
}
