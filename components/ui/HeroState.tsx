import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./HeroState.module.css";

// Hero state (pola C13–C16): lingkaran 88 + judul + body. Untuk kosong / terblokir.
// `size="sm"` (N3 · BT05b cari nggak ketemu): lingkaran 56, judul Headline, body Label, padding 60.
export function HeroState({
  icon,
  tone = "neutral",
  title,
  children,
  action,
  size = "md",
  className,
}: {
  icon: ReactNode;
  tone?: "neutral" | "accent" | "warning" | "danger" | "success";
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  size?: "md" | "sm";
  className?: string;
}) {
  return (
    <div className={cx(styles.hero, size === "sm" && styles.sm, className)}>
      <span className={cx(styles.circle, styles[tone])}>{icon}</span>
      <h2 className={cx(size === "sm" ? "t-headline" : "t-card-title", styles.title)}>{title}</h2>
      {children && (
        <p className={cx(size === "sm" ? "t-label" : "t-body", "c-label-2", styles.body)}>
          {children}
        </p>
      )}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
