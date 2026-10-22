import type { ReactNode } from "react";
import { Check } from "@/components/icons";
import type { Session } from "@/lib/data/types";
import { cx } from "@/lib/cx";
import styles from "./RundownList.module.css";

// Rundown: segmen progres 4 bagian + list (BP01/BP04 panitia = amber, BT04 tamu = oranye).
// Warna: selesai = Ink · berikutnya/berjalan = tint · belum = card-2.
type Tone = "crew" | "accent";

export function RundownSegments({ sessions, tone }: { sessions: Session[]; tone: Tone }) {
  return (
    <div className={styles.segments} aria-hidden>
      {sessions.map((s) => (
        <span
          key={s.id}
          className={cx(
            styles.segment,
            s.status === "selesai" && styles.done,
            (s.status === "berikutnya" || s.status === "berlangsung") && styles[tone],
          )}
        />
      ))}
    </div>
  );
}

export function RundownList({
  sessions,
  tone,
  sub,
  onSelect,
}: {
  sessions: Session[];
  tone: Tone;
  sub: (s: Session) => ReactNode;
  onSelect?: (s: Session) => void;
}) {
  return (
    <ul className={styles.list}>
      {sessions.map((s) => {
        const done = s.status === "selesai";
        const hot = s.status === "berikutnya" || s.status === "berlangsung";
        const body = (
          <>
            <span
              className={cx(
                styles.circle,
                done && styles.circleDone,
                hot && styles[`${tone}Circle`],
              )}
            >
              {done ? <Check size={16} /> : <span className="t-label-emph">{s.order}</span>}
            </span>
            <span className={styles.text}>
              <span className={cx("t-body-emph", done && "c-label-2")}>{s.title}</span>
              <span className={cx("t-label", hot ? styles[`${tone}Text`] : "c-label-2")}>
                {sub(s)}
              </span>
            </span>
            <span className="t-label c-label-2 tabular">{s.startsAt}</span>
          </>
        );
        return (
          <li key={s.id} className={styles.item}>
            {onSelect ? (
              <button type="button" className={styles.row} onClick={() => onSelect(s)}>
                {body}
              </button>
            ) : (
              <div className={styles.row}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
