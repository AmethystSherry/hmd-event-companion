import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { masonry } from "@/lib/kolase";
import { Avatar } from "./ListRow";
import styles from "./Masonry.module.css";

// Galeri gaya Pinterest (design.md "Kolase akhir", T15; nanti galeri panitia): 2 kolom, jarak 8
// antar kolom & 12 antar pin. Tiap item masuk kolom terpendek (lib/kolase `masonry`), jadi urutan
// terbaru tetap di atas. Tanpa JS di HP: susunan dihitung saat render dari rasio foto.
export function Masonry<T>({
  items,
  itemKey,
  ratio,
  render,
  columns = 2,
  captionRatio = 0.16, // tinggi caption ÷ lebar kolom (caption 28 di kolom 175)
  className,
}: {
  items: T[];
  itemKey: (item: T) => string;
  ratio: (item: T) => number; // tinggi ÷ lebar foto
  render: (item: T) => ReactNode;
  columns?: number;
  captionRatio?: number;
  className?: string;
}) {
  const cols = masonry(items, (x) => ratio(x) + captionRatio, columns);
  return (
    <div className={cx(styles.grid, className)} style={{ "--cols": columns } as CSSProperties}>
      {cols.map((col, i) => (
        <ul key={i} className={styles.column}>
          {col.map((item) => (
            <li key={itemKey(item)}>{render(item)}</li>
          ))}
        </ul>
      ))}
    </div>
  );
}

// Satu pin foto: foto radius 16 (tinggi ikut rasio asli) + label kaca "Fotoku" + caption avatar 20
// + "{nama} · {sesi}". Tanpa `src` = placeholder gradasi (pratinjau / belum dimuat).
// `frame` (P13 Foto masuk): kartu putih radius 4 (padding 8/8/10, shadow 0 6 7), foto radius 2;
// `action` = tombol di ujung kanan caption (P13: hapus).
export function PhotoPin({
  src,
  width,
  height,
  name,
  caption,
  mine,
  tone = 0,
  onOpen,
  label,
  frame,
  action,
}: {
  src?: string;
  width: number;
  height: number;
  name: string; // buat avatar inisial
  caption: string; // "Rara · Talkshow"
  mine?: boolean;
  tone?: number; // placeholder: 0 oranye · 1 gelap · 2 krem · 3 amber
  onOpen?: () => void;
  label?: string; // aria-label tombol ("Buka foto Rara")
  frame?: boolean;
  action?: ReactNode;
}) {
  const photo = (
    <span
      className={cx(styles.photo, !src && styles[`ph${tone % 4}`])}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- route proxy, bukan aset statis */}
      {src && <img src={src} alt="" loading="lazy" decoding="async" draggable={false} />}
      {mine && <span className={cx("t-label-emph", styles.mine)}>Fotoku</span>}
    </span>
  );
  return (
    <figure className={cx(styles.pin, frame && styles.frame)}>
      {onOpen ? (
        <button type="button" className={styles.open} onClick={onOpen} aria-label={label}>
          {photo}
        </button>
      ) : (
        photo
      )}
      <figcaption className={cx("t-label c-label-2", styles.caption)}>
        <Avatar name={name} size={20} />
        <span className={styles.captionText}>{caption}</span>
        {action}
      </figcaption>
    </figure>
  );
}
