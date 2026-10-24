import { Check } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./JejakAcara.module.css";

export type Stamp = { id: string; no: number; label: string; state: "done" | "now" | "later" };

// Jejak acara (BT20/BT03): 4 stempel lingkaran 44 + label 12. Selesai = isi accent + ✓ putih;
// sekarang (sesi jalan / berikutnya saat jeda) = accent-soft + border accent + nomor; nanti =
// card-2 + nomor & label label-3.
export function JejakAcara({ stamps, caption }: { stamps: Stamp[]; caption: string }) {
  return (
    <section className={styles.root} aria-label="Jejak acara">
      <div className={styles.head}>
        <span className="t-label-emph">Jejak acara</span>
        <span className="t-caption c-label-2">{caption}</span>
      </div>
      <ol className={styles.row}>
        {stamps.map((s) => (
          <li key={s.id} className={cx(styles.stamp, styles[s.state])}>
            <span className={styles.circle}>
              {s.state === "done" ? (
                <Check size={20} aria-label="Selesai" />
              ) : (
                <span className="t-headline" aria-hidden>
                  {s.no}
                </span>
              )}
            </span>
            <span className={cx("t-caption", styles.label)}>{s.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
