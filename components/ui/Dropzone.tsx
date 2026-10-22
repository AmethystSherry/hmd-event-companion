import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Dropzone.module.css";

// Dropzone (P04k "Belum ada daftar tamu"): kartu garis putus-putus, ikon bulat 56, judul, body, aksi.
export function Dropzone({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx(styles.zone, className)}>
      <span className={styles.icon}>{icon}</span>
      <p className="t-headline">{title}</p>
      {children && <p className="t-label c-label-2">{children}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
