"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const POLL_MS = 4000;
const FAILS_OFFLINE = 2; // S01: gagal 2× berturut = sinyal lemah

// Realtime ringan: dengarkan /api/live (SSE). Tiap `rev` store naik → router.refresh() supaya
// server component memuat data terbaru tanpa reload (mis. jawaban tamu masuk ke P04).
// Cadangan: refresh juga saat tab kembali terlihat atau sinyal kembali (koneksi SSE bisa putus di
// HP yang tidur / offline) — mis. tiket tamu yang discan saat HP-nya offline langsung sobek.
// Kalau SSE belum mengirim apa pun setelah `pollMs` (proxy menahan stream, mis. Cloudflare quick
// tunnel, atau Supabase yang menjawab 204), tanya `rev` lewat ?once=1 tiap `pollMs` (F3/F4: 2 dtk
// di layar acara & Kontrol acara supaya pindah mode ≤ 3 dtk).
// `onHealth` (S01): false saat `navigator.onLine` false atau SSE/poll gagal 2× berturut, true lagi
// begitu ada jawaban server.
export function LiveRefresh({
  token,
  pollMs = POLL_MS,
  onHealth,
}: {
  token?: string;
  pollMs?: number;
  onHealth?: (ok: boolean) => void;
}) {
  const router = useRouter();
  const last = useRef<number | null>(null);
  const health = useRef(onHealth);
  useEffect(() => {
    health.current = onHealth;
  });

  useEffect(() => {
    const url = token ? `/api/live?t=${encodeURIComponent(token)}` : "/api/live";
    let sseAlive = false;
    let fails = 0;
    const ok = () => {
      fails = 0;
      health.current?.(true);
    };
    const fail = () => {
      fails += 1;
      if (fails >= FAILS_OFFLINE) health.current?.(false);
    };
    const onRev = (rev: number) => {
      if (!Number.isFinite(rev)) return;
      ok();
      if (last.current !== null && rev > last.current) router.refresh();
      last.current = rev;
    };

    const es = new EventSource(url);
    es.onmessage = (e) => {
      sseAlive = true;
      onRev(Number(e.data));
    };
    es.onerror = () => {
      sseAlive = false;
      fail();
    };

    const check = async () => {
      try {
        const res = await fetch(`${url}${token ? "&" : "?"}once=1`, { cache: "no-store" });
        if (res.ok) onRev(Number(await res.text()));
        else fail();
      } catch {
        fail();
      }
    };
    const poll = setInterval(() => {
      if (!sseAlive && document.visibilityState === "visible") void check();
    }, pollMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const onOnline = () => {
      router.refresh();
      void check(); // SSE yang masih nyambung nggak mengirim apa-apa kalau rev tetap
    };
    const onOffline = () => health.current?.(false);
    if (!navigator.onLine) health.current?.(false);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      es.close();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [router, token, pollMs]);

  return null;
}
