"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// Realtime ringan: dengarkan /api/live (SSE). Tiap `rev` store naik → router.refresh() supaya
// server component memuat data terbaru tanpa reload (mis. jawaban tamu masuk ke P04).
// Cadangan: refresh juga saat tab kembali terlihat (koneksi SSE bisa putus di HP yang tidur).
export function LiveRefresh({ token }: { token?: string }) {
  const router = useRouter();
  const last = useRef<number | null>(null);

  useEffect(() => {
    const es = new EventSource(token ? `/api/live?t=${encodeURIComponent(token)}` : "/api/live");
    es.onmessage = (e) => {
      const rev = Number(e.data);
      if (last.current !== null && rev > last.current) router.refresh();
      last.current = rev;
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      es.close();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, token]);

  return null;
}
