"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/cx";
import styles from "./Sheet.module.css";

// Bottom sheet (Figma "Sheet · …"): dim 45% + kartu dari bawah radius 32, grabber 36×5.
// Dipakai untuk konfirmasi & aksi cepat (BP03, BP04b, P06, P07c, T15c).
export function Sheet({
  open,
  onClose,
  title,
  children,
  dismissible = true,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  dismissible?: boolean;
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

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className={styles.root}>
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
    </div>,
    document.body,
  );
}
