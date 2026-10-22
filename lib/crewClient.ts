"use client";

import type { CheckInView } from "./server/checkin";

// Id acak per HP panitia (localStorage) untuk catatan "dicek oleh"; bukan data pribadi.
export function deviceId(): string {
  try {
    let id = localStorage.getItem("hmd_device");
    if (!id) {
      id = `hp-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("hmd_device", id);
    }
    return id;
  } catch {
    return "hp-anon";
  }
}

export type CheckInResponse = CheckInView | { error: string };

// POST check-in. Lempar error kalau jaringan gagal (dipakai untuk antrean offline di P07).
export async function postCheckIn(
  body: { qr: string } | { guestId: string },
  path = "/api/panitia/checkin",
): Promise<CheckInResponse> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-device": deviceId() },
    body: JSON.stringify(body),
  });
  return (await res.json()) as CheckInResponse;
}

// Haptic + bunyi pendek saat valid (prd.md F2). Diam-diam gagal kalau tidak didukung.
export function feedback(kind: "valid" | "warn") {
  try {
    navigator.vibrate?.(kind === "valid" ? 40 : [30, 60, 30]);
  } catch {}
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = kind === "valid" ? 880 : 330;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
    osc.onended = () => void ctx.close();
  } catch {}
}
