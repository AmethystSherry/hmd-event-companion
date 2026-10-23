import { isValidIg, normalizeIg } from "./csv";
import type { CheckInMethod, CheckInResult, Rsvp } from "./data/types";

// F2 · logika pintu yang jalan di HP panitia (tanpa secret, tanpa Next) supaya scan & Cari nama
// tetap bisa dipakai offline. Server tetap memutuskan akhirnya (tanda tangan QR + siapa duluan).
//
// Manifest = daftar tamu event + ticketId + status, diunduh setelah PIN (/api/panitia/event/
// [id]/manifest) dan disimpan di IndexedDB. QR berisi "<ticketId>.<sig>": HP panitia cukup
// mencocokkan ticketId (UUID acak, tidak bisa ditebak) dengan manifest — QR palsu tidak pernah
// ada di daftar. Tanda tangan dicek server saat sinkron.

export type DoorGuest = {
  id: string;
  name: string;
  ig: string;
  keyNo: number;
  rsvp: Rsvp;
  source: "csv" | "manual" | "walkin";
  ticketId: string | null;
  shortCode: string | null;
  status: "aktif" | "dipakai";
  checkedInAt: string | null;
  guestNo: number | null;
  method: CheckInMethod | null;
  opId: string | null; // op yang membuat check-in (untuk Batalkan)
  pending?: boolean; // masih di antrean HP ini, belum sampai server
  // P07d Profil tamu (opsional: manifest lama di IndexedDB tetap terbaca). WA sudah disamarkan
  // di server ("0857-xxxx-2210") — nomor penuh nggak pernah sampai ke HP panitia.
  waMasked?: string | null;
  inviteStatus?: "belum" | "diundang";
  invitedAt?: string | null;
  respondedAt?: string | null;
};

export type DoorManifest = { eventId: string; rev: number; guests: DoorGuest[] };

// Antrean di HP panitia (IndexedDB), dikirim berurutan ke /api/panitia/checkin.
export type DoorOp =
  | { opId: string; kind: "scan"; payload: string; at: string }
  | { opId: string; kind: "manual"; guestId: string; at: string }
  | { opId: string; kind: "walkin"; name: string; ig: string; at: string }
  | { opId: string; kind: "undo"; target: string; at: string };

export type DoorOpResult = CheckInResult | { kind: "dibatalkan" };

export type CheckInRequest = { eventId: string; by: string; ops: DoorOp[] };
export type CheckInResponse = {
  rev: number;
  results: Array<{ opId: string; result: DoorOpResult }>;
};

const SIG_LEN = 16;

// "<ticketId>.<sig>" → ticketId. Bentuk lain (URL, teks acak) → null = "Tidak dikenal".
export function ticketIdFromPayload(payload: string): string | null {
  const raw = payload.trim();
  const dot = raw.lastIndexOf(".");
  if (dot <= 0 || raw.length - dot - 1 !== SIG_LEN) return null;
  return raw.slice(0, dot);
}

export function doorCounts(guests: DoorGuest[]) {
  return {
    checkedIn: guests.filter((g) => g.status === "dipakai").length,
    expected: guests.filter((g) => g.rsvp === "hadir" || g.status === "dipakai").length,
    total: guests.length,
  };
}

function markIn(guests: DoorGuest[], g: DoorGuest, op: DoorOp, method: CheckInMethod) {
  if (g.status === "dipakai") return;
  const guestNo = doorCounts(guests).checkedIn + 1;
  Object.assign(g, {
    status: "dipakai",
    rsvp: "hadir",
    checkedInAt: op.at,
    guestNo,
    method,
    opId: op.opId,
    pending: true,
  } satisfies Partial<DoorGuest>);
}

// Tampilan lokal = manifest terakhir + op yang belum terkirim (urutan antrean).
export function applyOps(manifest: DoorGuest[], ops: DoorOp[]): DoorGuest[] {
  const guests = manifest.map((g) => ({ ...g }));
  for (const op of ops) {
    if (op.kind === "scan") {
      const id = ticketIdFromPayload(op.payload);
      const g = id ? guests.find((x) => x.ticketId === id) : undefined;
      if (g) markIn(guests, g, op, "scan");
    } else if (op.kind === "manual") {
      const g = guests.find((x) => x.id === op.guestId);
      if (g) markIn(guests, g, op, "manual");
    } else if (op.kind === "walkin") {
      if (guests.some((x) => x.opId === op.opId)) continue;
      const g: DoorGuest = {
        id: `walkin-${op.opId}`,
        name: op.name,
        ig: op.ig,
        keyNo: guests.reduce((m, x) => Math.max(m, x.keyNo), 0) + 1,
        rsvp: "hadir",
        source: "walkin",
        ticketId: null,
        shortCode: null,
        status: "aktif",
        checkedInAt: null,
        guestNo: null,
        method: null,
        opId: null,
      };
      guests.push(g);
      markIn(guests, g, op, "manual");
    } else {
      const i = guests.findIndex((x) => x.opId === op.target && x.status === "dipakai");
      if (i < 0) continue;
      if (guests[i].id.startsWith("walkin-")) {
        guests.splice(i, 1);
        continue;
      }
      Object.assign(guests[i], {
        status: "aktif",
        checkedInAt: null,
        guestNo: null,
        method: null,
        opId: null,
        pending: true,
      } satisfies Partial<DoorGuest>);
    }
  }
  return guests;
}

// Validasi lokal hasil scan (dipakai saat offline / server lambat).
export function validateLocally(guests: DoorGuest[], payload: string, at: string): CheckInResult {
  const id = ticketIdFromPayload(payload);
  const g = id ? guests.find((x) => x.ticketId === id) : undefined;
  if (!g) return { kind: "tidak-dikenal" };
  if (g.status === "dipakai") {
    return {
      kind: "sudah-dipakai",
      guestId: g.id,
      at: g.checkedInAt ?? at,
      method: g.method ?? "scan",
    };
  }
  return { kind: "valid", guestId: g.id, guestNo: doorCounts(guests).checkedIn + 1, at };
}

export type DoorFilter = "semua" | "belum" | "udah";

// P07 · cari nama, @instagram, atau kode pendek (HMD-014-7F3K).
export function searchGuests(guests: DoorGuest[], query: string, filter: DoorFilter): DoorGuest[] {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  return guests
    .filter((g) => filter === "semua" || (filter === "udah") === (g.status === "dipakai"))
    .filter(
      (g) =>
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.ig.includes(q) ||
        (g.shortCode?.toLowerCase().includes(q) ?? false),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

// P07c · validasi form walk-in (sama di HP & server). IG opsional.
export function cleanWalkIn(
  input: { name: string; ig: string },
  existing: DoorGuest[] = [],
): { ok: true; name: string; ig: string } | { ok: false; field: "name" | "ig"; error: string } {
  const name = input.name.trim().replace(/\s+/g, " ").slice(0, 60);
  const ig = normalizeIg(input.ig);
  if (!name) return { ok: false, field: "name", error: "Nama wajib diisi." };
  if (ig && !isValidIg(ig))
    return { ok: false, field: "ig", error: "Format username IG belum pas." };
  if (ig && existing.some((g) => g.ig === ig))
    return {
      ok: false,
      field: "ig",
      error: "Username IG ini udah ada di daftar. Cari namanya aja.",
    };
  return { ok: true, name, ig };
}
