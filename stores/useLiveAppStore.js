"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const POLL_MS = 30000;
const MIN_FETCH_GAP_MS = 15000;
let poller = null;
let visibilityBound = false;
let inFlight = null;
let lastFetchAt = 0;

async function readSnapshot(force = false) {
  const now = Date.now();
  if (!force && inFlight) return inFlight;
  if (!force && now - lastFetchAt < MIN_FETCH_GAP_MS) return null;

  inFlight = fetch("/api/live-sync", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { "cache-control": "no-store" },
  })
    .then(async (res) => {
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.message || "Failed to sync app data");
      lastFetchAt = Date.now();
      return json?.data || {};
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

const defaultSupport = {
  contactWhatsApp: "",
  contactTelegram: "",
  contactTelegramGroup: "",
};

const invalidState = {
  liveReady: true,
  authenticated: false,
  role: "user",
  status: "invalid",
  sessionState: "invalid",
  balance: 0,
  balanceReady: false,
  inactiveReason: "",
  notice: { title: "NOTICE", body: "", isActive: false, updatedAt: null, intervalMin: 30 },
  giftNotice: { open: false, amount: 0, updatedAt: null },
  lastSyncedAt: Date.now(),
};

const useLiveAppStore = create(
  subscribeWithSelector((set, get) => ({
    liveReady: false,
    authenticated: false,
    role: "user",
    status: "guest",
    sessionState: "guest",
    support: defaultSupport,
    balance: 0,
    balanceReady: false,
    inactiveReason: "",
    notice: { title: "NOTICE", body: "", isActive: false, updatedAt: null, intervalMin: 30 },
    giftNotice: { open: false, amount: 0, updatedAt: null },
    user: null,
    currentPath: "/",
    lastSyncedAt: 0,

    applySnapshot: (snapshot = {}) => {
      const authenticated = Boolean(snapshot?.authenticated);
      const role = String(snapshot?.role || "user").toLowerCase() === "admin" ? "admin" : "user";
      const status = String(snapshot?.status || (authenticated ? "active" : "guest")).toLowerCase();
      const sessionState = String(snapshot?.sessionState || (status === "inactive" ? "inactive" : authenticated ? "ok" : "guest")).toLowerCase();
      const support = {
        contactWhatsApp: snapshot?.support?.contactWhatsApp || "",
        contactTelegram: snapshot?.support?.contactTelegram || "",
        contactTelegramGroup: snapshot?.support?.contactTelegramGroup || "",
      };
      const nextNotice = {
        title: snapshot?.notice?.title || "NOTICE",
        body: snapshot?.notice?.body || "",
        isActive: snapshot?.notice?.isActive !== false,
        updatedAt: snapshot?.notice?.updatedAt || null,
        intervalMin: Number(snapshot?.notice?.intervalMin || 30),
      };
      const next = {
        liveReady: true,
        authenticated,
        role,
        status,
        sessionState,
        support,
        inactiveReason: snapshot?.inactiveReason || "",
        notice: nextNotice,
        giftNotice: {
          open: Boolean(snapshot?.giftNotice?.open),
          amount: Number(snapshot?.giftNotice?.amount || 0),
          updatedAt: snapshot?.giftNotice?.updatedAt || null,
        },
        user: snapshot?.user || null,
        lastSyncedAt: Date.now(),
      };
      if (role === "user" && authenticated) {
        next.balance = Number(snapshot?.balance || 0);
        next.balanceReady = true;
      } else if (!authenticated) {
        next.balance = 0;
        next.balanceReady = false;
      }
      set(next);
    },

    refreshLiveSync: async ({ force = false } = {}) => {
      try {
        const snapshot = await readSnapshot(force);
        if (snapshot) get().applySnapshot(snapshot);
      } catch {
        set(invalidState);
      }
    },

    setBalanceLocal: (balance) => set({ balance: Number(balance || 0), balanceReady: true, lastSyncedAt: Date.now() }),

    startLiveSync: (pathname = "/") => {
      set({ currentPath: pathname || "/" });
      get().refreshLiveSync({ force: true });
      if (poller) return;
      poller = window.setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        get().refreshLiveSync();
      }, POLL_MS);

      if (!visibilityBound && typeof document !== "undefined") {
        const onVisible = () => {
          if (!document.hidden) get().refreshLiveSync();
        };
        document.addEventListener("visibilitychange", onVisible);
        visibilityBound = true;
      }
    },

    stopLiveSync: () => {
      if (poller) {
        window.clearInterval(poller);
        poller = null;
      }
    },
  }))
);

export default useLiveAppStore;
