import type { DataStore } from "@/lib/data/store";
import type { Introduction } from "@/lib/data/types";
import { pairOf } from "@/lib/kenalan";

// N5 · data contoh papan kenalan sesuai Figma: Dimas 12 · Sekar 7 · Rara 4 (#3) · sisanya ≤ 2 →
// 23 pasang. Dipakai alat uji (/dev/states/n5 "23 kenalan dummy") & pratinjau layar.
const pairsWith = (first: string, others: string[]): [string, string][] =>
  others.map((x) => [first, x]);

export const KENALAN_DUMMY: [string, string][] = [
  ...pairsWith("Dimas", [
    "Sekar",
    "Rara",
    "Laras",
    "Yoga",
    "Bima",
    "Nadia",
    "Fajar",
    "Citra",
    "Galih",
    "Intan",
    "Raka",
    "Sari",
  ]),
  ...pairsWith("Sekar", ["Rara", "Laras", "Yoga", "Bima", "Nadia", "Fajar"]),
  ...pairsWith("Rara", ["Tegar", "Ayu"]),
  ["Hendra", "Putri"],
  ["Arif", "Tegar"],
  ["Galih", "Hendra"],
];

export const byFirst = (store: DataStore, eventId: string, first: string) =>
  store.listGuests(eventId).find((g) => g.name.split(/\s+/)[0] === first);

// Kenalan contoh (yang kedua di pasangan = pemindai), 3 menit sekali sampai `endMs`.
export function kenalanDummy(
  store: DataStore,
  eventId: string,
  endMs: number,
  ids: string[],
): Introduction[] {
  return KENALAN_DUMMY.flatMap(([x, y], n) => {
    const gx = byFirst(store, eventId, x);
    const gy = byFirst(store, eventId, y);
    if (!gx || !gy) return [];
    const [a, b] = pairOf(gx.id, gy.id);
    const createdAt = new Date(endMs - (KENALAN_DUMMY.length - n) * 3 * 60_000).toISOString();
    return [{ id: ids[n], eventId, a, b, scannerId: gy.id, createdAt }];
  });
}
