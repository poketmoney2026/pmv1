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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${funnelDisplay.variable} ${manrope.variable} ${sora.variable} ${spaceGrotesk.variable} ${plusJakarta.variable} antialiased`}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
