import { safeEqual } from "./crypto";

// Rate-limit PIN panitia (P01b/P01c): 5 salah → kunci 5 menit. Per kunci klien (IP).
// In-memory untuk lokal; di Vercel (banyak instance) dicatat di tabel Supabase lewat pinStep.
export type PinResult =
  | { kind: "ok" }
  | { kind: "wrong"; remaining: number }
  | { kind: "locked"; retryAfterMs: number }
  | { kind: "disabled" }; // EVENT_PIN belum diisi

export const MAX_ATTEMPTS = 5;
export const LOCK_MS = 5 * 60 * 1000;

export type PinEntry = { fails: number; lockedUntil: number };

// Satu percobaan, murni: entry lama → hasil + entry baru (null = hapus / tidak ada yang dicatat).
// Dipakai versi in-memory di bawah dan versi Supabase (access.ts) supaya aturannya sama persis.
export function pinStep(
  prev: PinEntry | null,
  pin: string,
  expected: string | null,
  t: number,
): { result: PinResult; entry: PinEntry | null } {
  if (!expected) return { result: { kind: "disabled" }, entry: prev };
  const e = { ...(prev ?? { fails: 0, lockedUntil: 0 }) };
  if (e.lockedUntil > t) {
    return { result: { kind: "locked", retryAfterMs: e.lockedUntil - t }, entry: e };
  }
  if (e.lockedUntil && e.lockedUntil <= t) {
    e.fails = 0;
    e.lockedUntil = 0;
  }
  if (safeEqual(pin.trim(), expected)) return { result: { kind: "ok" }, entry: null };
  e.fails += 1;
  if (e.fails >= MAX_ATTEMPTS) {
    e.lockedUntil = t + LOCK_MS;
    return { result: { kind: "locked", retryAfterMs: LOCK_MS }, entry: e };
  }
  return { result: { kind: "wrong", remaining: MAX_ATTEMPTS - e.fails }, entry: e };
}

export function createPinGate(opts: { now?: () => number } = {}) {
  const now = opts.now ?? Date.now;
  const entries = new Map<string, PinEntry>();

  return {
    attempt(clientKey: string, pin: string, expected: string | null): PinResult {
      const { result, entry } = pinStep(entries.get(clientKey) ?? null, pin, expected, now());
      if (entry) entries.set(clientKey, entry);
      else entries.delete(clientKey);
      return result;
    },
  };
}
