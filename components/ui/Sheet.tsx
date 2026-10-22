"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Sheet.module.css";

// Bottom sheet (Figma "Sheet · …"): dim + kartu dari bawah radius 32, grabber 36×5.
// `floating` (P06 hasil scan): inset 8 dari tepi, radius 40 di semua sudut, dim 35%.
// Dirender di tempat (position fixed, tanpa portal) supaya sheet yang terbuka sejak render pertama
// tetap cocok saat hidrasi.
// Dipakai untuk konfirmasi & aksi cepat (BP03, BP04b, P06, P07c, T15c).
export function Sheet({
  open,
  onClose,
  title,
  children,
  dismissible = true,
  floating,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  dismissible?: boolean;
  floating?: boolean;
  className?: string;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus();
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;
  return (
    <div className={cx(styles.root, floating && styles.floating)}>
      <div aria-hidden className={styles.scrim} onClick={dismissible ? onClose : undefined} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(styles.panel, className)}
      >
        <span aria-hidden className={styles.grabber} />
        <h2 id={titleId} className="sr-only">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
