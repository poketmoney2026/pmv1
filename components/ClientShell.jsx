"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa";
import Sidebar from "@/components/Sidebar";
import { THEME_LS_KEY, applyThemeToDocument, readSavedThemeId } from "@/lib/themes";
import { FONT_LS_KEY, readSavedFontId } from "@/lib/fonts";
import useThemeStore from "@/stores/useThemeStore";
import useLiveAppStore from "@/stores/useLiveAppStore";

export default function ClientShell({ children }) {
  const pathname = usePathname();
  const authRoutes = ["/user/signin", "/user/signup"];
  const hideNav = authRoutes.includes(pathname);

  const initTheme = useThemeStore((state) => state.initTheme);
  const applyExternalTheme = useThemeStore((state) => state.applyExternalTheme);
  const applyExternalFont = useThemeStore((state) => state.applyExternalFont);

  const role = useLiveAppStore((state) => state.role);
  const sessionState = useLiveAppStore((state) => state.sessionState);
  const support = useLiveAppStore((state) => state.support);
  const inactiveReason = useLiveAppStore((state) => state.inactiveReason);
  const notice = useLiveAppStore((state) => state.notice);
  const giftNotice = useLiveAppStore((state) => state.giftNotice);
  const authenticated = useLiveAppStore((state) => state.authenticated);
  const liveReady = useLiveAppStore((state) => state.liveReady);
  const startLiveSync = useLiveAppStore((state) => state.startLiveSync);
  const refreshLiveSync = useLiveAppStore((state) => state.refreshLiveSync);

  const supportLink = useMemo(() => support?.contactWhatsApp || "#", [support]);

  const [noticeOpen, setNoticeOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);

  useEffect(() => {
    if (hideNav) return;
    if (!authenticated || role !== "user") return;
    if (!notice?.isActive || !notice?.body) return;
    const key = `pm_notice_seen_${String(notice.updatedAt || "global")}`;
    let lastShown = 0;
    try { lastShown = Number(localStorage.getItem(key) || 0); } catch {}
    const gapMs = Math.max(1, Number(notice.intervalMin || 30)) * 60 * 1000;
    if (!lastShown || Date.now() - lastShown >= gapMs) {
      setNoticeOpen(true);
    }
  }, [authenticated, role, hideNav, notice]);

  const closeNotice = () => {
    const key = `pm_notice_seen_${String(notice?.updatedAt || "global")}`;
    try { localStorage.setItem(key, String(Date.now())); } catch {}
    setNoticeOpen(false);
  };

  useEffect(() => {
    if (hideNav || !authenticated || role !== "user") return;
    if (giftNotice?.open && Number(giftNotice?.amount || 0) > 0) setGiftOpen(true);
  }, [authenticated, giftNotice, hideNav, role]);

  const closeGift = async () => {
    try {
      await fetch('/api/user/gift-notice', { method: 'POST', credentials: 'include' });
    } catch {}
    setGiftOpen(false);
    refreshLiveSync({ force: true });
  };

  useEffect(() => {
    if (hideNav || !authenticated || role !== "user") return;
    const t = window.setInterval(() => {
      if (!notice?.isActive || !notice?.body || noticeOpen) return;
      const key = `pm_notice_seen_${String(notice?.updatedAt || "global")}`;
      let lastShown = 0;
      try { lastShown = Number(localStorage.getItem(key) || 0); } catch {}
      const gapMs = Math.max(1, Number(notice?.intervalMin || 30)) * 60 * 1000;
      if (!lastShown || Date.now() - lastShown >= gapMs) setNoticeOpen(true);
    }, 60000);
    return () => window.clearInterval(t);
  }, [authenticated, role, hideNav, notice, noticeOpen]);

  useEffect(() => {
    initTheme();
    const onThemeChange = (e) => {
      const { a, b, fg, themeId } = e?.detail || {};
      if (themeId) {
        applyExternalTheme(themeId);
        return;
      }
      if (a && b && fg) applyThemeToDocument({ id: "custom", a, b, fg });
    };
    const onFontChange = (e) => {
      const { fontId } = e?.detail || {};
      if (fontId) applyExternalFont(fontId);
    };
    const onStorage = (ev) => {
      if (ev.key === THEME_LS_KEY) applyExternalTheme(readSavedThemeId());
      if (ev.key === FONT_LS_KEY) applyExternalFont(readSavedFontId());
    };
    window.addEventListener("pm-theme-change", onThemeChange);
    window.addEventListener("pm-font-change", onFontChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("pm-theme-change", onThemeChange);
      window.removeEventListener("pm-font-change", onFontChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [applyExternalFont, applyExternalTheme, initTheme]);

  useEffect(() => {
    startLiveSync(pathname);
  }, [pathname, startLiveSync]);

  useEffect(() => {
    const forceSyncNow = () => refreshLiveSync({ force: true });
    const syncNow = () => refreshLiveSync();
    const onVisible = () => {
      if (!document.hidden) refreshLiveSync();
    };
    window.addEventListener("pm-live-refresh", forceSyncNow);
    window.addEventListener("focus", syncNow);
    window.addEventListener("online", syncNow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pm-live-refresh", forceSyncNow);
      window.removeEventListener("focus", syncNow);
      window.removeEventListener("online", syncNow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshLiveSync]);

  useEffect(() => {
    if (authRoutes.includes(pathname)) return;
    if (!liveReady) return;
    if (sessionState === "inactive") return;
    if (!authenticated) {
      window.location.replace("/user/signin");
    }
  }, [authenticated, liveReady, pathname, sessionState]);

  return (
    <>
      <style jsx global>{`
        html, body { background: var(--pm-bg-grad) !important; color: var(--pm-fg) !important; }
      `}</style>
      {!hideNav && <Sidebar role={role} />}
      {children}
      {!hideNav && noticeOpen ? (
        <div className="fixed inset-0 z-[99] grid place-items-center bg-black/78 px-4">
          <div className="w-full max-w-sm border p-4 font-mono" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "var(--pm-bg)", color: "var(--pm-fg)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--pm-fg) 18%, transparent)" }}>
            <div className="text-[11px] font-black tracking-widest uppercase">{notice?.title || "Notice"}</div>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-6" style={{ color: "color-mix(in srgb, var(--pm-fg) 88%, transparent)" }}>{notice?.body || ""}</div>
            <button type="button" onClick={closeNotice} className="mt-4 w-full border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "var(--pm-fg)" }}>CLOSE</button>
          </div>
        </div>
      ) : null}
      {!hideNav && giftOpen ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 px-4">
          <div className="w-full max-w-sm border p-5 font-mono text-center" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "var(--pm-bg)", color: "var(--pm-fg)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--pm-fg) 18%, transparent), 0 32px 90px rgba(0,0,0,.62)" }}>
            <div className="text-[11px] font-black tracking-[0.28em] uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 72%, transparent)" }}>Gift Notice</div>
            <div className="mt-3 text-[15px] font-black uppercase tracking-[0.14em]">You received a gift</div>
            <div className="mt-4 text-[clamp(2rem,8vw,2.6rem)] font-black leading-none">Tk {Number(giftNotice?.amount || 0).toFixed(0)}</div>
            <div className="mt-2 text-sm font-bold tracking-wide" style={{ color: "color-mix(in srgb, var(--pm-fg) 84%, transparent)" }}>added to your account</div>
            <button type="button" onClick={closeGift} className="mt-6 w-full border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "var(--pm-fg)" }}>Close</button>
          </div>
        </div>
      ) : null}
      {!hideNav && sessionState === "inactive" ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 px-4">
          <div className="w-full max-w-sm border p-4 font-mono" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "var(--pm-bg)", color: "var(--pm-fg)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--pm-fg) 18%, transparent)" }}>
            <div className="text-center text-[11px] font-black tracking-widest uppercase">Account Inactive</div>
            <div className="mt-3 text-center text-sm font-black">YOUR ACCOUNT IS CURRENTLY INACTIVE</div>
            <div className="mt-2 text-center text-[12px] whitespace-pre-wrap" style={{ color: "color-mix(in srgb, var(--pm-fg) 78%, transparent)" }}>
              {inactiveReason || "আপনার অ্যাকাউন্ট ইনঅ্যাকটিভ করা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।"}
            </div>
            <Link href={supportLink} target="_blank" rel="noreferrer" className="mt-4 flex w-full items-center justify-center gap-2 border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 12%, transparent)", color: "var(--pm-fg)", pointerEvents: supportLink === "#" ? "none" : "auto", opacity: supportLink === "#" ? 0.6 : 1 }}>
              CONTACT SUPPORT
            </Link>
            <div className="mt-3 flex justify-center">
              <Link href={supportLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "var(--pm-fg)", pointerEvents: supportLink === "#" ? "none" : "auto", opacity: supportLink === "#" ? 0.6 : 1 }}>
                <FaWhatsapp className="h-4 w-4" /> WhatsApp
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      <Toaster position="top-center" />
    </>
  );
}
