"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  BookOpen,
  Camera,
  CaretLeft,
  ChatCircle,
  Check,
  Play,
  QrCode,
  Stop,
  Timer,
  Users,
} from "@/components/icons";
import { useServerNow } from "@/components/useServerNow";
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
  Sheet,
  StatTile,
  Toast,
  TopToast,
} from "@/components/ui";
import type { StateResult } from "@/app/panitia/actions";
import type { Event, StateAction } from "@/lib/data/types";
import { cx } from "@/lib/cx";
import { deviceLabel } from "@/lib/device";
import { dateLong, hms, msLabel, timeWib } from "@/lib/format";
import {
  actualMin,
  elapsedMs,
  lateToStart,
  overdueMin,
  type RundownView,
  type SessionView,
} from "@/lib/rundown";
import s from "./f2.module.css";

// BP00 · Kontrol acara (home hari-H panitia, Figma 4897:6694; F3: BP02 sesi berjalan · BP01 jeda):
// carousel kartu sesi dengan stopwatch + Mulai/Selesaikan (dialog BP01b/BP03, di kode BP00b/BP00a),
// stat, rundown, "Scan tiket" di bawah. Stopwatch dihitung dari startedAt server + jam server (HP
// cuma memutar detiknya). F3: waktu lewat (BP02c), pengingat lewat jam mulai, toast BP02d kalau
// state diubah HP panitia lain.

type SessionAction = (
  eventId: string,
  sessionId: string,
  by: string | null,
) => Promise<StateResult>;

// Siapa yang terakhir mengubah state acara (Event.stateBy/stateAction) → BP02d.
export type KontrolState = {
  updatedAt: string | null;
  by: string | null;
  action: StateAction | null;
};

const BP02D_MS = 4000;
type Confirm = { kind: "finish" | "start"; session: SessionView };

