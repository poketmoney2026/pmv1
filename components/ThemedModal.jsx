"use client";

import { X } from "lucide-react";

export default function ThemedModal({
  open,
  onClose,
  title = "Modal",
  subtitle = "",
  children,
  widthClass = "max-w-md",
  closeOnOverlay = true,
  footer = null,
}) {
  if (!open) return null;

  const handleOverlay = () => {
    if (closeOnOverlay && typeof onClose === "function") onClose();
  };

  return (
    <div className="fixed inset-0 z-[140]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]" onClick={handleOverlay} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div
          className={`w-full ${widthClass} overflow-hidden border font-mono shadow-2xl`}
          style={{
            borderColor: "color-mix(in srgb, var(--pm-fg) 22%, transparent)",
            background: "var(--pm-bg)",
            color: "var(--pm-fg)",
            boxShadow: "0 0 0 1px color-mix(in srgb, var(--pm-fg) 12%, transparent), 0 32px 80px rgba(0,0,0,.55)",
          }}
        >
          <div
            className="flex items-start justify-between gap-3 border-b px-4 py-3"
            style={{
              borderColor: "color-mix(in srgb, var(--pm-fg) 18%, transparent)",
              background: "color-mix(in srgb, var(--pm-fg) 8%, transparent)",
            }}
          >
            <div className="min-w-0">
              <div
                className="text-[10px] font-black uppercase tracking-[0.28em]"
                style={{ color: "color-mix(in srgb, var(--pm-fg) 72%, transparent)" }}
              >
                Custom Panel
              </div>
              <div className="mt-1 truncate text-[13px] font-black uppercase tracking-widest">{title}</div>
              {subtitle ? (
                <div className="mt-1 text-[11px] leading-5" style={{ color: "color-mix(in srgb, var(--pm-fg) 68%, transparent)" }}>
                  {subtitle}
                </div>
              ) : null}
            </div>
            {typeof onClose === "function" ? (
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 shrink-0 place-items-center border"
                style={{
                  borderColor: "color-mix(in srgb, var(--pm-fg) 20%, transparent)",
                  background: "color-mix(in srgb, var(--pm-fg) 9%, transparent)",
                  color: "var(--pm-fg)",
                }}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="p-4">{children}</div>
          {footer ? (
            <div
              className="border-t px-4 py-3"
              style={{
                borderColor: "color-mix(in srgb, var(--pm-fg) 18%, transparent)",
                background: "color-mix(in srgb, var(--pm-fg) 4%, transparent)",
              }}
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
