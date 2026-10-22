"use client";

import { useEffect, useState } from "react";
import styles from "../guest.module.css";

// Hitung mundur T04: jam / menit / detik ke pintu dibuka. Lebih dari 24 jam → jam total
// (mis. "40 jam"). Tidak pernah negatif.
function parts(target: string, now: number) {
  const s = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Jam baru dibaca di klien (hindari beda hasil server vs klien).
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  const p = now === null ? null : parts(target, now);
  const box = (value: number | null, unit: string) => (
    <div className={styles.countBox}>
      <span className="t-number-l">{value === null ? "–" : String(value).padStart(2, "0")}</span>
      <span className="t-label c-label-2">{unit}</span>
    </div>
  );

  return (
    <div
      className={styles.countdown}
      role="timer"
      aria-label={p ? `${p.h} jam ${p.m} menit lagi` : "Menghitung waktu"}
    >
      {box(p?.h ?? null, "jam")}
      {box(p?.m ?? null, "menit")}
      {box(p?.s ?? null, "detik")}
    </div>
  );
}
