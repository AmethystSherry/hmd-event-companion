"use client";

import { useEffect, useRef } from "react";
import s from "./f2.module.css";

// P05 viewfinder: kamera belakang + bingkai sudut. Decoder `qr-scanner` (MIT): BarcodeDetector
// bawaan di Android Chrome, decoder di Web Worker untuk iPhone Safari. Kamera butuh HTTPS
// (atau localhost) — gagal / izin ditolak → onError → P07b Cari nama.
export function Viewfinder({
  live,
  onScan,
  onError,
}: {
  live: boolean; // false = pratinjau tanpa kamera (/dev/states/f2)
  onScan: (text: string) => void;
  onError: (reason: string) => void;
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
    <div className={s.viewfinder}>
      {live && <video ref={video} muted playsInline aria-label="Kamera scan tiket" />}
      <div aria-hidden className={s.frame}>
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className={`t-label ${s.viewfinderHint}`}>Arahkan ke QR di tiket tamu</p>
    </div>
  );
}
