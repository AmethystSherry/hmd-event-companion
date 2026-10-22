"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowClockwise,
  BookOpen,
  Camera,
  CaretLeft,
  CaretRight,
  Check,
  Coffee,
  Info,
  ListBullets,
  MapPin,
  PaperPlaneTilt,
  Users,
  WifiSlash,
} from "@/components/icons";
import { RundownList, RundownSegments } from "@/components/RundownList";
import {
  Avatar,
  Badge,
  Button,
  Card,
  HeroState,
  IconButton,
  Pill,
  Screen,
  ScreenHeader,
  Toast,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import type { EventSnapshot, Session } from "@/lib/data/types";
import { minutesUntil, untilLabel } from "@/lib/event";
import { timeWib } from "@/lib/format";
import { useEventSnapshot } from "@/lib/useEventSnapshot";
import { askQuestion } from "./actions";
import styles from "./event.module.css";

type Stats = { checkedIn: number; photos: number; recentNames: string[] };

const STATS_REFRESH_MS = 15_000;

// Layar acara tamu: HP ngikutin panitia sendiri (prd.md §6). Tidak ada navigasi selain
// tile Rundown (BT04). Mode baru diumumkan ke pembaca layar + getar singkat.
export function EventScreen({
  token,
  firstName,
  initial,
  stats,
}: {
  token: string;
  firstName: string;
  initial: EventSnapshot;
  stats: Stats;
}) {
  const router = useRouter();
  const { snap, stale, lastSync } = useEventSnapshot(initial, token);
  const [now, setNow] = useState(() => Date.now());
  const [view, setView] = useState<"main" | "rundown">("main");
  const [announce, setAnnounce] = useState("");
  const lastMode = useRef(`${initial.event.mode}:${initial.event.activeSession}`);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) router.refresh();
    }, STATS_REFRESH_MS);
    return () => clearInterval(t);
  }, [router]);

  const ordered = [...snap.sessions].sort((a, b) => a.order - b.order);
  const active = ordered.find((s) => s.id === snap.event.activeSession) ?? null;
  const next = ordered.find((s) => s.id === snap.event.nextSession) ?? null;

  // Pergantian mode: umumkan & getar ringan (Android).
  useEffect(() => {
    const key = `${snap.event.mode}:${snap.event.activeSession}`;
    if (key === lastMode.current) return;
    lastMode.current = key;
    const text = active
      ? `Sesi dimulai: ${active.title}`
      : snap.event.mode === "closed"
        ? "Acara selesai"
        : "Lagi jeda";
    const t = setTimeout(() => {
      setAnnounce(text);
      setView("main");
    }, 0);
    try {
      navigator.vibrate?.(30);
    } catch {}
    return () => clearTimeout(t);
  }, [snap.event.mode, snap.event.activeSession, active]);

  if (snap.event.mode === "closed") {
    return (
      <Screen>
        <HeroState icon={<BookOpen />} title="Makasih udah mampir ke rumah baru!">
          Buku tamu &amp; kolase dibuka sebentar lagi.
        </HeroState>
      </Screen>
    );
  }

  const live = (
    <p className="sr-only" aria-live="polite">
      {announce}
    </p>
  );

  if (view === "rundown") {
    return (
      <>
        {live}
        <RundownView
          sessions={ordered}
          next={next}
          active={active}
          now={now}
          onBack={() => setView("main")}
        />
      </>
    );
  }

  return (
    <>
      {live}
      {active ? (
        <SessionView
          session={active}
          now={now}
          token={token}
          firstName={firstName}
          stale={stale}
          lastSync={lastSync}
        />
      ) : (
        <JedaView
          sessions={ordered}
          next={next}
          now={now}
          stats={stats}
          stale={stale}
          lastSync={lastSync}
          onRundown={() => setView("rundown")}
        />
      )}
    </>
  );
}

