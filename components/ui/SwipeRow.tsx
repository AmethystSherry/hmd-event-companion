"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Trash } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./SwipeRow.module.css";

const PANEL = 88; // lebar panel "Hapus"
const OPEN_AT = 44; // geser ≥ 44px → panel tetap terbuka
const SLOP = 8; // gerak awal sebelum ditentukan geser vs scroll
const OPEN_EVENT = "swiperow:open";

// Swipe kiri → panel merah "Hapus" (P04s baris tamu · PE04s baris sesi). Satu baris terbuka
// sekaligus; tap di luar / geser balik / Esc menutup. Gerak lebih vertikal = scroll biasa.
// Keyboard: fokus di baris → Delete/Backspace membuka panel (jalur utama tetap ✎ → 🗑).
export function SwipeRow({
  children,
  onDelete,
  deleteLabel,
  initialOpen = false,
  className,
}: {
  children: ReactNode;
  onDelete?: () => void; // kosong = swipe mati (pratinjau tanpa aksi tetap boleh dibuka)
  deleteLabel: string; // aria-label tombol panel, mis. "Hapus Rara Wening"
  initialOpen?: boolean; // pratinjau P04s/PE04s
  className?: string;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const panelBtn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(initialOpen);
  const [drag, setDrag] = useState<number | null>(null); // offset selagi digeser
  const gesture = useRef<{ x: number; y: number; mode: "?" | "swipe" | "scroll" }>(null);
  const swiped = useRef(false); // klik setelah geseran diabaikan

  // Baris lain dibuka → yang ini menutup. Tap di luar baris → menutup.
  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) setOpen(false);
    };
    window.addEventListener(OPEN_EVENT, onOther);
    return () => window.removeEventListener(OPEN_EVENT, onOther);
  }, [id]);
  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, id]);

  const base = open ? -PANEL : 0;
  const offset = drag ?? base;

  return (
    <div
      ref={root}
      className={cx(styles.root, className)}
      data-active={open || drag !== null || undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          return;
        }
        const tag = (e.target as HTMLElement).tagName;
        if ((e.key === "Delete" || e.key === "Backspace") && tag !== "INPUT" && !open) {
          e.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => panelBtn.current?.focus());
        }
      }}
    >
      <button
        ref={panelBtn}
        type="button"
        className={styles.panel}
        aria-label={deleteLabel}
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={() => {
          setOpen(false);
          onDelete?.();
        }}
      >
        <Trash size={20} />
        <span className="t-caption">Hapus</span>
      </button>
      <div
        className={cx(styles.content, drag !== null && styles.dragging)}
        style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          gesture.current = { x: e.clientX, y: e.clientY, mode: "?" };
          swiped.current = false;
        }}
        onPointerMove={(e) => {
          const g = gesture.current;
          if (!g) return;
          const dx = e.clientX - g.x;
          const dy = e.clientY - g.y;
          if (g.mode === "?") {
            if (Math.abs(dx) > SLOP && Math.abs(dx) > Math.abs(dy)) {
              g.mode = "swipe";
              e.currentTarget.setPointerCapture(e.pointerId);
            } else if (Math.abs(dy) > SLOP) g.mode = "scroll";
          }
          if (g.mode !== "swipe") return;
          swiped.current = true;
          setDrag(Math.max(-PANEL, Math.min(0, base + dx)));
        }}
        onPointerUp={() => {
          const g = gesture.current;
          gesture.current = null;
          if (g?.mode !== "swipe" || drag === null) return setDrag(null);
          setOpen(drag <= -OPEN_AT);
          setDrag(null);
        }}
        onPointerCancel={() => {
          gesture.current = null;
          setDrag(null);
        }}
        onClickCapture={(e) => {
          // Klik di akhir geseran / saat panel terbuka cuma menutup panel.
          if (swiped.current || open) {
            swiped.current = false;
            e.preventDefault();
            e.stopPropagation();
            if (open) setOpen(false);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
