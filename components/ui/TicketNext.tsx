import { initials } from "@/lib/format";
import styles from "./TicketNext.module.css";

// Kartu tiket "Berikutnya" (BT03): kolom countdown kiri, garis sobek putus-putus dengan takik
// bulat di atas & bawah (warna panel `--card`), info sesi di kanan. `soon` = countdown habis →
// "Sebentar lagi · mulai" (bukan angka minus).
export function TicketNext({
  value,
  unit,
  soon,
  eyebrow,
  title,
  speaker,
  onClick,
}: {
  value: string;
  unit: string;
  soon?: boolean;
  eyebrow: string;
  title: string;
  speaker?: { name: string; ig: string } | null;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className={styles.count} aria-live="polite">
        <span className={soon ? styles.soon : styles.value}>{value}</span>
        <span className="t-caption">{unit}</span>
      </span>
      <span aria-hidden className={styles.tear}>
        <span className={styles.notchTop} />
        <span className={styles.notchBottom} />
      </span>
      <span className={styles.info}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <span className="t-headline">{title}</span>
        {speaker && (
          <span className={styles.speaker}>
            <span aria-hidden className={styles.avatar}>
              {initials(speaker.name)}
            </span>
            <span className="t-label c-label-2">
              {speaker.name} · @{speaker.ig}
            </span>
          </span>
        )}
      </span>
    </>
  );
  return onClick ? (
    <button type="button" className={styles.card} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={styles.card}>{body}</div>
  );
}
