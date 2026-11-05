import { createHmac, timingSafeEqual } from "node:crypto";

// Semua tanda tangan pakai HMAC-SHA256, output base64url.
export function hmac(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// ---- Tiket ----
// Isi QR = "<ticketId>.<sig>" — tanpa data pribadi (prd.md F2).
const SIG_LEN = 16;

export function signTicket(secret: string, ticketId: string): string {
  return `${ticketId}.${hmac(secret, `ticket:${ticketId}`).slice(0, SIG_LEN)}`;
}

// Mengembalikan ticketId kalau tanda tangan cocok, null kalau palsu/acak.
export function verifyTicket(secret: string, payload: string): string | null {
  const raw = payload.trim();
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const ticketId = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = hmac(secret, `ticket:${ticketId}`).slice(0, SIG_LEN);
  return safeEqual(sig, expected) ? ticketId : null;
}

// ---- Sesi panitia ----
// Cookie stateless: "<role>.<expiresMs>.<sig>". Tidak butuh tabel sesi (cocok untuk serverless).
export function signSession(secret: string, expiresAt: number): string {
  const body = `crew.${expiresAt}`;
  return `${body}.${hmac(secret, `session:${body}`)}`;
}

export function verifySession(secret: string, value: string | undefined, now: number): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== "crew") return false;
  const body = `${parts[0]}.${parts[1]}`;
  if (!safeEqual(parts[2], hmac(secret, `session:${body}`))) return false;
  const exp = Number(parts[1]);
  return Number.isFinite(exp) && exp > now;
}

// ---- N5 · QR kenalan ----
// Isi QR = "k1.<guestId>.<sig>" — bukan token link tamu (akses penuh) dan bukan QR tiket. Label
// HMAC beda dari tiket, jadi QR tiket nggak bisa dipakai kenalan & sebaliknya.
const KENALAN_PREFIX = "k1";
const KENALAN_SIG_LEN = 12;

export function signKenalan(secret: string, guestId: string): string {
  const sig = hmac(secret, `kenalan:${guestId}`).slice(0, KENALAN_SIG_LEN);
  return `${KENALAN_PREFIX}.${guestId}.${sig}`;
}

export type KenalanCodeResult =
  { ok: true; guestId: string } | { ok: false; reason: "qr-tiket" | "qr-asing" };

// Hasil scan BTk1 → guestId pemilik QR. QR tiket & teks lain ditolak dengan alasan beda supaya
// layar scan bisa kasih pesan yang pas.
export function verifyKenalan(secret: string, text: string): KenalanCodeResult {
  const raw = text.trim();
  const parts = raw.split(".");
  if (parts.length === 3 && parts[0] === KENALAN_PREFIX && parts[1]) {
    const expected = hmac(secret, `kenalan:${parts[1]}`).slice(0, KENALAN_SIG_LEN);
    if (safeEqual(parts[2], expected)) return { ok: true, guestId: parts[1] };
    return { ok: false, reason: "qr-asing" };
  }
  if (verifyTicket(secret, raw)) return { ok: false, reason: "qr-tiket" };
  return { ok: false, reason: "qr-asing" };
}
