import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./styles/base.css";
import "./styles/hero.css";
import "./styles/calendar.css";
import "./styles/verdict.css";
import "./styles/evidence.css";
import "./styles/agent.css";

const sans = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Quiet Week — should you move your launch?",
  description:
    "Quiet Week measures whether the big release next to yours shares your players, using Qloo audience affinity, and finds the quiet weeks for your indie game launch.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#eef0f3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
