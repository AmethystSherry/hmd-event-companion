"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  BookOpen,
  Camera,
  CaretLeft,
  ChatCircle,
  PaperPlaneTilt,
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
  SESSION_CARD_BADGE,
  type RundownView,
  type SessionView,
} from "@/lib/rundown";
import s from "./f2.module.css";

// BP02 · Kontrol acara (home hari-H panitia, Figma 4897:6694 · F3: BP02 sesi berjalan · BP01 jeda):
// carousel kartu sesi dengan stopwatch + Mulai/Selesaikan (dialog BP01b/BP03),
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

// F5 v2: penutupan acara. canClose = nggak ada sesi jalan & sesi terakhir selesai → BP04 (kartu
// "Tutup acara"); closedAt → BP05 Acara selesai (kartu "{x} dari {n} udah ngisi").
export type KontrolFinale = {
  canClose: boolean;
  closedAt: string | null;
  endsAt: string; // jam selesai event, BP04 "± 17.00"
  feedback: { respondents: number; expected: number }; // BP05 "{x} dari {n} udah ngisi"
};

export function KontrolScreen({
  event,
  rundown,
  checkIn,
  photos = 0,
  questions = { total: 0, open: 0 },
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
  initialCloseDialog,
  state,
  initialConflict,
}: {
  event: Pick<Event, "id" | "name" | "date">;
  rundown: RundownView;
  checkIn: { checkedIn: number; expected: number };
  photos?: number; // N4: jumlah foto kolase (realtime lewat rev)
  questions?: { total: number; open: number }; // N1: pertanyaan talkshow (tile → P10)
  eventDay: boolean; // badge pulse saja; Mulai/Selesaikan/Tutup & Scan manual panitia, jam = display
  phaseLabel: string; // "Hari-H · Live" / "Persiapan · H-17"
  backHref: string;
  serverNow: string;
  start?: SessionAction; // kosong = pratinjau (/dev/states/f2)
  finish?: SessionAction;
  initialConfirm?: Confirm;
  frozen?: boolean;
  finale?: KontrolFinale;
  close?: (eventId: string, by: string | null) => Promise<StateResult>; // F5 BP04b
  initialCloseDialog?: boolean;
  state?: KontrolState; // F3 BP02d
  initialConflict?: string; // pratinjau BP02d (/dev/states/f4)
}) {
  const base = `/panitia/event/${event.id}`;
  const now = useServerNow(serverNow, { frozen });
  const [confirm, setConfirm] = useState<Confirm | null>(initialConfirm ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [closeDialog, setCloseDialog] = useState(!!initialCloseDialog);
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
      setCloseDialog(false);
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
  const allDone = !closedAt && !!finale?.canClose; // BP04

  // BP04b "Ya, tutup acara": idempoten di store (dobel tap / HP panitia lain = nggak berubah).
  const runClose = () => {
    if (!close) return setCloseDialog(false);
    startTransition(async () => {
      const r = await close(event.id, deviceLabel());
      setCloseDialog(false);
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
        // Scan sejak Kontrol acara kebuka (bukan cuma hari-H): tamu datang lebih awal tetap bisa masuk.
        !closedAt ? (
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
            {closedAt ? (
              <Badge tone="neutral">Acara selesai</Badge>
            ) : (
              <Badge tone="crew" pulse={eventDay}>
                {phaseLabel}
              </Badge>
            )}
          </div>
        }
        eyebrow={`Kontrol acara · ${dateLong(event.date)}`}
        title={event.name}
      />
      {(closedAt || allDone) && (
        <p className={cx("t-label c-label-2", s.finaleSub)}>
          {closedAt
            ? `Acara ditutup ${timeWib(closedAt)} · tamu lagi isi buku tamu`
            : "Semua sesi selesai · tamu masih di layar jeda"}
        </p>
      )}

      {closedAt && finale ? (
        // BP05 · Acara selesai (home panitia setelah ditutup, Figma 5073:5946).
        <Card className={s.finaleCard} aria-label="Buku tamu">
          <div className={s.sessionTop}>
            <Badge tone="neutral">Buku tamu kebuka</Badge>
            <span className="t-label c-label-2 tabular">{timeWib(closedAt)}</span>
          </div>
          <p className="t-title">
            {finale.feedback.respondents} dari {finale.feedback.expected} udah ngisi
          </p>
          <p className="t-body c-label-2">
            Rekap update otomatis tiap ada yang ngisi. Kirim makasih via WA biar yang udah pulang
            ikut ngisi.
          </p>
          <Button href={`${base}/rekap`} icon={<BookOpen />}>
            Lihat rekap buku tamu
          </Button>
          <Button variant="secondary" href={`${base}/tamu?tab=makasih`} icon={<PaperPlaneTilt />}>
            Kirim makasih via WA
          </Button>
        </Card>
      ) : allDone ? (
        // BP04 · Semua sesi selesai (Figma 5060:29676): kartu "Tutup acara" gantikan carousel.
        <Card className={s.finaleCard} aria-label="Tutup acara">
          <div className={s.sessionTop}>
            <Badge tone="neutral">
              {done} dari {sessions.length} selesai
            </Badge>
            <span className="t-label c-label-2 tabular">± {finale!.endsAt}</span>
          </div>
          <p className="t-title">Tutup acara</p>
          <p className="t-body c-label-2">Layar semua tamu pindah ke buku tamu & kolase kulkas.</p>
          <Button
            icon={<BookOpen />}
            aria-disabled={pending}
            onClick={() => !pending && setCloseDialog(true)}
          >
            Tutup acara & buka buku tamu
          </Button>
        </Card>
      ) : (
        sessions.length > 0 && (
          <SessionCarousel
            sessions={sessions}
            focusIndex={rundown.focusIndex}
            now={now}
            date={event.date}
            waitingFor={!active && rundown.next ? rundown.next.no : null}
            disabled={pending}
            onAction={(session) =>
              setConfirm({ kind: session.state === "berlangsung" ? "finish" : "start", session })
            }
          />
        )
      )}

      <div className={s.stats}>
        <StatTile
          icon={<Users size={18} />}
          value={`${checkIn.checkedIn}/${checkIn.expected}`}
          label="Check-in"
          href={`${base}/scan/cari`}
        />
        <StatTile
          icon={<Camera size={18} />}
          value={String(photos)}
          label="Foto"
          href={`${base}/foto`} // P13 · Foto masuk (5073:6192) belum dibangun → placeholder
        />
        <StatTile
          icon={<ChatCircle size={18} />}
          value={String(questions.total)}
          label="Pertanyaan"
          href={`${base}/tanya`}
          highlight={questions.open > 0}
        />
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
              leading={<Avatar name={String(x.no)} />}
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
              ? // Band F2 BP01b: tanpa "stopwatch mulai jalan" (cuma versi dari Jeda, F3 4900:27743).
                `${active.title} yang lagi jalan ikut selesai. Layar semua tamu langsung pindah ke ${confirm.session.title}.`
              : `Layar semua tamu langsung pindah dari Jeda ke ${confirm.session.title}, stopwatch mulai jalan.`)}
      </Dialog>

      {/* BP04b · Konfirmasi tutup acara (Figma v2 5060:29745): Dialog seperti BP01b/BP03. */}
      <Dialog
        open={closeDialog}
        onClose={() => !pending && setCloseDialog(false)}
        title="Tutup acara sekarang?"
        actions={
          <>
            <Button
              aria-disabled={pending || undefined}
              aria-busy={pending || undefined}
              onClick={() => !pending && runClose()}
            >
              {pending ? "Menutup acara…" : "Ya, tutup acara"}
            </Button>
            <Button variant="secondary" onClick={() => !pending && setCloseDialog(false)}>
              Batal
            </Button>
          </>
        }
      >
        Semua HP tamu ({checkIn.checkedIn}) langsung pindah ke buku tamu & kolase. Layar acara nggak
        bisa dibuka lagi.
      </Dialog>

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
}: {
  sessions: SessionView[];
  focusIndex: number;
  now: number;
  date: string;
  waitingFor: number | null; // BP01: mode jeda, layar tamu nunggu sesi n
  disabled: boolean;
  onAction: (session: SessionView) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(focusIndex);
  const anyRunning = sessions.some((x) => x.state === "berlangsung");

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
          {waitingFor
            ? `Lagi jeda · layar tamu nunggu sesi ${waitingFor}`
            : `Sesi ${index + 1} dari ${sessions.length}`}
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
          // Urut rundown: Mulai cuma di sesi berikutnya & selagi nggak ada yang jalan.
          const locked = !running && (x.state !== "berikutnya" || anyRunning);
          const over = running ? overdueMin(x, now) : null;
          const late = x.state === "berikutnya" && lateToStart(date, x, now);
          return (
            <Card key={x.id} className={s.sessionCard} aria-label={`Sesi ${x.no}: ${x.title}`}>
              <div className={s.sessionTop}>
                <Badge tone={SESSION_CARD_BADGE[x.state].tone} pulse={running}>
                  {SESSION_CARD_BADGE[x.state].label}
                </Badge>
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
                  aria-disabled={disabled || locked}
                  onClick={() => !disabled && !locked && onAction(x)}
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
