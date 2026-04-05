// Transactions/TransactionsClient
"use client";

import { useMemo, useState } from "react";
import {
  Receipt,
  ArrowDownToLine,
  ArrowUpRight,
  Wallet,
  BadgeDollarSign,
  Gift,
  RefreshCcw,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Hourglass,
  Search,
  Filter,
} from "lucide-react";

const fmtBDT2 = (n) =>
  `Tk ${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const typeLabel = (t) => {
  const k = String(t || "").toLowerCase();
  if (k === "payment") return "Payment";
  if (k === "recharge") return "Recharge";
  if (k === "deposit") return "Deposit";
  if (k === "withdraw") return "Withdraw";
  if (k === "refund") return "Refund";
  if (k === "bonus") return "Bonus";
  if (k === "cashback") return "Cashback";
  if (k === "reward") return "Reward";
  if (k === "commission") return "Commission";
  if (k === "royalty") return "Royalty";
  if (k === "referralbonus" || k === "referralBonus") return "Referral Bonus";
  if (k === "claim") return "Claim";
  if (k === "gift") return "Gift";
  if (k === "giveaway") return "Giveaway";
  return String(t || "").toUpperCase();
};

const statusMeta = (s) => {
  const k = String(s || "").toLowerCase();
  if (k === "successful")
    return {
      label: "SUCCESSFUL",
      icon: CheckCircle2,
      tone: "good",
    };
  if (k === "pending")
    return {
      label: "PENDING",
      icon: Clock,
      tone: "warn",
    };
  if (k === "processing")
    return {
      label: "PROCESSING",
      icon: RefreshCcw,
      tone: "info",
    };
  if (k === "verifying")
    return {
      label: "VERIFYING",
      icon: Hourglass,
      tone: "violet",
    };
  if (k === "hold")
    return {
      label: "HOLD",
      icon: AlertTriangle,
      tone: "pink",
    };
  if (k === "reject" || k === "rejected")
    return {
      label: "REJECT",
      icon: Ban,
      tone: "bad",
    };
  return { label: String(s || "UNKNOWN").toUpperCase(), icon: Receipt, tone: "neutral" };
};

function toneStyles(tone, pm) {
  if (tone === "good")
    return {
      borderColor: "rgba(16,185,129,0.55)",
      background: "rgba(16,185,129,0.16)",
      color: "rgba(209,250,229,0.98)",
    };
  if (tone === "warn")
    return {
      borderColor: "rgba(245,158,11,0.55)",
      background: "rgba(245,158,11,0.16)",
      color: "rgba(254,243,199,0.98)",
    };
  if (tone === "info")
    return {
      borderColor: "rgba(56,189,248,0.55)",
      background: "rgba(56,189,248,0.16)",
      color: "rgba(224,242,254,0.98)",
    };
  if (tone === "violet")
    return {
      borderColor: "rgba(139,92,246,0.55)",
      background: "rgba(139,92,246,0.16)",
      color: "rgba(237,233,254,0.98)",
    };
  if (tone === "pink")
    return {
      borderColor: "rgba(236,72,153,0.55)",
      background: "rgba(236,72,153,0.16)",
      color: "rgba(252,231,243,0.98)",
    };
  if (tone === "bad")
    return {
      borderColor: "rgba(244,63,94,0.55)",
      background: "rgba(244,63,94,0.16)",
      color: "rgba(255,228,230,0.98)",
    };
  return { borderColor: pm.b28, background: pm.bg08, color: pm.fg90 };
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

function KV({ label, value, pm }) {
  const isNote = String(label || "").toUpperCase() === "NOTE";
  return (
    <div className="flex items-start justify-between gap-3 border px-3 py-2 overflow-hidden" style={{ borderColor: pm.b28, background: pm.bg08 }}>
      <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: pm.fg70 }}>
        {label}
      </div>
      {isNote ? (
        <div
          className="text-[11px] font-black tabular-nums text-right max-w-[65%]"
          style={{
            color: pm.fg,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: "1.35",
            minHeight: "2.7em",
          }}
        >
          {value}
        </div>
      ) : (
        <div className="text-[11px] font-black tabular-nums truncate max-w-[65%] text-right" style={{ color: pm.fg }}>
          {value}
        </div>
      )}
    </div>
  );
}

function Pill({ icon: Icon, text, tone = "neutral", pm }) {
  const st = toneStyles(tone, pm);
  return (
    <span className="inline-flex items-center gap-2 border px-3 py-1 text-[10px] font-black tracking-widest uppercase" style={st}>
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {text}
    </span>
  );
}

function formatDate(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d || "");
    return dt.toLocaleString("en-US", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(d || "");
  }
}

function signByType(type) {
  const k = String(type || "").toLowerCase();
  if (k === "withdraw" || k === "payment" || k === "refund" || k === "debit") return "-";
  return "+";
}

export default function TransactionsClient({ initial = [], unauthorized = false }) {
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

  const [items] = useState(() => (Array.isArray(initial) ? initial : []));
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((t) => {
      const okStatus = status === "all" ? true : String(t.status) === status;
      const okType = type === "all" ? true : String(t.type) === type;
      const okSearch =
        !s ||
        String(t.id).toLowerCase().includes(s) ||
        String(t.note || "").toLowerCase().includes(s) ||
        String(t.type).toLowerCase().includes(s) ||
        String(t.status).toLowerCase().includes(s);
      return okStatus && okType && okSearch;
    });
  }, [items, q, status, type]);

  const inputCls = "w-full border px-4 py-3 text-sm outline-none";
  const inputStyle = {
    borderColor: pm.b28,
    background: pm.bg10,
    color: pm.fg,
    boxShadow: `0 0 0 1px ${pm.b20}`,
  };

  return (
    <div className="select-none min-h-[100svh] mt-14 px-3 py-4 font-medium" style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
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
        select,
        input {
          color-scheme: dark;
        }
        @supports not (color: color-mix(in srgb, black, white)) {
          :root {
            --pm-bg-grad: #0b0b0b;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-sm space-y-2" style={{ fontFamily: "var(--pm-font)" }}>
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] tracking-widest uppercase" style={{ color: pm.fg70 }}>
                Wallet
              </div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase" style={{ color: pm.fg }}>
                TRANSACTIONS
              </div>
              <div className="mt-2 text-[11px]" style={{ color: pm.fg80 }}>
                {unauthorized ? "Unauthorized (please sign in)." : "Loaded from database (server-side)."}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill icon={Receipt} text={`${filtered.length} RECORDS`} pm={pm} />
                <Pill icon={ShieldCheck} text="THEME SYNC ON" tone="info" pm={pm} />
              </div>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg08 }}>
              <Receipt className="h-6 w-6" style={{ color: pm.fg }} />
            </span>
          </div>
        </div>

        <Block title="FILTERS" pm={pm}>
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: pm.fg80 }}>
                <Search className="h-4 w-4" />
              </span>
              <input
                className={[inputCls, "pl-10"].join(" ")}
                style={inputStyle}
                placeholder="Search by id, note, type, status..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg80 }}>
                  STATUS
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: pm.fg80 }}>
                    <Filter className="h-4 w-4" />
                  </span>
                  <select className={[inputCls, "pl-10"].join(" ")} style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="verifying">Verifying</option>
                    <option value="successful">Successful</option>
                    <option value="hold">Hold</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-bold tracking-widest uppercase" style={{ color: pm.fg80 }}>
                  TYPE
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: pm.fg80 }}>
                    <Filter className="h-4 w-4" />
                  </span>
                  <select className={[inputCls, "pl-10"].join(" ")} style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="all">All</option>
                    <option value="payment">Payment</option>
                    <option value="recharge">Recharge</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdraw">Withdraw</option>
                    <option value="refund">Refund</option>
                    <option value="bonus">Bonus</option>
                    <option value="cashback">Cashback</option>
                    <option value="reward">Reward</option>
                    <option value="commission">Commission</option>
                    <option value="royalty">Royalty</option>
                    <option value="referralBonus">Referral Bonus</option>
                    <option value="claim">Claim</option>
                    <option value="gift">Gift</option>
                    <option value="giveaway">Giveaway</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Block>

        <Block title="TRANSACTION LIST" pm={pm}>
          <div className="space-y-2">
            {filtered.map((t) => {
              const meta = statusMeta(t.status);
              const StatusIcon = meta.icon;

              const typeIcon =
                String(t.type).toLowerCase() === "deposit"
                  ? Wallet
                  : String(t.type).toLowerCase() === "withdraw"
                  ? ArrowDownToLine
                  : String(t.type).toLowerCase() === "bonus" ||
                    String(t.type).toLowerCase() === "reward" ||
                    String(t.type).toLowerCase() === "referralbonus"
                  ? Gift
                  : BadgeDollarSign;

              const TypeIcon = typeIcon;
              const sign = signByType(t.type);
              const st = toneStyles(meta.tone, pm);

              return (
                <div key={t.id} className="border p-3 overflow-hidden" style={{ borderColor: pm.b28, background: pm.bg06, boxShadow: `0 0 0 1px ${pm.b20}` }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold tracking-widest uppercase truncate" style={{ color: pm.fg70 }}>
                        {t.id}
                      </div>

                      <div className="mt-1 flex items-center gap-2 min-w-0">
                        <span className="grid h-10 w-10 shrink-0 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg08 }}>
                          <TypeIcon className="h-5 w-5" style={{ color: pm.fg }} />
                        </span>

                        <div className="min-w-0">
                          <div className="text-sm font-black truncate" style={{ color: pm.fg }}>
                            {typeLabel(t.type)}
                          </div>
                          <div className="text-[11px] truncate" style={{ color: pm.fg70 }}>
                            {formatDate(t.date)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-[11px]" style={{ color: pm.fg70 }}>
                        AMOUNT
                      </div>
                      <div className="text-sm font-black tabular-nums" style={{ color: pm.fg }}>
                        {sign}
                        {fmtBDT2(t.amount)}
                      </div>

                      <span className="mt-2 inline-flex items-center gap-2 border px-3 py-1 text-[10px] font-black tracking-widest uppercase" style={st}>
                        <StatusIcon className="h-4 w-4" />
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <KV label="TYPE" value={typeLabel(t.type)} pm={pm} />
                    <KV label="STATUS" value={meta.label} pm={pm} />
                    <KV label="NOTE" value={t.note || "—"} pm={pm} />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-[10px]" style={{ color: pm.fg70 }}>
                    <span className="inline-flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4" />
                      Details
                    </span>
                    <span className="tabular-nums">{new Date().getFullYear()}</span>
                  </div>
                </div>
              );
            })}

            {!filtered.length ? (
              <div className="border px-3 py-3 text-[11px]" style={{ borderColor: pm.b28, background: pm.bg08, color: pm.fg90 }}>
                No transactions found for this filter/search.
              </div>
            ) : null}
          </div>
        </Block>
      </div>
    </div>
  );
}
