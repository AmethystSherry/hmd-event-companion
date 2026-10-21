import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Pill.module.css";

// Clean/Pill (4587:290): chip info, ikon 16 + Label Emph.
export function Pill({
  icon,
  children,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx(styles.pill, className)}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
}

// Chip pilihan (T02b skill/asbun, T14 "Bagian paling seru").
// tone "ink": terpilih = Ink; tone "accent": terpilih = oranye lembut (asbun).
export function Chip({
  selected,
  tone = "ink",
  children,
  className,
  ...rest
}: {
  selected: boolean;
  tone?: "ink" | "accent";
  children: ReactNode;
} & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(styles.chip, selected && styles[`selected-${tone}`], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
