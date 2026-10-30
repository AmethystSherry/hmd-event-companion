"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { DownloadSimple, Trash, X } from "@/components/icons";
import { Avatar, Button, IconButton } from "@/components/ui";
import { cx } from "@/lib/cx";
import type { KolasePhoto } from "@/lib/kolase";
import s from "./f5.module.css";

// T15b · Detail foto: kartu mengambang di atas kolase yang di-blur + diredupkan. Geser kiri/kanan
// (scroll-snap, jalan native di HP) = foto lain di filter aktif. Fokus dikunci di sini, Esc / X /
// back HP menutup. Hapus cuma foto sendiri (boleh sampai data dihapus H+30, keputusan F5).
export function FotoDetail({
  photos,
  index,
  src,
  onIndex,
  onClose,
  onSave,
  onDelete,
}: {
  photos: KolasePhoto[];
  index: number;
  src: (p: KolasePhoto) => string | undefined; // foto full
  onIndex: (i: number) => void;
  onClose: () => void;
  onSave: (p: KolasePhoto) => void;
  onDelete: (p: KolasePhoto) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  // Mulai di foto yang ditap (tanpa animasi); ikut kalau index berubah dari luar.
  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const target = index * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) > 2) el.scrollTo({ left: target, behavior: "instant" });
  }, [index]);

  // Fokus terkunci di overlay (pola Dialog), Esc menutup, body nggak ikut scroll.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        root.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();
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
  }, []);

  // Selesai geser → foto aktif baru (dibulatkan ke slide terdekat).
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  function onScroll() {
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const el = track.current;
      if (!el || !el.clientWidth) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      if (i !== index && photos[i]) onIndex(i);
    }, 120);
  }

  return (
    <div ref={root} className={s.detail} role="dialog" aria-modal="true" aria-label="Detail foto">
      <div aria-hidden className={s.detailScrim} onClick={onClose} />
      <div className={s.detailClose}>
        <IconButton variant="glass" label="Tutup foto" icon={<X />} onClick={onClose} />
      </div>
      <div ref={track} className={s.detailTrack} onScroll={onScroll}>
        {photos.map((p, i) => {
          const near = Math.abs(i - index) <= 1;
          const url = near ? src(p) : undefined;
          return (
            <div key={p.id} className={s.detailSlide} aria-hidden={i !== index} inert={i !== index}>
              <article className={s.detailCard}>
                <div
                  className={cx(s.detailPhoto, !url && s[`ph${p.tone % 4}`])}
                  style={{ aspectRatio: `${p.width} / ${p.height}` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- route proxy, bukan aset statis */}
                  {url && <img src={url} alt={`Foto dari ${p.first}`} draggable={false} />}
                </div>
                <div className={s.detailMeta}>
                  <Avatar name={p.name} size={34} />
                  <div className={s.detailText}>
                    <p className="t-body-emph">
                      {p.name}
                      {p.mine && <span className="c-label-2"> · fotomu</span>}
                    </p>
                    <p className="t-label c-label-2">
                      {p.session ? `${p.session} · ${p.time}` : p.time}
                    </p>
                  </div>
                </div>
                <div className={s.detailActions}>
                  <Button variant="secondary" icon={<DownloadSimple />} onClick={() => onSave(p)}>
                    Download foto
                  </Button>
                  {p.mine && (
                    <Button
                      variant="destructive"
                      iconOnly
                      label="Hapus foto"
                      icon={<Trash />}
                      onClick={() => onDelete(p)}
                    />
                  )}
                </div>
              </article>
            </div>
          );
        })}
      </div>
      {photos.length > 1 && (
        <p className={cx("t-label c-label-3", s.detailHint)}>Geser ke samping untuk foto lain</p>
      )}
    </div>
  );
}
