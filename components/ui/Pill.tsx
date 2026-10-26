import type { ComponentProps, ReactNode } from "react";
import { Check, Plus } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./Pill.module.css";

// Clean/Pill (4587:290): chip info, ikon 16 + Label Emph.
// `glass` (BT06): kaca di atas kamera gelap, teks putih.
export function Pill({
  icon,
  children,
  glass,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  glass?: boolean;
  className?: string;
}) {
  return (
    <span className={cx(styles.pill, glass && styles.glass, className)}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
}

// Chip pilihan (T02b skill/asbun, T14 "Bagian paling seru").
// tone "ink": terpilih = Ink; tone "accent": terpilih = oranye lembut (asbun).
// look "soft" (T14): off = card-2. look "outline" (T02b): off = kartu + garis, on = ikon check
// (`check={false}` = tanpa ikon, chip titip ucapan T02b). look "card" (P13): off = kartu + shadow.
export function Chip({
  selected,
  tone = "ink",
  look = "soft",
  check = true,
  children,
  className,
  ...rest
}: {
  selected: boolean;
  tone?: "ink" | "accent";
  look?: "soft" | "outline" | "card";
  check?: boolean;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        styles.chip,
        look === "outline" && styles.outline,
        look === "card" && styles.card,
        selected && styles[`selected-${tone}`],
        className,
      )}
      {...rest}
    >
      {look === "outline" && selected && check && <Check size={13} />}
      {children}
    </button>
  );
}

// Chip "Tambah" (T02b): card-2 + ikon plus.
export function AddChip({ children, ...rest }: Omit<ComponentProps<"button">, "type">) {
  return (
    <button type="button" className={cx(styles.chip, styles.outline, styles.add)} {...rest}>
      <Plus size={13} />
      {children}
    </button>
  );
}
