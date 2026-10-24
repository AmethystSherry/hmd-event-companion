"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { mutateStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { serverNow } from "@/lib/server/clock";
import { refreshSummary } from "@/lib/server/feedback";

// Dev saja: alat uji alur F5 di store lokal. Tidak tersedia di production.
function devOnly() {
  if (process.env.NODE_ENV === "production") throw new Error("Hanya untuk dev");
}

// Semua sesi dimulai lalu diselesaikan berurutan (BP04 "Jeda terakhir").
export async function devFinishAllSessions(): Promise<void> {
  devOnly();
  const at = (await serverNow()).toISOString();
  await mutateStore((store) => {
    if (store.getEvent(HMD_ID)?.mode === "closed") return;
    for (const s of store.listSessions(HMD_ID)) {
      if (s.status === "selesai") continue;
      store.startSession(HMD_ID, s.id, at);
      store.finishSession(HMD_ID, s.id, at);
    }
  });
  refresh();
}

export async function devCloseEvent(): Promise<void> {
  devOnly();
  const at = (await serverNow()).toISOString();
  await mutateStore((store) => store.closeEvent(HMD_ID, at));
  refresh();
}

// "Buka lagi (dev)": nggak ada tombolnya di UI panitia.
export async function devReopenEvent(): Promise<void> {
  devOnly();
  const at = (await serverNow()).toISOString();
  await mutateStore((store) => store.reopenEvent(HMD_ID, at));
  refresh();
}

const IMPROVE = [
  "Parkir motornya agak sempit, mungkin bisa kasih info parkir alternatif.",
  "Talkshow-nya kependekan, pengen sesi tanya jawab lebih lama.",
  "AC di ruang depan kurang dingin pas rame.",
  null,
  "Rundown di layar telat update pas pindah sesi.",
  null,
  "Snack-nya cepet abis, tambahin dikit lagi.",
  "Tur kantornya seru, tapi rombongannya kebesaran.",
];

// 15 tamu dummy: RSVP hadir + check-in (kalau belum), semua sesi selesai, acara ditutup, lalu
// isi buku tamu yang belum ada. Isian deterministik supaya rekap gampang dicek.
export async function devSeedFeedback(): Promise<void> {
  devOnly();
  const now = (await serverNow()).getTime();
  const iso = (min: number) => new Date(now - min * 60_000).toISOString();
  await mutateStore((store) => {
    const guests = store.listGuests(HMD_ID).slice(0, 15);
    for (const g of guests) {
      if (g.rsvp !== "hadir") {
        store.setRsvp(g.id, {
          rsvp: "hadir",
          name: g.name,
          ig: g.ig,
          wa: g.wa ?? "6281234567890",
          followConfirmed: true,
        });
      }
      const t = store.ticketFor(g.id);
      if (t && t.status !== "dipakai") {
        store.checkIn(
          HMD_ID,
          { ticketId: t.ticketId },
          { opId: `dev-${t.ticketId}`, method: "manual", by: "Dev", at: iso(240) },
        );
      }
    }
    const event = store.getEvent(HMD_ID)!;
    if (event.mode !== "closed") {
      for (const s of store.listSessions(HMD_ID)) {
        if (s.status === "selesai") continue;
        store.startSession(HMD_ID, s.id, iso(30));
        store.finishSession(HMD_ID, s.id, iso(30));
      }
      store.closeEvent(HMD_ID, iso(20));
    }
    const sessions = store.listSessions(HMD_ID);
    guests.forEach((g, i) => {
      if (store.feedbackFor(g.id)) return;
      store.addFeedback(
        g.id,
        {
          id: randomUUID(),
          rating: [5, 4, 5, 3, 5, 4, 4, 5][i % 8],
          highlightSessionId: sessions[[1, 1, 2, 0, 1, 3, 2][i % 7]]?.id ?? null,
          improve: IMPROVE[i % IMPROVE.length],
          inviteAgain: i % 5 === 4 ? null : i % 6 !== 5,
        },
        iso(15 - i),
      );
    });
  });
  refresh();
}

// Semua isian buku tamu + ringkasan dihapus (acara tetap ditutup).
export async function devResetFeedback(): Promise<void> {
  devOnly();
  await mutateStore((store) => {
    const data = store.snapshot();
    store.reset({
      ...data,
      feedback: [],
      events: data.events.map((e) => (e.id === HMD_ID ? { ...e, summary: null } : e)),
    });
  });
  refresh();
}

// Paksa buat ringkasan Claude sekarang (sama dengan "Coba lagi" di P11b).
export async function devRefreshSummary(): Promise<void> {
  devOnly();
  await refreshSummary(HMD_ID, true);
  refresh();
}
