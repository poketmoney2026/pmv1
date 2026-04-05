"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Funnel_Display } from "next/font/google";
import { FiArrowLeft, FiSave, FiEdit3 } from "react-icons/fi";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(
    () => ({
      fg: "var(--pm-fg)",
      fg60: "color-mix(in srgb, var(--pm-fg) 60%, transparent)",
      fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
      fg80: "color-mix(in srgb, var(--pm-fg) 80%, transparent)",
      fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
      b15: "color-mix(in srgb, var(--pm-fg) 15%, transparent)",
      b22: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
      b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
      b35: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
      bg05: "color-mix(in srgb, var(--pm-fg) 5%, transparent)",
      bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
      bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
      bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
      bg12: "color-mix(in srgb, var(--pm-fg) 12%, transparent)",
      bg15: "color-mix(in srgb, var(--pm-fg) 15%, transparent)",
    }),
    []
  );
}

function Block({ title, children, pm }) {
  return (
    <div className="border p-4" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b22}` }}>
      <div className="mb-2 text-center text-[12px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

const only11 = (v) => String(v || "").replace(/\D/g, "").slice(0, 11);

export default function AdminPaymentMethodsPage() {
  const pm = usePM();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bkash, setBkash] = useState("");
  const [nagad, setNagad] = useState("");

  const [bkashEdit, setBkashEdit] = useState(false);
  const [nagadEdit, setNagadEdit] = useState(false);

  const inputBase = "w-full border px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-white/10";
  const changed = useMemo(() => true, [bkash, nagad]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/payment-methods", { method: "GET", credentials: "include" });
        const j = await res.json().catch(() => ({}));
        if (!alive) return;

        if (!res.ok) {
          toast.error(j?.message || "Failed to load");
          setBkash("");
          setNagad("");
          setBkashEdit(false);
          setNagadEdit(false);
          return;
        }

        setBkash(String(j?.data?.bkash || ""));
        setNagad(String(j?.data?.nagad || ""));
        setBkashEdit(false);
        setNagadEdit(false);
      } catch {
        if (!alive) return;
        toast.error("Network error");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    toast.loading("Saving...", { id: "pmset" });

    try {
      const res = await fetch("/api/admin/payment-methods", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bkash: only11(bkash), nagad: only11(nagad) }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.message || "Save failed", { id: "pmset" });
        return;
      }

      setBkash(String(j?.data?.bkash || ""));
      setNagad(String(j?.data?.nagad || ""));
      setBkashEdit(false);
      setNagadEdit(false);
      toast.success(j?.message || "Saved", { id: "pmset" });
    } catch {
      toast.error("Network error", { id: "pmset" });
    } finally {
      setSaving(false);
    }
  };

  const lockAll = loading || saving;

  const inputClass = (editable) =>
    [inputBase, "pr-12 transition"].join(" ");

  const inputStyle = (editable) => ({
    borderColor: editable ? pm.b35 : pm.b15,
    background: editable ? pm.bg12 : pm.bg05,
    color: editable ? pm.fg : pm.fg70,
  });

  const editBtnClass = "absolute right-2 top-1/2 -translate-y-1/2 border p-2 transition active:scale-[0.99]";
  const editBtnStyle = (editable) => ({
    borderColor: editable ? pm.b35 : pm.b22,
    background: editable ? pm.bg15 : pm.bg10,
    color: pm.fg90,
    opacity: lockAll ? 0.6 : 1,
    cursor: lockAll ? "not-allowed" : "pointer",
  });

  return (
    <div
      className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6 overflow-x-hidden`}
      style={{ background: "var(--pm-bg-grad)", color: pm.fg, fontFamily: "var(--pm-font)" }}
    >
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

      <div className="mx-auto w-full max-w-md space-y-3 font-mono">
        <div className="border px-3 py-2" style={{ borderColor: pm.b22, background: pm.bg05, boxShadow: `0 0 0 1px ${pm.b15}` }}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg90 }}>
              PAYMENT METHOD PAGE
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

        <Block pm={pm} title="SET NUMBERS">
          <div className="space-y-3">
            <div>
              <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg80 }}>
                BKASH NUMBER
              </div>
              <div className="relative">
                <input
                  value={bkash}
                  onChange={(e) => setBkash(only11(e.target.value))}
                  placeholder={loading ? "Loading..." : "01XXXXXXXXX"}
                  inputMode="numeric"
                  className={inputClass(bkashEdit && !lockAll)}
                  style={inputStyle(bkashEdit && !lockAll)}
                  disabled={lockAll || !bkashEdit}
                />
                <button
                  type="button"
                  disabled={lockAll}
                  onClick={() => setBkashEdit((s) => !s)}
                  className={editBtnClass}
                  style={editBtnStyle(bkashEdit && !lockAll)}
                  aria-label="Toggle bKash edit"
                  title={bkashEdit ? "Lock" : "Edit"}
                >
                  <FiEdit3 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-1 text-[10px]" style={{ color: pm.fg60 }}>
                {bkash.length}/11
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg80 }}>
                NAGAD NUMBER
              </div>
              <div className="relative">
                <input
                  value={nagad}
                  onChange={(e) => setNagad(only11(e.target.value))}
                  placeholder={loading ? "Loading..." : "01XXXXXXXXX"}
                  inputMode="numeric"
                  className={inputClass(nagadEdit && !lockAll)}
                  style={inputStyle(nagadEdit && !lockAll)}
                  disabled={lockAll || !nagadEdit}
                />
                <button
                  type="button"
                  disabled={lockAll}
                  onClick={() => setNagadEdit((s) => !s)}
                  className={editBtnClass}
                  style={editBtnStyle(nagadEdit && !lockAll)}
                  aria-label="Toggle Nagad edit"
                  title={nagadEdit ? "Lock" : "Edit"}
                >
                  <FiEdit3 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-1 text-[10px]" style={{ color: pm.fg60 }}>
                {nagad.length}/11
              </div>
            </div>

            <div className="text-[10px]" style={{ color: pm.fg70 }}>
              {lockAll ? "Loading or saving..." : "Click the pencil icon to enable editing."}
            </div>
          </div>
        </Block>

        <button
          type="button"
          onClick={handleSave}
          disabled={lockAll || !changed}
          className="w-full border py-3 text-sm font-black active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <FiSave className="h-4 w-4" />
            {saving ? "PROCESSING..." : "SET"}
          </span>
        </button>
      </div>
    </div>
  );
}
