"use client";

import { useMemo } from "react";
import { Funnel_Display } from "next/font/google";
import { Users, MessageCircle, Code2, ShieldCheck, TrendingUp, Megaphone, Briefcase } from "lucide-react";

const funnelDisplay = Funnel_Display({ subsets: ["latin"], weight: ["400", "700"] });

const groups = [
  { title: "মেসেজ ও কাস্টমার সাপোর্ট টিম", count: 3, icon: MessageCircle, desc: "এই টিমের সদস্যরা user message, live support এবং সাধারণ জিজ্ঞাসার দ্রুত উত্তর দেওয়ার কাজ করে।" },
  { title: "ওয়েবসাইট আপডেট ও ডেভেলপার টিম", count: 4, icon: Code2, desc: "এই টিম feature update, bug fix, security improvement, server flow এবং website maintenance-এর দায়িত্বে থাকে।" },
  { title: "এজেন্ট টিম", count: 6, icon: ShieldCheck, desc: "এই টিম deposit ও withdraw processing, verification এবং user transaction support-এর কাজ সারাক্ষণ মনিটর করে।" },
  { title: "ইনভেস্ট ও মার্কেট অপারেশন টিম", count: 5, icon: TrendingUp, desc: "এই টিম market analysis, Binance training strategy, capital movement planning এবং return optimization নিয়ে কাজ করে।" },
  { title: "মার্কেটিং টিম", count: 3, icon: Megaphone, desc: "এই টিম platform promotion, campaign, user reach এবং brand communication-এর দায়িত্ব পালন করে।" },
  { title: "অপারেশন, মনিটরিং ও সাপোর্ট ব্যাকআপ", count: 7, icon: Briefcase, desc: "এই সদস্যরা admin supervision, internal checking, reporting, compliance support এবং daily workflow balance রাখে।" },
];

function usePM() {
  return useMemo(() => ({
    fg: "var(--pm-fg)", fg70: "color-mix(in srgb, var(--pm-fg) 70%, transparent)", b20: "color-mix(in srgb, var(--pm-fg) 20%, transparent)", b28: "color-mix(in srgb, var(--pm-fg) 28%, transparent)", bg06: "color-mix(in srgb, var(--pm-fg) 6%, transparent)", bg08: "color-mix(in srgb, var(--pm-fg) 8%, transparent)", bg10: "color-mix(in srgb, var(--pm-fg) 10%, transparent)",
  }), []);
}

export default function UserAboutPage() {
  const pm = usePM();
  const total = groups.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className={`${funnelDisplay.className} min-h-screen px-4 py-6 pt-16 md:pt-6`} style={{ background: "var(--pm-bg-grad)", color: pm.fg }}>
      <div className="mx-auto max-w-6xl space-y-3 font-mono">
        <div className="border p-4" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase" style={{ color: pm.fg70 }}>About</div>
              <div className="mt-1 text-lg font-black tracking-widest uppercase">আমরা কীভাবে আয় করি এবং আমাদের টিম কীভাবে কাজ করে</div>
              <div className="mt-2 text-[11px] leading-6" style={{ color: pm.fg70 }}>আমাদের পুরো সিস্টেমটি পরিচালনা হয় একটি বড় সমন্বিত টিমের মাধ্যমে। মোট ২৮ জনের টিমের মধ্যে সরাসরি core operation-এ ২১ জন নিয়মিত কাজ করে এবং বাকি সদস্যরা backup support, monitoring, reporting ও internal supervision সামলায়।</div>
            </div>
            <span className="grid h-12 w-12 place-items-center border" style={{ borderColor: pm.b28, background: pm.bg10 }}><Users className="h-6 w-6" /></span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="border p-4" style={{ borderColor: pm.b28, background: pm.bg06 }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="grid h-12 w-12 place-items-center border" style={{ borderColor: pm.b20, background: pm.bg10 }}><Icon className="h-5 w-5" /></div>
                  <div className="border px-3 py-1 text-xs font-black tracking-widest uppercase" style={{ borderColor: pm.b20, background: pm.bg10 }}>{item.count} People</div>
                </div>
                <div className="mt-3 text-sm font-black tracking-widest uppercase">{item.title}</div>
                <div className="mt-2 text-sm leading-6" style={{ color: pm.fg70 }}>{item.desc}</div>
              </div>
            );
          })}
        </div>

        <div className="border p-4" style={{ borderColor: pm.b28, background: pm.bg06 }}>
          <div className="text-sm font-black tracking-widest uppercase">আমাদের আয় ও কাজের সংক্ষিপ্ত ব্যাখ্যা</div>
          <div className="mt-3 space-y-3 text-sm leading-7" style={{ color: pm.fg70 }}>
            <p>আমাদের প্ল্যাটফর্মে deposit, withdraw, live support, referral, notice, tutorial, team operation এবং account monitoring—সবকিছু আলাদা আলাদা দায়িত্বে ভাগ করে পরিচালনা করা হয়। user-রা platform ব্যবহার করে deposit, withdraw ও referral activity চালায়, আর আমাদের টিম transaction flow, market work, support এবং technical maintenance সামলায়।</p>
            <p>আমাদের বিনিয়োগ ও market operation টিম capital management, market research, Binance training strategy এবং বিভিন্ন trading/market channel বিশ্লেষণ করে আয় তৈরির কাজ করে। সেই সাথে agent team deposit ও withdraw-এর service continuity বজায় রাখে, যাতে user-দের কাজ smooth থাকে।</p>
            <p>marketing team নতুন user acquisition, campaign এবং platform awareness-এর জন্য কাজ করে। developer team নিয়মিত feature update, security enhancement, bug fix এবং performance optimization সামলায়। support team user-এর প্রশ্ন, message, notice এবং guidance-এর কাজ করে।</p>
            <p>আপনি উপরের team visual থেকে দেখতে পাচ্ছেন—৩ + ৪ + ৬ + ৫ + ৩ + ৭ = মোট {total} জন সদস্য মিলে পুরো system-এর operation balance রাখে। এর মধ্যে ২১ জন core working members এবং ৭ জন backup/monitoring support সদস্য হিসেবে কাজ করছে, তাই আমরা মোট ২৮ জনের coordinated team হিসেবে সেবা দিতে পারি।</p>
          </div>
        </div>
      </div>
    </div>
  );
}
