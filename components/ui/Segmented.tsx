"use client";

import { useId, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Segmented.module.css";

// Segmented control (design.md §2A, T14 "Mau dong / Nanti dulu"): tinggi 54, segmen sama rata.
// Opsi `locked` (BT07d "Foto tamu" 🔒): nggak bisa dipilih, warna label-3; tap → `onLocked`.
// `look="tabs"` = HMD/Tabs · Kenalan (N5 BTk1/BTk2): tinggi 48, pil aktif putih.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  onLocked,
  label,
  look = "default",
  className,
}: {
  options: ReadonlyArray<{ value: T; label: ReactNode; icon?: ReactNode; locked?: boolean }>;
  value: T | null;
  onChange: (next: T) => void;
  onLocked?: (value: T) => void;
  label: string;
  look?: "default" | "tabs";
  className?: string;
}) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(styles.track, look === "tabs" && styles.tabs, className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <label
            key={opt.value}
            className={cx(styles.segment, active && styles.active, opt.locked && styles.locked)}
            onClick={opt.locked ? () => onLocked?.(opt.value) : undefined}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              disabled={opt.locked}
              aria-disabled={opt.locked || undefined}
              onChange={() => onChange(opt.value)}
              className={styles.input}
            />
            {opt.icon && (
              <span aria-hidden className={styles.icon}>
                {opt.icon}
              </span>
            )}
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
