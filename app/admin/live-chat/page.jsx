"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Loader2, MessageCircle, SendHorizontal, UserCircle2, X } from "lucide-react";

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
    violetBg: "rgba(139,92,246,0.18)",
    violetBd: "rgba(139,92,246,0.42)",
  }), []);
}

function ChatModal({ open, onClose, pm, activeThread, messages, loadingMessages, text, setText, sending, send, listRef }) {
  if (!open || !activeThread) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3">
      <div className="flex h-[min(86vh,760px)] w-full max-w-2xl flex-col overflow-hidden border shadow-2xl" style={{ borderColor: pm.b28, background: "var(--pm-bg)", color: pm.fg }}>
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: pm.b20 }}>
          <div>
            <div className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: pm.fg70 }}>Chat User</div>
            <div className="mt-1 text-base font-black tracking-widest uppercase">{activeThread?.user?.fullName || "User"}</div>
            <div className="mt-1 text-[11px]" style={{ color: pm.fg70 }}>{activeThread?.user?.mobile || ""}</div>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={listRef} className="h-[460px] flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {loadingMessages ? <div className="text-sm">Loading...</div> : messages.length === 0 ? <div className="flex h-full items-center justify-center text-sm" style={{ color: pm.fg70 }}>No messages yet.</div> : messages.map((m) => {
            const mine = m.senderRole === "admin";
            return (
              <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] border px-3 py-2 text-sm" style={{ borderColor: pm.b20, background: mine ? pm.greenBg : pm.bg08 }}>
                  <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>{mine ? "Admin" : "User"}</div>
                  {m.message ? <div className="mt-1 whitespace-pre-wrap">{m.message}</div> : null}
                  {m.imageUrl ? <img src={m.imageUrl} alt="Chat upload" className="mt-2 max-h-40 rounded border object-cover pointer-events-none select-none" style={{ borderColor: pm.b20 }} /> : null}
                  <div className="mt-1 text-[10px]" style={{ color: pm.fg70 }}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t px-4 py-3" style={{ borderColor: pm.b20 }}>
          <div className="flex items-stretch gap-2">
            <textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} className="h-12 min-h-12 max-h-12 flex-1 resize-none border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} placeholder="Write your message..." />
            <button type="button" onClick={send} disabled={!text.trim() || sending || loadingMessages} className="grid h-12 w-12 shrink-0 place-items-center border disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLiveChatPage() {
  const pm = usePM();
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const socketRef = useRef(null);
  const listRef = useRef(null);

  const sortThreads = (items) => [...items].sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());

  const loadThreads = async () => {
    const res = await fetch("/api/chat/threads", { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load threads");
    setThreads(sortThreads(Array.isArray(data?.data) ? data.data : []));
  };

  const loadMessages = async (threadId, markRead = false) => {
    if (!threadId) return;
    const qs = new URLSearchParams({ threadId });
    if (markRead) qs.set("markRead", "1");
    const res = await fetch(`/api/chat/messages?${qs.toString()}`, { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load messages");
    setMessages(Array.isArray(data?.data) ? data.data : []);
    setTimeout(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingThreads(true);
      try {
        await loadThreads();
      } catch (e) {
        if (alive) toast.error(e?.message || "Load failed");
      } finally {
        if (alive) setLoadingThreads(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let interval;
    let mounted = true;
    (async () => {
      try {
        const mod = await import("socket.io-client");
        if (!mounted) return;
        const socket = mod.io({ path: "/socket.io" });
        socketRef.current = socket;
        socket.on("connect", () => {
          if (activeThread?._id) socket.emit("chat:join", { threadId: activeThread._id, role: "admin" });
        });
        socket.on("chat:new", async (payload) => {
          await loadThreads().catch(() => {});
          if (payload?.threadId && payload.threadId === activeThread?._id && open) loadMessages(payload.threadId, true).catch(() => {});
        });
      } catch {}
      interval = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        loadThreads().catch(() => {});
        if (open && activeThread?._id) loadMessages(activeThread._id, true).catch(() => {});
      }, 12000);
    })();
    return () => {
      mounted = false;
      clearInterval(interval);
      try { socketRef.current?.disconnect(); } catch {}
    };
  }, [activeThread?._id, open]);

  const openThread = async (thread) => {
    setActiveThread(thread);
    setOpen(true);
    setLoadingMessages(true);
    try {
      await loadMessages(thread._id, true);
      if (socketRef.current?.connected) socketRef.current.emit("chat:join", { threadId: thread._id, role: "admin" });
      await loadThreads().catch(() => {});
    } catch (e) {
      toast.error(e?.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const send = async () => {
    if (!activeThread?._id || !text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadId: activeThread._id, message: text.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Send failed");
      setText("");
      await loadMessages(activeThread._id, true);
      await loadThreads().catch(() => {});
      try { socketRef.current?.emit("chat:notify", { threadId: activeThread._id }); } catch {}
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg, fontFamily: "var(--pm-font)" }}>
      <div className="mx-auto max-w-md space-y-3">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Admin</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">Live Chat</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.violetBd, background: pm.violetBg }}><MessageCircle className="h-5 w-5" /></span>
          </div>
        </div>

        <div className="space-y-2">
          {loadingThreads ? (
            <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b28, background: pm.bg06 }}>Loading...</div>
          ) : threads.length === 0 ? (
            <div className="border px-3 py-4 text-sm" style={{ borderColor: pm.b28, background: pm.bg06, color: pm.fg70 }}>No chat users yet.</div>
          ) : threads.map((thread) => (
            <button key={thread._id} type="button" onClick={() => openThread(thread)} className="w-full border px-3 py-3 text-left active:scale-[0.99]" style={{ borderColor: pm.violetBd, background: 'linear-gradient(180deg, rgba(139,92,246,0.14), rgba(255,255,255,0.04))', color: pm.fg }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full border" style={{ borderColor: pm.violetBd, background: pm.violetBg }}><UserCircle2 className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <div className="text-[12px] font-black uppercase truncate">{thread?.user?.fullName || 'User'}</div>
                    <div className="mt-1 text-[11px] truncate" style={{ color: pm.fg70 }}>{thread?.user?.mobile || ''}</div>
                  </div>
                </div>
                {Number(thread.unreadByAdmin || 0) > 0 ? <span className="shrink-0 border px-2 py-1 text-[10px] font-black tracking-widest uppercase" style={{ borderColor: pm.violetBd, background: pm.violetBg }}>NEW</span> : null}
              </div>
            </button>
          ))}
        </div>
      </div>

      <ChatModal open={open} onClose={() => setOpen(false)} pm={pm} activeThread={activeThread} messages={messages} loadingMessages={loadingMessages} text={text} setText={setText} sending={sending} send={send} listRef={listRef} />
    </div>
  );
}
