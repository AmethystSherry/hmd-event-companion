"use client";

import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { ArrowClockwise, Camera, CameraSlash } from "@/components/icons";
import { Viewfinder } from "@/components/f2/Viewfinder";
import { Button } from "@/components/ui";
import type { KenalanCekResponse } from "@/lib/kenalan";
import type { KenalanFriend } from "./KenalanSelfie";
import s from "./n5.module.css";

// N5 · BTk1 Scan QR kenalan: kamera belakang (`Viewfinder` F2, qr-scanner) → POST …/kenalan/cek →
// `onFriend` (lanjut selfie BTk3) / `onMessage` (pesan error, toast pemanggil). QR sama diabaikan
// 2,5 dtk. K8: kamera ditolak / nggak ada (webview IG, http) → "Coba lagi" + "Pakai kamera HP"
// (foto QR, dibaca `QrScanner.scanImage`). Dipakai sheet Kenalan & mode Scan QR kamera kolase.
// Render: viewfinder + input file tersembunyi (fragment → kelas `className` nempel ke viewfinder).

const CHECK_MS = 8000;
const SCAN_REPEAT_MS = 2500; // QR yang sama kebaca berkali-kali per detik
const OFFLINE = "Sinyal lagi lemah. Coba scan lagi, ya."; // TODO copy

export function KenalanScanner({
  token,
  active,
  onFriend,
  onMessage,
  className,
  preview,
}: {
  token: string;
  active: boolean; // kamera scan nyala (tab / mode Scan QR lagi dipilih)
  onFriend: (friend: KenalanFriend, code: string) => void;
  onMessage: (text: string) => void;
  className?: string;
  preview?: { scanError?: boolean }; // /dev/states: tanpa kamera & jaringan
}) {
  const [scanError, setScanError] = useState(!!preview?.scanError);
  const [scanAttempt, setScanAttempt] = useState(0);
  const [checking, setChecking] = useState(false);
  const lastScan = useRef<{ text: string; at: number } | null>(null);
  const qrFile = useRef<HTMLInputElement>(null);

  const onScan = useCallback(
    async (text: string) => {
      const now = Date.now();
      const last = lastScan.current;
      if (checking || (last && last.text === text && now - last.at < SCAN_REPEAT_MS)) return;
      lastScan.current = { text, at: now };
      setChecking(true);
      try {
        const res = await fetch(`/api/t/${token}/kenalan/cek`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: text }),
          signal: AbortSignal.timeout(CHECK_MS),
        });
        const body = (await res.json()) as KenalanCekResponse;
        if (body.ok) onFriend(body.friend, text);
        else onMessage(body.message);
      } catch {
        onMessage(OFFLINE);
      } finally {
        setChecking(false);
      }
    },
    [checking, token, onFriend, onMessage],
  );

  // K8: kamera scan nggak jalan → foto QR pakai kamera HP, dibaca qr-scanner dari gambar.
  async function onQrFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      // Dinamis: qr-scanner cuma jalan di browser & cuma dibutuhkan di jalur cadangan K8.
      const { default: QrScanner } = await import("qr-scanner");
      const r = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      lastScan.current = null;
      await onScan(r.data);
    } catch {
      onMessage("QR-nya nggak kebaca. Coba foto lebih dekat, ya."); // TODO copy
    }
  }

  return (
    <>
      <Viewfinder
        key={scanAttempt}
        live={active && !preview && !scanError}
        onScan={(text) => void onScan(text)}
        onError={() => setScanError(true)}
        hint="Arahkan ke QR kenalan temanmu"
        label="Kamera scan QR kenalan"
        className={className}
      >
        {scanError ? (
          // K8 · TODO desain: kamera scan ditolak / nggak ada (webview IG, http).
          <div className={s.scanDenied}>
            <CameraSlash size={36} />
            <p className="t-body-emph">Kamera belum bisa dipakai</p>
            <p className="t-label" style={{ opacity: 0.8 }}>
              Izinkan kamera di browser, atau foto QR temanmu pakai kamera HP.
            </p>
            <div className={s.scanDeniedActions} data-theme="light">
              <Button
                icon={<ArrowClockwise />}
                onClick={() => {
                  setScanError(false);
                  setScanAttempt((n) => n + 1);
                }}
              >
                Coba lagi
              </Button>
              <Button variant="secondary" icon={<Camera />} onClick={() => qrFile.current?.click()}>
                Pakai kamera HP
              </Button>
            </div>
          </div>
        ) : undefined}
      </Viewfinder>
      <input
        ref={qrFile}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onQrFile}
      />
    </>
  );
}
