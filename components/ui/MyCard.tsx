import { cardSubtitle } from "@/lib/card";
import { cx } from "@/lib/cx";
import { initials, keyLabel } from "@/lib/format";
import { LogoMark } from "./Logo";
import styles from "./MyCard.module.css";

// Kartu kamu (N3 · BT05 & live preview T11): tiket gelap --cta, "HOUSE MOVING DAY · TAMU" + nomor
// kunci, avatar inisial, "@ig · pekerjaan" (kosong → "belum isi pekerjaan", T11e), chip minat.
export function MyCard({
  name,
  ig,
  keyNo,
  role,
  askAbout,
}: {
  name: string;
  ig: string;
  keyNo: number;
  role: string | null;
  askAbout: string[];
}) {
  return (
    <article className={styles.card} aria-label="Kartu kamu">
      <div className={styles.head}>
        <span className={styles.eyebrow}>House Moving Day · Tamu</span>
        <span className={cx("t-label-emph", styles.no)}>{keyLabel(keyNo)}</span>
      </div>
      <span aria-hidden className={styles.tear} />
      <div className={styles.body}>
        <div className={styles.top}>
          <span aria-hidden className={styles.avatar}>
            {initials(name)}
          </span>
          <span className={styles.name}>
            <span className="t-headline">{name}</span>
            <span className="t-label">{cardSubtitle(ig, role)}</span>
          </span>
        </div>
        {askAbout.length > 0 && (
          <ul className={styles.chips} aria-label="Tanya aku soal">
            {askAbout.map((a) => (
              <li key={a} className="t-caption">
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>
      <span aria-hidden className={styles.logo}>
        <LogoMark size={84} title="" />
      </span>
      <span aria-hidden className={cx(styles.notch, styles.notchL)} />
      <span aria-hidden className={cx(styles.notch, styles.notchR)} />
    </article>
  );
}
