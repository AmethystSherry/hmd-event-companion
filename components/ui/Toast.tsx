"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Toast.module.css";

// Toast gelap (Figma "Toast"): capsule label/ink, ikon 18 + Label Emph. Untuk perubahan realtime.
// `undo`: tombol "Batalkan" dengan ring hitung mundur (BP02, default 5 dtk); onExpire saat habis.
export function Toast({
  icon,
  children,
  undo,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  undo?: { label?: string; seconds?: number; onUndo: () => void; onExpire?: () => void };
  className?: string;
}) {
  const seconds = undo?.seconds ?? 5;
  const onExpire = useRef(undo?.onExpire);
  useEffect(() => {
    onExpire.current = undo?.onExpire;
  });
  const hasUndo = !!undo;
  // Timer mulai saat toast muncul; render ulang tidak mereset hitungan (pakai `key` untuk reset).
  useEffect(() => {
    if (!hasUndo) return;
    const t = setTimeout(() => onExpire.current?.(), seconds * 1000);
    return () => clearTimeout(t);
  }, [hasUndo, seconds]);

  return (
    <div role="status" aria-live="polite" className={cx(styles.toast, className)}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>{children}</span>
      {undo && (
        <button type="button" className={styles.undo} onClick={undo.onUndo}>
          <svg
            aria-hidden
            className={styles.ring}
            viewBox="0 0 20 20"
            style={{ animationDuration: `${seconds}s` }}
          >
            <circle cx="10" cy="10" r="8" />
          </svg>
          {undo.label ?? "Batalkan"}
        </button>
      )}
    </div>
  );
}
