import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./TopToast.module.css";

// Toast atas (F3/F4 · S01 sinyal lemah, BP02d diubah panitia lain): kartu putih di bawah status
// bar, ikon 20 + judul Label Emph + isi Caption label-2, aksi ikon opsional di kanan. Beda dengan
// `Toast` (kapsul gelap di bawah). `tone="dark"` (N3 · T11s): kartu --cta, teks & ikon --on-cta,
// judul Label biasa. Muncul/hilang diatur pemanggil.
export function TopToast({
  icon,
  title,
  children,
  action,
  tone = "light",
  className,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: { label: string; icon: ReactNode; onClick: () => void };
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(styles.toast, tone === "dark" && styles.dark, className)}
    >
      <span aria-hidden className={styles.icon}>
        {icon}
      </span>
      <span className={styles.text}>
        <span className={tone === "dark" ? "t-label" : "t-label-emph"}>{title}</span>
        {children && <span className={cx("t-caption c-label-2", styles.body)}>{children}</span>}
      </span>
      {action && (
        <button
          type="button"
          className={styles.action}
          aria-label={action.label}
          onClick={action.onClick}
        >
          {action.icon}
        </button>
      )}
    </div>
  );
}
