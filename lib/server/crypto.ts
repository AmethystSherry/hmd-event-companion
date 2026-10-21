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

// Token link tamu: 22 karakter base64url (~131 bit) diturunkan dari id tamu.
// Stabil selama secret sama (link WA tetap berlaku walau server restart), tapi tidak bisa ditebak.
export function guestToken(secret: string, guestId: string): string {
  return hmac(secret, `guest:${guestId}`).slice(0, 22);
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

// Kode pendek yang bisa dibaca manusia: HMD-014-7F3K (tanpa 0/O/1/I biar nggak salah baca).
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function shortCode(secret: string, ticketId: string, keyNo: number): string {
  const bytes = createHmac("sha256", secret).update(`code:${ticketId}`).digest();
  const tail = Array.from(bytes.subarray(0, 4), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `HMD-${String(keyNo).padStart(3, "0")}-${tail}`;
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
