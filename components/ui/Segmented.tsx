"use client";

import { useId } from "react";
import { cx } from "@/lib/cx";
import styles from "./Segmented.module.css";

// Segmented control (design.md §2A, T14 "Mau dong / Nanti dulu"): tinggi 54, segmen sama rata.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | null;
  onChange: (next: T) => void;
  label: string;
  className?: string;
}) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cx(styles.track, className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <label key={opt.value} className={cx(styles.segment, active && styles.active)}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              onChange={() => onChange(opt.value)}
              className={styles.input}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
