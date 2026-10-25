import type { CSSProperties, ReactNode } from "react";
import { Check, Hourglass } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./Polaroid.module.css";

// Polaroid (N4 BT06/BT07/BT07d, nanti T15): bingkai putih + foto 5:6 + caption "{nama} · rumah baru"
// dan tanggal. Benda fisik → warnanya tetap di light & dark.
// - `lg` = viewfinder kamera BT06 (isi lewat children: video / state izin ditolak)
// - `sheet` = hasil foto di sheet BT07 (foto 150×170) · `grid` = Galeri BT07d (foto 152×170)
// `magnet` = magnet oranye di tengah atas, `status` = badge 30 di pojok kanan atas (✓ terkirim /
// ⌛ antre). `caption` mengganti teks kiri, `action` = slot kanan (mis. tombol hapus).
// Tanpa `src` dan children → placeholder gradasi gelap (loading).
export function Polaroid({
  size = "lg",
  src,
  alt = "",
  name,
  date,
  caption,
  action,
  tilt = 0,
  magnet,
  status,
  children,
  className,
}: {
  size?: "lg" | "sheet" | "grid";
  src?: string;
  alt?: string;
  name: string;
  date?: string; // "8.11.26"
  caption?: ReactNode; // ganti "{nama} · rumah baru" (BT07d: "{nama} · {jam}")
  action?: ReactNode;
  tilt?: number;
  magnet?: boolean;
  status?: "sent" | "queued";
  children?: ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={cx(styles.polaroid, styles[size], className)}
      style={tilt ? ({ "--tilt": `${tilt}deg` } as CSSProperties) : undefined}
    >
      {magnet && <span aria-hidden className={styles.magnet} />}
      {status && (
        <span
          role="img"
          aria-label={status === "sent" ? "Udah nempel" : "Nunggu sinyal"}
          className={cx(styles.status, styles[status])}
        >
          {status === "sent" ? <Check weight="bold" /> : <Hourglass weight="bold" />}
        </span>
      )}
      <div className={styles.photo}>
        {children ??
          (src ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob: & route proxy, bukan aset statis
            <img src={src} alt={alt} draggable={false} />
          ) : null)}
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.name}>{caption ?? `${name} · rumah baru`}</span>
        {action ?? (date && <span className={styles.date}>{date}</span>)}
      </figcaption>
    </figure>
  );
}
