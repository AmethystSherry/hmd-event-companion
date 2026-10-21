"use client";

import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";
import styles from "./Toggle.module.css";

// Toggle (4663:3466): track 51×31 cekung, knob 26,5 dua lapis. On = accent.
export function Toggle({
  checked,
  onChange,
  label,
  className,
  ...rest
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
} & Omit<ComponentProps<"button">, "onChange" | "children">) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cx(styles.track, checked && styles.on, className)}
      onClick={() => onChange(!checked)}
      {...rest}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- knob SVG statis dari Figma */}
      <img className={styles.knob} src="/figma/toggle-knob.svg" alt="" width={36.5} height={36.5} />
    </button>
  );
}
