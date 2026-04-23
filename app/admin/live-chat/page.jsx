"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Loader2, MessageCircle, SendHorizontal, X } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

function usePM() {
  return useMemo(() => ({
    fg: "var(--pm-fg)",
    fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)",
    b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
    b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)",
    bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)",
    bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
    bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
    greenBg: "rgba(34,197,94,0.16)",
  }), []);
}

function useLiveNow(step = 30000) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), step);
    return () => clearInterval(t);
  }, [step]);
  return now;
}

function presenceText(presence, now) {
  const last = presence?.lastSeenAt ? new Date(presence.lastSeenAt).getTime() : 0;
  if (presence?.isOnline && last && now && now - last <= 90 * 1000) return "এখন অনলাইন";
  if (!last || !now) return "স্ট্যাটাস আপডেট হচ্ছে";
  const minutes = Math.max(1, Math.floor((now - last) / 60000));
  if (minutes < 60) return `${minutes} মিনিট আগে`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ঘন্টা আগে`;
  const days = Math.floor(hours / 24);
  return `${days} দিন আগে`;
}

function PresenceRow({ pm, presence, now }) {
  const online = Boolean(presence?.isOnline && presence?.lastSeenAt && now && (now - new Date(presence.lastSeenAt).getTime()) <= 90 * 1000);
  return (
    <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: pm.fg70 }} suppressHydrationWarning>
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: online ? "#22c55e" : "color-mix(in srgb, var(--pm-fg) 38%, transparent)" }} />
      <span>{presenceText(presence, now)}</span>
    </div>
  );
}

function TypingIndicator({ pm, label }) {
  return <div className="flex items-center gap-2 px-1 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}><span>{label}</span><span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" /><span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:120ms]" /><span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:240ms]" /></span></div>;
}

function ChatModal({ open, onClose, pm, activeThread, messages, loadingMessages, text, onChangeText, sending, send, listRef, peerTyping, liveNow }) {
  if (!open || !activeThread) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3">
      <div className="flex h-[min(86vh,760px)] w-full max-w-2xl flex-col overflow-hidden border shadow-2xl" style={{ borderColor: pm.b28, background: "var(--pm-bg)", color: pm.fg }}>
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: pm.b20 }}>
          <div>
            <div className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: pm.fg70 }}>Chat User</div>
            <div className="mt-1 text-base font-black tracking-widest uppercase">{activeThread?.user?.fullName || "User"}</div>
            <div className="mt-1 text-[11px]" style={{ color: pm.fg70 }}>{activeThread?.user?.mobile || ""}</div>
            <PresenceRow pm={pm} presence={activeThread?.user?.presence} now={liveNow} />
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}><X className="h-5 w-5" /></button>
        </div>
        <div ref={listRef} className="h-[460px] flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {loadingMessages ? <div className="text-sm">Loading...</div> : messages.length === 0 ? <div className="flex h-full items-center justify-center text-sm" style={{ color: pm.fg70 }}>No messages yet.</div> : messages.map((m) => {
            const mine = m.senderRole === "admin";
            return <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className="max-w-[85%] border px-3 py-2 text-sm" style={{ borderColor: pm.b20, background: mine ? pm.greenBg : pm.bg08 }}><div className="text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>{mine ? "Admin" : (activeThread?.user?.fullName || "User")}</div>{!mine ? <div className="text-[10px] font-black tracking-[0.24em] uppercase" style={{ color: pm.fg70 }}>{activeThread?.user?.label || "User"}</div> : null}{m.message ? <div className="mt-1 whitespace-pre-wrap">{m.message}</div> : null}{m.imageUrl ? <img src={m.imageUrl} alt="Chat upload" className="mt-2 max-h-40 rounded border object-cover pointer-events-none select-none" style={{ borderColor: pm.b20 }} /> : null}<div className="mt-1 text-[10px]" style={{ color: pm.fg70 }}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</div></div></div>;
          })}
        </div>
        <div className="min-h-6 px-4">{peerTyping ? <TypingIndicator pm={pm} label={`${activeThread?.user?.fullName || "User"} typing`} /> : null}</div>
        <div className="border-t px-4 py-3" style={{ borderColor: pm.b20 }}><div className="flex items-stretch gap-2"><textarea rows={1} value={text} onChange={(e) => onChangeText(e.target.value)} className="h-12 min-h-12 max-h-12 flex-1 resize-none border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} placeholder="Write your message..." /><button type="button" onClick={send} disabled={!text.trim() || sending || loadingMessages} className="grid h-12 w-12 shrink-0 place-items-center border disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}</button></div></div>
      </div>
    </div>
  );
}

export default function AdminLiveChatPage() {
  const pm = usePM();
  const liveNow = useLiveNow();
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const sortThreads = (items) => [...items].sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());

const scrollBottom = useCallback((behavior = "auto") => {
  const run = () => {
    const el = listRef.current;
    if (!el) return;
    try {
      el.scrollTo({ top: el.scrollHeight, behavior });
    } catch {
      el.scrollTop = el.scrollHeight;
    }
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
}, []);
  const sameThreads = (a = [], b = []) => a.length === b.length && a.every((row, index) => String(row?._id || "") === String(b[index]?._id || "") && Number(row?.unreadByAdmin || 0) === Number(b[index]?.unreadByAdmin || 0) && String(row?.lastMessageAt || "") === String(b[index]?.lastMessageAt || "") && String(row?.user?.presence?.lastSeenAt || "") === String(b[index]?.user?.presence?.lastSeenAt || "") && Boolean(row?.user?.presence?.isOnline) === Boolean(b[index]?.user?.presence?.isOnline));
  const sameMessages = (a = [], b = []) => a.length === b.length && a.every((row, index) => String(row?._id || "") === String(b[index]?._id || "") && String(row?.updatedAt || row?.createdAt || "") === String(b[index]?.updatedAt || b[index]?.createdAt || ""));

  const loadThreads = async () => {
    const res = await fetch("/api/chat/threads", { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load threads");
    const nextRows = sortThreads(Array.isArray(data?.data) ? data.data : []);
    setThreads((prev) => sameThreads(prev, nextRows) ? prev : nextRows);
    setActiveThread((prev) => prev ? nextRows.find((row) => String(row._id) === String(prev._id)) || prev : prev);
  };

  const loadMessages = async (threadId, markRead = false) => {
    if (!threadId) return;
    const qs = new URLSearchParams({ threadId });
    if (markRead) qs.set("markRead", "1");
    const res = await fetch(`/api/chat/messages?${qs.toString()}`, { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load messages");
    const rows = Array.isArray(data?.data) ? data.data : [];
    setMessages((prev) => {
      if (sameMessages(prev, rows)) return prev;
      scrollBottom("auto");
      return rows;
    });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingThreads(true);
      try { await loadThreads(); } catch (e) { if (alive) toast.error(e?.message || "Load failed"); } finally { if (alive) setLoadingThreads(false); }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    scrollBottom("auto");
  }, [open, messages.length, loadingMessages, activeThread?._id, scrollBottom]);

  useEffect(() => {
    if (!activeThread?._id || !socketRef.current?.connected) return;
    try { socketRef.current.emit("chat:join", { threadId: activeThread._id, role: "admin" }); } catch {}
  }, [activeThread?._id, open]);

  useEffect(() => {
    let interval;
    let mounted = true;
    (async () => {
      try {
        const mod = await import("socket.io-client");
        if (!mounted) return;
        const socket = mod.io({ path: "/socket.io" });
        socketRef.current = socket;
        socket.on("connect", () => { if (activeThread?._id) socket.emit("chat:join", { threadId: activeThread._id, role: "admin" }); });
        socket.on("chat:new", async (payload) => {
          await loadThreads().catch(() => {});
      scrollBottom("auto");
          if (payload?.threadId && payload.threadId === activeThread?._id && open) loadMessages(payload.threadId, true).catch(() => {});
        });
        socket.on("chat:typing", (payload) => {
          if (!activeThread?._id || payload?.threadId !== activeThread._id) return;
          if (payload?.senderRole === "user") setPeerTyping(Boolean(payload?.isTyping));
        });
      } catch {}
      interval = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        loadThreads().catch(() => {});
        if (open && activeThread?._id) loadMessages(activeThread._id, true).catch(() => {});
      }, 12000);
    })();
    return () => { mounted = false; clearInterval(interval); try { socketRef.current?.disconnect(); } catch {} };
  }, [activeThread?._id, open]);

  const openThread = async (thread) => {
    setActiveThread(thread);
    setOpen(true);
    setLoadingMessages(true);
    setPeerTyping(false);
    try {
      await loadMessages(thread._id, true);
      if (socketRef.current?.connected) socketRef.current.emit("chat:join", { threadId: thread._id, role: "admin" });
      await loadThreads().catch(() => {});
      scrollBottom("auto");
    } catch (e) { toast.error(e?.message || "Failed to load messages"); } finally { setLoadingMessages(false); }
  };

  const onChangeText = (value) => {
    setText(value);
    if (!activeThread?._id) return;
    try { socketRef.current?.emit("chat:typing", { threadId: activeThread._id, senderRole: "admin" }); } catch {}
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { try { socketRef.current?.emit("chat:stop-typing", { threadId: activeThread._id, senderRole: "admin" }); } catch {} }, 1200);
  };

  const send = async () => {
    if (!activeThread?._id || !text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadId: activeThread._id, message: text.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Send failed");
      setText("");
      try { socketRef.current?.emit("chat:stop-typing", { threadId: activeThread._id, senderRole: "admin" }); } catch {}
      await loadMessages(activeThread._id, true);
      await loadThreads().catch(() => {});
      scrollBottom("auto");
      try { socketRef.current?.emit("chat:notify", { threadId: activeThread._id }); } catch {}
    } catch { toast.error("Network error"); } finally { setSending(false); }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg, fontFamily: "var(--pm-font)" }}>
      <div className="mx-auto max-w-md space-y-3">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}><div className="flex items-center justify-between gap-3"><div><div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div><div className="mt-1 text-lg font-black tracking-widest uppercase">Live Chat</div></div><span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><MessageCircle className="h-5 w-5" /></span></div></div>
        <div className="space-y-2">
          {loadingThreads ? <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b28, background: pm.bg06 }}>Loading...</div> : threads.length === 0 ? <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b28, background: pm.bg06, color: pm.fg70 }}>No chat users yet.</div> : threads.map((thread) => <button key={thread._id} type="button" onClick={() => openThread(thread)} className="w-full border px-3 py-3 text-left" style={{ borderColor: pm.b28, background: pm.bg06 }}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-sm font-black truncate">{thread?.user?.fullName || "User"}</div><div className="mt-1 text-[11px] truncate" style={{ color: pm.fg70 }}>{thread?.user?.mobile || ""}</div><PresenceRow pm={pm} presence={thread?.user?.presence} now={liveNow} /></div><div className="text-right">{Number(thread.unreadByAdmin || 0) > 0 ? <div className="inline-flex border px-2 py-1 text-[10px] font-black tracking-widest uppercase" style={{ borderColor: pm.b28, background: pm.bg10 }}>NEW</div> : null}</div></div></button>)}
        </div>
      </div>
      <ChatModal open={open} onClose={() => setOpen(false)} pm={pm} activeThread={activeThread} messages={messages} loadingMessages={loadingMessages} text={text} onChangeText={onChangeText} sending={sending} send={send} listRef={listRef} peerTyping={peerTyping} liveNow={liveNow} />
    </div>
  );
}
