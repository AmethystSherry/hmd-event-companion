import { cookies } from "next/headers";
import { daysUntil } from "../format";

// Jam server F2. Hari-H mulai 00.00 WIB di tanggal event (keputusan 22 Okt): tamu T03 → T05,
// panitia PE03b → BP02. Untuk uji coba (dev saja) jam bisa digeser lewat cookie `hmd_now`
// (dipasang dari /dev/states/f2) atau env HMD_FAKE_NOW. Waktu tetap berjalan dari titik itu.
export const FAKE_NOW_COOKIE = "hmd_now";

// Nilai cookie: "<iso palsu>|<ms asli saat dipasang>".
export function encodeFakeNow(fakeIso: string, realMs = Date.now()): string {
  return `${fakeIso}|${realMs}`;
}

export function decodeFakeNow(value: string | undefined, realMs = Date.now()): Date | null {
  if (!value) return null;
  const [iso, setAt] = value.split("|");
  const base = new Date(iso);
  if (Number.isNaN(base.getTime())) return null;
  const since = Number(setAt);
  return new Date(base.getTime() + (Number.isFinite(since) ? Math.max(0, realMs - since) : 0));
}

export async function serverNow(): Promise<Date> {
  if (process.env.NODE_ENV !== "production") {
    const fake =
      decodeFakeNow((await cookies()).get(FAKE_NOW_COOKIE)?.value) ??
      decodeFakeNow(process.env.HMD_FAKE_NOW);
    if (fake) return fake;
  }
  return new Date();
}

// Hari-H dan sesudahnya (sampai link kedaluwarsa H+30) = mode hari-H.
export function isEventDay(date: string, now: Date): boolean {
  return daysUntil(date, now) <= 0;
}
