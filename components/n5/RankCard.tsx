import type { CSSProperties, ReactNode } from "react";
import { Gift, Sparkle } from "@/components/icons";
import { cx } from "@/lib/cx";
import { rankProgress, type KenalanView } from "@/lib/kenalan";
import s from "./n5.module.css";

// N5 · BT05k kartu peringkat di sheet Yuk Kenalan (Figma 5324:9823, update 6 Nov; 5358:10340): "#5" di
// lingkaran putih bercincin emas + Sparkle, "Kamu peringkat #5 dari 18" / "{n} kenalan · kenalan
// terbanyak dapat hadiah", progress (fill = kenalanku ÷ teratas) dengan titik milestone (tepat di atasku,
// #2, #1) + label "#r · n", lalu `action` (tombol Kenalan, ganti pil "🔥 … lagi buat naik"). Label
// milestone yang terlalu dekat disembunyikan (titik tetap).
const LABEL_GAP = 18; // % lebar bar, ±57 px di kartu 350

export function RankCard({ view, action }: { view: KenalanView; action?: ReactNode }) {
  const { count, rank, of, winner } = view;
  const p = rankProgress(view);
  // Label "Kamu · n" di kiri; label milestone yang terlalu dekat dengan label sebelumnya disembunyikan.
  const labels = p.milestones.reduce<{ last: number; show: boolean[] }>(
    (acc, m) =>
      m.pct - acc.last >= LABEL_GAP
        ? { last: m.pct, show: [...acc.show, true] }
        : { last: acc.last, show: [...acc.show, false] },
    { last: 0, show: [] },
  ).show;
  return (
    <section className={s.rank} aria-label="Peringkat kenalan">
      <Gift aria-hidden className={s.rankMotif} />
      <div className={s.rankTop}>
        <span className={s.rankNo} aria-hidden>
          {rank ? `#${rank}` : "–"}
          <Sparkle weight="fill" className={s.rankSparkle} />
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
              : `${count} kenalan · kenalan terbanyak dapat hadiah`}
          </p>
        </div>
      </div>
      <div className={s.rankProgress}>
        <div
          className={s.track}
          role="progressbar"
          aria-label="Kenalanmu dibanding teratas"
          aria-valuemin={0}
          aria-valuemax={view.ladder[0]?.count ?? 0}
          aria-valuenow={count}
        >
          <span className={s.fill} style={{ width: `${p.pct}%` }} />
          {p.milestones.map((m) => (
            <span
              key={m.rank}
              aria-hidden
              className={s.milestone}
              style={{ "--at": `${m.pct}%` } as CSSProperties}
            />
          ))}
        </div>
        <div className={s.rankMeta} aria-hidden>
          <span>Kamu · {count}</span>
          {p.milestones.map((m, i) => (
            <span
              key={m.rank}
              className={cx(s.milestoneLabel, !labels[i] && s.hidden)}
              style={{ "--at": `${m.pct}%` } as CSSProperties}
            >
              #{m.rank} · {m.count}
            </span>
          ))}
        </div>
      </div>
      {action}
    </section>
  );
}
