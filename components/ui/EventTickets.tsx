import type { CSSProperties } from "react";
import { Check, Clock, MapPin } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./EventTickets.module.css";

// F4 v3 · Tiket acara (geser): deret horizontal tinggi 88 (scroll-snap, tanpa scrollbar). Sesi
// selesai = sobekan 62×88 yang numpuk di kiri (geser 12, miring ±5°, terbaru paling atas); sesi
// sekarang / berikutnya / sebentar lagi mulai / nanti = tiket 262×88 (stub "SESI 02", garis sobek,
// takik, label status, judul, jam & ruang). Tiket dan sobekan = tombol → BT22 sesi itu (K16).

export type EventTicketState = "done" | "now" | "next" | "soon" | "later";

export type EventTicketItem = {
  id: string;
  no: number;
  title: string;
  startsAt: string;
  endsAt: string;
  room: string | null;
  state: EventTicketState;
};

const LABEL: Record<Exclude<EventTicketState, "done">, string> = {
  now: "Sedang berjalan",
  next: "Berikutnya",
  soon: "Sebentar lagi mulai",
  later: "Nanti",
};

const no2 = (n: number) => String(n).padStart(2, "0");

export function EventTickets({
  tickets,
  caption,
  onOpen,
}: {
  tickets: EventTicketItem[];
  caption: string; // "Sesi 2 dari 4" / "1 dari 4 selesai"
  onOpen?: (id: string) => void;
}) {
  const done = tickets.filter((t) => t.state === "done");
  const rest = tickets.filter((t) => t.state !== "done");
  return (
    <section className={styles.root} aria-label="Tiket acara">
      <div className={styles.head}>
        <span className="t-label-emph">Tiket acara</span>
        <span className="t-caption c-label-2">{caption}</span>
      </div>
      <ul
        className={styles.row}
        style={{ "--pile": `${done.length ? 54 + 12 * done.length : 0}px` } as CSSProperties}
      >
        {done.length > 0 && (
          <li className={styles.pile}>
            {done.map((t, i) => (
              <button
                key={t.id}
                type="button"
                className={styles.stub}
                style={{ left: i * 12, rotate: `${i % 2 ? -4 : 5}deg`, zIndex: i + 1 }}
                onClick={() => onOpen?.(t.id)}
                aria-label={`Sesi ${t.no}, ${t.title}, selesai`}
              >
                <Check size={14} />
                <span className={styles.stubNo}>{no2(t.no)}</span>
              </button>
            ))}
          </li>
        )}
        {rest.map((t) => (
          <li key={t.id} className={styles.item}>
            <button
              type="button"
              className={cx(styles.ticket, styles[t.state as Exclude<EventTicketState, "done">])}
              onClick={() => onOpen?.(t.id)}
              aria-label={[
                `Sesi ${t.no}`,
                t.title,
                LABEL[t.state as Exclude<EventTicketState, "done">].toLowerCase(),
                `${t.startsAt} sampai ${t.endsAt}`,
                t.room,
              ]
                .filter(Boolean)
                .join(", ")}
            >
              <span aria-hidden className={styles.side}>
                <span className="t-caption">SESI</span>
                <span className={styles.sideNo}>{no2(t.no)}</span>
              </span>
              <span aria-hidden className={styles.tear}>
                <span className={styles.notchTop} />
                <span className={styles.notchBottom} />
              </span>
              <span aria-hidden className={styles.body}>
                <span className={styles.status}>
                  {LABEL[t.state as Exclude<EventTicketState, "done">]}
                </span>
                <span className={cx("t-headline", styles.title)}>{t.title}</span>
                <span className={styles.meta}>
                  <span className={styles.time}>
                    <Clock size={14} />
                    {t.startsAt}–{t.endsAt}
                  </span>
                  {t.room && (
                    <span className={styles.room}>
                      <MapPin size={14} />
                      <span>{t.room}</span>
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
