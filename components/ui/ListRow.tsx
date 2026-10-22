import Link from "next/link";
import type { ReactNode } from "react";
import { CaretRight } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./ListRow.module.css";

// Avatar: lingkaran card-2 + inisial label-2 (tanpa warna-warni).
export function Avatar({
  name,
  size = 36,
}: {
  name: string;
  size?: 20 | 24 | 30 | 34 | 36 | 44 | 52 | 56;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={styles.avatar}
      style={{ width: size, height: size }}
      data-size={size}
    >
      {initials}
    </span>
  );
}

// Clean/ListRow (4587:350): avatar/ikon 36, judul Body Emph + subjudul Label, nilai kanan.
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  href,
  onClick,
  chevron,
  className,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  chevron?: boolean;
  className?: string;
}) {
  const body = (
    <>
      {leading}
      <span className={styles.text}>
        <span className={cx("t-body-emph", styles.title)}>{title}</span>
        {subtitle && <span className={cx("t-label c-label-2", styles.subtitle)}>{subtitle}</span>}
      </span>
      {trailing && <span className={cx("t-label c-label-2", styles.trailing)}>{trailing}</span>}
      {chevron && <CaretRight size={14} className={styles.chevron} />}
    </>
  );
  const cls = cx(styles.row, (href || onClick) && styles.interactive, className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}
