"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa";
import { FiClock, FiX } from "react-icons/fi";
import { OdometerStyles, OdometerText, useAnimatedCountdown, formatCountdownLabel } from "@/components/OdometerText";
import Sidebar from "@/components/Sidebar";
import { THEME_LS_KEY, applyThemeToDocument, readSavedThemeId } from "@/lib/themes";
import { FONT_LS_KEY, readSavedFontId } from "@/lib/fonts";
import useThemeStore from "@/stores/useThemeStore";
import useLiveAppStore from "@/stores/useLiveAppStore";

const SOUND_KEY = "pm_sound_enabled_v1";
const VIBRATE_KEY = "pm_vibrate_enabled_v1";
const VISIT_SESSION_KEY = "pm_visit_session_key_v1";

function readBoolKey(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "1";
  } catch {
    return fallback;
  }
}

function ensureVisitSessionKey() {
  try {
    let value = sessionStorage.getItem(VISIT_SESSION_KEY);
    if (!value) {
      value = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `pm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(VISIT_SESSION_KEY, value);
    }
    return value;
  } catch {
    return `pm_${Date.now()}`;
  }
}

function CountdownStrip({ target, label = "COUNTDOWN", big = false }) {
  const { value, pulse } = useAnimatedCountdown(target);
  return (
    <div className={["border", big ? "px-4 py-4" : "px-3 py-3"].join(" ")} style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)" }}>
      <div className="text-center text-[10px] font-bold tracking-[0.28em] uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>{label}</div>
      <div className={["mt-3 flex items-center justify-center gap-2 font-black tabular-nums leading-none", big ? "text-[clamp(28px,7vw,44px)]" : "text-[18px] tracking-[0.16em]"].join(" ")} style={{ color: "var(--pm-fg)" }}>
        <FiClock className={big ? "h-5 w-5" : "h-4 w-4"} />
        <OdometerText value={value} pulse={pulse} durationBase={460} durationSpread={180} flashMs={520} />
      </div>
    </div>
  );
}

function getNoticeStorageKey(notice) {
  return `pm_notice_seen_${String(notice?.updatedAt || "global")}`;
}

function readNoticeSeen(notice) {
  const key = getNoticeStorageKey(notice);
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return { key, lastShown: Number(parsed?.lastShown || 0), count: Number(parsed?.count || 0) };
  } catch {
    return { key, lastShown: 0, count: 0 };
  }
}

function shouldOpenNotice(notice) {
  if (!notice?.isActive || !notice?.body) return false;
  const { lastShown, count } = readNoticeSeen(notice);
  const maxShows = Math.max(0, Number(notice?.maxShows || 0));
  if (maxShows > 0 && count >= maxShows) return false;
  const gapMs = Math.max(1, Number(notice?.intervalMin || 30)) * 60 * 1000;
  return !lastShown || Date.now() - lastShown >= gapMs;
}

export default function ClientShell({ children }) {
  const pathname = usePathname();
  const authRoutes = ["/user/signin", "/user/signup"];
  const hideNav = authRoutes.includes(pathname);
  const routeRole = pathname?.startsWith("/admin") ? "admin" : pathname?.startsWith("/agent") ? "agent" : "user";

  const initTheme = useThemeStore((state) => state.initTheme);
  const applyExternalTheme = useThemeStore((state) => state.applyExternalTheme);
  const applyExternalFont = useThemeStore((state) => state.applyExternalFont);

  const role = useLiveAppStore((state) => state.role);
  const sessionState = useLiveAppStore((state) => state.sessionState);
  const support = useLiveAppStore((state) => state.support);
  const inactiveReason = useLiveAppStore((state) => state.inactiveReason);
  const notice = useLiveAppStore((state) => state.notice);
  const siteUpdate = useLiveAppStore((state) => state.siteUpdate);
  const giftNotice = useLiveAppStore((state) => state.giftNotice);
  const authenticated = useLiveAppStore((state) => state.authenticated);
  const liveReady = useLiveAppStore((state) => state.liveReady);
  const startLiveSync = useLiveAppStore((state) => state.startLiveSync);
  const refreshLiveSync = useLiveAppStore((state) => state.refreshLiveSync);

  const supportLink = useMemo(() => support?.contactWhatsApp || "#", [support]);

  const [noticeOpen, setNoticeOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [siteWarningOpen, setSiteWarningOpen] = useState(false);
  const [nowTick, setNowTick] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(false);
  const clickAudioRef = useRef(null);
  const clickPingAtRef = useRef(0);

  const siteStartMs = siteUpdate?.startAt ? new Date(siteUpdate.startAt).getTime() : null;
  const siteEndMs = siteUpdate?.endAt ? new Date(siteUpdate.endAt).getTime() : null;
  const userFacingSiteUpdate = authenticated && role !== "admin" && siteUpdate?.isActive && siteStartMs && siteEndMs;
  const sitePhase = useMemo(() => {
    if (!userFacingSiteUpdate) return "idle";
    if (!nowTick || nowTick <= 0) return "idle";
    if (nowTick >= siteStartMs && nowTick < siteEndMs) return "active";
    if (nowTick < siteStartMs) return "upcoming";
    return "ended";
  }, [userFacingSiteUpdate, siteStartMs, siteEndMs, nowTick]);

  const siteWarningKey = useMemo(() => {
    const start = siteUpdate?.startAt || "none";
    const end = siteUpdate?.endAt || "none";
    const updatedAt = siteUpdate?.updatedAt || "global";
    return `pm_site_update_seen_${updatedAt}_${start}_${end}`;
  }, [siteUpdate]);

  useEffect(() => {
    setNowTick(Date.now());
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setSoundEnabled(readBoolKey(SOUND_KEY, true));
    setVibrateEnabled(readBoolKey(VIBRATE_KEY, false));
    const onStorage = (ev) => {
      if (ev.key === SOUND_KEY) setSoundEnabled(readBoolKey(SOUND_KEY, true));
      if (ev.key === VIBRATE_KEY) setVibrateEnabled(readBoolKey(VIBRATE_KEY, false));
    };
    const onSound = (e) => setSoundEnabled(Boolean(e?.detail?.value));
    const onVibrate = (e) => setVibrateEnabled(Boolean(e?.detail?.value));
    window.addEventListener("storage", onStorage);
    window.addEventListener("pm-sound-change", onSound);
    window.addEventListener("pm-vibrate-change", onVibrate);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pm-sound-change", onSound);
      window.removeEventListener("pm-vibrate-change", onVibrate);
    };
  }, []);

  useEffect(() => {
    const audio = new Audio("/audio/click.mp3");
    audio.preload = "auto";
    audio.volume = 0.8;
    clickAudioRef.current = audio;
    const selector = 'button, a, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], summary, [data-click-sound="true"]';
    const onClick = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const clickable = target.closest(selector);
      if (!clickable) return;
      if (vibrateEnabled && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        try { navigator.vibrate(18); } catch {}
      }
      const now = Date.now();
      if (authenticated && !hideNav && now - clickPingAtRef.current > 1600) {
        clickPingAtRef.current = now;
        const sessionKey = ensureVisitSessionKey();
        fetch("/api/analytics/ping", {
          method: "POST",
          credentials: "include",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionKey, pathname, click: true }),
        }).catch(() => {});
      }
      if (!soundEnabled) return;
      const src = clickAudioRef.current?.src || "/audio/click.mp3";
      try {
        const player = new Audio(src);
        player.volume = 0.8;
        player.play().catch(() => {});
      } catch {}
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      try { clickAudioRef.current?.pause(); } catch {}
      clickAudioRef.current = null;
    };
  }, [authenticated, hideNav, pathname, soundEnabled, vibrateEnabled]);

  useEffect(() => {
    if (hideNav || !authenticated) return;
    const sessionKey = ensureVisitSessionKey();
    const ping = async () => {
      try {
        await fetch("/api/analytics/ping", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionKey, pathname }),
        });
      } catch {}
    };
    ping();
    const t = window.setInterval(() => {
      if (!document.hidden) ping();
    }, 30000);
    return () => window.clearInterval(t);
  }, [authenticated, hideNav, pathname]);

  useEffect(() => {
    if (hideNav) return;
    if (!authenticated || role === "admin") return;
    if (!notice?.isActive || !notice?.body) {
      setNoticeOpen(false);
      return;
    }
    if (shouldOpenNotice(notice)) setNoticeOpen(true);
  }, [authenticated, role, hideNav, notice]);

  const closeNotice = () => {
    const { key, count } = readNoticeSeen(notice);
    try { localStorage.setItem(key, JSON.stringify({ lastShown: Date.now(), count: count + 1 })); } catch {}
    setNoticeOpen(false);
  };

  useEffect(() => {
    if (hideNav || !authenticated || role === "admin") return;
    if (giftNotice?.open && Number(giftNotice?.amount || 0) > 0) setGiftOpen(true);
  }, [authenticated, giftNotice, hideNav, role]);

  const closeGift = async () => {
    try {
      await fetch("/api/user/gift-notice", { method: "POST", credentials: "include" });
    } catch {}
    setGiftOpen(false);
    refreshLiveSync({ force: true });
  };

  useEffect(() => {
    if (hideNav || !authenticated || role === "admin") return;
    const t = window.setInterval(() => {
      if (noticeOpen) return;
      if (shouldOpenNotice(notice)) setNoticeOpen(true);
    }, 60000);
    return () => window.clearInterval(t);
  }, [authenticated, role, hideNav, notice, noticeOpen]);

  useEffect(() => {
    if (hideNav || !authenticated || role === "admin") return;
    if (sitePhase !== "upcoming") {
      setSiteWarningOpen(false);
      return;
    }
    let lastShown = 0;
    try { lastShown = Number(localStorage.getItem(siteWarningKey) || 0); } catch {}
    const gapMs = Math.max(1, Number(siteUpdate?.notifyEveryMin || 30)) * 60 * 1000;
    if (!lastShown || Date.now() - lastShown >= gapMs) setSiteWarningOpen(true);
  }, [authenticated, role, hideNav, sitePhase, siteUpdate, siteWarningKey]);

  useEffect(() => {
    if (hideNav || !authenticated || role === "admin") return;
    const t = window.setInterval(() => {
      if (sitePhase !== "upcoming" || siteWarningOpen) return;
      let lastShown = 0;
      try { lastShown = Number(localStorage.getItem(siteWarningKey) || 0); } catch {}
      const gapMs = Math.max(1, Number(siteUpdate?.notifyEveryMin || 30)) * 60 * 1000;
      if (!lastShown || Date.now() - lastShown >= gapMs) setSiteWarningOpen(true);
    }, 30000);
    return () => window.clearInterval(t);
  }, [authenticated, role, hideNav, sitePhase, siteWarningOpen, siteWarningKey, siteUpdate]);

  useEffect(() => {
    if (sitePhase === "active") setSiteWarningOpen(false);
  }, [sitePhase]);

  const closeSiteWarning = () => {
    try { localStorage.setItem(siteWarningKey, String(Date.now())); } catch {}
    setSiteWarningOpen(false);
  };

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
    if (!authenticated) window.location.replace("/user/signin");
  }, [authenticated, liveReady, pathname, sessionState]);

  useEffect(() => {
    if (sitePhase !== "active") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [sitePhase]);

  const startCountdown = formatCountdownLabel(siteUpdate?.startAt, nowTick);

  return (
    <>
      <style jsx global>{`
        html, body { background: var(--pm-bg-grad) !important; color: var(--pm-fg) !important; }
        @keyframes pmNewsMarquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .pm-news-track { white-space: nowrap; display: inline-block; min-width: 100%; animation: pmNewsMarquee 16s linear infinite; }
      `}</style>
      <OdometerStyles />
      {!hideNav && <Sidebar role={routeRole || role} />}
      {!hideNav && noticeOpen && notice?.type === "news" ? (
        <div className="fixed left-2 right-2 top-16 z-[98] overflow-hidden border px-3 py-2 font-mono md:left-4 md:right-4 md:top-3" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "var(--pm-bg)", color: "var(--pm-fg)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--pm-fg) 16%, transparent)" }}>
          <div className="flex items-center gap-3">
            <div className="shrink-0 text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 72%, transparent)" }}>{notice?.title || "News"}</div>
            <div className="min-w-0 flex-1 overflow-hidden text-[12px] font-bold">
              <span className="pm-news-track">{notice?.body || ""}</span>
            </div>
            <button type="button" onClick={closeNotice} className="shrink-0 border p-1.5" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "var(--pm-fg)" }}>
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
      {children}

      {!hideNav && siteWarningOpen && sitePhase === "upcoming" ? (
        <div className="fixed inset-0 z-[104] grid place-items-center bg-black/78 px-4">
          <div className="w-full max-w-sm overflow-hidden border font-mono" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "var(--pm-bg)", color: "var(--pm-fg)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--pm-fg) 18%, transparent), 0 30px 80px rgba(0,0,0,.55)" }}>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 22%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 8%, transparent)" }}>
              <div>
                <div className="text-[10px] font-black tracking-[0.30em] uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 72%, transparent)" }}>Warning</div>
                <div className="mt-1 text-[12px] font-black tracking-widest uppercase">Update</div>
              </div>
              <button type="button" onClick={closeSiteWarning} className="border p-2" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "var(--pm-fg)" }}>
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-sm font-black">অল্প কিছু সময়ের মধ্যে সাইট আপডেট শুরু হবে।</div>
              <div className="mt-2 text-[12px] whitespace-pre-wrap" style={{ color: "color-mix(in srgb, var(--pm-fg) 82%, transparent)" }}>
                আর {startCountdown} পর আপডেট শুরু হবে। আপডেট চলাকালীন আপনি কোনো পেজ ব্যবহার করতে পারবেন না।
              </div>
              <div className="mt-4">
                <CountdownStrip target={siteUpdate?.startAt} label="UPDATE STARTS IN" big />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!hideNav && noticeOpen && notice?.type !== "news" ? (
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
              {inactiveReason || "আপনার অ্যাকাউন্ট ইনঅ্যাকটিভ করা হয়েছে। বিস্তারিত জানতে কন্টাক্টে যোগাযোগ করুন।"}
            </div>
            <Link href={supportLink} target="_blank" rel="noreferrer" className="mt-4 flex w-full items-center justify-center gap-2 border px-3 py-3 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 12%, transparent)", color: "var(--pm-fg)", pointerEvents: supportLink === "#" ? "none" : "auto", opacity: supportLink === "#" ? 0.6 : 1 }}>
              CONTACT
            </Link>
            <div className="mt-3 flex justify-center">
              <Link href={supportLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-black tracking-widest uppercase" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 10%, transparent)", color: "var(--pm-fg)", pointerEvents: supportLink === "#" ? "none" : "auto", opacity: supportLink === "#" ? 0.6 : 1 }}>
                <FaWhatsapp className="h-4 w-4" /> WhatsApp
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {!hideNav && sitePhase === "active" ? (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-black/88 px-4">
          <div className="w-full max-w-sm overflow-hidden border font-mono text-center" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "var(--pm-bg)", color: "var(--pm-fg)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--pm-fg) 18%, transparent), 0 32px 90px rgba(0,0,0,.62)" }}>
            <div className="border-b px-5 py-4" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 22%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 8%, transparent)" }}>
              <div className="text-[11px] font-black tracking-[0.28em] uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 72%, transparent)" }}>Update</div>
              <div className="mt-2 text-[15px] font-black uppercase tracking-[0.14em]">আপডেট চলমান আছে</div>
            </div>
            <div className="p-5">
              <div className="text-sm leading-6" style={{ color: "color-mix(in srgb, var(--pm-fg) 84%, transparent)" }}>
                আপডেট শেষ না হওয়া পর্যন্ত কোনো পেজ ব্যবহার করা যাবে না।
              </div>
              <div className="mt-5">
                <CountdownStrip target={siteUpdate?.endAt} label="UPDATE ENDS IN" big />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Toaster position="top-center" />
    </>
  );
}
