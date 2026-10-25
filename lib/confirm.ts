import { isValidIg, isValidWa, normalizeIg, normalizeWa } from "./csv";

// T02 konfirmasi: tipe & validasi bersama (form klien dan server action).
export type ConfirmInput = {
  rsvp: "hadir" | "nggak";
  name: string;
  ig: string;
  wa: string;
  job: string; // opsional, kartu kenalan hari-H (N3)
  interests: string; // opsional
  follow: boolean;
};

export const JOB_MAX = 40;
export const INTERESTS_MAX = 60;

export type ConfirmResult =
  { ok: true } | { ok: false; fields: Partial<Record<"name" | "ig" | "wa" | "follow", string>> };

export type ConfirmErrors = Partial<Record<"name" | "ig" | "wa" | "follow", string>>;

// Validasi T02c — sama dengan server (actions.ts). WA wajib untuk Hadir (pengingat H-1).
export function validateConfirm(
  v: Pick<ConfirmInput, "name" | "ig" | "wa" | "follow">,
): ConfirmErrors {
  const e: ConfirmErrors = {};
  const ig = normalizeIg(v.ig);
  const wa = normalizeWa(v.wa);
  if (!v.name.trim()) e.name = "Nama wajib diisi.";
  if (!ig) e.ig = "Instagram wajib diisi, biar teman gampang nyapa kamu.";
  else if (!isValidIg(ig)) e.ig = "Username IG-nya kayaknya kurang pas.";
  if (!wa) e.wa = "Nomor WhatsApp wajib diisi, buat kirim pengingat H-1.";
  else if (!isValidWa(wa)) e.wa = "Nomor WA-nya kurang pas, contoh 0812 3456 7890.";
  if (!v.follow) e.follow = "Wajib — follow dulu ya, ini syarat hadir";
  return e;
}

// T02b titip ucapan: batas huruf (form & server).
export const FAREWELL_MAX = 140;
