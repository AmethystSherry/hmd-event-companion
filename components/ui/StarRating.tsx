"use client";

import type { KeyboardEvent, Ref } from "react";
import { Star } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./StarRating.module.css";

// Rating 5 bintang (T14 "Nilai acaranya"): radiogroup, tiap bintang radio "Nilai {n} dari 5",
// target 44. Terisi = accent, kosong = garis label-3. Panah kiri/kanan ganti nilai.
// `ref` ke grup (T14c: fokus ke bintang saat rating belum diisi).
export function StarRating({
  value,
  onChange,
  label,
  invalid,
  describedBy,
  ref,
  className,
}: {
  value: number; // 0 = belum diisi
  onChange: (next: number) => void;
  label: string;
  invalid?: boolean;
  describedBy?: string;
  ref?: Ref<HTMLDivElement>;
  className?: string;
}) {
  function onKey(e: KeyboardEvent<HTMLButtonElement>, n: number) {
    const delta =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -1
          : 0;
    if (!delta) return;
    e.preventDefault();
    const next = Math.min(5, Math.max(1, n + delta));
    onChange(next);
    const group = e.currentTarget.parentElement;
    group?.querySelectorAll<HTMLButtonElement>("[role=radio]")[next - 1]?.focus();
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cx(styles.group, className)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`Nilai ${n} dari 5`}
            // Satu tab-stop: bintang terpilih (atau pertama kalau belum ada).
            tabIndex={n === (value || 1) ? 0 : -1}
            className={cx(styles.star, on && styles.on)}
            onClick={() => onChange(n)}
            onKeyDown={(e) => onKey(e, n)}
          >
            <Star size={30} weight={on ? "fill" : "regular"} />
          </button>
        );
      })}
    </div>
  );
}
