"use server";

import { refresh } from "next/cache";
import { mutateStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { serverNow } from "@/lib/server/clock";

// Dev saja: alat uji F3 + F4 di store lokal. Tidak tersedia di production.
function devOnly() {
  if (process.env.NODE_ENV === "production") throw new Error("Hanya untuk dev");
}

// "HP lain": aksi Kontrol acara atas nama label HP lain → HP panitia yang lagi buka Kontrol dapat
// toast BP02d.
const OTHER_HP = "HP LAIN";

// Mulai sesi berikutnya (yang belum selesai) / selesaikan sesi yang jalan, atas nama HP lain.
export async function devStartNext(): Promise<void> {
  devOnly();
  const at = (await serverNow()).toISOString();
  await mutateStore((store) => {
    const e = store.getEvent(HMD_ID);
    const list = store.listSessions(HMD_ID);
    const next =
      list.find((s) => s.id === e?.nextSessionId) ?? list.find((s) => s.status !== "selesai");
    if (next) store.startSession(HMD_ID, next.id, at, OTHER_HP);
  });
  refresh();
}

export async function devFinishActive(): Promise<void> {
  devOnly();
  const at = (await serverNow()).toISOString();
  await mutateStore((store) => {
    const active = store.listSessions(HMD_ID).find((s) => s.status === "berlangsung");
    if (active) store.finishSession(HMD_ID, active.id, at, OTHER_HP);
  });
  refresh();
}
