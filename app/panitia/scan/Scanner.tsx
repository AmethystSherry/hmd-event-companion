"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock, MagnifyingGlass, QrCode, Users, X } from "@/components/icons";
import { Avatar, Badge, Button, Screen, ScreenHeader, Sheet, TabBar, Toast } from "@/components/ui";
import { deviceId, feedback, postCheckIn } from "@/lib/crewClient";
import { cx } from "@/lib/cx";
import type { CheckInView } from "@/lib/server/checkin";
import styles from "./scan.module.css";

type Count = { checkedIn: number; total: number };
type Scanned = Exclude<CheckInView, { kind: "unknown" }>;

const AUTO_CLOSE_MS = 2000; // P06: "tutup dalam 2 detik", kamera tetap nyala
const SAME_QR_COOLDOWN_MS = 3000;

export function Scanner({ initialCount }: { initialCount: Count }) {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const busy = useRef(false);
  const last = useRef<{ data: string; at: number } | null>(null);
  const [count, setCount] = useState(initialCount);
  const [result, setResult] = useState<CheckInView | null>(null);
  const [netError, setNetError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const close = useCallback(() => {
    setResult(null);
    busy.current = false;
  }, []);

  const handle = useCallback(async (data: string) => {
    const now = Date.now();
    if (busy.current) return;
    if (last.current && last.current.data === data && now - last.current.at < SAME_QR_COOLDOWN_MS) {
      return;
    }
    busy.current = true;
    last.current = { data, at: now };
    try {
      const res = await postCheckIn({ qr: data });
      if ("error" in res) throw new Error(res.error);
      setCount(res.count);
      setResult(res);
      feedback(res.kind === "valid" ? "valid" : "warn");
    } catch {
      setNetError(true);
      busy.current = false;
    }
  }, []);

  // Kamera: qr-scanner (MIT, jalan di Safari iOS). Izin ditolak / error → P07b Cari nama.
  useEffect(() => {
    let scanner: { start(): Promise<void>; stop(): void; destroy(): void } | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const { default: QrScanner } = await import("qr-scanner");
        if (cancelled || !video.current) return;
        const s = new QrScanner(video.current, (r) => void handle(r.data), {
          preferredCamera: "environment",
          maxScansPerSecond: 6,
          returnDetailedScanResult: true,
        });
        scanner = s;
        await s.start();
        if (!cancelled) setCameraReady(true);
      } catch {
        if (!cancelled) router.replace("/panitia/cari?kamera=error");
      }
    })();
    deviceId();
    return () => {
      cancelled = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, [handle, router]);

  // Valid → tutup sendiri 2 dtk, kamera tetap jalan.
  useEffect(() => {
    if (result?.kind !== "valid") return;
    const t = setTimeout(close, AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [result, close]);

  useEffect(() => {
    if (!netError) return;
    const t = setTimeout(() => setNetError(false), 2500);
    return () => clearTimeout(t);
  }, [netError]);

  return (
    <Screen bottom={<TabBar active="scan" />} bottomHeight={57}>
      <ScreenHeader
        eyebrow={`Pintu masuk · ${count.checkedIn} dari ${count.total} sudah masuk`}
        title="Scan tiket"
        trailing={<Badge tone="crew">Panitia</Badge>}
      />
      <div className={styles.camera}>
        <video
          ref={video}
          className={cx(styles.video, cameraReady && styles.videoOn)}
          muted
          playsInline
        />
        <div className={styles.overlay}>
          <svg className={styles.frame} viewBox="0 0 200 200" aria-hidden>
            <path d="M2 48V18A16 16 0 0 1 18 2h30M152 2h30a16 16 0 0 1 16 16v30M198 152v30a16 16 0 0 1-16 16h-30M48 198H18A16 16 0 0 1 2 182v-30" />
          </svg>
          <p className={cx("t-label-emph", styles.hint)}>Arahkan ke QR di tiket tamu</p>
        </div>
      </div>
      <div className={styles.shortcuts}>
        <Link href="/panitia/cari" className={styles.shortcut}>
          <span className={styles.shortcutIcon}>
            <MagnifyingGlass size={18} />
          </span>
          <span className={styles.stack}>
            <span className="t-body-emph">Cari nama</span>
            <span className="t-label c-label-2">atau kode tiket</span>
          </span>
        </Link>
        <Link href="/panitia/tamu" className={styles.shortcut}>
          <span className={styles.shortcutIcon}>
            <Users size={18} />
          </span>
          <span className={styles.stack}>
            <span className="t-body-emph tabular">
              {count.checkedIn} / {count.total}
            </span>
            <span className="t-label c-label-2">sudah masuk</span>
          </span>
        </Link>
      </div>

      {netError && (
        <div className={styles.toastWrap}>
          <Toast icon={<X />}>Gagal cek tiket, sinyalnya lemah. Scan lagi ya.</Toast>
        </div>
      )}

      <Sheet open={!!result} onClose={close} title="Hasil scan" floating>
        {result && <ResultBody result={result} onNext={close} />}
      </Sheet>
    </Screen>
  );
}

function ResultBody({ result, onNext }: { result: CheckInView; onNext: () => void }) {
  if (result.kind === "valid") return <Valid r={result} onNext={onNext} />;

  if (result.kind === "used") {
    const via = result.method === "manual" ? "lewat cari nama" : "lewat scan";
    return (
      <>
        <span className={cx(styles.statusCircle, styles.warn)}>
          <Clock size={26} />
        </span>
        <div className={styles.center}>
          <h3 className="t-card-title">Tiket sudah dipakai</h3>
          <p className="t-body c-label-2">
            {result.name} sudah masuk {result.time} {via}. Hitungan tamu tidak bertambah.
          </p>
        </div>
        <div className={styles.actions}>
          <Button icon={<QrCode />} onClick={onNext}>
            Scan berikutnya
          </Button>
          <Button variant="secondary" href={`/panitia/cari?q=${encodeURIComponent(result.name)}`}>
            Lihat detail tamu
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <span className={cx(styles.statusCircle, styles.danger)}>
        <X size={26} />
      </span>
      <div className={styles.center}>
        <h3 className="t-card-title">Tiket tidak dikenal</h3>
        <p className="t-body c-label-2">
          QR ini bukan tiket House Moving Day. Coba cari nama atau kode di tiket tamu.
        </p>
      </div>
      <div className={styles.actions}>
        <Button icon={<MagnifyingGlass />} href="/panitia/cari">
          Cari nama atau kode
        </Button>
        <Button variant="secondary" onClick={onNext}>
          Scan lagi
        </Button>
      </div>
    </>
  );
}

// P06 · Valid
function Valid({ r, onNext }: { r: Scanned; onNext: () => void }) {
  return (
    <>
      <div className={styles.person}>
        <Avatar name={r.name} size={56} />
        <span className={styles.stack}>
          <span className="t-card-title">{r.name}</span>
          <span className="t-label c-label-2">
            Kunci {r.keyNo} · @{r.ig}
          </span>
        </span>
        <span className={cx(styles.okCircle)}>
          <Check size={20} />
        </span>
      </div>
      <div className={styles.badges}>
        <Badge tone="success">Valid · tamu ke-{r.guestNo}</Badge>
        <Badge tone="neutral">Masuk {r.time}</Badge>
      </div>
      <div className={styles.actions}>
        <Button icon={<QrCode />} onClick={onNext}>
          Scan berikutnya
        </Button>
      </div>
      <p className="t-label c-label-2" style={{ textAlign: "center" }}>
        Tiket di HP tamu sobek otomatis · tutup dalam 2 detik
      </p>
    </>
  );
}
