"use server";

import { getStore } from "@/lib/data";
import { guestFromToken } from "@/lib/server/access";

// BT08: kirim pertanyaan ke pembicara (hanya saat sesi talkshow sedang berjalan).
// Pengelompokan Claude (P10) & layar BT09 dibangun di N1.
export async function askQuestion(
  token: string,
  text: string,
): Promise<{ ok: true } | { ok: false; reason: "empty" | "closed" | "error" }> {
  const clean = text.trim();
  if (!clean) return { ok: false, reason: "empty" };
  try {
    const guest = await guestFromToken(token);
    if (!guest) return { ok: false, reason: "error" };
    const store = await getStore();
    const snap = await store.getSnapshot();
    const active = snap.sessions.find((s) => s.id === snap.event.activeSession);
    if (snap.event.mode !== "sesi" || active?.type !== "talkshow")
      return { ok: false, reason: "closed" };
    await store.addQuestion({
      guestId: guest.id,
      sessionId: active.id,
      text: clean,
      anonymous: false,
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}
