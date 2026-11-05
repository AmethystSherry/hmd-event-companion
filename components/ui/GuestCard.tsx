import { Check, HandWaving, InstagramLogo } from "@/components/icons";
import { initials } from "@/lib/format";
import { igProfileUrl } from "@/lib/invite";
import { Button } from "./Button";
import styles from "./GuestCard.module.css";

// Kartu tamu ala saran IG (BT05 Tamu di sini, N3): 158×228 card-2, avatar 56 accent-soft, nama,
// @ig, peran, "Tanya soal …", Button primary sm "Buka IG". ✓ hijau di pojok avatar = udah
// datang; belum datang = avatar redup tanpa ✓.
// N5 (BT05k): prop `kenalan` → tombol utama "Kenalan" (HandWaving, → BTk1) / "Kenal" (Check,
// secondary, tap = toast K6) + IG jadi tombol ikon. `disabled` = tamu belum datang / papan tutup.
export type GuestCardKenalan =
  | { state: "bisa"; href: string; disabled?: false }
  | { state: "bisa"; disabled: true }
  | { state: "kenal"; onPress: () => void };

export function GuestCard({
  name,
  ig,
  role,
  askAbout,
  here,
  kenalan,
}: {
  name: string;
  ig: string;
  role: string | null;
  askAbout: string[];
  here: boolean;
  kenalan?: GuestCardKenalan;
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
      {kenalan ? (
        <div className={styles.actions}>
          {kenalan.state === "kenal" ? (
            <Button
              size="sm"
              variant="secondary"
              icon={<Check />}
              onClick={kenalan.onPress}
              className={styles.main}
              aria-label={`Udah kenal ${name}`}
            >
              Kenal
            </Button>
          ) : kenalan.disabled ? (
            <Button
              size="sm"
              icon={<HandWaving />}
              aria-disabled
              className={styles.main}
              aria-label={`Kenalan sama ${name}`}
            >
              Kenalan
            </Button>
          ) : (
            <Button
              size="sm"
              icon={<HandWaving />}
              href={kenalan.href}
              className={styles.main}
              aria-label={`Kenalan sama ${name}`}
            >
              Kenalan
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            iconOnly
            label={`Buka Instagram ${name}`}
            icon={<InstagramLogo />}
            href={igProfileUrl(ig)}
            target="_blank"
            rel="noopener noreferrer"
          />
        </div>
      ) : (
        <Button
          size="sm"
          href={igProfileUrl(ig)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cta}
        >
          Buka IG
        </Button>
      )}
    </article>
  );
}
