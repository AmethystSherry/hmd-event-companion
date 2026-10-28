import { cx } from "@/lib/cx";
import styles from "./PhotoStack.module.css";

// Tumpukan foto (28 Okt, galeri tamu di samping tombol kamera): maks 3 thumbnail berkotak
// membulat, miring bertumpuk, terbaru paling atas + badge jumlah. Tap = buka galeri.
// `src` = URL thumbnail (foto antre: object URL dari pemanggil); kosong = kotak abu.
export type StackPhoto = { id: string; src?: string };

const TILTS = [0, -12, -24]; // atas → bawah

export function PhotoStack({
  photos,
  count,
  label,
  onClick,
  className,
}: {
  photos: StackPhoto[]; // terbaru dulu
  count: number;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  const top = photos.slice(0, 3);
  const urls = top.map((p) => p.src);

  return (
    <button
      type="button"
      className={cx(styles.stack, className)}
      onClick={onClick}
      aria-label={label}
    >
      {top
        .map((p, i) => (
          <span
            key={p.id}
            aria-hidden
            className={cx(styles.card, !urls[i] && styles.empty)}
            style={{ transform: `rotate(${TILTS[i]}deg) translateX(${-i * 9}px)`, zIndex: 3 - i }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail lewat route proxy */}
            {urls[i] && <img src={urls[i]} alt="" draggable={false} />}
          </span>
        ))
        .reverse()}
      {count > 0 && (
        <span aria-hidden className={cx("tabular", styles.badge)}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
