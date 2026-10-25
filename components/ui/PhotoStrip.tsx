import { cx } from "@/lib/cx";
import styles from "./PhotoStrip.module.css";

// Strip foto (N4 BT07/BT07e): thumbnail 52 radius 12 + tile "+N" card-2 sisa foto (extra 0 = tanpa
// tile, BT07e). Tile bisa ditap (`onExtra`, BT07c: kolase lengkap kebuka pas acara selesai);
// `pressed` = garis oranye.
export function PhotoStrip({
  photos,
  extra = 0,
  onExtra,
  pressed,
  className,
}: {
  photos: { id: string; src?: string }[];
  extra?: number;
  onExtra?: () => void;
  pressed?: boolean;
  className?: string;
}) {
  if (!photos.length && extra <= 0) return null;
  return (
    <ul className={cx(styles.strip, className)} aria-label="Foto terbaru di kolase">
      {photos.map((p) => (
        <li key={p.id} className={styles.thumb}>
          {/* eslint-disable-next-line @next/next/no-img-element -- route proxy, bukan aset statis */}
          {p.src && <img src={p.src} alt="" loading="lazy" draggable={false} />}
        </li>
      ))}
      {extra > 0 && (
        <li>
          <button
            type="button"
            className={cx("t-label tabular", styles.thumb, styles.extra, pressed && styles.pressed)}
            onClick={onExtra}
            aria-label={`${extra} foto lainnya`}
          >
            +{extra}
          </button>
        </li>
      )}
    </ul>
  );
}
