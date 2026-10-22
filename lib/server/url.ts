import { headers } from "next/headers";

// Origin absolut untuk link yang dikirim ke luar (WA, .ics). APP_URL menang kalau diisi
// (production); kalau tidak, pakai host request (dev di laptop/LAN).
export async function appOrigin(): Promise<string> {
  const fixed = process.env.APP_URL?.replace(/\/+$/, "");
  if (fixed) return fixed;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "http");
  return `${proto}://${host}`;
}
