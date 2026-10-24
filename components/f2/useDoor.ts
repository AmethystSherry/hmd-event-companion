"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyOps,
  type CheckInResponse,
  type DoorGuest,
  type DoorManifest,
  type DoorOp,
  type DoorOpResult,
} from "@/lib/door";
import {
  addOp,
  clearDoorData,
  listOps,
  loadManifest,
  removeOps,
  saveManifest,
} from "@/lib/offline/doorDb";
import { deviceLabel } from "@/lib/device";

// Data pintu di HP panitia: manifest (IndexedDB) + antrean check-in, sinkron ke server.
// - Online: op dikirim langsung; hasil server dipakai untuk sheet P06 (siapa duluan, tanda tangan).
// - Offline: op diantre (P05b), dikirim ulang tiap 5 dtk / saat sinyal kembali. Idempoten per opId.
// - Realtime: /api/live (SSE) → rev naik → unduh manifest baru (angka di semua HP panitia sama).

const RETRY_MS = 5000;

export function newOpId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useDoor(
  eventId: string,
  opts: { preview?: DoorGuest[]; onSynced?: (op: DoorOp, result: DoorOpResult) => void } = {},
) {
  const preview = opts.preview;
  const [manifest, setManifest] = useState<DoorManifest | null>(
    preview ? { eventId, rev: 0, guests: preview } : null,
  );
  const [ops, setOps] = useState<DoorOp[]>([]);
  const [online, setOnline] = useState(true);
  const syncing = useRef(false);
  const waiters = useRef(new Map<string, (r: DoorOpResult) => void>());
  const onSynced = useRef(opts.onSynced);
  useEffect(() => {
    onSynced.current = opts.onSynced;
  });

  const router = useRouter();
  const sessionGone = useCallback(async () => {
    await clearDoorData();
    router.replace("/panitia");
  }, [router]);

  const fetchManifest = useCallback(async (): Promise<DoorManifest | null> => {
    try {
      const res = await fetch(`/api/panitia/event/${eventId}/manifest`, { cache: "no-store" });
      if (res.status === 401) {
        await sessionGone();
        return null;
      }
      if (!res.ok) throw new Error(String(res.status));
      const m = (await res.json()) as DoorManifest;
      await saveManifest(m);
      setOnline(true);
      return m;
    } catch {
      setOnline(false);
      return null;
    }
  }, [eventId, sessionGone]);

  const flush = useCallback(async () => {
    if (preview || syncing.current) return;
    syncing.current = true;
    try {
      for (let round = 0; round < 5; round++) {
        const pending = await listOps(eventId);
        if (!pending.length) break;
        const res = await fetch("/api/panitia/checkin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ eventId, by: deviceLabel(), ops: pending }),
        });
        if (res.status === 401) return sessionGone();
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as CheckInResponse;
        for (const { opId, result } of data.results) {
          waiters.current.get(opId)?.(result);
          waiters.current.delete(opId);
          const op = pending.find((o) => o.opId === opId);
          if (op) onSynced.current?.(op, result);
        }
        // Op baru dibuang dari antrean setelah manifest terbaru masuk (tanpa kedip di layar).
        // Kalau manifest gagal diunduh, op tetap diantre — kirim ulang aman (idempoten).
        const m = await fetchManifest();
        if (!m) break;
        await removeOps(data.results.map((r) => r.opId));
        setManifest(m);
        setOps(await listOps(eventId));
      }
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      syncing.current = false;
    }
  }, [eventId, preview, fetchManifest, sessionGone]);

  // Muat dari IndexedDB dulu (instan, offline), lalu ambil yang terbaru dari server.
  useEffect(() => {
    if (preview) return;
    let alive = true;
    (async () => {
      const [cached, queued] = await Promise.all([loadManifest(eventId), listOps(eventId)]);
      if (!alive) return;
      if (cached) setManifest(cached);
      setOps(queued);
      const fresh = await fetchManifest();
      if (alive && fresh) setManifest(fresh);
      flush();
    })();
    return () => {
      alive = false;
    };
  }, [eventId, preview, fetchManifest, flush]);

  // Realtime antar-HP panitia + kirim ulang antrean.
  const rev = manifest?.rev ?? -1;
  const revRef = useRef(rev);
  useEffect(() => {
    revRef.current = rev;
  }, [rev]);
  useEffect(() => {
    if (preview) return;
    const es = new EventSource("/api/live");
    es.onmessage = async (e) => {
      if (Number(e.data) > revRef.current && !syncing.current) {
        const m = await fetchManifest();
        if (m) setManifest(m);
      }
    };
    const onOnline = () => {
      setOnline(true);
      flush();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const t = setInterval(() => {
      listOps(eventId).then((q) => {
        if (q.length) flush();
      });
    }, RETRY_MS);
    return () => {
      es.close();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(t);
    };
  }, [eventId, preview, fetchManifest, flush]);

  // Tambah op ke antrean. `waitMs` → tunggu hasil server sebentar (scan); null = belum sampai.
  const submit = useCallback(
    async (op: DoorOp, waitMs = 0): Promise<DoorOpResult | null> => {
      setOps((q) => [...q, op]);
      if (preview) return null;
      await addOp(eventId, op);
      const result = waitMs
        ? new Promise<DoorOpResult | null>((resolve) => {
            waiters.current.set(op.opId, resolve);
            setTimeout(() => {
              waiters.current.delete(op.opId);
              resolve(null);
            }, waitMs);
          })
        : Promise.resolve(null);
      flush();
      return result;
    },
    [eventId, preview, flush],
  );

  const guests = useMemo(() => (manifest ? applyOps(manifest.guests, ops) : null), [manifest, ops]);
  const pending = ops.filter((o) => o.kind !== "undo").length;

  return { guests, pending, online, submit };
}
