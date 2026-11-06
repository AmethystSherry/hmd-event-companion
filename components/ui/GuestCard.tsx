import { initials } from "@/lib/format";
import { igProfileUrl } from "@/lib/invite";
import styles from "./GuestCard.module.css";

// Kartu tamu ala saran IG (BT05 Tamu di sini, N3; Figma BT05k 5358:10227): 158×188 card-2, rata kiri,
// avatar 56 accent-soft, nama, @ig, peran, "Tanya soal …". Pil "● Hadir" hijau di pojok kanan atas =
// udah datang; belum datang = avatar redup tanpa pil. (6 Nov) Tanpa tombol: seluruh kartu = link ke
// Instagram tamu (tab baru). Tombol Kenalan ada di kartu peringkat (RankCard) sheet Yuk Kenalan.
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
    <a
      href={igProfileUrl(ig)}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
      aria-label={`${name}, ${here ? "udah datang" : "belum datang"}. Buka Instagram @${ig}`}
    >
      <span aria-hidden className={styles.avatar} data-away={!here || undefined}>
        {initials(name)}
      </span>
      {here && (
        <span aria-hidden className={styles.here}>
          Hadir
        </span>
      )}
      <span className={styles.name}>{name}</span>
      <span className="t-caption c-label-3">@{ig}</span>
      {role && <span className="t-caption c-label-2">{role}</span>}
      <span className={styles.ask}>
        {askAbout.length > 0 && `Tanya soal ${askAbout.join(", ")}`}
      </span>
    </a>
  );
}
