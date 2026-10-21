import { safeEqual } from "./crypto";

// Rate-limit PIN panitia (P01b/P01c): 5 salah → kunci 5 menit. Per kunci klien (IP).
// In-memory: cukup untuk 1 server; dengan DB asli nanti dipindah ke tabel.
export type PinResult =
  | { kind: "ok" }
  | { kind: "wrong"; remaining: number }
  | { kind: "locked"; retryAfterMs: number }
  | { kind: "disabled" }; // EVENT_PIN belum diisi

export const MAX_ATTEMPTS = 5;
export const LOCK_MS = 5 * 60 * 1000;

type Entry = { fails: number; lockedUntil: number };

export function createPinGate(opts: { now?: () => number } = {}) {
  const now = opts.now ?? Date.now;
  const entries = new Map<string, Entry>();

  return {
    attempt(clientKey: string, pin: string, expected: string | null): PinResult {
      if (!expected) return { kind: "disabled" };
      const t = now();
      const e = entries.get(clientKey) ?? { fails: 0, lockedUntil: 0 };
      if (e.lockedUntil > t) return { kind: "locked", retryAfterMs: e.lockedUntil - t };
      if (e.lockedUntil && e.lockedUntil <= t) {
        e.fails = 0;
        e.lockedUntil = 0;
      }
      if (safeEqual(pin.trim(), expected)) {
        entries.delete(clientKey);
        return { kind: "ok" };
      }
      e.fails += 1;
      if (e.fails >= MAX_ATTEMPTS) {
        e.lockedUntil = t + LOCK_MS;
        entries.set(clientKey, e);
        return { kind: "locked", retryAfterMs: LOCK_MS };
      }
      entries.set(clientKey, e);
      return { kind: "wrong", remaining: MAX_ATTEMPTS - e.fails };
    },
  };
}
