// Admin Link Settings Page (your file)
// (Telegram Group field added)
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Funnel_Display } from "next/font/google";
import { FiArrowLeft } from "react-icons/fi";
import {
  MessageCircle,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Pencil,
  Check,
  Loader2,
  Users,
} from "lucide-react";

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
      b15: "color-mix(in srgb, var(--pm-fg) 15%, transparent)",
      b18: "color-mix(in srgb, var(--pm-fg) 18%, transparent)",
      b22: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
      b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
      b35: "color-mix(in srgb, var(--pm-fg) 35%, transparent)",
      bg05: "color-mix(in srgb, var(--pm-fg) 5%, transparent)",
      bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
      bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
      bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
      bg12: "color-mix(in srgb, var(--pm-fg) 12%, transparent)",
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

function Field({ icon: Icon, label, placeholder, value, onChange, rightSlot, readOnly = false, pm }) {
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
          readOnly={readOnly}
          onChange={readOnly ? undefined : onChange}
          placeholder={placeholder}
          className={[base, rightSlot ? "pr-[92px]" : ""].join(" ")}
          style={{
            borderColor: readOnly ? pm.b15 : pm.b28,
            background: readOnly ? pm.bg05 : pm.bg10,
            color: readOnly ? pm.fg70 : pm.fg,
          }}
        />
        {rightSlot ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">{rightSlot}</div>
        ) : null}
      </div>
    </div>
  );
}

function ValidateLine({ ok, warnText, tipText, pm }) {
  if (ok)
    return (
      <div className="inline-flex items-center gap-2 text-[11px] font-bold" style={{ color: pm.fg }}>
        <CheckCircle2 className="h-4 w-4" /> Looks good
      </div>
    );
  return (
    <div className="inline-flex items-center gap-2 text-[11px] font-bold" style={{ color: pm.fg80 }}>
      <AlertCircle className="h-4 w-4" /> {warnText || tipText}
    </div>
  );
}

function IconBtn({ title, onClick, children, disabled = false, pm }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="border p-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg90 }}
    >
      {children}
    </button>
  );
}

function OpenBtn({ href, pm }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="border p-2 active:scale-[0.98]"
      aria-label="Open link"
      title="Open link"
      onClick={(e) => e.stopPropagation()}
      style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg90 }}
    >
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

const onlyDigits = (v) => String(v || "").replace(/\D/g, "");

function normalizeWaLinkFromBdMobile(raw) {
  const d = onlyDigits(raw);
  if (!d) return "";
  if (d.length === 11 && d.startsWith("01")) return `https://wa.me/${"880" + d.slice(1)}`;
  if (d.length === 13 && d.startsWith("8801")) return `https://wa.me/${d}`;
  return null;
}

function waLinkToBdMobile11(link) {
  const s = String(link || "").trim();
  if (!s) return "";
  const d = onlyDigits(s);
  if (d.length >= 13 && d.startsWith("8801")) return "0" + d.slice(3, 13);
  if (d.length === 11 && d.startsWith("01")) return d;
  return "";
}

function normalizeTgLinkFromAtUsername(raw) {
  const s0 = String(raw || "").trim();
  if (!s0) return "";
  const m1 = s0.match(/t\.me\/([A-Za-z0-9_]{3,})/i);
  if (m1?.[1]) return `https://t.me/${m1[1]}`;
  const u0 = s0.startsWith("@") ? s0.slice(1) : s0;
  const u = u0.trim();
  if (!/^[A-Za-z0-9_]{3,32}$/.test(u)) return null;
  return `https://t.me/${u}`;
}

