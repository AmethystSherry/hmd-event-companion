import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { ArtVideo, type ArtVideoFit } from "./ArtVideo";
import styles from "./IllustratedScreen.module.css";

// Layar ilustrasi + fade + panel (BT02 selamat datang; pola sama dengan layar acara F4).
// Ilustrasi full-bleed dari atas (status bar di atasnya), tinggi = sisa layar di atas panel + 32
// (panel menimpa 32; di 390×844 dengan panel BT02 = 584). Fade 110 ke warna panel `--card`,
// panel `--card` radius atas 32 menempel bawah — warna sama di light & dark, jadi tanpa garis.
export function IllustratedScreen({
  src,
  children,
  video,
  priority,
  className,
}: {
  src: string;
  video?: ArtVideoFit; // ilustrasi bergerak di atas gambar (sinyal kuat saja)
  children: ReactNode; // isi panel (gap 14)
  priority?: boolean; // gambar penting di layar pertama → fetchPriority high
  className?: string;
}) {
  return (
    <main className={cx(styles.screen, className)}>
      <div className={styles.art}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ilustrasi statis, cache SW */}
        <img
          src={src}
          alt=""
          aria-hidden
          className={styles.img}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
        />
        {video && <ArtVideo fit={video} />}
        <span aria-hidden className={styles.fade} />
      </div>
      <section className={styles.panel}>{children}</section>
    </main>
  );
}
