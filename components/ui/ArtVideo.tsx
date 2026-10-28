"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { cx } from "@/lib/cx";
import styles from "./ArtVideo.module.css";

// Ilustrasi bergerak (28 Okt): video 1080×1920 di atas gambar statis yang sama. Gambar tetap
// jadi dasar (tampil duluan, dipakai kalau sinyal lemah / hemat data / reduced motion / offline);
// video cuma diputar kalau koneksi kuat dan baru muncul (fade) setelah benar-benar jalan.
// Dipasang tepat sesudah <img> ilustrasi (object-fit: cover, posisi tengah) di kotak yang sama.
// `fit` = posisi gambar di dalam video: lebar gambar = s × lebar video (di tengah), tepi atas
// gambar di y × tinggi video — diukur dari frame pertama tiap video (lib/artVideo).

export type ArtVideoFit = { src: string; ratio: number; s: number; y: number };

type Connection = {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  addEventListener?: (t: "change", fn: () => void) => void;
  removeEventListener?: (t: "change", fn: () => void) => void;
};

const connection = (): Connection | undefined =>
  (navigator as Navigator & { connection?: Connection }).connection;

function subscribe(fn: () => void) {
  const c = connection();
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  c?.addEventListener?.("change", fn);
  motion.addEventListener("change", fn);
  window.addEventListener("online", fn);
  window.addEventListener("offline", fn);
  return () => {
    c?.removeEventListener?.("change", fn);
    motion.removeEventListener("change", fn);
    window.removeEventListener("online", fn);
    window.removeEventListener("offline", fn);
  };
}

// Sinyal kuat? Network Information API (Android Chrome); iPhone nggak punya → dianggap boleh,
// video baru tampil kalau udah keputer (sinyal lemah = gambar tetap).
function strongSignal(): boolean {
  if (!navigator.onLine) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const c = connection();
  if (!c) return true;
  if (c.saveData) return false;
  if (c.effectiveType && c.effectiveType !== "4g") return false;
  if (typeof c.downlink === "number" && c.downlink > 0 && c.downlink < 1.5) return false;
  return true;
}

export function useStrongSignal(): boolean {
  return useSyncExternalStore(subscribe, strongSignal, () => false);
}

export function ArtVideo({
  fit,
  enabled = true,
  className,
}: {
  fit: ArtVideoFit;
  enabled?: boolean; // false = gambar saja (mis. layar offline S01, pratinjau)
  className?: string;
}) {
  const strong = useStrongSignal();
  const [playing, setPlaying] = useState<string | null>(null);
  if (!enabled || !strong) return null;
  return (
    <div aria-hidden className={cx(styles.box, className)}>
      <div className={styles.frame} style={{ "--ar": fit.ratio } as CSSProperties}>
        <video
          key={fit.src}
          src={fit.src}
          muted
          loop
          autoPlay
          playsInline
          disablePictureInPicture
          preload="auto"
          tabIndex={-1}
          onPlaying={() => setPlaying(fit.src)}
          className={cx(styles.video, playing === fit.src && styles.on)}
          style={{ "--s": fit.s, "--y": fit.y } as CSSProperties}
        />
      </div>
    </div>
  );
}
