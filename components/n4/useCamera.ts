"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

// N4 · kamera BT06: default kamera depan (selfie), preview di-mirror lewat CSS (hasil tidak).
// Senter hanya kalau track-nya mendukung `torch` (iPhone Safari nggak). Kamera butuh HTTPS.
// - "denied"      → izin ditolak (BT06b)
// - "unsupported" → getUserMedia nggak ada / bukan HTTPS → jalur cadangan kamera bawaan HP
// - "error"       → kamera dipakai aplikasi lain / nggak ada kamera → jalur cadangan juga

export type Facing = "user" | "environment";
export type CameraStatus = "starting" | "live" | "denied" | "unsupported" | "error";

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };

const noSubscribe = () => () => {};
const canUseCamera = () => window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;

export function useCamera(video: RefObject<HTMLVideoElement | null>, enabled: boolean) {
  const [facing, setFacing] = useState<Facing>("user");
  const [attempt, setAttempt] = useState(0);
  // Hasil per percobaan (kamera × "Coba lagi"): percobaan baru otomatis "starting" tanpa setState di effect.
  const key = `${facing}:${attempt}`;
  const [result, setResult] = useState<{ key: string; status: CameraStatus } | null>(null);
  const supported = useSyncExternalStore(noSubscribe, canUseCamera, () => true);
  const [torch, setTorch] = useState<{ supported: boolean; on: boolean }>({
    supported: false,
    on: false,
  });
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled || !supported) return;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } },
      })
      .then(async (s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream.current = s;
        const el = video.current;
        if (el) {
          el.srcObject = s;
          await el.play().catch(() => {});
        }
        const caps = s.getVideoTracks()[0]?.getCapabilities?.() as TorchCapabilities | undefined;
        setTorch({ supported: !!caps?.torch, on: false });
        setResult({ key, status: "live" });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        setResult({
          key,
          status: name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error",
        });
      });
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
    };
  }, [enabled, supported, facing, key, video]);

  const status: CameraStatus = !supported
    ? "unsupported"
    : result?.key === key
      ? result.status
      : "starting";

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const flip = useCallback(() => setFacing((f) => (f === "user" ? "environment" : "user")), []);
  const toggleTorch = useCallback(async () => {
    const track = stream.current?.getVideoTracks()[0];
    if (!track) return;
    const on = !torch.on;
    try {
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
      setTorch((t) => ({ ...t, on }));
    } catch {
      setTorch({ supported: false, on: false });
    }
  }, [torch.on]);

  return { status, facing, torch, retry, flip, toggleTorch };
}
