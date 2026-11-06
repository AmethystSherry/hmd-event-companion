"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cx } from "@/lib/cx";
import styles from "./HadiahFloat.module.css";

// N5 · HMD/Hadiah · float (Figma 5306:9848): kotak hijau 64 + ikon + badge oranye jumlah + pil
// label putih. Tamu = Gift "Hadiah" (badge kenalanmu, BT03h), panitia = Trophy "Peringkat" (badge
// pasang kenalan, BP02k). Nempel di layar (fixed) & bisa digeser: tahan + geser > 6 px = drag,
// dilepas → nempel ke sisi kiri/kanan terdekat (margin 16), y dibatasi `top` .. atas elemen
// `avoid` (panel / tombol bawah). Posisi disimpan per HP (localStorage `storageKey`). Tap tanpa
// geser = `onPress` (keyboard: Enter/Space bawaan button). Reduced motion = snap tanpa animasi.
// z-index 40: di bawah Sheet (50) & navbar tamu (55); pemanggil menyembunyikannya saat sheet kebuka.

const MARGIN = 16;
const DRAG_PX = 6;

type Side = "left" | "right";
type Pos = { side: Side; y: number };

const noSubscribe = () => () => {};

function readPos(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parsePos(raw: string | null): Pos | null {
  try {
    const p = raw ? (JSON.parse(raw) as Pos) : null;
    return p && (p.side === "left" || p.side === "right") && Number.isFinite(p.y) ? p : null;
  } catch {
    return null;
  }
}

export function HadiahFloat({
  icon,
  count,
  label,
  ariaLabel,
  storageKey,
  initial = { side: "right", y: 300 },
  top = MARGIN,
  avoid,
  bottom = MARGIN,
  onPress,
  className,
}: {
  icon: ReactNode;
  count: number;
  label: string; // "Hadiah" / "Peringkat"
  ariaLabel: string; // "Hadiah, 3 kenalan"
  storageKey: string;
  initial?: Pos; // posisi awal Figma (x306 y300 → kanan, 300)
  top?: number; // batas atas (di bawah toolbar)
  avoid?: RefObject<HTMLElement | null>; // batas bawah = atas elemen ini − 8
  bottom?: number; // tanpa `avoid`: ruang bawah layar yang nggak boleh ditutup (tombol bawah)
  onPress: () => void;
  className?: string;
}) {
  // Baru dirender di HP (server: belum tahu ukuran layar). Ukuran dibaca langsung dari window,
  // render ulang saat layar diputar / diubah ukurannya.
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    window.addEventListener("resize", rerender);
    return () => window.removeEventListener("resize", rerender);
  }, []);
  const vw = mounted ? window.innerWidth : 0;
  const vh = mounted ? window.innerHeight : 0;
  const stored = useSyncExternalStore(
    noSubscribe,
    () => readPos(storageKey),
    () => null,
  );
  const [moved, setMoved] = useState<Pos | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [floor, setFloor] = useState<number | null>(null);
  const el = useRef<HTMLButtonElement>(null);
  const start = useRef<{ px: number; py: number; x: number; y: number; id: number } | null>(null);
  const dragged = useRef(false);
  const dragPos = useRef<{ x: number; y: number } | null>(null); // posisi geser terakhir (pointerup bisa datang sebelum render)

  // Batas bawah ikut posisi elemen `avoid` (panel bisa berubah tinggi / layar diputar).
  useEffect(() => {
    const target = avoid?.current;
    if (!target) return;
    const measure = () => setFloor(target.getBoundingClientRect().top + window.scrollY - 8);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(target);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [avoid]);

  // Ukuran tombol (lebar ikut label: "Hadiah" 64, "Peringkat" ±74), diukur setelah tampil.
  const [box, setBox] = useState({ w: 64, h: 80 });
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const ro = new ResizeObserver(() => {
      const r = node.getBoundingClientRect();
      setBox((b) => (b.w === r.width && b.h === r.height ? b : { w: r.width, h: r.height }));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [vw]);

  const clampY = useCallback(
    (y: number) => {
      const max = Math.max(top, (floor ?? vh - bottom) - box.h);
      return Math.min(Math.max(y, top), max);
    },
    [box.h, top, floor, vh, bottom],
  );

  if (!vw) return null;
  const pos = moved ?? parsePos(stored) ?? initial;
  const w = box.w;
  const x = drag ? drag.x : pos.side === "left" ? MARGIN : vw - MARGIN - w;
  const y = drag ? drag.y : clampY(pos.y);

  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    start.current = { px: e.clientX, py: e.clientY, x, y, id: e.pointerId };
    dragged.current = false;
    // Sentuhan otomatis ter-capture ke tombol; mouse/pen nggak → capture sejak awal biar geser
    // cepat yang keluar dari tombol tetap kebaca.
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.px;
    const dy = e.clientY - s.py;
    if (!dragged.current && Math.hypot(dx, dy) < DRAG_PX) return;
    dragged.current = true;
    const next = { x: Math.min(Math.max(s.x + dx, 0), vw - w), y: clampY(s.y + dy) };
    dragPos.current = next;
    setDrag(next);
  }

  function onPointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    const s = start.current;
    const last = dragPos.current;
    start.current = null;
    dragPos.current = null;
    if (!s || !dragged.current || !last) return;
    const next: Pos = { side: last.x + w / 2 < vw / 2 ? "left" : "right", y: last.y };
    setDrag(null);
    setMoved(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <button
      ref={el}
      type="button"
      aria-label={ariaLabel}
      className={cx(styles.float, drag && styles.dragging, className)}
      style={{ left: x, top: y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        start.current = null;
        dragPos.current = null;
        setDrag(null);
      }}
      onClick={() => {
        // Klik setelah geser = bagian dari drag, bukan tap.
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        onPress();
      }}
    >
      <span aria-hidden className={styles.bubble}>
        {icon}
        {count > 0 && <span className={styles.count}>{count}</span>}
      </span>
      <span aria-hidden className={styles.label}>
        {label}
      </span>
    </button>
  );
}
