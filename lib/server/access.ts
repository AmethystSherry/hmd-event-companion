import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getStore, type Guest } from "../data";
import { secrets } from "./config";
import { signSession, verifySession } from "./crypto";
import { createPinGate } from "./pinGate";

export const CREW_COOKIE = "hmd_crew";
const CREW_SESSION_MS = 24 * 60 * 60 * 1000; // 1 hari

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
  await connection();
  const value = (await cookies()).get(CREW_COOKIE)?.value;
  return verifySession(secrets().sessionSecret, value, Date.now());
}

// Guard halaman & server action panitia: belum masuk → P01.
export async function requireCrew(): Promise<void> {
  if (!(await isCrew())) redirect("/panitia");
}

// Guard tamu: hanya data milik pemilik token. Null → T01e "Link tidak valid".
export async function guestFromToken(token: string): Promise<Guest | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  return (await getStore()).getGuestByToken(token);
}
