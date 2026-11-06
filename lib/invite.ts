// Template pesan undangan (DM IG) & pengingat H-1 (WA) — copy persis Figma P04 / P04b.
// Variabel: {nama} {link}. Panitia mengirim manual (prd.md F1: tanpa API IG/WA).
export const DEFAULT_DM_TEMPLATE = [
  "Halo, {nama}!",
  "Kali ini, Potara x Inipagi akan menghadirkan kegiatan seru yang nggak boleh kamu lewatkan di House Moving Day Potara Studio! Nantinya, kamu bisa menikmati sesi talkshow yang insightful, ikut berbagai aktivitas seru, dan tentunya spend some good time bersama teman-teman lainnya!",
  "Yuk, siapkan diri kamu untuk jadi bagian dari momen spesial ini di Potara New Office pada:",
  "Minggu, 8 November 2026",
  "Pukul 10.00 WIB",
  "Jangan lupa konfirmasi kehadiranmu di sini ya:",
  "{link}",
  "See You at Our New Space!",
].join("\n");

// Default lama yang tersimpan di event yang dibuat sebelum template diganti (6 Nov) → dibaca
// sebagai default baru, supaya event yang udah ada ikut pakai teks baru tanpa migrasi data.
const LEGACY_DM_TEMPLATES = [
  "Halo {nama}! Potara pindah rumah dan kami pengin kamu datang. Minggu, 8 Nov, 13.00. Konfirmasi di sini ya: {link}",
];

export function eventDmTemplate(stored: string): string {
  return LEGACY_DM_TEMPLATES.includes(stored) ? DEFAULT_DM_TEMPLATE : stored;
}

export const REMINDER_TEMPLATE =
  "Halo {nama}! Besok kita pindahan. Pintu dibuka 13.00 di kantor baru Potara. Tiketmu ada di sini, tunjukkan ke panitia ya: {link}";

export const POTARA_IG = "potarastudio";

export function fillTemplate(template: string, vars: { nama: string; link: string }): string {
  return template.replaceAll("{nama}", vars.nama).replaceAll("{link}", vars.link);
}

// DM IG: coba app dulu (ig.me), kalau gagal browser tetap ke profil instagram.com/{ig}.
// `text` = isi chat. `?text=` nggak didokumentasikan Meta: sebagian versi app IG mengisinya,
// sisanya chat kosong → pesan tetap disalin ke clipboard sebagai cadangan (P04 ✈).
export function igDmUrl(ig: string, text?: string): string {
  const url = `https://ig.me/m/${encodeURIComponent(ig)}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}

export function igProfileUrl(ig: string): string {
  return `https://instagram.com/${encodeURIComponent(ig)}`;
}

// https://wa.me/<62…>?text=… — membuka WhatsApp dengan pesan terisi.
export function waLink(wa: string, message: string): string {
  return `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
}

// Link tamu. `dari=wa` → T03h (dibuka dari pengingat H-1).
export function guestLink(origin: string, token: string, fromWa = false): string {
  return `${origin}/t/${token}${fromWa ? "?dari=wa" : ""}`;
}

// T01 grid "{n} bagian acara": semua sesi urut jam mulai, nomor 2 digit, jam, nama sesi lengkap
// (tanpa pembicara; nama panjang dipotong 2 baris di UI).
export function rundownTiles(
  sessions: { title: string; startsAt: string }[],
): { no: string; time: string; name: string }[] {
  return [...sessions]
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((s, i) => ({ no: String(i + 1).padStart(2, "0"), time: s.startsAt, name: s.title }));
}
