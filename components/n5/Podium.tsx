import { cx } from "@/lib/cx";
import { initials } from "@/lib/format";
import type { KenalanRow } from "@/lib/kenalan";
import s from "./n5.module.css";

// N5 · P14 podium (Figma 5332:9807, 6 Nov): 3 kolom sama lebar #2 · #1 · #3, rata bawah. Tiap kolom:
// avatar inisial (48; #1 56) bercincin warna medali + badge nomor 22, nama depan, "{n} kenalan", balok
// bernomor (tinggi #1 104 · #2 78 · #3 58, gradien medali). < 3 tamu → kolom yang nggak ada
// disembunyikan, posisi tetap (#1 di tengah). Urutan dari `kenalanRanking`, nggak ada logika baru.
const MEDAL = { 1: "gold", 2: "silver", 3: "bronze" } as const;

export function Podium({ rows }: { rows: KenalanRow[] }) {
  const at = (rank: 1 | 2 | 3) => rows.find((r) => r.rank === rank) ?? null;
  return (
    <ol className={s.podium} aria-label="Tiga teratas">
      {([2, 1, 3] as const).map((rank) => {
        const r = at(rank);
        return (
          <li
            key={rank}
            className={cx(s.podiumCol, s[MEDAL[rank]], rank === 1 && s.podiumFirst)}
            aria-hidden={!r || undefined}
            aria-label={r ? `Peringkat ${rank}, ${r.name}, ${r.count} kenalan` : undefined}
          >
            {r && (
              <>
                <span aria-hidden className={s.podiumAvatar}>
                  {initials(r.name)}
                  <span className={s.podiumBadge}>{rank}</span>
                </span>
                <span aria-hidden className={s.podiumName}>
                  {r.firstName}
                </span>
                <span aria-hidden className={s.podiumCount}>
                  {r.count} kenalan
                </span>
                <span aria-hidden className={s.podiumStep}>
                  {rank}
                </span>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
