import type { ComponentProps } from "react";
import { MagnifyingGlass } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./SearchField.module.css";

// SearchField (P03, P07, BT05): capsule 44, kartu putih + shadow, ikon 18.
export function SearchField({
  label,
  className,
  ...rest
}: { label: string } & Omit<ComponentProps<"input">, "type">) {
  return (
    <label className={cx(styles.field, className)}>
      <MagnifyingGlass size={18} className={styles.icon} />
      <span className="sr-only">{label}</span>
      <input type="search" className={styles.input} {...rest} />
    </label>
  );
}
