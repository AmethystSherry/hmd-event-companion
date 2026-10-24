"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Camera,
  CaretLeft,
  ChatCircle,
  Play,
  QrCode,
  Stop,
  Timer,
  Users,
} from "@/components/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dialog,
  IconButton,
  ListRow,
  Screen,
  ScreenHeader,
  StatTile,
  Toast,
} from "@/components/ui";
import type { FormResult } from "@/app/panitia/actions";
import type { Event } from "@/lib/data/types";
import { cx } from "@/lib/cx";
import { dateLong, hms, msLabel } from "@/lib/format";
import { elapsedMs, type RundownView, type SessionView } from "@/lib/rundown";
import s from "./f2.module.css";

// BP00 · Kontrol acara (home hari-H panitia, Figma 4897:6694): carousel kartu sesi dengan
// stopwatch + Mulai/Selesaikan (dialog BP00b/BP00a), stat, rundown, "Scan tiket" di bawah.
// Stopwatch dihitung dari startedAt server + jam server (HP cuma memutar detiknya).

type SessionAction = (eventId: string, sessionId: string) => Promise<FormResult>;
type Confirm = { kind: "finish" | "start"; session: SessionView };

// Jam server yang ikut berjalan: selisih jam HP ↔ server diambil sekali saat render.
function useServerNow(serverNow: string, frozen?: boolean): number {
  const base = new Date(serverNow).getTime();
  const [now, setNow] = useState(base);
  useEffect(() => {
    if (frozen) return;
    const skew = base - Date.now();
    const t = setInterval(() => setNow(Date.now() + skew), 1000);
    return () => clearInterval(t);
  }, [base, frozen]);
  return now;
}

