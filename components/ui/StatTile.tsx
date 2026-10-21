import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./StatTile.module.css";

// Clean/StatTile (4587:320): ikon 18 → angka Number M → label. Bisa tappable (mis. → P03).
export function StatTile({
  icon,
  value,
  label,
  href,
  className,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  href?: string;
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
      <Link href={href} className={cx(styles.tile, styles.link, className)}>
        {body}
      </Link>
    );
  }
  return <div className={cx(styles.tile, className)}>{body}</div>;
}
