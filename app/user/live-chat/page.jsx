"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { Clock3, ImagePlus, Loader2, SendHorizontal, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });
const WAIT_MS = 60 * 1000;

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

async function uploadChatImage(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload/chat-image", { method: "POST", body: form, credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Upload failed");
  return data?.data || {};
}

function TypingIndicator({ pm, label }) {
  return <div className="flex items-center gap-2 px-1 text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}><span>{label}</span><span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" /><span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:120ms]" /><span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:240ms]" /></span></div>;
}

function formatWait(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function WaitingBanner({ pm, waitUntil, visible }) {
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    if (!visible || !waitUntil) return;
    setTick(Date.now());
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [visible, waitUntil]);
  if (!visible || !waitUntil) return null;
  const left = Math.max(0, waitUntil - tick);
  if (left <= 0) return null;
  return (
    <div className="border-b px-3 py-2" style={{ borderColor: pm.b20, background: "color-mix(in srgb, var(--pm-fg) 6%, transparent)" }}>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg08 }}><Clock3 className="h-3.5 w-3.5" /></span>
        <div className="min-w-0 flex-1"><div className="text-[9px] font-black tracking-[0.22em] uppercase leading-none" style={{ color: pm.fg70 }}>Reply Timer</div><div className="mt-1 text-[11px] font-semibold leading-4" style={{ color: pm.fg }}>এডমিন শিগগিরই রিপ্লাই দেবে। একটু অপেক্ষা করুন।</div></div>
        <div className="shrink-0 border px-2 py-1.5 text-[11px] font-black tabular-nums leading-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}>{formatWait(left)}</div>
      </div>
    </div>
  );
}

function ChatModal({ open, onClose, pm, loading, messages, text, onChangeText, sending, send, listRef, imagePreview, imageUploading, onPickImage, clearImage, peerTyping, waitUntil, waitingVisible, supportAdmin, liveNow }) {
  const fileInputRef = useRef(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3">
      <div className="flex h-[min(86vh,760px)] w-full max-w-2xl flex-col overflow-hidden border shadow-2xl" style={{ borderColor: pm.b28, background: "var(--pm-bg)", color: pm.fg }}>
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: pm.b20 }}>
          <div>
            <div className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: pm.fg70 }}>Live Support</div>
            <div className="mt-1 text-base font-black tracking-widest uppercase">{supportAdmin?.fullName || "Admin Support"}</div>
            <div className="mt-1 text-[11px] font-black tracking-[0.24em] uppercase" style={{ color: pm.fg70 }}>{supportAdmin?.label || "Admin"}</div>
            <PresenceRow pm={pm} presence={supportAdmin?.presence} now={liveNow} />
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}><X className="h-5 w-5" /></button>
        </div>
        <WaitingBanner pm={pm} waitUntil={waitUntil} visible={waitingVisible} />
        <div ref={listRef} className="h-[460px] flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {loading ? <div className="text-sm">Loading...</div> : messages.length === 0 ? <div className="flex h-full items-center justify-center text-sm" style={{ color: pm.fg70 }}>No messages yet.</div> : messages.map((m) => {
            const mine = m.senderRole === "user";
            return <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className="max-w-[85%] border px-3 py-2 text-sm" style={{ borderColor: pm.b20, background: mine ? pm.greenBg : pm.bg08 }}><div className="text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>{mine ? "You" : (supportAdmin?.fullName || "Admin")}</div>{!mine ? <div className="text-[10px] font-black tracking-[0.24em] uppercase" style={{ color: pm.fg70 }}>{supportAdmin?.label || "Admin"}</div> : null}{m.message ? <div className="mt-1 whitespace-pre-wrap">{m.message}</div> : null}{m.imageUrl ? <img src={m.imageUrl} alt="Chat upload" className="mt-2 max-h-40 rounded border object-cover" style={{ borderColor: pm.b20 }} /> : null}<div className="mt-1 text-[10px]" style={{ color: pm.fg70 }}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</div></div></div>;
          })}
        </div>
        <div className="min-h-6 px-4">{peerTyping ? <TypingIndicator pm={pm} label={`${supportAdmin?.fullName || "Admin"} typing`} /> : null}</div>
        {imagePreview ? <div className="border-t px-4 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}><div className="mb-2 text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Image Preview</div><div className="flex items-start gap-3"><img src={imagePreview} alt="Preview" className="h-16 w-16 rounded border object-cover" style={{ borderColor: pm.b20 }} /><button type="button" onClick={clearImage} className="h-10 border px-3 text-[10px] font-black tracking-widest uppercase" style={{ borderColor: pm.b20, background: pm.bg10, color: pm.fg }}>Remove</button></div></div> : null}
        <div className="border-t px-4 py-3" style={{ borderColor: pm.b20 }}><div className="flex items-stretch gap-2"><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0] || null)} /><button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageUploading || sending} className="grid h-12 w-12 shrink-0 place-items-center border disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }} aria-label="Upload image">{imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}</button><textarea rows={1} value={text} onChange={(e) => onChangeText(e.target.value)} className="h-12 min-h-12 max-h-12 flex-1 resize-none border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} placeholder="Write your message..." /><button type="button" onClick={send} disabled={(!text.trim() && !imagePreview) || sending || loading || imageUploading} className="grid h-12 w-12 shrink-0 place-items-center border disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}</button></div></div>
      </div>
    </div>
  );
}

