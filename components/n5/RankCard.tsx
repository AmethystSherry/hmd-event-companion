import { Gift } from "@/components/icons";
import type { KenalanView } from "@/lib/kenalan";
import s from "./n5.module.css";

// N5 · BT05k kartu peringkat di sheet Tamu di sini (Figma 5324:9823): "#5" di lingkaran putih,
// "Kamu peringkat #5 dari 18", progress = kenalanmu ÷ kenalan teratas, "3 kenalan" · "#1 Dimas · 12".
// K14 (0 kenalan, TODO desain): "–" + "Belum ada kenalan", bar kosong, kanan disembunyikan kalau
// belum ada siapa pun. Setelah pemenang diumumin: baris kedua = nama pemenang (TODO copy).
export function RankCard({ view }: { view: KenalanView }) {
  const { count, rank, of, top, winner } = view;
  const pct = top && top.count > 0 ? Math.min(100, Math.round((count / top.count) * 100)) : 0;
  return (
    <section className={s.rank} aria-label="Peringkat kenalan">
      <Gift aria-hidden className={s.rankMotif} />
      <div className={s.rankTop}>
        <span className={s.rankNo} aria-hidden>
          {rank ? `#${rank}` : "–"}
        </span>
        <div className={s.rankText}>
          <p className={s.rankTitle}>
            {rank ? `Kamu peringkat #${rank} dari ${of}` : "Belum ada kenalan"}
          </p>
          <p className={s.rankSub}>
            {winner
              ? winner.isMe
                ? "Kamu pemenangnya! Samperin panitia, ya." // TODO copy
                : `${winner.firstName} menang hadiah kenalan terbanyak` // TODO copy
              : "Kenalan terbanyak dapat hadiah pas closing"}
          </p>
        </div>
      </div>
      <div className={s.rankProgress}>
        <div
          className={s.track}
          role="progressbar"
          aria-label="Kenalanmu dibanding teratas"
          aria-valuemin={0}
          aria-valuemax={top?.count ?? 0}
          aria-valuenow={count}
        >
          <span className={s.fill} style={{ width: `${pct}%` }} />
        </div>
        <div className={s.rankMeta}>
          <span>{count} kenalan</span>
          {top && (
            <span>
              #1 {top.firstName} · {top.count}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