// F5: penutupan acara. canClose = nggak ada sesi jalan & sesi terakhir selesai (BP04).
export type KontrolFinale = {
  canClose: boolean;
  closedAt: string | null;
  lastEndedAt: string | null; // "Closing selesai {jam}"
  feedback: { respondents: number; expected: number }; // "Mengisi x/n" setelah ditutup
};

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
  finale,
  close,
  initialCloseSheet,
  state,
  initialConflict,
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
  finale?: KontrolFinale;
  close?: (eventId: string, by: string | null) => Promise<StateResult>; // F5 BP04b
  initialCloseSheet?: boolean;
  state?: KontrolState; // F3 BP02d
  initialConflict?: string; // pratinjau BP02d (/dev/states/f4)
}) {
  const base = `/panitia/event/${event.id}`;
  const now = useServerNow(serverNow, { frozen });
  const [confirm, setConfirm] = useState<Confirm | null>(initialConfirm ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [closeSheet, setCloseSheet] = useState(!!initialCloseSheet);
  const [conflict, setConflict] = useState<string | null>(initialConflict ?? null);
  const { sessions, active } = rundown;

  // BP02d "HP 7K2Q udah mulai Open space duluan. Layarmu ikut update."
  const conflictText = (by: string, action: StateAction | null) => {
    const title = sessions.find((x) => x.id === action?.sessionId)?.title ?? "sesi";
    if (action?.kind === "tutup") return `${by} udah tutup acara duluan. Layarmu ikut update.`;
    const verb = action?.kind === "selesai" ? "selesaikan" : "mulai";
    return `${by} udah ${verb} ${title} duluan. Layarmu ikut update.`;
  };

  // State acara diubah HP panitia lain (rev → SSE → refresh) → toast BP02d, dialog yang kebuka
  // ditutup. Perubahan dari HP ini sendiri (label sama) diam saja. Disesuaikan saat render
  // (state acara = props baru dari router.refresh), bukan di effect.
  const stateAt = state?.updatedAt ?? null;
  const [seenAt, setSeenAt] = useState(stateAt);
  if (stateAt !== seenAt) {
    setSeenAt(stateAt);
    if (state?.by && state.by !== deviceLabel()) {
      setConflict(conflictText(state.by, state.action));
      setConfirm(null);
      setCloseSheet(false);
    }
  }
  useEffect(() => {
    if (!conflict || initialConflict) return;
    const t = setTimeout(() => setConflict(null), BP02D_MS);
    return () => clearTimeout(t);
  }, [conflict, initialConflict]);

  // Hasil aksi: no-op karena HP lain udah duluan → toast BP02d juga.
  const settle = (r: StateResult) => {
    if (!r.ok) return setError(r.error);
    if (!r.changed && r.by && r.by !== deviceLabel()) setConflict(conflictText(r.by, r.action));
  };
  const done = sessions.filter((x) => x.state === "selesai").length;
  const closedAt = finale?.closedAt ?? null;

  // BP04b "Ya, tutup acara": idempoten di store (dobel tap / HP panitia lain = nggak berubah).
  const runClose = () => {
    if (!close) return setCloseSheet(false);
    startTransition(async () => {
      const r = await close(event.id, deviceLabel());
      setCloseSheet(false);
      settle(r);
    });
  };

  const run = () => {
    if (!confirm) return;
    const action = confirm.kind === "start" ? start : finish;
    if (!action) return setConfirm(null);
    startTransition(async () => {
      const r = await action(event.id, confirm.session.id, deviceLabel());
      setConfirm(null);
      settle(r);
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

      {closedAt ? (
        // TODO desain: BP00 setelah acara ditutup belum ada di Figma (temuan F5-deliverables).
        <Card className={s.finaleCard}>
          <p className="t-label c-label-2">Layar tamu sekarang</p>
          <p className="t-title">Acara udah ditutup</p>
          <p className="t-body c-label-2">
            Ditutup {timeWib(closedAt)}. Tamu lagi isi buku tamu & lihat kolase.
          </p>
          <Button href={`${base}/rekap`} icon={<BookOpen />}>
            Lihat rekap buku tamu
          </Button>
        </Card>
      ) : (
        sessions.length > 0 && (
          <SessionCarousel
            sessions={sessions}
            focusIndex={finale?.canClose ? sessions.length : rundown.focusIndex}
            now={now}
            date={event.date}
            waitingFor={!active && rundown.next ? rundown.next.no : null}
            disabled={!eventDay || pending}
            onAction={(session) =>
              setConfirm({ kind: session.state === "berlangsung" ? "finish" : "start", session })
            }
            finale={
              finale?.canClose ? (
                // BP04 · Jeda terakhir = kartu terakhir carousel (keputusan F5, tanpa TabBar).
                <Card className={cx(s.sessionCard, s.finaleCard)} aria-label="Jeda terakhir">
                  <p className="t-label c-label-2">Layar tamu sekarang</p>
                  <p className="t-title">Jeda terakhir</p>
                  <p className="t-body c-label-2">
                    {finale.lastEndedAt ? `Closing selesai ${timeWib(finale.lastEndedAt)}. ` : ""}
                    Tamu masih bisa foto & lihat peserta.
                  </p>
                  <Button
                    icon={<BookOpen />}
                    aria-disabled={!eventDay || pending}
                    onClick={() => eventDay && !pending && setCloseSheet(true)}
                  >
                    Tutup acara & buka buku tamu
                  </Button>
                </Card>
              ) : undefined
            }
          />
        )
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
        {closedAt && finale ? (
          <StatTile
            icon={<BookOpen size={18} />}
            value={`${finale.feedback.respondents}/${finale.feedback.expected}`}
            label="Mengisi"
            href={`${base}/rekap`}
          />
        ) : (
          <StatTile
            icon={<ChatCircle size={18} />}
            value="0"
            label="Pertanyaan"
            href={`${base}/tanya`}
          />
        )}
      </div>

      {sessions.length > 0 && (
        <Card inset>
          <div className={s.rundownHead}>
            <p className="t-headline">Rundown</p>
            <p className="t-label c-label-2">
              {active
                ? `Sesi ${active.no} lagi jalan`
                : done
                  ? `${done} dari ${sessions.length} selesai`
                  : "Belum mulai"}
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
              leading={
                x.state === "selesai" ? (
                  <span className={s.doneIcon} role="img" aria-label="Selesai">
                    <Check size={18} weight="bold" />
                  </span>
                ) : (
                  <Avatar name={String(x.no)} />
                )
              }
              title={x.title}
              subtitle={
                x.state === "selesai"
                  ? actualMin(x) !== null
                    ? `Selesai · ${actualMin(x)} mnt`
                    : "Selesai"
                  : x.state === "berlangsung"
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
            (active && active.id !== confirm.session.id
              ? `${active.title} yang lagi jalan ikut selesai. Layar semua tamu langsung pindah ke ${confirm.session.title}, stopwatch mulai jalan.`
              : `Layar semua tamu langsung pindah dari Jeda ke ${confirm.session.title}, stopwatch mulai jalan.`)}
      </Dialog>

      <Sheet
        open={closeSheet}
        onClose={() => !pending && setCloseSheet(false)}
        title="Tutup acara sekarang?"
        dismissible={!pending}
      >
        <div className={s.closeSheet}>
          <span className={s.closeIcon}>
            <BookOpen size={30} />
          </span>
          <p className="t-headline">Tutup acara sekarang?</p>
          <p className="t-body c-label-2">
            Semua HP tamu ({checkIn.checkedIn}) langsung pindah ke buku tamu dan kolase. Layar acara
            nggak bisa dibuka lagi.
          </p>
          <p className={cx("t-label", s.closeInfo)}>
            <Check size={16} weight="bold" />
            Semua sesi udah selesai · {done}/{sessions.length}
          </p>
        </div>
        <div className={s.closeActions}>
          <Button
            icon={<BookOpen />}
            aria-disabled={pending || undefined}
            aria-busy={pending || undefined}
            onClick={() => !pending && runClose()}
          >
            {pending ? "Menutup acara…" : "Ya, tutup acara"}
          </Button>
          <Button variant="secondary" onClick={() => !pending && setCloseSheet(false)}>
            Belum, kembali
          </Button>
        </div>
      </Sheet>

      {error && (
        <div className={s.toast}>
          <Toast key={error}>{error}</Toast>
        </div>
      )}
      {conflict && (
        <TopToast key={conflict} icon={<Users size={20} />} title="Diubah oleh panitia lain">
          {conflict}
        </TopToast>
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
  date,
  waitingFor,
  disabled,
  onAction,
  finale,
}: {
  sessions: SessionView[];
  focusIndex: number;
  now: number;
  date: string;
  waitingFor: number | null; // BP01: mode jeda, layar tamu nunggu sesi n
  disabled: boolean;
  onAction: (session: SessionView) => void;
  finale?: ReactNode; // F5 BP04: kartu "Jeda terakhir" sesudah sesi terakhir
}) {
  const count = sessions.length + (finale ? 1 : 0);
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
    setIndex(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  };

  return (
    <section aria-label="Sesi rundown" className={s.carouselWrap}>
      <div className={s.carouselHead}>
        <p className="t-label c-label-2">
          {waitingFor
            ? `Lagi jeda · layar tamu nunggu sesi ${waitingFor}`
            : index < sessions.length
              ? `Sesi ${index + 1} dari ${sessions.length}`
              : "Setelah sesi terakhir"}
        </p>
        <div aria-hidden className={s.dots}>
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className={cx(i === index && s.dotOn)} />
          ))}
        </div>
      </div>
      <div ref={track} className={s.carousel} onScroll={onScroll}>
        {sessions.map((x) => {
          const running = x.state === "berlangsung";
          const over = running ? overdueMin(x, now) : null;
          const late = x.state === "berikutnya" && lateToStart(date, x, now);
          return (
            <Card key={x.id} className={s.sessionCard} aria-label={`Sesi ${x.no}: ${x.title}`}>
              <div className={s.sessionTop}>
                {running ? (
                  <Badge tone="live" pulse>
                    Lagi jalan
                  </Badge>
                ) : x.state === "selesai" ? (
                  <Badge tone="success">Selesai</Badge>
                ) : x.state === "berikutnya" ? (
                  <Badge tone="crew">Berikutnya</Badge>
                ) : (
                  <Badge tone="neutral">Belum mulai</Badge>
                )}
                <span className="t-label c-label-2 tabular">
                  {x.startsAt}–{x.endsAt}
                </span>
              </div>
              <p className="t-card-title">{x.title}</p>
              <div className={s.stopwatchWrap}>
                <p
                  className={cx(
                    s.stopwatch,
                    !x.startedAt && s.stopwatchIdle,
                    over !== null && s.stopwatchOver,
                  )}
                >
                  <Timer size={22} />
                  <span className="t-number-l tabular">{hms(elapsedMs(x, now))}</span>
                </p>
                {/* BP02c · stopwatch > durasi */}
                {over !== null && (
                  <p className={cx("t-caption", s.overdue)}>
                    Lewat {over} mnt dari jadwal ({x.endsAt})
                  </p>
                )}
                {/* BP01 · jeda lewat jam mulai sesi berikutnya */}
                {late && (
                  <p className={cx("t-caption", s.lateStart)}>
                    {x.title} harusnya mulai {x.startsAt}
                  </p>
                )}
              </div>
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
        {finale}
      </div>
    </section>
  );
}
