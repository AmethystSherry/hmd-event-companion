// N4 · logika foto kolase tanpa secret/DOM — dipakai di HP (kompres, kemiringan) dan server
// (validasi upload). Bagian canvas ada di components/n4/capture.ts.

export const PHOTO_RATIO = 5 / 6; // viewfinder 300×360 (lebar/tinggi)
export const PHOTO_LONG_SIDE = 1280;
export const THUMB_LONG_SIDE = 320;
export const MAX_PHOTO_BYTES = 400 * 1024; // prd §7 N4
export const MAX_THUMB_BYTES = 40 * 1024;
// Batas di server sedikit longgar (header JPEG, pembulatan) tapi jauh di bawah 4,5 MB Vercel.
export const SERVER_MAX_PHOTO_BYTES = 480 * 1024;
export const SERVER_MAX_THUMB_BYTES = 80 * 1024;
// Kualitas JPEG dicoba berurutan sampai ≤ batas; habis → gambar diperkecil lalu ulang.
export const JPEG_QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.5];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isPhotoId = (id: string) => UUID.test(id);

// UUID v4 di HP. `crypto.randomUUID` cuma ada di HTTPS; getRandomValues ada di http LAN juga.
export function newPhotoId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type Rect = { x: number; y: number; w: number; h: number };

// Potongan tengah rasio 5:6 dari frame kamera — sama dengan yang terlihat di viewfinder
// (`object-fit: cover`, posisi tengah).
export function centerCrop(srcW: number, srcH: number, ratio = PHOTO_RATIO): Rect {
  if (srcW / srcH > ratio) {
    const w = Math.round(srcH * ratio);
    return { x: Math.round((srcW - w) / 2), y: 0, w, h: srcH };
  }
  const h = Math.round(srcW / ratio);
  return { x: 0, y: Math.round((srcH - h) / 2), w: srcW, h };
}

// Ukuran hasil: sisi panjang ≤ `longSide`, nggak pernah diperbesar.
export function fitSize(w: number, h: number, longSide: number): { w: number; h: number } {
  const scale = Math.min(1, longSide / Math.max(w, h));
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

// JPEG selalu diawali FF D8 FF.
export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

// Kemiringan polaroid acak ±4° (design.md §6), tapi tetap sama tiap kali foto yang sama tampil.
export function photoTilt(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const t = ((Math.abs(h) % 81) - 40) / 10; // -4.0 … 4.0
  return t === 0 ? 2 : t;
}

// Tanggal di caption polaroid: "2026-11-08" → "8.11.26".
export function polaroidDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${d}.${m}.${String(y).slice(-2)}`;
}

// Webview Instagram / Facebook: getUserMedia sering nggak jalan (terutama iOS) dan nggak punya
// address bar → pakai kamera bawaan HP lewat <input capture>.
export function isInAppBrowser(ua: string): boolean {
  return /Instagram|FBAN|FBAV|FB_IAB/i.test(ua);
}

// URL gambar lewat proxy (cek akses di server). Id unik → aman di-cache selamanya.
export function guestPhotoUrl(token: string, id: string, variant: "full" | "thumb" = "thumb") {
  return `/api/t/${token}/foto/${id}${variant === "thumb" ? "?v=thumb" : ""}`;
}

export function crewPhotoUrl(id: string, variant: "full" | "thumb" = "thumb") {
  return `/api/panitia/foto/${id}${variant === "thumb" ? "?v=thumb" : ""}`;
}

// Respons upload (BT07) & ringkasan kolase untuk layar tamu.
export type PhotoUploadResponse =
  | { ok: true; id: string; total: number; others: number; latest: string[]; mine: number }
  | { ok: false; error: string; code?: "foto-penuh" | "acara-ditutup" | "belum-masuk" };
