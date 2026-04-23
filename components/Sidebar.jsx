"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import {
  Menu as MenuIcon,
  X,
  LayoutDashboard,
  Wallet,
  ArrowDownToLine,
  User,
  LifeBuoy,
  LogOut,
  ArrowUpRight,
  Loader2,
  Settings,
  Coins,
  Link2,
  Receipt,
  Users,
  CheckCircle2,
  Download,
  Trophy,
  Users2,
  Bell,
  MessageCircle,
  Wrench,
  Files,
  Activity,
  HelpCircle,
  Palette,
  Volume2,
  BookOpen,
} from "lucide-react";
import { Calculator } from "lucide-react";
import { FiCreditCard, FiLayers } from "react-icons/fi";
import useLiveAppStore from "@/stores/useLiveAppStore";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

const USER_MENU = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Leaderboard", href: "/user/leaderboard", icon: Trophy },
  { name: "Deposit", href: "/user/deposit", icon: Wallet },
  { name: "Withdraw", href: "/user/withdraw", icon: ArrowDownToLine },
  { name: "Live Support", href: "/user/live-chat", icon: MessageCircle },
  { name: "Balance Box", href: "/user/plan-and-balance-claim", icon: FiLayers },
  { name: "Referral", href: "/user/referral", icon: Users2 },
  { name: "Profile", href: "/user/profile", icon: User },
  { name: "Transactions", href: "/user/transactions", icon: Receipt },
  { name: "Calculator", href: "/user/income-calculate", icon: Calculator },
  { name: "Download App", href: "/user/download", icon: Download },
  { name: "Contact", href: "/user/contact", icon: LifeBuoy },
  { name: "Notice", href: "/user/notice", icon: Bell },
  { name: "Theme", href: "/user/theme", icon: Palette },
  { name: "Sound", href: "/user/sound", icon: Volume2 },
  { name: "Tutorial", href: "/user/tutorial", icon: HelpCircle },
  { name: "About", href: "/user/about", icon: BookOpen },
];

const ADMIN_MENU = [
  { name: "Deposit Request", href: "/admin/approve-deposit", icon: CheckCircle2 },
  { name: "Withdraw Request", href: "/admin/withdraws", icon: ArrowDownToLine },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Add and Gift", href: "/admin/addbalance", icon: Coins },
  { name: "Leaderboard", href: "/admin/leaderboard", icon: Trophy },
  { name: "Referral", href: "/admin/referral", icon: Users2 },
  { name: "Links", href: "/admin/links", icon: Link2 },
  { name: "General", href: "/admin/general", icon: Settings },
  { name: "Theme", href: "/admin/theme", icon: Palette },
  { name: "Transactions", href: "/admin/transactions", icon: Receipt },
  { name: "Documents", href: "/admin/documents", icon: Files },
  { name: "Download App", href: "/admin/download", icon: Download },
  { name: "Notice", href: "/admin/notice", icon: Bell },
  { name: "Live Chat", href: "/admin/live-chat", icon: MessageCircle },
  { name: "Analytics", href: "/admin/analytics", icon: Activity },
  { name: "Tutorial", href: "/admin/tutorial", icon: HelpCircle },
  { name: "Update", href: "/admin/site-updating", icon: Wrench },
  { name: "Payment Methods", href: "/admin/payment-methods", icon: FiCreditCard },
  { name: "Role", href: "/admin/roles", icon: Users2 },
];


const AGENT_MENU = [
  { name: "Deposit Verify", href: "/agent/deposit-verify", icon: CheckCircle2 },
  { name: "Deposit", href: "/agent/deposit", icon: Wallet },
  { name: "Withdraw", href: "/agent/withdraw", icon: ArrowDownToLine },
  { name: "Transactions", href: "/agent/transactions", icon: Receipt },
  { name: "Profile", href: "/agent/profile", icon: User },
  { name: "Referral", href: "/agent/referral", icon: Users2 },
  { name: "Notice", href: "/agent/notice", icon: Bell },
  { name: "Live Chat", href: "/agent/live-chat", icon: MessageCircle },
  { name: "Tutorial", href: "/agent/tutorial", icon: HelpCircle },
  { name: "Theme", href: "/agent/theme", icon: Palette },
  { name: "Sound", href: "/agent/sound", icon: Volume2 },
  { name: "Download App", href: "/agent/download", icon: Download },
];

