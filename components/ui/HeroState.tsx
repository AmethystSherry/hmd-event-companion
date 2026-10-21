import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./HeroState.module.css";

// Hero state (pola C13–C16): lingkaran 88 + judul + body. Untuk kosong / terblokir.
export function HeroState({
  icon,
  tone = "neutral",
  title,
  children,
  action,
  className,
}: {
  icon: ReactNode;
  tone?: "neutral" | "accent" | "warning" | "danger" | "success";
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx(styles.hero, className)}>
      <span className={cx(styles.circle, styles[tone])}>{icon}</span>
      <h2 className={cx("t-card-title", styles.title)}>{title}</h2>
      {children && <p className={cx("t-body c-label-2", styles.body)}>{children}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
