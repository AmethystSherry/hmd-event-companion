import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";
import styles from "./DestructiveButton.module.css";

// Clean/Button · Destructive (4712:9105): lingkaran 54 merah, ikon ember putih, tanpa label teks.
export function DestructiveButton({
  label = "Hapus",
  className,
  ...rest
}: { label?: string } & Omit<ComponentProps<"button">, "children">) {
  return (
    <button type="button" aria-label={label} className={cx(styles.button, className)} {...rest}>
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG statis dari Figma */}
      <img src="/figma/bucket.svg" alt="" width={34} height={34} />
    </button>
  );
}
