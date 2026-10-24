import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Banner.module.css";

// Banner (Figma "Banner · danger/warning/neutral"): soft tone + ikon 22 + judul Body Emph + body.
// Untuk error yang bisa dipulihkan; aksi opsional (mis. "Coba lagi").
export function Banner({
  tone = "neutral",
  icon,
  title,
  children,
  action,
  className,
}: {
  tone?: "danger" | "warning" | "neutral" | "success";
  icon: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx(styles.banner, styles[tone], className)}
    >
      <span className={styles.icon}>{icon}</span>
      <div className={styles.text}>
        <p className={cx("t-body-emph", styles.title)}>{title}</p>
        {children && <p className="t-label c-label-2">{children}</p>}
        {action && <div className={styles.action}>{action}</div>}
      </div>
    </div>
  );
}

// Aksi teks di dalam banner/toast ("Coba lagi", "Batalkan"). `href` = link keluar (T15 "Follow
// @potarastudio", tab baru).
export function TextAction({
  children,
  onClick,
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={styles.textAction}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={styles.textAction} onClick={onClick}>
      {children}
    </button>
  );
}
