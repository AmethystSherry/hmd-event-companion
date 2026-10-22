"use client";

import { useEffect, useRef, useState } from "react";
import type { EventSnapshot } from "./data/types";

// Langganan state acara: SSE (/api/acara/stream) + cadangan polling 5 dtk kalau SSE putus.
// `stale` = sinyal lemah (S01): tampilkan data terakhir + jam terakhir diperbarui.
const POLL_MS = 5000;

export function useEventSnapshot(initial: EventSnapshot, guestToken?: string) {
  const [snap, setSnap] = useState(initial);
  const [stale, setStale] = useState(false);
  const [lastSync, setLastSync] = useState(initial.event.updatedAt);
  const rev = useRef(initial.event.rev);

  useEffect(() => {
    const q = guestToken ? `?t=${encodeURIComponent(guestToken)}` : "";
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let closed = false;

    const accept = (next: EventSnapshot) => {
      setStale(false);
      setLastSync(new Date().toISOString());
      if (next.event.rev >= rev.current) {
        rev.current = next.event.rev;
        setSnap(next);
      }
    };

    const pollOnce = async () => {
      try {
        const res = await fetch(`/api/acara${q}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        accept((await res.json()) as EventSnapshot);
      } catch {
        setStale(true);
      }
    };

    const startPolling = () => {
      if (poll || closed) return;
      poll = setInterval(pollOnce, POLL_MS);
    };

    const connect = () => {
      if (closed || typeof EventSource === "undefined") return startPolling();
      es = new EventSource(`/api/acara/stream${q}`);
      es.onmessage = (e) => {
        if (poll) {
          clearInterval(poll);
          poll = null;
        }
        accept(JSON.parse(e.data) as EventSnapshot);
      };
      es.onerror = () => {
        setStale(true);
        startPolling(); // EventSource mencoba sambung ulang sendiri; sementara itu polling
      };
    };

    const onOffline = () => setStale(true);
    const onOnline = () => void pollOnce();
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    connect();
    return () => {
      closed = true;
      es?.close();
      if (poll) clearInterval(poll);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [guestToken]);

  return { snap, stale, lastSync };
}
