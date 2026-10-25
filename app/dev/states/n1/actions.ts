"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { mutateStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { TANYA_FAIL_COOKIE, talkshowFor } from "@/lib/questions";
import { rundownView } from "@/lib/rundown";
import { serverNow } from "@/lib/server/clock";
import { demoQuestions } from "./questions";

// Dev saja: alat uji N1 di store lokal. Tidak tersedia di production.
function devOnly() {
  if (process.env.NODE_ENV === "production") throw new Error("Hanya untuk dev");
}

// Mulai Talkshow atas nama "HP LAIN" (sesi lain yang jalan ikut selesai).
export async function devStartTalkshow(): Promise<void> {
  devOnly();
  const at = (await serverNow()).toISOString();
  await mutateStore((store) => {
    const talk = store.listSessions(HMD_ID).find((s) => s.type === "talkshow");
    if (talk) store.startSession(HMD_ID, talk.id, at, "HP LAIN");
  });
  refresh();
}

// 23 pertanyaan dummy (2 udah dijawab) dari tamu yang udah masuk, menggantikan yang lama.
export async function devSeedQuestions(): Promise<void> {
  devOnly();
  const now = await serverNow();
  await mutateStore((store) => {
    const event = store.getEvent(HMD_ID)!;
    const talk = talkshowFor(rundownView(event, store.listSessions(HMD_ID)).sessions);
    const inside = store
      .listGuests(HMD_ID)
      .filter((g) => store.ticketFor(g.id)?.status === "dipakai");
    if (!talk || !inside.length) return;
    store.clearQuestions(HMD_ID);
    const start = new Date(now.getTime() - 26 * 60_000).toISOString();
    store.seedQuestions(demoQuestions(HMD_ID, talk.id, inside, start));
  });
  refresh();
}

export async function devClearQuestions(): Promise<void> {
  devOnly();
  await mutateStore((store) => store.clearQuestions(HMD_ID));
  refresh();
}

// Simulasi gagal kirim (browser ini): API tanya tetap menyimpan, tapi menjawab 503 → HP tamu
// dapat BT08b; "Kirim lagi" setelah dimatikan membuktikan nggak dobel (clientId sama).
export async function devSetTanyaFail(on: boolean): Promise<void> {
  devOnly();
  const jar = await cookies();
  if (on) jar.set(TANYA_FAIL_COOKIE, "1", { path: "/", sameSite: "lax" });
  else jar.delete(TANYA_FAIL_COOKIE);
  refresh();
}
