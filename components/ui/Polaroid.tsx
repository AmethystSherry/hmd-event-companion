import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Polaroid.module.css";

// Polaroid (N4 BT06/BT07, nanti T15): bingkai putih + foto 5:6 + caption "{nama} · rumah baru" dan
// tanggal. Benda fisik → warnanya tetap di light & dark. `lg` = viewfinder kamera (isi lewat
// children: video / state izin ditolak), `sm` = kartu hasil yang miring (`tilt` derajat).
// Tanpa `src` dan children → placeholder gradasi gelap (loading).
export function Polaroid({
  size = "lg",
  src,
  alt = "",
  name,
  date,
  tilt = 0,
  dim,
  children,
  className,
}: {
  size?: "lg" | "sm";
  src?: string;
  alt?: string;
  name: string;
  date?: string; // "8.11.26"
  tilt?: number;
  dim?: boolean; // BT07b: masih antre (opacity 70%, bayangan lebih tebal)
  children?: ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={cx(styles.polaroid, styles[size], dim && styles.dim, className)}
      style={tilt ? ({ "--tilt": `${tilt}deg` } as CSSProperties) : undefined}
    >
      <div className={styles.photo}>
        {children ??
          (src ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob: & route proxy, bukan aset statis
            <img src={src} alt={alt} draggable={false} />
          ) : null)}
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.name}>{name} · rumah baru</span>
        {date && <span className={styles.date}>{date}</span>}
      </figcaption>
    </figure>
  );
}
