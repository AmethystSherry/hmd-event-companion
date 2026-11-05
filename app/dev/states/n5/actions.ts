"use server";

import { refresh } from "next/cache";
import { getStore, mutateStore, type DataStore, type Guest } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { kenalanFileId, pairOf } from "@/lib/kenalan";
import { newPhotoId } from "@/lib/photo";
import { serverNow } from "@/lib/server/clock";
import { deletePhotoFiles, putPhotoFile } from "@/lib/server/photos";

// Dev saja: alat uji N5 Kenalan & hadiah di store lokal. Tidak tersedia di production.
function devOnly() {
  if (process.env.NODE_ENV === "production") throw new Error("Hanya untuk dev");
}

const byFirst = (store: DataStore, first: string): Guest | undefined =>
  store.listGuests(HMD_ID).find((g) => g.name.split(/\s+/)[0] === first);

// Tamu ini hadir + udah check-in (data uji apa adanya, pola /dev/states/n3).
function ensureInside(store: DataStore, g: Guest, at: string, i: number) {
  if (store.ticketFor(g.id)?.status === "dipakai") return;
  if (g.rsvp !== "hadir") {
    store.setRsvp(g.id, {
      rsvp: "hadir",
      name: g.name,
      ig: g.ig,
      wa: g.wa ?? "6281234567890",
      followConfirmed: true,
    });
  }
  store.checkIn(
    HMD_ID,
    { guestId: g.id },
    { opId: `n5-${Date.now()}-${i}`, method: "manual", by: "HP LAIN", at },
  );
}

const COLORS = [
  { r: 255, g: 122, b: 26 },
  { r: 52, g: 48, b: 44 },
  { r: 221, g: 210, b: 192 },
  { r: 120, g: 98, b: 80 },
];

// Selfie placeholder: JPEG warna polos (sharp ikut Next), rasio 5:6 seperti kamera N4.
async function putPlaceholder(id: string, n: number) {
  const { default: sharp } = await import("sharp");
  const background = COLORS[n % COLORS.length];
  const make = (w: number, h: number) =>
    sharp({ create: { width: w, height: h, channels: 3, background } })
      .jpeg({ quality: 70 })
      .toBuffer();
  await putPhotoFile(HMD_ID, kenalanFileId(id), "full", new Uint8Array(await make(500, 600)));
  await putPhotoFile(HMD_ID, kenalanFileId(id), "thumb", new Uint8Array(await make(267, 320)));
}

const pairsWith = (first: string, others: string[]): [string, string][] =>
  others.map((x) => [first, x]);

// Data Figma: Dimas 12 · Sekar 7 · Rara 4 (#3) · sisanya ≤ 2 → 23 pasang kenalan.
const DUMMY: [string, string][] = [
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
  ["Arif", "Maya"],
  ["Kevin", "Hendra"],
];

// "23 kenalan dummy": event dimulai, tamu yang terlibat check-in, kenalan lama dihapus dulu.
export async function devSeedKenalan(): Promise<void> {
  devOnly();
  const now = await serverNow();
  const at = now.toISOString();
  const plan = DUMMY.map(() => newPhotoId());
  for (const [n, id] of plan.entries()) await putPlaceholder(id, n);
  const stale = await mutateStore((store) => {
    const old = store.resetKenalan(HMD_ID);
    store.startEvent(HMD_ID, at);
    const list = DUMMY.flatMap(([x, y], n) => {
      const gx = byFirst(store, x);
      const gy = byFirst(store, y);
      if (!gx || !gy) return [];
      ensureInside(store, gx, at, n * 2);
      ensureInside(store, gy, at, n * 2 + 1);
      const [a, b] = pairOf(gx.id, gy.id);
      const createdAt = new Date(now.getTime() - (DUMMY.length - n) * 3 * 60_000).toISOString();
      return [{ id: plan[n], eventId: HMD_ID, a, b, scannerId: gy.id, createdAt }];
    });
    store.seedIntroductions(list);
    return old;
  });
  await Promise.all(stale.map((id) => deletePhotoFiles(HMD_ID, id).catch(() => {})));
  refresh();
}

// "HP lain scan QR Rara": tamu acak yang udah masuk & belum kenal Rara jadi pemindai (aturan
// kenalan asli lewat addIntroduction) → HP Rara di tab QR saya pindah ke BTk4.
export async function devScanRara(): Promise<void> {
  devOnly();
  const id = newPhotoId();
  const at = (await serverNow()).toISOString();
  const store = await getStore();
  const rara = byFirst(store, "Rara");
  if (!rara) return;
  const known = new Set(
    store
      .listIntroductions(HMD_ID)
      .filter((i) => i.a === rara.id || i.b === rara.id)
      .flatMap((i) => [i.a, i.b]),
  );
  const pool = store
    .listGuests(HMD_ID)
    .filter(
      (g) => g.id !== rara.id && !known.has(g.id) && store.ticketFor(g.id)?.status === "dipakai",
    );
  const scanner = pool[Math.floor(Math.random() * pool.length)];
  if (!scanner) return;
  await putPlaceholder(id, known.size);
  try {
    await mutateStore((s) => s.addIntroduction(scanner.id, rara.id, { id }, at));
  } catch (err) {
    await deletePhotoFiles(HMD_ID, kenalanFileId(id)).catch(() => {});
    console.warn("[dev n5] scan Rara gagal:", (err as Error).message);
  }
  refresh();
}

export async function devAnnounce(): Promise<void> {
  devOnly();
  const at = (await serverNow()).toISOString();
  try {
    await mutateStore((store) => store.announceKenalanWinner(HMD_ID, at, "HP LAIN"));
  } catch (err) {
    console.warn("[dev n5] umumkan gagal:", (err as Error).message);
  }
  refresh();
}

// Semua kenalan + pemenang dihapus (file selfie lokal ikut).
export async function devResetKenalan(): Promise<void> {
  devOnly();
  const ids = await mutateStore((store) => store.resetKenalan(HMD_ID));
  await Promise.all(ids.map((id) => deletePhotoFiles(HMD_ID, id).catch(() => {})));
  refresh();
}
