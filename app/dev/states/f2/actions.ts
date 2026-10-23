"use server";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { parseGuestCsv } from "@/lib/csv";
import { getStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { encodeFakeNow, FAKE_NOW_COOKIE } from "@/lib/server/clock";

// Dev saja: alat uji alur F2 di store lokal. Tidak tersedia di production.
function devOnly() {
  if (process.env.NODE_ENV === "production") throw new Error("Hanya untuk dev");
}

// Geser jam server (cookie, hanya browser ini). null = jam asli.
export async function setFakeNow(iso: string | null): Promise<void> {
  devOnly();
  const jar = await cookies();
  if (iso) jar.set(FAKE_NOW_COOKIE, encodeFakeNow(iso), { path: "/", sameSite: "lax" });
  else jar.delete(FAKE_NOW_COOKIE);
  refresh();
}

// Siapkan data uji: 20 tamu dummy (kalau belum ada), 12 hadir (dapat tiket), 1 "Nggak bisa".
export async function seedF2(): Promise<void> {
  devOnly();
  const store = await getStore();
  if (!store.getEvent(HMD_ID)?.csvImportedAt) {
    const csv = parseGuestCsv(
      readFileSync(join(process.cwd(), "public", "dev", "tamu-hmd-dummy.csv"), "utf8"),
    );
    if (csv.ok) store.importCsv(HMD_ID, "tamu-hmd-dummy.csv", csv.valid, null);
  }
  store.listGuests(HMD_ID).forEach((g, i) => {
    if (g.rsvp !== "belum" || i > 12) return;
    store.setRsvp(g.id, {
      rsvp: i === 12 ? "nggak" : "hadir",
      name: g.name,
      ig: g.ig,
      wa: g.wa ?? "6281234567890",
      followConfirmed: i !== 12,
    });
  });
  refresh();
}

// Semua tiket aktif lagi (check-in diulang dari nol).
export async function resetCheckIns(): Promise<void> {
  devOnly();
  const store = await getStore();
  for (const t of store.listTickets(HMD_ID)) if (t.opId) store.undoCheckIn(t.opId);
  refresh();
}
