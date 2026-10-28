"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { cx } from "@/lib/cx";
import styles from "./ArtVideo.module.css";

// Ilustrasi bergerak (28 Okt): video 1080×1920 di atas gambar statis yang sama. Gambar tetap
// jadi dasar (tampil duluan, dipakai kalau sinyal lemah / hemat data / reduced motion / offline);
// video cuma diputar kalau koneksi kuat dan baru muncul (fade) setelah benar-benar jalan.
// Dipasang tepat sesudah <img> ilustrasi (object-fit: cover, posisi tengah) di kotak yang sama;
// ukuran video dihitung JS (videoRect) dari ukuran kotak.
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

// Posisi video (px) di kotak W×H: gambar di-cover di tengah kotak (seperti <img> object-fit: cover),
// lalu video ditaruh supaya bagian gambarnya tepat di atas gambar itu.
export function videoRect(fit: ArtVideoFit, W: number, H: number) {
  const frameW = Math.max(W, H * fit.ratio);
  const frameH = frameW / fit.ratio;
  const width = frameW / fit.s;
  const height = (width * 16) / 9;
  return {
    width,
    height,
    left: (W - frameW) / 2 + (frameW - width) / 2,
    top: (H - frameH) / 2 - fit.y * height,
  };
}

// Suara (T01): browser cuma mengizinkan video bersuara kalau play() dipanggil dari sentuhan.
// Dipanggil dari tap (segel T01a / tap pertama di halaman): mulai dari awal dengan suara, sekali;
// habis itu loop tanpa suara.
export function playArtSound() {
  document.querySelectorAll<HTMLVideoElement>("video[data-sound]").forEach((v) => {
    if (v.dataset.sound === "played") return;
    v.dataset.sound = "played";
    v.loop = false;
    v.muted = false;
    v.currentTime = 0;
    v.play().catch(() => {
      v.muted = true;
      v.loop = true;
    });
    v.addEventListener(
      "ended",
      () => {
        v.muted = true;
        v.loop = true;
        v.play().catch(() => {});
      },
      { once: true },
    );
  });
}

export function ArtVideo({
  fit,
  enabled = true,
  sound,
  className,
}: {
  fit: ArtVideoFit;
  enabled?: boolean; // false = gambar saja (mis. layar offline S01, pratinjau)
  sound?: boolean; // suara sekali setelah tap pertama (T01)
  className?: string;
}) {
  const strong = useStrongSignal();
  const [playing, setPlaying] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const show = enabled && strong;

  useLayoutEffect(() => {
    const el = box.current;
    const v = video.current;
    if (!show || !el || !v) return;
    const place = () => {
      const r = videoRect(fit, el.clientWidth, el.clientHeight);
      v.style.width = `${r.width}px`;
      v.style.height = `${r.height}px`;
      v.style.transform = `translate(${r.left}px, ${r.top}px)`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [show, fit]);

  // Halaman dibuka langsung (tanpa amplop): suara nyala di tap pertama di mana aja.
  useLayoutEffect(() => {
    if (!show || !sound) return;
    const once = () => playArtSound();
    document.addEventListener("click", once, { once: true });
    document.addEventListener("touchend", once, { once: true });
    return () => {
      document.removeEventListener("click", once);
      document.removeEventListener("touchend", once);
    };
  }, [show, sound]);

  if (!show) return null;
  return (
    <div ref={box} aria-hidden className={cx(styles.box, className)}>
      <video
        ref={video}
        key={fit.src}
        src={fit.src}
        muted
        loop
        autoPlay
        playsInline
        disablePictureInPicture
        preload="auto"
        tabIndex={-1}
        data-sound={sound ? "" : undefined}
        onPlaying={() => setPlaying(fit.src)}
        className={cx(styles.video, playing === fit.src && styles.on)}
      />
    </div>
  );
}