// S01 · Sinyal lemah: data terakhir + jam sinkron; ketuk untuk muat ulang.
function WeakSignal({ lastSync }: { lastSync: string }) {
  return (
    <div className={styles.weak} role="status">
      <span className={styles.weakIcon}>
        <WifiSlash size={18} />
      </span>
      <span className={styles.stack}>
        <span className="t-body-emph">Sinyal lagi lemah</span>
        <span className="t-label c-label-2">
          Data terakhir {timeWib(lastSync)} · tiketmu tetap bisa dipakai
        </span>
      </span>
      <button
        type="button"
        className={styles.retry}
        aria-label="Muat ulang"
        onClick={() => location.reload()}
      >
        <ArrowClockwise size={18} />
      </button>
    </div>
  );
}

// BT03 / BT03b / BT10 · Jeda
function JedaView({
  sessions,
  next,
  now,
  stats,
  stale,
  lastSync,
  onRundown,
}: {
  sessions: Session[];
  next: Session | null;
  now: number;
  stats: Stats;
  stale: boolean;
  lastSync: string;
  onRundown: () => void;
}) {
  const done = sessions.filter((s) => s.status === "selesai");
  const lastDone = [...done].sort((a, b) => ((a.endedAt ?? "") < (b.endedAt ?? "") ? 1 : -1))[0];
  const mins = next ? minutesUntil(next.startsAt, new Date(now)) : 0;
  const until = untilLabel(mins);
  const others = Math.max(0, stats.checkedIn - stats.recentNames.length);

  const info = lastDone
    ? {
        title: `${lastDone.title} selesai, makasih udah ${lastDone.type === "talkshow" ? "nanya" : "ikut"}!`,
        body: "Isi jedanya buat kenalan atau foto-foto.",
      }
    : {
        title: "Lagi jeda, santai dulu",
        body: "Kopi di dapur. Kenalan, atau isi kulkas polaroid.",
      };

  return (
    <Screen
      bottomHeight={82}
      bottom={
        <>
          <p className={cx("t-label c-label-2", styles.caption)}>
            {stats.photos} foto udah nempel di kulkas
          </p>
          <Button icon={<Camera />} disabled aria-label="Foto buat kolase (segera hadir)">
            Foto buat kolase
          </Button>
        </>
      }
    >
      <ScreenHeader
        eyebrow="Minggu, 8 Nov · Rumah baru Potara"
        title="Lagi jeda"
        trailing={
          <Badge tone="neutral" className={styles.cardBadge}>
            Mode jeda
          </Badge>
        }
      />
      {stale && <WeakSignal lastSync={lastSync} />}

      {next ? (
        <Card>
          <div className={styles.between}>
            <span className="t-label c-label-2">Selanjutnya</span>
            <Pill icon={<MapPin />}>{next.room}</Pill>
          </div>
          <h2 className="t-title">{next.title}</h2>
          <p className={cx("t-body c-label-2", styles.teaser)}>{next.teaser}</p>
          <hr className={styles.sep} />
          {mins > 0 ? (
            <div
              className={styles.countdown}
              role="timer"
              aria-label={`${until.value} ${until.unit}`}
            >
              <span className="t-display">{until.value}</span>
              <span className={styles.stack}>
                <span className={cx("t-body-emph", styles.accent)}>{until.unit}</span>
                <span className="t-label c-label-2">Mulai {next.startsAt}</span>
              </span>
            </div>
          ) : (
            // BT03b · Countdown habis tapi panitia belum Mulai (bukan angka minus).
            <div className={styles.soon}>
              <span className="t-card-title">Sebentar lagi mulai</span>
              <span className="t-label c-label-2">
                Jadwal {next.startsAt} · tunggu aba-aba panitia
              </span>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <span className="t-label c-label-2">Selanjutnya</span>
          <h2 className="t-title">Penutupan</h2>
          <p className="t-body c-label-2">
            Semua sesi udah selesai. Tunggu panitia buka buku tamu ya.
          </p>
        </Card>
      )}

      <div className={styles.tiles}>
        <button
          type="button"
          className={styles.tile}
          onClick={onRundown}
          aria-label="Lihat rundown"
        >
          <span className={styles.tileTop}>
            <ListBullets size={18} />
            <CaretRight size={16} className={styles.caret} />
          </span>
          <span className="t-number-m">
            {done.length} / {sessions.length}
          </span>
          <span className="t-label c-label-2">bagian selesai</span>
          <span className={styles.tileFoot}>
            <RundownSegments sessions={sessions} tone="accent" />
          </span>
        </button>
        <div className={styles.tile}>
          <span className={styles.tileTop}>
            <Users size={18} />
          </span>
          <span className="t-number-m">{stats.checkedIn}</span>
          <span className="t-label c-label-2">di dalam</span>
          <span className={cx(styles.tileFoot, styles.avatars)}>
            {stats.recentNames.map((n) => (
              <span key={n} className={styles.avatarRing}>
                <Avatar name={n} size={24} />
              </span>
            ))}
            {others > 0 && (
              <span className={cx("t-caption c-label-2", styles.more)}>+{others}</span>
            )}
          </span>
        </div>
      </div>

      {!stale && (
        <div className={styles.infoCard}>
          <span className={styles.infoIcon}>
            <Coffee size={20} />
          </span>
          <span className={styles.stack}>
            <span className="t-body-emph">{info.title}</span>
            <span className="t-label c-label-2">{info.body}</span>
          </span>
        </div>
      )}
    </Screen>
  );
}

// BT04 · Jeda · Rundown (read-only, status ikut panitia)
function RundownView({
  sessions,
  next,
  active,
  now,
  onBack,
}: {
  sessions: Session[];
  next: Session | null;
  active: Session | null;
  now: number;
  onBack: () => void;
}) {
  const done = sessions.filter((s) => s.status === "selesai").length;
  return (
    <Screen withBack>
      <div className={styles.between}>
        <IconButton label="Kembali" icon={<CaretLeft />} onClick={onBack} />
        {active ? (
          <Badge tone="live" pulse>
            Live
          </Badge>
        ) : (
          <Badge tone="neutral" className={styles.cardBadge}>
            Mode jeda
          </Badge>
        )}
      </div>
      <ScreenHeader eyebrow="Minggu, 8 Nov · 13.00 – 17.00" title="Rundown acara" />
      <Card className={styles.rundownCard}>
        <div className={styles.between}>
          <span className="t-body-emph">
            {done} dari {sessions.length} selesai
          </span>
          {next && <span className={cx("t-label", styles.accent)}>Berikutnya {next.startsAt}</span>}
        </div>
        <RundownSegments sessions={sessions} tone="accent" />
        <RundownList
          sessions={sessions}
          tone="accent"
          sub={(s) => {
            if (s.status === "selesai") return "Selesai";
            if (s.status === "berlangsung") return "Sedang berlangsung";
            if (s.status === "berikutnya") {
              const m = minutesUntil(s.startsAt, new Date(now));
              const u = untilLabel(m);
              return m > 0 ? `Berikutnya · ${u.value} ${u.unit}` : "Berikutnya · sebentar lagi";
            }
            return "Nanti";
          }}
        />
      </Card>
      <div className={styles.infoCard}>
        <span className={cx(styles.infoIcon, styles.infoSmall)}>
          <Info size={18} />
        </span>
        <span className="t-label c-label-2">Jadwal bisa geser. Layarmu otomatis ikut panitia.</span>
      </div>
    </Screen>
  );
}

// BT08 · Sesi talkshow (+ kolom tanya) · BT11 · Sesi info (+ titik tur)
function SessionView({
  session,
  now,
  token,
  firstName,
  stale,
  lastSync,
}: {
  session: Session;
  now: number;
  token: string;
  firstName: string;
  stale: boolean;
  lastSync: string;
}) {
  const elapsedMin = session.startedAt ? (now - new Date(session.startedAt).getTime()) / 60000 : 0;
  const pct = Math.min(100, Math.max(0, (elapsedMin / session.durationMin) * 100));
  const left = Math.max(0, Math.ceil(session.durationMin - elapsedMin));
  const startedAt = session.startedAt ? timeWib(session.startedAt) : session.startsAt;
  // Titik tur aktif bergeser sesuai waktu (rata per titik).
  const stop = session.points.length
    ? Math.min(session.points.length - 1, Math.floor((pct / 100) * session.points.length))
    : -1;

  return (
    <Screen>
      <ScreenHeader
        eyebrow={`Sedang berlangsung · ${session.room}`}
        title={session.title}
        trailing={
          <Badge tone="live" pulse>
            Live
          </Badge>
        }
      />
      {stale && <WeakSignal lastSync={lastSync} />}
      <Card className={session.type === "talkshow" ? styles.sessionTalk : undefined}>
        <h2 className="t-card-title">{session.topic}</h2>
        <div className={styles.hosts}>
          <span className={styles.avatars}>
            {session.hosts.map((h) => (
              <span key={h} className={styles.avatarRing}>
                <Avatar name={h} size={30} />
              </span>
            ))}
          </span>
          <span className="t-label c-label-2">{session.speakers}</span>
        </div>
        {session.description && <p className="t-body c-label-2">{session.description}</p>}
        <div className={styles.progress}>
          <div className={styles.between}>
            <span className="t-label c-label-2">Mulai {startedAt}</span>
            <span className={cx("t-label-emph", styles.accent)}>
              {left > 0 ? `Sisa ${left} menit` : "Sebentar lagi selesai"}
            </span>
          </div>
          <div className={styles.track}>
            <span className={styles.fill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </Card>

      {session.type === "talkshow" ? (
        <Composer token={token} firstName={firstName} />
      ) : session.points.length ? (
        <>
          <Card className={styles.stops}>
            <span className="t-label c-label-2">Titik tur</span>
            {session.points.map((p, i) => (
              <div key={p} className={styles.stopRow}>
                <span
                  className={cx(
                    styles.stopCircle,
                    i < stop && styles.stopDone,
                    i === stop && styles.stopHere,
                  )}
                >
                  {i < stop ? <Check size={15} /> : <span className="t-label-emph">{i + 1}</span>}
                </span>
                <span className={cx("t-body-emph", i < stop && "c-label-2", styles.grow)}>{p}</span>
                {i === stop && (
                  <Badge tone="live" pulse>
                    Di sini
                  </Badge>
                )}
              </div>
            ))}
          </Card>
          <p className={cx("t-label c-label-2", styles.note)}>
            <Info size={16} />
            HP boleh disimpan. Nikmati turnya, layar ini cuma pengingat.
          </p>
        </>
      ) : (
        <p className={cx("t-label c-label-2", styles.note)}>
          <Info size={16} />
          HP boleh disimpan. Layar ini otomatis ikut panitia.
        </p>
      )}
    </Screen>
  );
}

// Kolom "Tanya pembicara" (BT08). Gagal kirim → isian tetap (pola BT08b).
function Composer({ token, firstName }: { token: string; firstName: string }) {
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  function send() {
    start(async () => {
      const res = await askQuestion(token, text).catch(() => ({
        ok: false as const,
        reason: "error" as const,
      }));
      if (res.ok) {
        setText("");
        setToast("Pertanyaanmu masuk ke moderator");
      } else if (res.reason === "closed") setToast("Sesi tanya udah ditutup");
      else if (res.reason === "error") setToast("Gagal kirim, sinyalnya lemah. Coba lagi ya.");
    });
  }

  return (
    <Card className={styles.composer}>
      <span className="t-body-emph">Tanya pembicara</span>
      <textarea
        className={styles.textarea}
        placeholder="Tulis pertanyaanmu buat pembicara…"
        value={text}
        maxLength={280}
        onChange={(e) => setText(e.target.value)}
        aria-label="Pertanyaan untuk pembicara"
      />
      <div className={styles.between}>
        <span className="t-label c-label-2">Tampil sebagai {firstName}</span>
        <Button
          className={styles.sendBtn}
          icon={<PaperPlaneTilt />}
          onClick={send}
          disabled={pending || !text.trim()}
        >
          Kirim
        </Button>
      </div>
      {toast && (
        <div className={styles.toastWrap}>
          <Toast icon={<Check />}>{toast}</Toast>
        </div>
      )}
    </Card>
  );
}
