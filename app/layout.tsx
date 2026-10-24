import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./styles/base.css";
import "./styles/home.css";
import "./styles/tool.css";
import "./styles/result.css";
import "./styles/sources.css";

const sans = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Quiet Week — find a quiet week to launch your indie game",
  description:
    "Quiet Week measures whether the big games and films around your launch share your players, using Qloo audience data, and finds the quiet weeks for your indie game launch.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
