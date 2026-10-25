import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./StatTile.module.css";

// Clean/StatTile (4587:320): ikon 18 → angka Number M → label. Bisa tappable (mis. → P03).
// `highlight` = border 1,5 --accent (N1: tile Pertanyaan BP02 selagi ada yang belum dijawab).
export function StatTile({
  icon,
  value,
  label,
  href,
  highlight,
  className,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  href?: string;
  highlight?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.spacer} />
      <span className={cx("t-number-m", styles.value)}>{value}</span>
      <span className="t-label c-label-2">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className={cx(styles.tile, styles.link, highlight && styles.highlight, className)}
      >
        {body}
      </Link>
    );
  }
  return <div className={cx(styles.tile, highlight && styles.highlight, className)}>{body}</div>;
}
