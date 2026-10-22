"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Backspace } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./PinPad.module.css";

// PinPad (P01 · P01b · P01c): 6 kotak PIN + keypad angka bulat 78 + backspace.
// `message` (Banner P01b/P01c) tampil di antara kotak dan keypad.
// `state` error → kotak bergaris merah (PIN salah); `disabled` (terkunci) → keypad nonaktif.
// Keyboard fisik (0–9, Backspace) juga bisa dipakai.
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function PinPad({
  value,
  onChange,
  length = 6,
  state = "idle",
  disabled,
  message,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  state?: "idle" | "error";
  disabled?: boolean;
  message?: ReactNode;
  className?: string;
}) {
  // Nilai terbaru di ref supaya tap beruntun (sebelum render ulang) tidak kehilangan digit.
  const current = useRef(value);
  useEffect(() => {
    current.current = value;
  }, [value]);
  const handler = useRef<(key: string) => void>(() => {});
  useEffect(() => {
    handler.current = (key: string) => {
      if (disabled) return;
      const v = current.current;
      const next = key === "del" ? v.slice(0, -1) : v.length < length ? v + key : key; // penuh → mulai ulang
      current.current = next;
      onChange(next);
    };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return; // ketikan di field lain
      if (/^\d$/.test(e.key)) handler.current(e.key);
      else if (e.key === "Backspace") handler.current("del");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={cx(styles.root, className)}>
      <div
        className={styles.boxes}
        role="img"
        aria-label={`PIN, ${value.length} dari ${length} digit terisi`}
      >
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={cx(
              styles.box,
              state === "error" && styles.error,
              state !== "error" && !disabled && i === value.length && styles.active,
            )}
          >
            {i < value.length && <span className={styles.dot} />}
          </span>
        ))}
      </div>
      {message}
      <div className={styles.keypad}>
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              className={cx(styles.key, k === "del" && styles.del)}
              aria-label={k === "del" ? "Hapus satu digit" : k}
              disabled={disabled}
              onClick={() => handler.current(k)}
            >
              {k === "del" ? <Backspace size={26} /> : k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
