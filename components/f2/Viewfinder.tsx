"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import s from "./f2.module.css";

// P05 viewfinder: kamera belakang + bingkai sudut. Decoder `qr-scanner` (MIT): BarcodeDetector
// bawaan di Android Chrome, decoder di Web Worker untuk iPhone Safari. Kamera butuh HTTPS
// (atau localhost) — gagal / izin ditolak → onError → P07b Cari nama.
// N5 · BTk1 pakai juga: `hint`/`label` sendiri, `className` (rasio & radius), `children` = lapisan di
// atas kamera (kamera ditolak / lagi ngecek kode).
export function Viewfinder({
  live,
  onScan,
  onError,
  hint = "Arahkan ke QR di tiket tamu",
  label = "Kamera scan tiket",
  className,
  children,
}: {
  live: boolean; // false = pratinjau tanpa kamera (/dev/states/f2)
  onScan: (text: string) => void;
  onError: (reason: string) => void;
  hint?: string;
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const scanRef = useRef(onScan);
  const errorRef = useRef(onError);
  useEffect(() => {
    scanRef.current = onScan;
    errorRef.current = onError;
  });

  useEffect(() => {
    if (!live || !video.current) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      errorRef.current("kamera-butuh-https");
      return;
    }
    let scanner: { start(): Promise<void>; destroy(): void } | null = null;
    let cancelled = false;
    import("qr-scanner").then(({ default: QrScanner }) => {
      if (cancelled || !video.current) return;
      const q = new QrScanner(video.current, (r) => scanRef.current(r.data), {
        returnDetailedScanResult: true,
        preferredCamera: "environment",
        maxScansPerSecond: 8,
        highlightScanRegion: false,
        highlightCodeOutline: false,
        onDecodeError: () => {},
      });
      scanner = q;
      q.start().catch((err: unknown) => {
        if (!cancelled) errorRef.current(String(err));
      });
    });
    return () => {
      cancelled = true;
      scanner?.destroy();
    };
  }, [live]);

  return (
    <div className={cx(s.viewfinder, className)}>
      {live && <video ref={video} muted playsInline aria-label={label} />}
      {children ?? (
        <>
          <div aria-hidden className={s.frame}>
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className={`t-label ${s.viewfinderHint}`}>{hint}</p>
        </>
      )}
    </div>
  );
}
