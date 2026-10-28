"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listQueued, removeQueued, type QueuedPhoto } from "@/lib/offline/photoDb";
import type { PhotoUploadResponse } from "@/lib/photo";

// N4 · kirim foto ke server + antrean offline (BT07b). Pola sama dengan useDoor (F2): coba lagi
// tiap 5 dtk & saat `online`; idempoten per id (kirim ulang aman, server nggak menggandakan).

const RETRY_MS = 5000;
// Sinyal jelek bisa bikin fetch nggantung lama; tanpa batas, pengurasan antrean ikut macet.
const DRAIN_TIMEOUT_MS = 30_000;

export type Sent = Extract<PhotoUploadResponse, { ok: true }>;
export type Rejected = Extract<PhotoUploadResponse, { ok: false }>;
export type SendResult =
  | { kind: "sent"; res: Sent }
  | { kind: "rejected"; res: Rejected }
  | { kind: "offline"; server?: boolean }; // server = sampai ke server tapi dijawab 5xx

// Satu kali kirim. Sinyal putus / timeout / server error → "offline" (tetap di antrean);
// ditolak (4xx: belum masuk, batas foto, acara ditutup) → dibuang dari antrean.
export async function sendPhoto(row: QueuedPhoto, timeoutMs?: number): Promise<SendResult> {
  const body = new FormData();
  body.set("id", row.id);
  body.set("width", String(row.width));
  body.set("height", String(row.height));
  body.set("photo", row.photo, "foto.jpg");
  body.set("thumb", row.thumb, "thumb.jpg");
  let res: Response;
  try {
    res = await fetch(`/api/t/${row.token}/foto`, {
      method: "POST",
      body,
      signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
    });
  } catch {
    return { kind: "offline" };
  }
  if (res.status >= 500) return { kind: "offline", server: true };
  const json = (await res.json().catch(() => null)) as PhotoUploadResponse | null;
  await removeQueued(row.id);
  if (res.ok && json?.ok) return { kind: "sent", res: json };
  return {
    kind: "rejected",
    res: json && !json.ok ? json : { ok: false, error: "Fotonya nggak bisa dikirim" },
  };
}

// Satu pengurasan antrean per tab (interval, `online`, tombol "Coba kirim sekarang" bisa bentrok).
let draining: Promise<SendResult[]> | null = null;

export function drainOutbox(token: string): Promise<SendResult[]> {
  draining ??= (async () => {
    const out: SendResult[] = [];
    try {
      for (const row of await listQueued(token)) {
        const r = await sendPhoto(row, DRAIN_TIMEOUT_MS);
        out.push(r);
        if (r.kind === "offline") break; // urutan dijaga; sisanya dicoba putaran berikutnya
      }
    } finally {
      draining = null;
    }
    return out;
  })();
  return draining;
}

export function usePhotoOutbox(
  token: string,
  { enabled = true, onResult }: { enabled?: boolean; onResult?: (r: SendResult) => void } = {},
) {
  // Isi antrean (Blob ikut) → jumlah BT07b + foto antre di Galeri BT07d.
  const [queued, setQueued] = useState<QueuedPhoto[]>([]);
  const resultRef = useRef(onResult);
  useEffect(() => {
    resultRef.current = onResult;
  });

  const refreshCount = useCallback(async () => {
    setQueued(await listQueued(token));
  }, [token]);

  const flush = useCallback(async () => {
    const results = await drainOutbox(token);
    for (const r of results) resultRef.current?.(r);
    await refreshCount();
    return results;
  }, [token, refreshCount]);

  useEffect(() => {
    if (!enabled) return;
    const kick = () => void flush();
    // Antrean dari kunjungan sebelumnya langsung dicoba saat layar dibuka.
    const first = setTimeout(kick, 0);
    const t = setInterval(kick, RETRY_MS);
    window.addEventListener("online", kick);
    return () => {
      clearTimeout(first);
      clearInterval(t);
      window.removeEventListener("online", kick);
    };
  }, [enabled, flush]);

  return { pending: queued.length, queued, flush, refreshCount };
}
