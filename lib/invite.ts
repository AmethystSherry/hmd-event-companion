import { EVENT } from "./event";

// Template pesan undangan & pengingat — copy persis Figma P04 / P04b. Variabel: {nama} {link}.
// Panitia mengirim manual lewat wa.me / DM IG (prd.md F1: tanpa API WA).
export const INVITE_TEMPLATE =
  "Halo {nama}! Potara pindah rumah dan kami pengin kamu datang. Minggu, 8 Nov, 13.00. Konfirmasi di sini ya: {link}";

export const REMINDER_TEMPLATE =
  "Halo {nama}! Besok kita pindahan. Pintu dibuka 13.00 di kantor baru Potara. Tiketmu ada di sini, tunjukkan ke panitia ya: {link}";

export function fillTemplate(template: string, vars: { nama: string; link: string }): string {
  return template.replaceAll("{nama}", vars.nama).replaceAll("{link}", vars.link);
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

// https://wa.me/<62…>?text=… — membuka WhatsApp dengan pesan terisi.
export function waLink(wa: string, message: string): string {
  return `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
}

// Countdown H-1 (T04): hari / jam / menit menuju pintu dibuka. Tidak pernah negatif.
export function countdownTo(target: string, now: Date) {
  const ms = Math.max(0, new Date(target).getTime() - now.getTime());
  const totalMin = Math.floor(ms / 60_000);
  return {
    days: Math.floor(totalMin / (60 * 24)),
    hours: Math.floor((totalMin % (60 * 24)) / 60),
    minutes: totalMin % 60,
    done: ms === 0,
  };
}

export const EVENT_START = EVENT.startsAt;
