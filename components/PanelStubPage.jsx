
"use client";

import Link from "next/link";
import { Funnel_Display } from "next/font/google";
import { ArrowRight } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

export default function PanelStubPage({ panel = "PANEL", title = "Static Page", subtitle = "", bullets = [], links = [] }) {
  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 font-mono pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: "var(--pm-fg)" }}>
      <div className="mx-auto w-full max-w-md space-y-3">
        <section className="border p-4" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--pm-fg) 16%, transparent)" }}>
          <div className="text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>{panel}</div>
          <h1 className="mt-2 text-lg font-black tracking-widest uppercase">{title}</h1>
          <p className="mt-2 text-[12px] leading-6" style={{ color: "color-mix(in srgb, var(--pm-fg) 82%, transparent)" }}>{subtitle}</p>
        </section>

        <section className="border p-4" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--pm-fg) 16%, transparent)" }}>
          <div className="mb-3 text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>Current Status</div>
          <ul className="space-y-2 text-[12px] leading-6">
            {bullets.map((item, idx) => (
              <li key={idx} className="border px-3 py-2" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 18%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 4%, transparent)" }}>
                {idx + 1}. {item}
              </li>
            ))}
          </ul>
        </section>

        {links.length ? (
          <section className="border p-4" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--pm-fg) 16%, transparent)" }}>
            <div className="mb-3 text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: "color-mix(in srgb, var(--pm-fg) 70%, transparent)" }}>Quick Links</div>
            <div className="space-y-2">
              {links.map((item, idx) => (
                <Link key={idx} href={item.href} className="flex items-center justify-between border px-3 py-3 text-sm font-black" style={{ borderColor: "color-mix(in srgb, var(--pm-fg) 18%, transparent)", background: "color-mix(in srgb, var(--pm-fg) 4%, transparent)" }}>
                  <span>{item.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
