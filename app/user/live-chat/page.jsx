"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Funnel_Display } from "next/font/google";
import { ImagePlus, Loader2, SendHorizontal, ShieldCheck, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

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
    violetBg: "rgba(139,92,246,0.18)",
    violetBd: "rgba(139,92,246,0.42)",
    greenBg: "rgba(34,197,94,0.16)",
  }), []);
}

async function uploadChatImage(file) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) throw new Error("Cloudinary is not configured");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.secure_url) throw new Error(data?.error?.message || "Image upload failed");
  return { imageUrl: data.secure_url, imagePublicId: data.public_id || "" };
}

function ChatModal({ open, onClose, pm, loading, messages, text, setText, sending, send, listRef, imagePreview, imageUploading, onPickImage, clearImage }) {
  const fileInputRef = useRef(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3">
      <div className="flex h-[min(88vh,760px)] w-full max-w-xl flex-col overflow-hidden border shadow-2xl" style={{ borderColor: pm.b28, background: "var(--pm-bg)", color: pm.fg }}>
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: pm.b20 }}>
          <div>
            <div className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: pm.fg70 }}>Live Support</div>
            <div className="mt-1 flex items-center gap-2 text-base font-black tracking-widest uppercase"><FaWhatsapp className="h-4 w-4" /> Admin Support</div>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={listRef} className="h-[460px] flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {loading ? <div className="text-sm">Loading...</div> : messages.length === 0 ? <div className="flex h-full items-center justify-center text-sm" style={{ color: pm.fg70 }}>Start a conversation with support.</div> : messages.map((m) => {
            const mine = m.senderRole === "user";
            return (
              <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] border px-3 py-2 text-sm" style={{ borderColor: pm.b20, background: mine ? pm.greenBg : pm.bg08 }}>
                  <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>{mine ? "You" : "Admin"}</div>
                  {m.message ? <div className="mt-1 whitespace-pre-wrap">{m.message}</div> : null}
                  {m.imageUrl ? <img src={m.imageUrl} alt="Chat upload" className="mt-2 max-h-40 rounded border object-cover pointer-events-none select-none" style={{ borderColor: pm.b20 }} /> : null}
                  <div className="mt-1 text-[10px]" style={{ color: pm.fg70 }}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</div>
                </div>
              </div>
            );
          })}
        </div>

        {imagePreview ? (
          <div className="border-t px-4 py-2" style={{ borderColor: pm.b20, background: pm.bg08 }}>
            <div className="mb-2 text-[10px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>Image Preview</div>
            <div className="flex items-start gap-3">
              <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded border object-cover" style={{ borderColor: pm.b20 }} />
              <button type="button" onClick={clearImage} className="h-10 border px-3 text-[10px] font-black tracking-widest uppercase" style={{ borderColor: pm.b20, background: pm.bg10, color: pm.fg }}>Remove</button>
            </div>
          </div>
        ) : null}

        <div className="border-t px-4 py-3" style={{ borderColor: pm.b20 }}>
          <div className="flex items-stretch gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0] || null)} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageUploading || sending} className="grid h-12 w-12 shrink-0 place-items-center border disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }} aria-label="Upload image">
              {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            </button>
            <textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} className="h-12 min-h-12 max-h-12 flex-1 resize-none border px-3 py-3 text-sm outline-none" style={{ borderColor: pm.b20, background: pm.bg08, color: pm.fg }} placeholder="Write your message..." />
            <button type="button" onClick={send} disabled={(!text.trim() && !imagePreview) || sending || loading || imageUploading} className="grid h-12 w-12 shrink-0 place-items-center border disabled:opacity-60" style={{ borderColor: pm.b28, background: pm.bg10, color: pm.fg }}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserLiveChatPage() {
  const pm = usePM();
  const [threadId, setThreadId] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const sessionIdRef = useRef("");
  const firstMessageSentRef = useRef(false);

  const scrollBottom = () => {
    setTimeout(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  };

  const loadThread = async () => {
    const res = await fetch("/api/chat/threads", { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load thread");
    setThreadId(data?.data?._id || "");
    return data?.data?._id || "";
  };

  const loadMessages = async (tid, markRead = false) => {
    if (!tid) return;
    const qs = new URLSearchParams({ threadId: tid });
    if (markRead) qs.set("markRead", "1");
    const res = await fetch(`/api/chat/messages?${qs.toString()}`, { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load messages");
    setMessages(Array.isArray(data?.data) ? data.data : []);
    scrollBottom();
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const tid = await loadThread();
        if (!alive) return;
        await loadMessages(tid, false);
      } catch (e) {
        if (alive) toast.error(e?.message || "Load failed");
      } finally {
        if (alive) setLoading(false);
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
          if (threadId) socket.emit("chat:join", { threadId, role: "user" });
        });
        socket.on("chat:new", (payload) => {
          if (!payload?.threadId || payload.threadId === threadId) loadMessages(threadId, open).catch(() => {});
        });
      } catch {}
      interval = setInterval(() => { if (typeof document !== "undefined" && document.hidden) return; if (threadId && open) loadMessages(threadId, true).catch(() => {}); }, 12000);
    })();
    return () => {
      mounted = false;
      clearInterval(interval);
      try { socketRef.current?.disconnect(); } catch {}
    };
  }, [threadId, open]);

  const openModal = async () => {
    const newSessionId = `session-${Date.now()}`;
    sessionIdRef.current = newSessionId;
    firstMessageSentRef.current = false;
    setImagePreview("");
    setImagePublicId("");
    setOpen(true);
    if (threadId) await loadMessages(threadId, true).catch(() => {});
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

  const send = async () => {
    if ((!text.trim() && !imagePreview) || !threadId || sending) return;
    setSending(true);
    try {
      const shouldNotify = !firstMessageSentRef.current;
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message: text.trim(), imageUrl: imagePreview, imagePublicId, sessionId: sessionIdRef.current, notifyFirstInSession: shouldNotify }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data?.message || "Send failed");
      firstMessageSentRef.current = true;
      setText("");
      setImagePreview("");
      setImagePublicId("");
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
        <div className="border p-3" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>User</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">Live Chat</div>
            </div>
            <span className="grid h-11 w-11 place-items-center border" style={{ borderColor: pm.violetBd, background: pm.violetBg }}><FaWhatsapp className="h-5 w-5" /></span>
          </div>
        </div>

        <button type="button" onClick={openModal} className="w-full border px-4 py-4 text-left" style={{ borderColor: pm.violetBd, background: "linear-gradient(180deg, rgba(139,92,246,0.20), rgba(255,255,255,0.07))", color: pm.fg, boxShadow: "0 0 0 1px rgba(139,92,246,0.18)" }}>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full border" style={{ borderColor: pm.violetBd, background: pm.violetBg }}><FaWhatsapp className="h-5 w-5" /></span>
            <span className="min-w-0">
              <span className="block text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: pm.fg70 }}>Admin</span>
              <span className="mt-1 block text-base font-black tracking-widest uppercase">Admin Support</span>
              <span className="mt-1 block text-[11px]" style={{ color: pm.fg70 }}>Open a direct chat with admin support.</span>
            </span>
          </div>
        </button>
      </div>

      <ChatModal open={open} onClose={() => setOpen(false)} pm={pm} loading={loading} messages={messages} text={text} setText={setText} sending={sending} send={send} listRef={listRef} imagePreview={imagePreview} imageUploading={imageUploading} onPickImage={onPickImage} clearImage={() => { setImagePreview(""); setImagePublicId(""); }} />
    </div>
  );
}
