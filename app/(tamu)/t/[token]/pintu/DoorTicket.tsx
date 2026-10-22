"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Badge, Button, Screen, Ticket, TicketStub, type TicketData } from "@/components/ui";
import { cx } from "@/lib/cx";
import styles from "./door.module.css";

// T05 Tiket hari-H → (panitia scan) → T05a tiket valid, mulai sobek → BT02 selamat datang.
// Status dipoll tiap 2 dtk (pengganti realtime). Animasi sobek ±900 ms (design.md "Tiket"):
//  0–150 badge "Valid" · 150–450 tiket sobek, potongan miring 4° · 450–900 potongan jatuh,
//  cap "Masuk" muncul (spring). Reduce motion: crossfade 200 ms langsung ke BT02.
type Phase = "aktif" | "valid" | "jatuh" | "masuk";
type Entry = { time: string; guestNo: number | null; total: number };

const POLL_MS = 2000;
const AUTO_NEXT_MS = 3000;

export function DoorTicket({
  token,
  firstName,
  data,
  qr,
  nextHref,
}: {
  token: string;
  firstName: string;
  data: TicketData;
  qr: ReactNode;
  nextHref: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("aktif");
  const [entry, setEntry] = useState<Entry | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Layar tetap menyala selama tiket ditunjukkan (Wake Lock; diam kalau tidak didukung).
  useEffect(() => {
    let lock: { release(): Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> };
    };
    nav.wakeLock
      ?.request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    return () => void lock?.release().catch(() => {});
  }, []);

  const tear = useCallback(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      navigator.vibrate?.(40);
    } catch {}
    if (reduce) {
      setPhase("masuk");
      return;
    }
    setPhase("valid");
    timers.current.push(setTimeout(() => setPhase("jatuh"), 450));
    timers.current.push(setTimeout(() => setPhase("masuk"), 900));
  }, []);

  // Polling status tiket sampai panitia men-scan.
  useEffect(() => {
    if (phase !== "aktif") return;
    let stop = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/t/${token}/status`, { cache: "no-store" });
        const body = (await res.json()) as {
          checkedIn?: boolean;
          time?: string;
          guestNo?: number | null;
          total?: number;
        };
        if (stop || !body.checkedIn) return;
        setEntry({ time: body.time ?? "", guestNo: body.guestNo ?? null, total: body.total ?? 0 });
        tear();
      } catch {
        // Offline: tiket tetap tampil; sobek begitu HP online lagi (kartu case T05a).
      }
    };
    const t = setInterval(tick, POLL_MS);
    void tick();
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [phase, token, tear]);

  // BT02 → layar acara otomatis dalam 3 dtk.
  useEffect(() => {
    if (phase !== "masuk") return;
    const t = setTimeout(() => router.replace(nextHref), AUTO_NEXT_MS);
    return () => clearTimeout(t);
  }, [phase, router, nextHref]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const torn = phase !== "aktif";
  const welcomed = phase === "masuk";

  return (
    <Screen
      withBack={!welcomed}
      bottomHeight={82}
      bottom={
        welcomed ? (
          <>
            <p className={cx("t-label c-label-2", styles.caption)}>
              Otomatis lanjut ke layar Jeda dalam 3 detik
            </p>
            <Button href={nextHref}>Masuk sekarang</Button>
          </>
        ) : undefined
      }
    >
      <div className={styles.door} aria-live="polite">
        {welcomed && entry ? (
          <header className={cx(styles.header, styles.fadeIn)}>
            <p className="t-label c-label-2">
              Masuk {entry.time} · tamu ke-{entry.guestNo} dari {entry.total}
            </p>
            <h1 className="t-title">Selamat datang di rumah baru, {firstName}!</h1>
          </header>
        ) : (
          <header className={styles.rowHeader}>
            <span className={styles.stack}>
              <span className="t-label c-label-2">Hari-H · pintu dibuka 13.00</span>
              <span className={cx("t-headline", torn && styles.validText)}>
                {torn ? "Tiket valid!" : "Tunjukkan ke panitia"}
              </span>
            </span>
            {!torn && (
              <Badge tone="neutral" className={styles.brightBadge}>
                Kecerahan maks
              </Badge>
            )}
          </header>
        )}

        <div className={styles.ticketWrap}>
          <Ticket
            data={data}
            state={welcomed ? "sobek" : torn ? "valid" : "aktif"}
            torn={torn}
            qr={qr}
            stamp={welcomed && entry ? entry : undefined}
            className={cx(welcomed && styles.welcomed)}
          />
          {torn && (
            <TicketStub
              code={data.code}
              qr={qr}
              className={cx(
                styles.stub,
                phase === "jatuh" && styles.falling,
                welcomed && styles.fallen,
              )}
            />
          )}
        </div>
      </div>
    </Screen>
  );
}
