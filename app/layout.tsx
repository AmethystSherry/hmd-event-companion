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
  themeColor: "#F3F2F0",
};

// Selalu light (bukan ikut setting sistem): `data-theme="light"` di html mengalahkan
// `prefers-color-scheme: dark` di tokens.css. Token dark tetap ada untuk `data-theme="dark"`
// per elemen (mis. pratinjau /dev/ui).
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-theme="light" className={`${switzer.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
