import { cx } from "@/lib/cx";
import styles from "./BarList.module.css";

// Daftar bar horizontal (P11 "Bagian paling seru"): label kiri, bar sebanding nilai tertinggi,
// angka kanan. Urutan dari pemanggil (terbanyak dulu); bar teratas Ink, sisanya abu.
export function BarList({
  items,
  label,
  className,
}: {
  items: { key: string; label: string; value: number }[];
  label: string; // aria-label daftar
  className?: string;
}) {
  const max = Math.max(1, ...items.map((x) => x.value));
  return (
    <ul className={cx(styles.list, className)} aria-label={label}>
      {items.map((x, i) => (
        <li key={x.key} className={styles.row}>
          <span className={cx("t-label", styles.label)}>{x.label}</span>
          <span aria-hidden className={styles.track}>
            <span
              className={cx(styles.bar, i === 0 && x.value > 0 && styles.top)}
              style={{ width: `${(x.value / max) * 100}%` }}
            />
          </span>
          <span className={cx("t-label-emph tabular", styles.value)}>{x.value}</span>
        </li>
      ))}
    </ul>
  );
}
