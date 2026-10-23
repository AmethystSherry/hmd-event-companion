// Format tanggal & waktu WIB untuk UI. Jam 24 jam pakai titik (design.md §7).
const WIB = "Asia/Jakarta";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function parts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, dow };
}

// "2026-11-08" → "Minggu, 8 Nov 2026"
export function dateLong(date: string): string {
  const { y, m, d, dow } = parts(date);
  return `${DAYS[dow]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

// "2026-11-08" → "Minggu, 8 Nov"
export function dateMedium(date: string): string {
  const { m, d, dow } = parts(date);
  return `${DAYS[dow]}, ${d} ${MONTHS[m - 1]}`;
}

// "2026-11-08" → "Min, 8 Nov"
export function dateShort(date: string): string {
  const { m, d, dow } = parts(date);
  return `${DAYS_SHORT[dow]}, ${d} ${MONTHS[m - 1]}`;
}

// ISO → "20 Okt" (tanggal WIB)
export function dayMonth(iso: string): string {
  return dayMonthOf(wibDate(new Date(iso)));
}

function dayMonthOf(date: string): string {
  const { m, d } = parts(date);
  return `${d} ${MONTHS[m - 1]}`;
}

// Tanggal WIB "YYYY-MM-DD" dari sebuah waktu.
export function wibDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: WIB }).format(now);
}

// Geser tanggal "YYYY-MM-DD" sebanyak n hari.
export function addDays(date: string, n: number): string {
  const { y, m, d } = parts(date);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Selisih hari kalender WIB: positif = event masih di depan.
export function daysUntil(date: string, now: Date): number {
  const a = parts(wibDate(now));
  const b = parts(date);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

// Fase event di PE01/PE03: "Persiapan · H-17" · "Hari-H" · "Selesai".
export function eventPhase(
  date: string,
  now: Date,
): { label: string; tone: "crew" | "live" | "neutral" } {
  const n = daysUntil(date, now);
  if (n > 0) return { label: `Persiapan · H-${n}`, tone: "crew" };
  if (n === 0) return { label: "Hari-H", tone: "live" };
  return { label: "Selesai", tone: "neutral" };
}

// Waktu mulai event (pintu dibuka) sebagai Date: "2026-11-08" + "13.00" WIB.
export function eventStart(date: string, hhmm: string): Date {
  const [h, m] = hhmm.split(".").map(Number);
  return new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+07:00`);
}

// Countdown T03 "17 hari 4 jam" · T03h (< 2 hari) "18 jam 42 menit" · < 1 jam "42 menit".
export function countdownLabel(target: Date, now: Date): string {
  const totalMin = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 60_000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (totalMin >= 2 * 1440) return `${days} hari ${hours} jam`;
  const allHours = Math.floor(totalMin / 60);
  if (allHours > 0) return `${allHours} jam ${minutes} menit`;
  return `${minutes} menit`;
}

// ISO → jam WIB "13.04" (cap "MASUK 13.04", P06).
export function timeWib(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: WIB,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(":", ".");
}

// "13.00" + 60 → "14.00" (rundown). Menit dari tengah malam ↔ "HH.MM".
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(/[.:]/).map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}.${String(t % 60).padStart(2, "0")}`;
}

// Hitung mundur mm:ss (P01c "coba lagi 04:52").
export function mmss(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// Stopwatch sesi "00:12:34" (BP00) · "12:34" (rundown).
export function hms(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export function msLabel(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// WA disamarkan untuk P07d: 6285712342210 → "0857-xxxx-2210". Nomor penuh nggak ke HP panitia.
export function maskWa(wa: string | null): string | null {
  if (!wa) return null;
  const local = wa.startsWith("62") ? `0${wa.slice(2)}` : wa;
  if (local.length < 8) return "xxxx";
  return `${local.slice(0, 4)}-xxxx-${local.slice(-4)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function keyLabel(keyNo: number): string {
  return `#${String(keyNo).padStart(3, "0")}`;
}
