import { isStoreError, type StoreError } from "../data";
import { kenalanMessage, type KenalanError } from "../kenalan";
import { secrets } from "./config";
import { signKenalan, verifyKenalan, type KenalanCodeResult } from "./crypto";

// N5 · kode QR kenalan di server (secret nggak pernah ke HP). Isi QR BTk2 = kenalanCode(guestId).
export const kenalanCode = (guestId: string) => signKenalan(secrets().ticketSecret, guestId);

export const parseKenalanCode = (text: string): KenalanCodeResult =>
  verifyKenalan(secrets().ticketSecret, text);

// StoreError dari aturan kenalan → kode error + pesan + status HTTP buat route handler.
const STATUS: Partial<Record<KenalanError, number>> = {
  "qr-tiket": 400,
  "qr-asing": 400,
  "qr-sendiri": 400,
  "foto-rusak": 400,
  "belum-check-in": 403,
  "teman-belum-check-in": 409,
  "udah-kenalan": 409,
  "belum-mulai": 409,
  "papan-dikunci": 409,
  "acara-selesai": 409,
  "data-dihapus": 410,
  kebanyakan: 429,
  link: 404,
};

export function kenalanFail(
  error: KenalanError,
  ctx: { friendFirstName?: string; at?: string } = {},
) {
  return {
    status: STATUS[error] ?? 409,
    body: { ok: false as const, error, message: kenalanMessage(error, ctx) },
  };
}

// null = bukan error aturan kenalan (lempar ulang).
export function kenalanStoreFail(err: unknown) {
  if (!isStoreError(err)) return null;
  const e = err as StoreError;
  const first = e.meta?.name?.trim().split(/\s+/)[0];
  const map: Partial<Record<StoreError["code"], KenalanError>> = {
    "qr-sendiri": "qr-sendiri",
    "udah-kenalan": "udah-kenalan",
    "belum-mulai": "belum-mulai",
    "papan-dikunci": "papan-dikunci",
    "acara-ditutup": "acara-selesai",
    "data-dihapus": "data-dihapus",
    "tamu-tidak-ada": "qr-asing",
    "isian-tidak-valid": "qr-asing",
  };
  const code: KenalanError | undefined =
    e.code === "belum-masuk"
      ? e.meta?.who === "owner"
        ? "teman-belum-check-in"
        : "belum-check-in"
      : map[e.code];
  if (!code) return null;
  return kenalanFail(code, { friendFirstName: first, at: e.meta?.at });
}
