"use client";

import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Sheet.module.css";

// Bottom sheet (Figma "Sheet · …"): dim + kartu dari bawah radius 32, grabber 36×5.
// `floating` (P06 hasil scan): inset 8 dari tepi, radius 40 di semua sudut, dim 35%.
// `aboveNav` (sheet navbar tamu: Tamu di sini, Rundown, Info rumah; Figma 5356:9816): kartu
// mengambang inset 8, radius 28 semua sudut, berhenti 16 px di atas navbar tamu (navbar tetap
// kelihatan & bisa dipakai, z 55 > sheet 50).
// Dirender di tempat (position fixed, tanpa portal) supaya sheet yang terbuka sejak render pertama
// tetap cocok saat hidrasi.
// Dipakai untuk konfirmasi & aksi cepat (BP03, BP04b, P06, P07c, T15c) dan hasil foto/galeri N4.
// (28 Okt) Geser ke bawah buat nutup (kalau dismissible): mulai dari mana aja di panel selama isinya
// udah di paling atas & gerakan pertama vertikal ke bawah (geser horizontal = carousel di dalamnya).
// Lepas > 96 px atau cepat → tutup; selain itu balik. Panel nggak bisa di-scroll horizontal.
// (6 Nov) Tutup = animasi kebalikan buka (panel turun + dim pudar), dari jalur mana pun (tombol,
// scrim, geser, back HP, ganti sheet, `open` false / pemanggil berhenti merender): saat sheet hilang
// dari DOM, salinan statisnya (`.leaving`, inert) ditaruh di tempat yang sama lalu dianimasikan keluar
// dan dibuang. Ganti sheet (navbar, Tamu → Kartu kamu, …) = gantian: yang lama turun dulu, yang baru
// naik setelahnya, dim tetap (nggak kedip / dobel). Reduced motion → langsung hilang.

const CLOSE_PX = 96;
const CLOSE_SPEED = 0.6; // px/ms
export const SHEET_EXIT_MS = 280; // samakan dengan .leaving di Sheet.module.css
export function Sheet({
  open,
  onClose,
  title,
  children,
  dismissible = true,
  floating,
  aboveNav,
  strong,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  dismissible?: boolean;
  floating?: boolean;
  aboveNav?: boolean;
  strong?: boolean; // backdrop 45% (N4 BT07/BT07d)
  className?: string;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  // onClose lewat ref: pemanggil biasanya mengirim fungsi baru tiap render. Kalau ikut jadi
  // dependency efek di bawah, tiap ketikan di Field dalam sheet memfokus ulang panel → input
  // kehilangan fokus dan keyboard HP tertutup.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const el = root.current;
    const body = panel.current;
    const parent = el?.parentNode;
    if (!el || !body || !parent) return;
    // Posisi scroll & tinggi terakhir: salinan dibuat setelah DOM asli lepas (ukurannya udah 0) dan
    // aturan CSS pemanggil bisa ikut berubah (mis. navbar muncul lagi), jadi ukurannya dibekukan.
    let scrollTop = body.scrollTop;
    let height = body.offsetHeight;
    const onScroll = () => {
      scrollTop = body.scrollTop;
    };
    const resize = new ResizeObserver(() => {
      if (body.isConnected) height = body.offsetHeight;
    });
    body.addEventListener("scroll", onScroll, { passive: true });
    resize.observe(body);
    return () => {
      body.removeEventListener("scroll", onScroll);
      resize.disconnect();
      // Dicek setelah commit: StrictMode (dev) cuma pura-pura unmount, DOM-nya tetap terpasang.
      queueMicrotask(() => {
        if (el.isConnected || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const ghost = el.cloneNode(true) as HTMLDivElement;
        ghost.classList.remove(styles.enterAfter);
        ghost.classList.add(styles.leaving);
        ghost.setAttribute("aria-hidden", "true");
        ghost.inert = true;
        ghost.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
        ghost.querySelectorAll("input[name]").forEach((n) => n.removeAttribute("name"));
        // Ganti ke sheet lain: dim punya sheet baru (tanpa animasi), panel barunya naik setelah yang
        // lama selesai turun.
        const next = document.querySelector(`:not(.${styles.leaving}) > [data-sheet]`);
        if (next?.parentElement) {
          ghost.classList.add(styles.handoff);
          next.parentElement.classList.add(styles.enterAfter);
        }
        parent.appendChild(ghost);
        const ghostPanel = ghost.querySelector<HTMLElement>("[data-sheet]");
        if (ghostPanel) {
          ghostPanel.style.height = `${height}px`;
          ghostPanel.scrollTop = scrollTop;
        }
        setTimeout(() => ghost.remove(), SHEET_EXIT_MS + 40);
      });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) close.current();
    };
    document.addEventListener("keydown", onKey);

    // Geser ke bawah buat nutup.
    const el = panel.current;
    let start: { x: number; y: number; t: number; top: boolean } | null = null;
    let mode: "drag" | "scroll" | null = null;
    let dy = 0;
    const setY = (y: number, animate: boolean) => {
      if (!el) return;
      el.style.transition = animate ? "transform 220ms ease-out" : "none";
      el.style.transform = y ? `translateY(${y}px)` : "";
    };
    const onStart = (e: TouchEvent) => {
      if (!el || e.touches.length !== 1) return;
      const t = e.touches[0];
      // Area gulir di dalam panel (mis. daftar Leaderboard) yang belum di paling atas → geser = gulir dulu.
      let top = el.scrollTop <= 0;
      for (let n = e.target as Element | null; top && n && n !== el; n = n.parentElement) {
        if (n.scrollTop > 0) top = false;
      }
      start = { x: t.clientX, y: t.clientY, t: e.timeStamp, top };
      mode = null;
      dy = 0;
    };
    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const t = e.touches[0];
      const mx = t.clientX - start.x;
      const my = t.clientY - start.y;
      if (!mode) {
        if (Math.abs(mx) < 6 && Math.abs(my) < 6) return;
        mode = start.top && my > 0 && Math.abs(my) > Math.abs(mx) ? "drag" : "scroll";
      }
      if (mode !== "drag") return;
      e.preventDefault();
      dy = Math.max(0, my);
      setY(dy, false);
    };
    const onEnd = (e: TouchEvent) => {
      if (mode === "drag" && start) {
        const speed = dy / Math.max(1, e.timeStamp - start.t);
        if (dy > CLOSE_PX || speed > CLOSE_SPEED) {
          setY(el ? el.offsetHeight : 600, true);
          setTimeout(() => close.current(), 200);
        } else setY(0, true);
      }
      start = null;
      mode = null;
    };
    if (dismissible && el) {
      el.addEventListener("touchstart", onStart, { passive: true });
      el.addEventListener("touchmove", onMove, { passive: false });
      el.addEventListener("touchend", onEnd);
      el.addEventListener("touchcancel", onEnd);
    }

    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      el?.removeEventListener("touchstart", onStart);
      el?.removeEventListener("touchmove", onMove);
      el?.removeEventListener("touchend", onEnd);
      el?.removeEventListener("touchcancel", onEnd);
      document.body.style.overflow = overflow;
      prev?.focus();
    };
  }, [open, dismissible]);

  if (!open) return null;
  return (
    <div
      ref={root}
      className={cx(
        styles.root,
        floating && styles.floating,
        aboveNav && styles.aboveNav,
        strong && styles.strong,
      )}
    >
      <div aria-hidden className={styles.scrim} onClick={dismissible ? onClose : undefined} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-sheet=""
        data-above-nav={aboveNav || undefined}
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
