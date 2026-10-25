"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Dialog.module.css";

// Dialog konfirmasi di tengah layar + backdrop (BP03 Selesaikan sesi, BP01b Mulai sesi).
// Pola sama dengan Sheet: dirender di tempat (tanpa portal), Esc / tap backdrop = onClose (Batal),
// fokus dikunci di dalam dialog selama terbuka lalu kembali ke pemicu.
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode; // isi (Body, label-2)
  actions: ReactNode; // tombol lg: primary dulu, lalu secondary "Batal"
  className?: string;
}) {
  const titleId = useId();
  const bodyId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    (focusables()[0] ?? panel.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close.current();
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return e.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className={styles.root}>
      <div aria-hidden className={styles.scrim} onClick={onClose} />
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children ? bodyId : undefined}
        tabIndex={-1}
        className={cx(styles.panel, className)}
      >
        <h2 id={titleId} className="t-headline">
          {title}
        </h2>
        {children && (
          <div id={bodyId} className="t-label c-label-2">
            {children}
          </div>
        )}
        <div className={styles.actions}>{actions}</div>
      </div>
    </div>
  );
}
