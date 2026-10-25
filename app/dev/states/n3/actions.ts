"use server";

import { refresh } from "next/cache";
import { mutateStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { serverNow } from "@/lib/server/clock";
import { demoCard } from "./cards";

// Dev saja: alat uji N3 di store lokal. Tidak tersedia di production.
function devOnly() {
  if (process.env.NODE_ENV === "production") throw new Error("Hanya untuk dev");
}

// Kartu dummy semua tamu (lewat saveGuestCard kalau boleh, jadi job/interests T02 ikut sinkron).
export async function devSeedCards(): Promise<void> {
  devOnly();
  await mutateStore((store) => {
    store.listGuests(HMD_ID).forEach((g, i) => {
      const card = demoCard(g.name, i);
      try {
        store.saveGuestCard(g.id, card);
      } catch {
        store.setGuestCard(g.id, card); // belum RSVP / acara ditutup: data uji apa adanya
      }
    });
  });
  refresh();
}

// "Kosongkan kartu saya": kartu tamu yang namanya diawali Rara (pemilik HP di Figma) → T11e.
export async function devClearMyCard(): Promise<void> {
  devOnly();
  await mutateStore((store) => {
    const me = store.listGuests(HMD_ID).find((g) => g.name.startsWith("Rara"));
    if (!me) return;
    // job & interests kosong → kartu ikut kosong (setRsvp mengisi card dari isian T02).
    store.setRsvp(me.id, {
      rsvp: me.rsvp === "belum" ? "hadir" : me.rsvp,
      name: me.name,
      ig: me.ig,
      wa: me.wa,
      followConfirmed: me.followConfirmed,
      job: null,
      interests: null,
    });
  });
  refresh();
}

// BT05c: semua tamu RSVP hadir, cuma Rara & Bima yang udah check-in.
export async function devOnlyTwoHere(): Promise<void> {
  devOnly();
  const at = (await serverNow()).toISOString();
  await mutateStore((store) => {
    for (const t of store.listTickets(HMD_ID)) if (t.opId) store.undoCheckIn(t.opId);
    const two = store.listGuests(HMD_ID).filter((g) => /^(Rara|Bima)\b/.test(g.name));
    two.forEach((g, i) => {
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
        { opId: `n3-${Date.now()}-${i}`, method: "manual", by: "HP LAIN", at },
      );
    });
  });
  refresh();
}

// Reset: kartu semua tamu dihapus (BT05 balik baca isian T02).
export async function devResetCards(): Promise<void> {
  devOnly();
  await mutateStore((store) => {
    store.listGuests(HMD_ID).forEach((g) => store.setGuestCard(g.id, null));
  });
  refresh();
}
