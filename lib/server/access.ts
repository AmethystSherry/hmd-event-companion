import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStore, type Guest } from "../data";
import { secrets } from "./config";
import { signSession, verifySession } from "./crypto";
import { createPinGate } from "./pinGate";

export const CREW_COOKIE = "hmd_crew";
const CREW_SESSION_MS = 24 * 60 * 60 * 1000; // 1 hari; cukup untuk persiapan & hari-H

const g = globalThis as typeof globalThis & { __hmdPinGate?: ReturnType<typeof createPinGate> };
export const pinGate = () => (g.__hmdPinGate ??= createPinGate());

// Kunci rate-limit: IP klien (di belakang proxy Vercel lewat x-forwarded-for).
export async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function startCrewSession(): Promise<void> {
  const exp = Date.now() + CREW_SESSION_MS;
  (await cookies()).set(CREW_COOKIE, signSession(secrets().sessionSecret, exp), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CREW_SESSION_MS / 1000,
  });
}

export async function endCrewSession(): Promise<void> {
  (await cookies()).delete(CREW_COOKIE);
}

export async function isCrew(): Promise<boolean> {
  const value = (await cookies()).get(CREW_COOKIE)?.value;
  return verifySession(secrets().sessionSecret, value, Date.now());
}

// Guard halaman panitia: belum masuk → P01 dengan `next` kembali ke halaman ini.
export async function requireCrew(path: string): Promise<void> {
  if (!(await isCrew())) redirect(`/panitia?next=${encodeURIComponent(path)}`);
}

// Hanya izinkan kembali ke halaman panitia (cegah open redirect).
export function safeNext(next: string | string[] | undefined, fallback = "/panitia/tamu"): string {
  const v = Array.isArray(next) ? next[0] : next;
  return v && /^\/panitia(\/[\w\-/]*)?(\?[\w=&-]*)?$/.test(v) ? v : fallback;
}

// Guard tamu: hanya data milik pemilik token. Null → layar T01e "Link tidak valid".
export async function guestFromToken(token: string): Promise<Guest | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  return (await getStore()).getGuestByToken(token);
}
