import { Funnel_Display, Manrope, Sora, Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ClientShell from "@/components/ClientShell";

const funnelDisplay = Funnel_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-funnel-display",
});

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });

const themeBootScript = `(function(){try{var themeKey="pm_theme_bw_v8";var fontKey="pm_font_bw_v1";var themes={ice:{a:"#dbeafe",b:"#bfdbfe",fg:"#111827"},storm:{a:"#0b1120",b:"#172554",fg:"#eff6ff"},midnight:{a:"#030712",b:"#111827",fg:"#e5e7eb"},violet:{a:"#1e1b4b",b:"#312e81",fg:"#eef2ff"},slate:{a:"#0f172a",b:"#1e293b",fg:"#f8fafc"}};var fonts={funnel:'var(--font-funnel-display)',manrope:'var(--font-manrope)',sora:'var(--font-sora)',space:'var(--font-space-grotesk)',jakarta:'var(--font-plus-jakarta)'};var id=(localStorage.getItem(themeKey)||'midnight').toLowerCase();if(id==='black')id='midnight';var t=themes[id]||themes.midnight;var f=localStorage.getItem(fontKey)||'funnel';var s=document.documentElement.style;s.setProperty('--pm-bg',t.a);s.setProperty('--pm-accent',t.a);s.setProperty('--pm-a',t.a);s.setProperty('--pm-b',t.b);s.setProperty('--pm-fg',t.fg);s.setProperty('--pm-bg-grad','linear-gradient(135deg,'+t.a+','+t.b+')');s.setProperty('--pm-font',fonts[f]||fonts.funnel);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${funnelDisplay.variable} ${manrope.variable} ${sora.variable} ${spaceGrotesk.variable} ${plusJakarta.variable} antialiased`}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