function fmt2(n) {
  const x = Number(n || 0);
  return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isActivePath(pathname, href) {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

function BrandMark() {
  return (
    <span className="inline-flex overflow-hidden border" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)" }}>
      <span className="px-3 py-2 text-[11px] font-black tracking-widest uppercase" style={{ background: "var(--pm-fg)", color: "var(--pm-bg)" }}>
        Pocket
      </span>
      <span className="px-3 py-2 text-[11px] font-black tracking-widest uppercase" style={{ background: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", color: "var(--pm-fg)" }}>
        Money
      </span>
    </span>
  );
}

export default function Sidebar({ role = "user" }) {
  const pathname = usePathname();
  const router = useRouter();
  const roleKey = String(role || "user").toLowerCase();
  const isAdmin = roleKey === "admin";
  const isAgent = roleKey === "agent";
  const menu = useMemo(() => (isAdmin ? ADMIN_MENU : isAgent ? AGENT_MENU : USER_MENU), [isAdmin, isAgent]);

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const balance = useLiveAppStore((state) => state.balance);
  const balanceReady = useLiveAppStore((state) => state.balanceReady);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const clearAllClientStorage = () => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setOpen(false);
    try {
      clearAllClientStorage();
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message || "Logout failed");
        setLoggingOut(false);
        return;
      }
      toast.success(data?.message || "Logout successful");
      setTimeout(() => router.push("/user/signin"), 300);
    } catch {
      toast.error("Network error. Please try again.");
      setLoggingOut(false);
    }
  };

  const Divider = ({ label }) => (
    <div className="my-3" suppressHydrationWarning>
      <div suppressHydrationWarning className="h-px w-full" style={{ background: "color-mix(in srgb, var(--pm-fg) 18%, transparent)" }} />
      <div suppressHydrationWarning className="mt-2 text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 65%, transparent)" }}>
        {label}
      </div>
    </div>
  );

  const MenuItem = ({ item }) => {
    const active = isActivePath(pathname, item.href);
    const Icon = item.icon;
    const border = active
      ? "color-mix(in srgb, var(--pm-fg) 55%, transparent)"
      : "color-mix(in srgb, var(--pm-fg) 20%, transparent)";
    const bg = active
      ? "color-mix(in srgb, var(--pm-fg) 16%, transparent)"
      : "color-mix(in srgb, var(--pm-fg) 6%, transparent)";

    return (
      <Link
        href={item.href}
        onClick={() => setOpen(false)}
        className="relative flex items-center justify-between gap-3 border px-3 py-3 transition active:scale-[0.995]"
        style={{ borderColor: border, background: bg, boxShadow: active ? `0 0 0 2px ${"color-mix(in srgb, var(--pm-fg) 25%, transparent)"}` : "none", color: "var(--pm-fg)" }}
      >
        {active ? <span aria-hidden="true" className="absolute left-0 top-0 h-full w-[4px]" style={{ background: "var(--pm-fg)" }} /> : null}
        <span className="inline-flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: border, background: active ? "color-mix(in srgb, var(--pm-fg) 14%, transparent)" : "color-mix(in srgb, var(--pm-fg) 6%, transparent)" }}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <p className="truncate text-sm font-black">{item.name}</p>
            <p className="truncate text-[11px]" style={{ color: active ? "color-mix(in srgb, var(--pm-fg) 85%, transparent)" : "color-mix(in srgb, var(--pm-fg) 60%, transparent)" }}>{active ? "Selected" : "Open page"}</p>
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 border px-3 py-1 text-[10px] font-black tracking-widest" style={{ borderColor: border, background: active ? "var(--pm-fg)" : "color-mix(in srgb, var(--pm-fg) 6%, transparent)", color: active ? "var(--pm-bg)" : "var(--pm-fg)" }}>
          GO <ArrowUpRight className="h-4 w-4" />
        </span>
      </Link>
    );
  };

  return (
    <>
      <div
        suppressHydrationWarning
        className={[funnelDisplay.className, "fixed left-0 right-0 top-0 z-50 h-14 select-none border-b px-3 md:hidden"].join(" ")}
        style={{ backgroundColor: "var(--pm-bg)", borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", color: "var(--pm-fg)" }}
      >
        <div suppressHydrationWarning className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex items-center justify-self-start">
            <button
              onClick={() => setOpen(true)}
              disabled={loggingOut}
              className="shrink-0 border p-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", color: "var(--pm-fg)" }}
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" style={{ color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)" }} />
            </button>
          </div>

          <div className="flex min-w-0 items-center justify-center">
            <Link href="/" onClick={() => setOpen(false)} aria-label="Go to dashboard" className="shrink-0 select-none">
              <BrandMark />
            </Link>
          </div>

          <div className="flex items-center justify-self-end">
            {!isAdmin ? (
              <div className="min-w-[108px] overflow-hidden border px-3 py-1 text-right" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", color: "var(--pm-fg)" }}>
                <div className="text-[10px] font-bold uppercase leading-none tracking-widest" style={{ color: "color-mix(in srgb, var(--pm-fg) 60%, transparent)" }}>
                  Balance
                </div>
                <div className="whitespace-nowrap text-[14px] font-black leading-tight tabular-nums">Tk{balanceReady ? fmt2(balance) : "…"}</div>
              </div>
            ) : (
              <div className="w-11 shrink-0" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>

      {open ? <div className="fixed inset-0 z-[60] bg-black/70 md:hidden" onClick={() => setOpen(false)} /> : null}

      <aside
        suppressHydrationWarning
        className={[funnelDisplay.className, "fixed left-0 top-0 z-[70] h-full w-[84%] max-w-[340px] select-none border-r shadow-2xl transition-transform duration-150 ease-out md:hidden", open ? "translate-x-0" : "-translate-x-full"].join(" ")}
        style={{ backgroundColor: "var(--pm-bg)", borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", color: "var(--pm-fg)" }}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col">
          <div className="border-b px-4 py-4" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 6%, transparent)" }}>
            <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
              <div className="h-10 w-10" aria-hidden="true" />
              <div className="min-w-0 text-center">
                <Link href="/" onClick={() => setOpen(false)} className="inline-flex justify-center" aria-label="Go to dashboard">
                  <BrandMark />
                </Link>
                {!isAdmin ? (
                  <div className="mt-2 text-[11px]" style={{ color: "color-mix(in srgb, var(--pm-fg) 85%, transparent)" }}>
                    My Balance: Tk<span className="font-black">{balanceReady ? fmt2(balance) : "…"}</span>
                  </div>
                ) : null}
              </div>

              <button
                onClick={() => setOpen(false)}
                disabled={loggingOut}
                className="border p-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", color: "var(--pm-fg)" }}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" style={{ color: "color-mix(in srgb, var(--pm-fg) 90%, transparent)" }} />
              </button>
            </div>
          </div>

          <nav suppressHydrationWarning className="flex-1 space-y-2 overflow-y-auto p-4">
            <Divider label={isAdmin ? "Admin Menu" : isAgent ? "Agent Menu" : "User Menu"} />
            {menu.map((item) => <MenuItem key={item.href} item={item} />)}
          </nav>

          <div className="border-t p-4" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 6%, transparent)" }}>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full border px-3 py-3 font-black active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", color: "var(--pm-fg)" }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loggingOut ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <><LogOut className="h-4 w-4" />Log Out</>}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
