import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Card.module.css";

// Kartu tanpa garis: putih di atas bg hangat, shadow sangat halus, radius 24, padding 20.
// `inset` = kartu list tanpa padding (baris ListRow mengatur sendiri).
export function Card({
  inset,
  className,
  ...rest
}: { inset?: boolean } & ComponentProps<"section">) {
  return <section className={cx(styles.card, inset && styles.inset, className)} {...rest} />;
}

// Hierarki 3 tingkat: label kecil abu → judul/angka besar → keterangan kecil.
export function CardLabel({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <div className={styles.labelRow}>
      <p className="t-label c-label-2">{children}</p>
      {trailing}
    </div>
  );
}

// Kotak di dalam kartu (card-2, radius 16), mis. "Sudah follow @potarastudio".
export function InnerBox({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.inner}>
      {icon && <span className={styles.innerIcon}>{icon}</span>}
      <div className="t-label">{children}</div>
    </div>
  );
}