export default function UserLiveChatPage() {
  const pm = usePM();
  const liveNow = useLiveNow();
  const [threadId, setThreadId] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);
  const [waitUntil, setWaitUntil] = useState(0);
  const [waitingVisible, setWaitingVisible] = useState(false);
  const [supportAdmin, setSupportAdmin] = useState(null);
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const sessionIdRef = useRef("");
  const firstMessageSentRef = useRef(false);
  const typingTimeoutRef = useRef(null);


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
  const sameMessages = (a = [], b = []) => a.length === b.length && a.every((row, index) => String(row?._id || "") === String(b[index]?._id || "") && String(row?.updatedAt || row?.createdAt || "") === String(b[index]?.updatedAt || b[index]?.createdAt || ""));

  const loadThread = async () => {
    const res = await fetch("/api/chat/threads", { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load thread");
    const nextThreadId = data?.data?._id || "";
    setThreadId(nextThreadId);
    setSupportAdmin(data?.data?.supportAdmin || null);
    try {
      if (nextThreadId && socketRef.current?.connected) {
        socketRef.current.emit("chat:join", { threadId: nextThreadId, role: "user" });
      }
    } catch {}
    return nextThreadId;
  };

  const loadMessages = async (tid, markRead = false) => {
    if (!tid) return;
    const qs = new URLSearchParams({ threadId: tid });
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

  useEffect(() => { let alive = true; (async () => { setLoading(true); try { const tid = await loadThread(); if (!alive) return; await loadMessages(tid, false); } catch (e) { if (alive) toast.error(e?.message || "Load failed"); } finally { if (alive) setLoading(false); } })(); return () => { alive = false; }; }, []);

  useEffect(() => {
    if (!open) return;
    scrollBottom("auto");
  }, [open, messages.length, loading, scrollBottom]);

  useEffect(() => {
    if (!threadId || !socketRef.current?.connected) return;
    try { socketRef.current.emit("chat:join", { threadId, role: "user" }); } catch {}
  }, [threadId, open]);

  useEffect(() => {
    let interval; let mounted = true;
    (async () => {
      try {
        const mod = await import("socket.io-client");
        if (!mounted) return;
        const socket = mod.io({ path: "/socket.io" });
        socketRef.current = socket;
        socket.on("connect", () => { if (threadId) socket.emit("chat:join", { threadId, role: "user" }); });
        socket.on("chat:new", (payload) => { if (!payload?.threadId || payload.threadId === threadId) loadMessages(threadId, open).catch(() => {}); });
        socket.on("chat:typing", (payload) => {
          if (!threadId || payload?.threadId !== threadId) return;
          if (payload?.senderRole === "admin") setPeerTyping(Boolean(payload?.isTyping));
        });
      } catch {}
      interval = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        loadThread().catch(() => {});
        if (threadId && open) loadMessages(threadId, true).catch(() => {});
      }, 12000);
    })();
    return () => { mounted = false; clearInterval(interval); try { socketRef.current?.disconnect(); } catch {} };
  }, [threadId, open]);

  useEffect(() => {
    if (!waitingVisible || !waitUntil) return;
    const t = setInterval(() => { if (Date.now() >= waitUntil) setWaitingVisible(false); }, 1000);
    return () => clearInterval(t);
  }, [waitingVisible, waitUntil]);

  const openModal = async () => {
    const newSessionId = `session-${Date.now()}`;
    sessionIdRef.current = newSessionId;
    firstMessageSentRef.current = false;
    setImagePreview("");
    setImagePublicId("");
    setPeerTyping(false);
    setWaitUntil(0);
    setWaitingVisible(false);
    setOpen(true);
    const tid = await loadThread().catch(() => threadId);
    if (tid) await loadMessages(tid, true).catch(() => {});
  };

  const onPickImage = async (file) => {
    if (!file) return;
    setImageUploading(true);
    try {
      const result = await uploadChatImage(file);
      setImagePreview(result.imageUrl || "");
      setImagePublicId(result.imagePublicId || "");
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e?.message || "Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const onChangeText = (value) => {
    setText(value);
    if (!threadId) return;
    try { socketRef.current?.emit("chat:typing", { threadId, senderRole: "user" }); } catch {}
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { try { socketRef.current?.emit("chat:stop-typing", { threadId, senderRole: "user" }); } catch {} }, 1200);
  };

  const send = async () => {
    if ((!text.trim() && !imagePreview) || !threadId || sending) return;
    setSending(true);
    try {
      const shouldNotify = !firstMessageSentRef.current;
      const res = await fetch("/api/chat/messages", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadId, message: text.trim(), imageUrl: imagePreview, imagePublicId, sessionId: sessionIdRef.current, notifyFirstInSession: shouldNotify }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Send failed");
      if (!firstMessageSentRef.current) {
        firstMessageSentRef.current = true;
        setWaitUntil(Date.now() + WAIT_MS);
        setWaitingVisible(true);
      }
      setText("");
      setImagePreview("");
      setImagePublicId("");
      try { socketRef.current?.emit("chat:stop-typing", { threadId, senderRole: "user" }); } catch {}
      await loadThread().catch(() => {});
      await loadMessages(threadId, true);
      try { socketRef.current?.emit("chat:notify", { threadId }); } catch {}
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg, fontFamily: "var(--pm-font)" }}>
      <div className="mx-auto max-w-md space-y-3">
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}><div className="flex items-center justify-between gap-3"><div><div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>User</div><div className="mt-1 text-lg font-black tracking-widest uppercase">Live Support</div></div><span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><FaWhatsapp className="h-5 w-5" /></span></div></div>
        <button type="button" onClick={openModal} className="w-full border px-4 py-4 text-left" style={{ borderColor: pm.b28, background: pm.bg06, color: pm.fg, boxShadow: `0 0 0 1px ${pm.b20}` }}>
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full border" style={{ borderColor: pm.b28, background: pm.bg10 }}><FaWhatsapp className="h-5 w-5" /></span><span className="min-w-0"><span className="block text-base font-black tracking-widest uppercase">{supportAdmin?.fullName || "Admin Support"}</span><span className="mt-1 block text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: pm.fg70 }}>{supportAdmin?.label || "Admin"}</span><PresenceRow pm={pm} presence={supportAdmin?.presence} now={liveNow} /></span></div>
        </button>
      </div>
      <ChatModal open={open} onClose={() => setOpen(false)} pm={pm} loading={loading} messages={messages} text={text} onChangeText={onChangeText} sending={sending} send={send} listRef={listRef} imagePreview={imagePreview} imageUploading={imageUploading} onPickImage={onPickImage} clearImage={() => { setImagePreview(""); setImagePublicId(""); }} peerTyping={peerTyping} waitUntil={waitUntil} waitingVisible={waitingVisible} supportAdmin={supportAdmin} liveNow={liveNow} />
    </div>
  );
}
