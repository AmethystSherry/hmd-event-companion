"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const POLL_MS = 4000;

// Realtime ringan: dengarkan /api/live (SSE). Tiap `rev` store naik → router.refresh() supaya
// server component memuat data terbaru tanpa reload (mis. jawaban tamu masuk ke P04).
// Cadangan: refresh juga saat tab kembali terlihat atau sinyal kembali (koneksi SSE bisa putus di
// HP yang tidur / offline) — mis. tiket tamu yang discan saat HP-nya offline langsung sobek.
// Kalau SSE belum mengirim apa pun setelah POLL_MS (proxy menahan stream, mis. Cloudflare quick
// tunnel), tanya `rev` lewat ?once=1 tiap POLL_MS.
export function LiveRefresh({ token }: { token?: string }) {
  const router = useRouter();
  const last = useRef<number | null>(null);

  useEffect(() => {
    const url = token ? `/api/live?t=${encodeURIComponent(token)}` : "/api/live";
    let sseAlive = false;
    const onRev = (rev: number) => {
      if (!Number.isFinite(rev)) return;
      if (last.current !== null && rev > last.current) router.refresh();
      last.current = rev;
    };

    const es = new EventSource(url);
    es.onmessage = (e) => {
      sseAlive = true;
      onRev(Number(e.data));
    };

    const poll = setInterval(async () => {
      if (sseAlive || document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`${url}${token ? "&" : "?"}once=1`, { cache: "no-store" });
        if (res.ok) onRev(Number(await res.text()));
      } catch {}
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const onOnline = () => router.refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      es.close();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [router, token]);

  return null;
}