function tgLinkToAtUsername(link) {
  const s = String(link || "").trim();
  if (!s) return "";
  const m = s.match(/t\.me\/([^/?#]+)/i);
  return m?.[1] ? `@${String(m[1])}` : "";
}

function normalizeTgGroupLink(raw) {
  const s0 = String(raw || "").trim();
  if (!s0) return "";
  const s = s0.replace(/^http:\/\//i, "https://");
  if (/^https:\/\/t\.me\/.+/i.test(s)) return s;
  const m = s0.match(/t\.me\/(.+)/i);
  if (m?.[1]) return `https://t.me/${String(m[1]).trim()}`;
  const u0 = s0.startsWith("@") ? s0.slice(1) : s0;
  const u = u0.trim();
  if (!/^[A-Za-z0-9_+]{3,64}$/.test(u)) return null;
  return `https://t.me/${u}`;
}

function tgGroupToRaw(link) {
  return String(link || "").trim();
}

export default function AdminLinkSettingsPage() {
  const pm = usePM();

  const [contactWhatsApp, setContactWhatsApp] = useState("");
  const [contactTelegram, setContactTelegram] = useState("");
  const [contactTelegramGroup, setContactTelegramGroup] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [edit, setEdit] = useState({ contactWhatsApp: false, contactTelegram: false, contactTelegramGroup: false });

  const waContactLink = useMemo(() => normalizeWaLinkFromBdMobile(contactWhatsApp), [contactWhatsApp]);
  const tgContactLink = useMemo(() => normalizeTgLinkFromAtUsername(contactTelegram), [contactTelegram]);
  const tgGroupLink = useMemo(() => normalizeTgGroupLink(contactTelegramGroup), [contactTelegramGroup]);
  const valid = useMemo(() => waContactLink !== null && tgContactLink !== null && tgGroupLink !== null, [waContactLink, tgContactLink, tgGroupLink]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/link-settings", { method: "GET", credentials: "include" });
        const j = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) {
          toast.error(j?.message || "Failed to load links");
          return;
        }
        const s = j?.data || {};
        setContactWhatsApp(waLinkToBdMobile11(s.contactWhatsApp));
        setContactTelegram(tgLinkToAtUsername(s.contactTelegram));
        setContactTelegramGroup(tgGroupToRaw(s.contactTelegramGroup));
      } catch {
        if (!alive) return;
        toast.error("Network error while loading");
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
    if (!valid) return toast.error("Fix invalid inputs first.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/link-settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactWhatsAppNumber: contactWhatsApp,
          contactTelegramAtUsername: contactTelegram,
          contactTelegramGroupLink: contactTelegramGroup,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.message || "Save failed");
        return;
      }
      const s = j?.data || {};
      setContactWhatsApp(waLinkToBdMobile11(s.contactWhatsApp));
      setContactTelegram(tgLinkToAtUsername(s.contactTelegram));
      setContactTelegramGroup(tgGroupToRaw(s.contactTelegramGroup));
      setEdit({ contactWhatsApp: false, contactTelegram: false, contactTelegramGroup: false });
      toast.success("Links saved successfully.");
    } catch {
      toast.error("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  const editBtns = (key, href) =>
    !edit[key] ? (
      <>
        <OpenBtn pm={pm} href={href} />
        <IconBtn pm={pm} title="Edit" onClick={() => setEdit((p) => ({ ...p, [key]: true }))} disabled={saving || loading}>
          <Pencil className="h-4 w-4" />
        </IconBtn>
      </>
    ) : (
      <>
        <OpenBtn pm={pm} href={href} />
        <IconBtn pm={pm} title="Lock" onClick={() => setEdit((p) => ({ ...p, [key]: false }))} disabled={saving || loading}>
          <Check className="h-4 w-4" />
        </IconBtn>
      </>
    );

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6 overflow-x-hidden`} style={{ background: "var(--pm-bg-grad)", color: pm.fg, fontFamily: "var(--pm-font)" }}>
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
        <div className="border px-3 py-2" style={{ borderColor: pm.b22, background: pm.bg05, boxShadow: `0 0 0 1px ${pm.b18}` }}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg90 }}>
              CONTACT LINKS
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

        <Block pm={pm} title="CONTACT LINKS">
          <div className="space-y-3">
            <Field
              pm={pm}
              icon={MessageCircle}
              label="WHATSAPP NUMBER (11 DIGITS)"
              placeholder="017XXXXXXXX"
              value={contactWhatsApp}
              onChange={(e) => setContactWhatsApp(e.target.value)}
              readOnly={!edit.contactWhatsApp}
              rightSlot={editBtns("contactWhatsApp", typeof waContactLink === "string" ? waContactLink : "")}
            />
            <ValidateLine pm={pm} ok={waContactLink !== null} warnText="Use 11 digits like 017XXXXXXXX." tipText="Required." />

            <Field
              pm={pm}
              icon={Send}
              label="TELEGRAM USERNAME (WITH @)"
              placeholder="@your_support"
              value={contactTelegram}
              onChange={(e) => setContactTelegram(e.target.value)}
              readOnly={!edit.contactTelegram}
              rightSlot={editBtns("contactTelegram", typeof tgContactLink === "string" ? tgContactLink : "")}
            />
            <ValidateLine pm={pm} ok={tgContactLink !== null} warnText="Use @username (letters/numbers/_)." tipText="Required." />

            <Field
              pm={pm}
              icon={Users}
              label="TELEGRAM GROUP LINK"
              placeholder="https://t.me/your_group"
              value={contactTelegramGroup}
              onChange={(e) => setContactTelegramGroup(e.target.value)}
              readOnly={!edit.contactTelegramGroup}
              rightSlot={editBtns("contactTelegramGroup", typeof tgGroupLink === "string" ? tgGroupLink : "")}
            />
            <ValidateLine pm={pm} ok={tgGroupLink !== null} warnText="Use a valid t.me group link." tipText="Optional." />
          </div>
        </Block>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading || !valid}
          className="w-full border py-3 text-sm font-black active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}
        >
          <span className="inline-flex items-center justify-center gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> PROCESSING...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> SAVE
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}