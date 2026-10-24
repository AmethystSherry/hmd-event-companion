import Link from "next/link";
import type { ReactNode } from "react";
import { CaretRight } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./NumberedRow.module.css";

// NumberedRow (T01 daftar acara · PE04 rundown): lingkaran nomor card-2 + judul + subjudul + trailing.
// Ditaruh di <Card inset> — garis pemisah antarbaris otomatis.
export function NumberedRow({
  number,
  title,
  subtitle,
  meta,
  trailing,
  href,
  onClick,
  chevron,
  size = "md",
  className,
}: {
  size?: "md" | "sm"; // sm = daftar langkah kecil (BT06b): bulatan 22 oranye lembut, teks t-label
  number: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode; // baris ketiga (mis. "PIC Tim Acara")
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  chevron?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <span className={cx("t-label-emph tabular", styles.number)}>{number}</span>
      <span className={styles.text}>
        <span className={size === "sm" ? "t-label" : "t-body-emph"}>{title}</span>
        {subtitle && <span className={cx("t-label c-label-2", styles.subtitle)}>{subtitle}</span>}
        {meta && <span className="t-label c-label-2">{meta}</span>}
      </span>
      {trailing && <span className={styles.trailing}>{trailing}</span>}
      {chevron && <CaretRight size={14} className={styles.chevron} />}
    </>
  );
  const cls = cx(
    styles.row,
    size === "sm" && styles.sm,
    (href || onClick) && styles.interactive,
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}
