import type { ReactNode } from "react";
import { Clock } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./Countdown.module.css";

// Countdown (T03 · T03h): ikon jam oranye + label → angka besar → caption tanggal.
export function Countdown({
  label,
  value,
  caption,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  caption?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx(styles.countdown, className)}>
      <span className={styles.icon}>
        <Clock size={20} />
      </span>
      <div className={styles.text}>
        <p className="t-label c-label-2">{label}</p>
        <p className={cx("t-card-title tabular", styles.value)} aria-live="polite">
          {value}
        </p>
        {caption && <p className="t-label c-label-2">{caption}</p>}
      </div>
    </div>
  );
}
