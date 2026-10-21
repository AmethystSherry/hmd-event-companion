import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Switzer (Fontshare, Free Font License) — self-host, variable 100–900.
const switzer = localFont({
  src: "./fonts/Switzer-Variable.woff2",
  weight: "100 900",
  variable: "--font-switzer",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "House Moving Day · Potara Studio",
  description: "Pendamping acara House Moving Day Potara Studio.",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F2F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0B" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${switzer.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
