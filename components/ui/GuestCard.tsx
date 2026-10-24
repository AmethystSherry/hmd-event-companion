import { Check } from "@/components/icons";
import { initials } from "@/lib/format";
import { igProfileUrl } from "@/lib/invite";
import { Button } from "./Button";
import styles from "./GuestCard.module.css";

// Kartu tamu ala saran IG (BT05 Tamu di sini, N3): 158×228 card-2, avatar 56 accent-soft, nama,
// @ig, peran, "Tanya soal …", Button primary sm "Buka IG". ✓ hijau di pojok avatar = udah
// datang; belum datang = avatar redup tanpa ✓.
export function GuestCard({
  name,
  ig,
  role,
  askAbout,
  here,
}: {
  name: string;
  ig: string;
  role: string | null;
  askAbout: string[];
  here: boolean;
}) {
  return (
    <article
      className={styles.card}
      aria-label={`${name}, ${here ? "udah datang" : "belum datang"}`}
    >
      <span aria-hidden className={styles.avatar} data-away={!here || undefined}>
        {initials(name)}
      </span>
      {here && (
        <span aria-hidden className={styles.here}>
          <Check size={13} weight="bold" />
        </span>
      )}
      <span className={styles.name}>{name}</span>
      <span className="t-caption c-label-3">@{ig}</span>
      {role && <span className="t-caption c-label-2">{role}</span>}
      <span className={styles.ask}>
        {askAbout.length > 0 && `Tanya soal ${askAbout.join(", ")}`}
      </span>
      <Button
        size="sm"
        href={igProfileUrl(ig)}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.cta}
      >
        Buka IG
      </Button>
    </article>
  );
}
