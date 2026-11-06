import { cx } from "@/lib/cx";
import { initials } from "@/lib/format";
import type { KenalanRow } from "@/lib/kenalan";
import s from "./n5.module.css";

// N5 · Leaderboard (P14 Papan kenalan panitia & sheet Leaderboard tamu, Figma 6 Nov). Podium 3 kolom
// sama lebar #2 · #1 · #3, rata bawah: avatar inisial (48; #1 56) bercincin warna medali, nama depan,
// "{n} Point" (scan +2, discan +1), balok bernomor (tinggi #1 104 · #2 78 · #3 58, gradien medali). Lalu daftar mulai #4:
// nomor, avatar 32, nama + "Terakhir kenalan {jam}", "{n} Point" di kanan. `framed` = daftar di kartu
// putih (halaman panitia berlatar abu); di sheet tamu langsung di atas latar sheet. < 3 tamu → kolom
// podium yang nggak ada disembunyikan, posisi tetap. Urutan dari `kenalanRanking`, tanpa logika baru.
const MEDAL = { 1: "gold", 2: "silver", 3: "bronze" } as const;

export function Leaderboard({ rows, framed }: { rows: KenalanRow[]; framed?: boolean }) {
  const at = (rank: 1 | 2 | 3) => rows.find((r) => r.rank === rank) ?? null;
  return (
    <div className={s.leaderboard}>
      <ol className={s.podium} aria-label="Tiga teratas">
        {([2, 1, 3] as const).map((rank) => {
          const r = at(rank);
          return (
            <li
              key={rank}
              className={cx(s.podiumCol, s[MEDAL[rank]], rank === 1 && s.podiumFirst)}
              aria-hidden={!r || undefined}
              aria-label={r ? `Peringkat ${rank}, ${r.name}, ${r.points} point` : undefined}
            >
              {r && (
                <>
                  <span aria-hidden className={s.podiumAvatar}>
                    {initials(r.name)}
                  </span>
                  <span aria-hidden className={s.podiumName}>
                    {r.firstName}
                  </span>
                  <span aria-hidden className={s.podiumCount}>
                    {r.points} Point
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
      {rows.length > 3 && (
        <ol className={cx(s.boardList, framed && s.boardFramed)} aria-label="Peringkat berikutnya">
          {rows.slice(3).map((r) => (
            <li
              key={r.guestId}
              className={s.boardRow}
              aria-label={`Peringkat ${r.rank}, ${r.name}, ${r.points} point, terakhir ${r.lastLabel}`}
            >
              <span aria-hidden className={s.boardRank}>
                {r.rank}
              </span>
              <span aria-hidden className={s.boardAvatar}>
                {initials(r.name)}
              </span>
              <span aria-hidden className={s.boardText}>
                <span className={s.boardName}>{r.name}</span>
                <span className="t-caption c-label-2">Terakhir kenalan {r.lastLabel}</span>
              </span>
              <span aria-hidden className={s.boardCount}>
                {r.points} Point
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
