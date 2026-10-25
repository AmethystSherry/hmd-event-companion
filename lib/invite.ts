// Template pesan undangan (DM IG) & pengingat H-1 (WA) — copy persis Figma P04 / P04b.
// Variabel: {nama} {link}. Panitia mengirim manual (prd.md F1: tanpa API IG/WA).
export const DEFAULT_DM_TEMPLATE =
  "Halo {nama}! Potara pindah rumah dan kami pengin kamu datang. Minggu, 8 Nov, 13.00. Konfirmasi di sini ya: {link}";

export const REMINDER_TEMPLATE =
  "Halo {nama}! Besok kita pindahan. Pintu dibuka 13.00 di kantor baru Potara. Tiketmu ada di sini, tunjukkan ke panitia ya: {link}";

export const POTARA_IG = "potarastudio";

export function fillTemplate(template: string, vars: { nama: string; link: string }): string {
  return template.replaceAll("{nama}", vars.nama).replaceAll("{link}", vars.link);
}

// DM IG: coba app dulu (ig.me), kalau gagal browser tetap ke profil instagram.com/{ig}.
export function igDmUrl(ig: string): string {
  return `https://ig.me/m/${encodeURIComponent(ig)}`;
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

// T01 "4 bagian acara": judul sesi digabung " · "; Talkshow yang punya pembicara ditulis
// "Talkshow bareng {pembicara}".
export function rundownLine(
  sessions: { title: string; type: string; speaker?: { name: string } | null }[],
): string {
  return sessions
    .map((s) =>
      s.type === "talkshow" && s.speaker?.name ? `Talkshow bareng ${s.speaker.name}` : s.title,
    )
    .join(" · ");
}
