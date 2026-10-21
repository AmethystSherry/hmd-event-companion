import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Screen.module.css";

// Kerangka layar 390: margin 16, safe area atas/bawah, jarak antarkartu 12.
// `bottom` = aksi mengambang (tombol utama / tab bar panitia) dengan scroll-edge fade di belakangnya,
// jadi konten memudar, bukan terpotong.
export function Screen({
  children,
  bottom,
  className,
}: {
  children: ReactNode;
  bottom?: ReactNode;
  className?: string;
}) {
  return (
    <div className={styles.screen}>
      <main className={cx(styles.content, bottom ? styles.withBottom : undefined, className)}>
        {children}
      </main>
      {bottom && (
        <div className={styles.bottom}>
          <div aria-hidden className={styles.fade} />
          <div className={styles.bottomInner}>{bottom}</div>
        </div>
      )}
    </div>
  );
}

// Header layar: label kecil (tanggal/peran) + judul besar di kiri, satu aksi/badge di kanan.
export function ScreenHeader({
  eyebrow,
  title,
  trailing,
  leading,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  trailing?: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      {leading && <div className={styles.leading}>{leading}</div>}
      <div className={styles.headerRow}>
        <div className={styles.headerText}>
          {eyebrow && <p className="t-label c-label-2">{eyebrow}</p>}
          <h1 className="t-title">{title}</h1>
        </div>
        {trailing && <div className={styles.trailing}>{trailing}</div>}
      </div>
    </header>
  );
}

// Skeleton bentuk kartu (state loading — bukan spinner penuh).
export function Skeleton({ height = 120, radius = 24 }: { height?: number; radius?: number }) {
  return <div aria-hidden className={styles.skeleton} style={{ height, borderRadius: radius }} />;
}
