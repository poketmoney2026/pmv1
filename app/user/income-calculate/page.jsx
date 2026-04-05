// app/user/income-calculate/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Calculator, Coins, ArrowRight, Trash2 } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

const fmt2 = (n) =>
  `Tk ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function toNumberSafe(s) {
  const v = String(s || "").replace(/[^\d.]/g, "");
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function Block({ title, children, pm }) {
  return (
    <div className="select-none border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}`, color: pm.fg }}>
      <div className="mb-2 text-center text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg90 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ icon: Icon, label, placeholder, value, onChange, inputMode = "decimal", pm }) {
  const cls = "w-full border px-4 py-3 text-sm outline-none";
  const style = { borderColor: pm.b28, background: pm.bg10, color: pm.fg, boxShadow: `0 0 0 1px ${pm.b20}` };
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg80 }}>
        {label}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: pm.fg80 }}>
          <Icon className="h-4 w-4" />
        </span>
        <input inputMode={inputMode} type="text" placeholder={placeholder} value={value} onChange={onChange} className={[cls, "pl-10"].join(" ")} style={style} />
      </div>
      <div className="mt-2 text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>
        Example: 1000, 2500.5
      </div>
    </div>
  );
}

export default function IncomeCalculatePage() {
  const pm = {
    fg: "var(--pm-fg)",
    fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
    fg80: "color-mix(in srgb, var(--pm-fg) 80%, transparent)",
    fg90: "color-mix(in srgb, var(--pm-fg) 90%, transparent)",
    b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
    b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
    b35: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
    bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
    bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
    bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
  };

  const [loadingCfg, setLoadingCfg] = useState(true);
  const [valuePercent, setValuePercent] = useState(10);
  const [dayCount, setDayCount] = useState(15);

  const [amountText, setAmountText] = useState("");
  const [rows, setRows] = useState([]);
  const [defaultAmount, setDefaultAmount] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingCfg(true);
      try {
        const res = await fetch("/api/user/income-calculate", { method: "GET", cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (!alive) return;

        if (!res.ok || !j?.ok) {
          toast.error(j?.message || "Failed to load settings");
          return;
        }

        const vp = Number(j?.data?.valuePercent);
        const dd = Number(j?.data?.day);
        const totalDepositAmount = Number(j?.data?.totalDepositAmount || 0);

        if (Number.isFinite(vp) && vp > 0) setValuePercent(vp);
        if (Number.isFinite(dd) && dd > 0) setDayCount(dd);
        if (Number.isFinite(totalDepositAmount) && totalDepositAmount > 0) {
          setDefaultAmount(totalDepositAmount);
          setAmountText(String(totalDepositAmount));
        }
      } catch {
        if (!alive) return;
        toast.error("Network error");
      } finally {
        if (!alive) return;
        setLoadingCfg(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const amount = useMemo(() => toNumberSafe(amountText), [amountText]);
  const rate = useMemo(() => Number(valuePercent || 0) / 100, [valuePercent]);
  const canCalc = amount > 0 && Number.isFinite(rate) && rate > 0 && Number(dayCount || 0) > 0;

  const handleCalc = (nextAmount = amount) => {
    if (!(nextAmount > 0 && Number.isFinite(rate) && rate > 0 && Number(dayCount || 0) > 0)) return;

    const dailyProfit = nextAmount * rate;
    const out = [];
    let total = 0;

    const base = new Date();
    for (let i = 0; i < Number(dayCount); i++) {
      const dayIndex = i + 1;
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      total += dailyProfit;
      out.push({ day: dayIndex, date: dateStr, profit: dailyProfit, total });
    }
    setRows(out);
  };

  const handleReset = () => {
    setAmountText("");
    setRows([]);
  };

  useEffect(() => {
    if (amountText && amount > 0 && !loadingCfg) handleCalc(amount);
  }, [amountText, amount, loadingCfg, valuePercent, dayCount]);

  const summary = useMemo(() => {
    if (!rows.length) return null;
    const perDay = rows[0]?.profit || 0;
    const days = rows.length;
    const total = rows[rows.length - 1]?.total || 0;
    return { perDay, days, total };
  }, [rows]);

  return (
    <div className={`${funnelDisplay.className} select-none min-h-[100svh] mt-14 px-3 py-4 font-medium`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
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
        button {
          font-family: var(--pm-font);
        }
        input {
          color-scheme: dark;
        }
      `}</style>

      <div className="mx-auto w-full max-w-sm space-y-2" style={{ fontFamily: "var(--pm-font)" }}>
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>
                Income Calculator
              </div>
              <div className="mt-1 text-base font-black tracking-widest uppercase" style={{ color: pm.fg }}>
                {loadingCfg ? "LOADING..." : `${Number(valuePercent || 0)}% Daily · ${Number(dayCount || 0)} Days`}
              </div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg80 }}>
                Your active deposit total is auto-filled. Clear it anytime to calculate a custom amount.
              </div>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg08 }}>
              <Calculator className="h-6 w-6" style={{ color: pm.fg }} />
            </span>
          </div>
        </div>

        <Block title="INPUT" pm={pm}>
          <div className="space-y-3">
            <Field icon={Coins} label="Investment Amount" placeholder="e.g. 1000" value={amountText} onChange={(e) => setAmountText(e.target.value)} pm={pm} />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={handleReset} className="w-full border py-3 text-[12px] font-black tracking-widest uppercase active:scale-[0.99]" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
                <span className="inline-flex items-center justify-center gap-2">
                  <Trash2 className="h-4 w-4" /> Clear
                </span>
              </button>

              <button
                type="button"
                onClick={handleCalc}
                disabled={!canCalc}
                className="w-full border py-3 text-[12px] font-black tracking-widest uppercase active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ borderColor: pm.b35, background: pm.bg10, color: pm.fg }}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  Calculate <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        </Block>

        {summary ? (
          <Block title="SUMMARY" pm={pm}>
            <div className="grid grid-cols-3 gap-2">
              <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg08 }}>
                <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>
                  PER DAY
                </div>
                <div className="mt-1 text-sm font-black tabular-nums" style={{ color: pm.fg }}>
                  {fmt2(summary.perDay)}
                </div>
              </div>
              <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg08 }}>
                <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>
                  DAYS
                </div>
                <div className="mt-1 text-sm font-black tabular-nums" style={{ color: pm.fg }}>
                  {summary.days}
                </div>
              </div>
              <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg08 }}>
                <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>
                  TOTAL PROFIT
                </div>
                <div className="mt-1 text-sm font-black tabular-nums" style={{ color: pm.fg }}>
                  {fmt2(summary.total)}
                </div>
              </div>
            </div>
          </Block>
        ) : null}

        {rows.length > 0 ? (
          <Block title="DAY BY DAY" pm={pm}>
            <div className="border" style={{ borderColor: pm.b28, background: pm.bg08 }}>
              <div className="grid grid-cols-4 gap-0 border-b text-[10px] font-black tracking-widest uppercase" style={{ borderColor: pm.b20, color: pm.fg90 }}>
                <div className="p-3">#</div>
                <div className="p-3 border-l" style={{ borderColor: pm.b20 }}>
                  DATE
                </div>
                <div className="p-3 border-l" style={{ borderColor: pm.b20 }}>
                  PROFIT ({Number(valuePercent || 0)}%)
                </div>
                <div className="p-3 border-l" style={{ borderColor: pm.b20 }}>
                  TOTAL PROFIT
                </div>
              </div>

              <div className="max-h-[420px] overflow-auto">
                {rows.map((r) => (
                  <div key={r.day} className="grid grid-cols-4 gap-0 border-b text-[12px]" style={{ borderColor: pm.b20, color: pm.fg90 }}>
                    <div className="p-3 tabular-nums font-black" style={{ color: pm.fg }}>
                      {r.day}
                    </div>
                    <div className="p-3 border-l" style={{ borderColor: pm.b20 }}>
                      {r.date}
                    </div>
                    <div className="p-3 border-l tabular-nums" style={{ borderColor: pm.b20 }}>
                      {fmt2(r.profit)}
                    </div>
                    <div className="p-3 border-l tabular-nums font-black" style={{ borderColor: pm.b20, color: pm.fg }}>
                      {fmt2(r.total)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Block>
        ) : null}
      </div>
    </div>
  );
}