export function KontrolScreen({
  event,
  rundown,
  checkIn,
  photos = 0,
  eventDay,
  phaseLabel,
  backHref,
  serverNow,
  start,
  finish,
  initialConfirm,
  frozen,
}: {
  event: Pick<Event, "id" | "name" | "date">;
  rundown: RundownView;
  checkIn: { checkedIn: number; expected: number };
  photos?: number; // N4: jumlah foto kolase (realtime lewat rev)
  eventDay: boolean; // sebelum hari-H: sesi belum bisa dimulai, Scan belum ada
  phaseLabel: string; // "Hari-H · Live" / "Persiapan · H-17"
  backHref: string;
  serverNow: string;
  start?: SessionAction; // kosong = pratinjau (/dev/states/f2)
  finish?: SessionAction;
  initialConfirm?: Confirm;
  frozen?: boolean;
}) {
  const base = `/panitia/event/${event.id}`;
  const now = useServerNow(serverNow, frozen);
  const [confirm, setConfirm] = useState<Confirm | null>(initialConfirm ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { sessions, active } = rundown;

  const run = () => {
    if (!confirm) return;
    const action = confirm.kind === "start" ? start : finish;
    if (!action) return setConfirm(null);
    startTransition(async () => {
      const r = await action(event.id, confirm.session.id);
      setConfirm(null);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <Screen
      bottom={
        eventDay ? (
          <Button href={`${base}/scan`} icon={<QrCode />}>
            Scan tiket
          </Button>
        ) : undefined
      }
    >
      <ScreenHeader
        leading={
          <div className={s.toolbar}>
            <IconButton href={backHref} label="Kembali" icon={<CaretLeft />} />
            <Badge tone="crew" pulse={eventDay}>
              {phaseLabel}
            </Badge>
          </div>
        }
        eyebrow={`Kontrol acara · ${dateLong(event.date)}`}
        title={event.name}
      />

      {sessions.length > 0 && (
        <SessionCarousel
          sessions={sessions}
          focusIndex={rundown.focusIndex}
          now={now}
          disabled={!eventDay || pending}
          onAction={(session) =>
            setConfirm({ kind: session.state === "berlangsung" ? "finish" : "start", session })
          }
        />
      )}

      <div className={s.stats}>
        <StatTile
          icon={<Users size={18} />}
          value={`${checkIn.checkedIn}/${checkIn.expected}`}
          label="Check-in"
          href={eventDay ? `${base}/scan/cari` : undefined}
        />
        <StatTile
          icon={<Camera size={18} />}
          value={String(photos)}
          label="Foto"
          href={`${base}/foto`}
        />
        <StatTile
          icon={<ChatCircle size={18} />}
          value="0"
          label="Pertanyaan"
          href={`${base}/tanya`}
        />
      </div>

      {sessions.length > 0 && (
        <Card inset>
          <div className={s.rundownHead}>
            <p className="t-headline">Rundown</p>
            <p className="t-label c-label-2">
              {active ? `Sesi ${active.no} lagi jalan` : "Belum mulai"}
            </p>
          </div>
          <div aria-hidden className={s.progress}>
            {sessions.map((x) => (
              <span
                key={x.id}
                className={cx(x.state === "berlangsung" && s.done, x.state === "selesai" && s.past)}
              />
            ))}
          </div>
          {sessions.map((x) => (
            <ListRow
              key={x.id}
              leading={<Avatar name={String(x.no)} />}
              title={x.title}
              subtitle={
                x.state === "berlangsung"
                  ? `Lagi jalan · ${msLabel(elapsedMs(x, now))}`
                  : x.state === "berikutnya"
                    ? `Berikutnya · PIC ${x.pic}`
                    : `PIC ${x.pic}`
              }
              trailing={<span className="tabular">{x.startsAt}</span>}
            />
          ))}
        </Card>
      )}

      <Dialog
        open={!!confirm}
        onClose={() => !pending && setConfirm(null)}
        title={
          confirm?.kind === "finish"
            ? `Selesaikan ${confirm.session.title}?`
            : `Mulai ${confirm?.session.title} sekarang?`
        }
        actions={
          <>
            <Button onClick={run} aria-disabled={pending}>
              {confirm?.kind === "finish" ? "Ya, selesaikan" : "Ya, mulai"}
            </Button>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Batal
            </Button>
          </>
        }
      >
        {confirm?.kind === "finish"
          ? `Udah jalan ${hms(elapsedMs(confirm.session, now))}. Layar tamu otomatis jeda sampai kamu mulai sesi berikutnya.`
          : confirm &&
            `${active && active.id !== confirm.session.id ? `${active.title} yang lagi jalan ikut selesai. ` : ""}Layar semua tamu langsung pindah ke ${confirm.session.title}.`}
      </Dialog>

      {error && (
        <div className={s.toast}>
          <Toast key={error}>{error}</Toast>
        </div>
      )}
    </Screen>
  );
}

// Carousel kartu sesi: 1 kartu per layar + intip kartu berikutnya (scroll-snap), "Sesi n dari N"
// + titik (aktif = pil). Dibuka langsung di sesi yang jalan / berikutnya.
function SessionCarousel({
  sessions,
  focusIndex,
  now,
  disabled,
  onAction,
}: {
  sessions: SessionView[];
  focusIndex: number;
  now: number;
  disabled: boolean;
  onAction: (session: SessionView) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(focusIndex);

  useEffect(() => {
    const el = track.current;
    const card = el?.children[focusIndex] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 16 });
  }, [focusIndex]);

  const onScroll = () => {
    const el = track.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    const step = first.offsetWidth + 12;
    setIndex(Math.min(sessions.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  };

  return (
    <section aria-label="Sesi rundown" className={s.carouselWrap}>
      <div className={s.carouselHead}>
        <p className="t-label c-label-2">
          Sesi {index + 1} dari {sessions.length}
        </p>
        <div aria-hidden className={s.dots}>
          {sessions.map((x, i) => (
            <span key={x.id} className={cx(i === index && s.dotOn)} />
          ))}
        </div>
      </div>
      <div ref={track} className={s.carousel} onScroll={onScroll}>
        {sessions.map((x) => {
          const running = x.state === "berlangsung";
          return (
            <Card key={x.id} className={s.sessionCard} aria-label={`Sesi ${x.no}: ${x.title}`}>
              <div className={s.sessionTop}>
                {running ? (
                  <Badge tone="live" pulse>
                    Lagi jalan
                  </Badge>
                ) : x.state === "selesai" ? (
                  <Badge tone="success">Selesai</Badge>
                ) : (
                  <Badge tone="neutral">Belum mulai</Badge>
                )}
                <span className="t-label c-label-2 tabular">
                  {x.startsAt}–{x.endsAt}
                </span>
              </div>
              <p className="t-card-title">{x.title}</p>
              <p className={cx(s.stopwatch, !x.startedAt && s.stopwatchIdle)}>
                <Timer size={22} />
                <span className="t-number-l tabular">{hms(elapsedMs(x, now))}</span>
              </p>
              {running ? (
                <Button
                  variant="secondary"
                  icon={<Stop />}
                  aria-disabled={disabled}
                  onClick={() => !disabled && onAction(x)}
                >
                  Selesaikan sesi
                </Button>
              ) : (
                <Button
                  icon={<Play />}
                  aria-disabled={disabled}
                  onClick={() => !disabled && onAction(x)}
                >
                  Mulai sesi
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
