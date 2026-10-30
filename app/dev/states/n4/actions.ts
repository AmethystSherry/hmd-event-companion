"use server";

import { rm } from "node:fs/promises";
import { join } from "node:path";
import { refresh } from "next/cache";
import { getStore, mutateStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { newPhotoId } from "@/lib/photo";
import { serverNow } from "@/lib/server/clock";
import { putPhotoFile } from "@/lib/server/photos";

// Dev saja: alat uji N4 di store lokal. Tidak tersedia di production.
function devOnly() {
  if (process.env.NODE_ENV === "production") throw new Error("Hanya untuk dev");
}

// Semua tamu bertiket langsung "Udah masuk" (supaya link tamu bisa buka kamera kolase).
export async function checkInAll(): Promise<void> {
  devOnly();
  const at = (await serverNow()).toISOString();
  await mutateStore((store) => {
    for (const t of store.listTickets(HMD_ID)) {
      if (t.status === "dipakai") continue;
      store.checkIn(
        HMD_ID,
        { ticketId: t.ticketId },
        { opId: `dev-${t.ticketId}`, method: "manual", by: "Dev", at },
      );
    }
  });
  refresh();
}

// Warna foto contoh (mirip placeholder Figma: oranye, gelap, krem).
const COLORS = [
  { r: 255, g: 122, b: 26 },
  { r: 52, g: 48, b: 44 },
  { r: 221, g: 210, b: 192 },
  { r: 246, g: 168, b: 54 },
  { r: 120, g: 98, b: 80 },
];

// 30 foto dummy dari tamu bertiket (JPEG warna polos dibuat pakai sharp, ikut Next).
export async function seedPhotos(): Promise<void> {
  devOnly();
  const { default: sharp } = await import("sharp");
  const at = (await serverNow()).getTime();
  const plan = (await getStore()).listTickets(HMD_ID).map((t) => t.guestId);
  if (!plan.length) return;
  const made: { id: string; guestId: string; at: string }[] = [];
  for (let i = 0; i < 30; i++) {
    const id = newPhotoId();
    const color = COLORS[i % COLORS.length];
    const make = (w: number, h: number) =>
      sharp({ create: { width: w, height: h, channels: 3, background: color } })
        .jpeg({ quality: 70 })
        .toBuffer();
    await putPhotoFile(HMD_ID, id, "full", new Uint8Array(await make(500, 600)));
    await putPhotoFile(HMD_ID, id, "thumb", new Uint8Array(await make(267, 320)));
    made.push({
      id,
      guestId: plan[i % plan.length],
      at: new Date(at - (30 - i) * 60_000).toISOString(),
    });
  }
  await mutateStore((store) => {
    for (const p of made) {
      store.addPhoto({ ...p, width: 500, height: 600, bytes: 20_000 });
    }
  });
  refresh();
}

// Semua foto dihapus (metadata + file lokal .data/photos).
export async function resetPhotos(): Promise<void> {
  devOnly();
  await mutateStore((store) => store.reset({ ...store.snapshot(), photos: [] }));
  await rm(join(process.cwd(), ".data", "photos"), { recursive: true, force: true });
  refresh();
}
