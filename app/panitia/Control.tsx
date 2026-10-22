"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowClockwise,
  BookOpen,
  Camera,
  CaretRight,
  ChatCircle,
  Check,
  CheckCircle,
  Play,
  Scroll,
  Stop,
  Users,
} from "@/components/icons";
import { RundownList, RundownSegments } from "@/components/RundownList";
import {
  Badge,
  Button,
  Card,
  Field,
  InnerBox,
  Screen,
  ScreenHeader,
  Segmented,
  Sheet,
  StatTile,
  TabBar,
  Toast,
} from "@/components/ui";
import { deviceId } from "@/lib/crewClient";
import { cx } from "@/lib/cx";
import type { EventSnapshot, Session, SessionEdit } from "@/lib/data/types";
import { minutesUntil, untilLabel } from "@/lib/event";
import { mmss, timeWib } from "@/lib/format";
import { useEventSnapshot } from "@/lib/useEventSnapshot";
import styles from "./control.module.css";

export type ControlStats = {
  checkedIn: number;
  total: number;
  photos: number;
  questions: number;
  questionsBySession: Record<string, number>;
};

const UNDO_SECONDS = 5;
const STATS_REFRESH_MS = 10_000;

// Batas toast "Batalkan" (dipanggil dari handler klik, bukan saat render).
function undoDeadline() {
  return Date.now() + UNDO_SECONDS * 1000;
}

async function act(body: Record<string, unknown>): Promise<EventSnapshot | null> {
  try {
    const res = await fetch("/api/panitia/acara", {
      method: "POST",
      headers: { "content-type": "application/json", "x-device": deviceId() },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as EventSnapshot;
  } catch {
    return null;
  }
}

// BP01 Kontrol (Jeda) · BP02 Sesi berjalan (+BP02b toast konflik, BP02c timer lewat) ·
// BP03 konfirmasi selesai · BP04 semua sesi selesai · BP04b konfirmasi tutup.
export function Control({ initial, stats }: { initial: EventSnapshot; stats: ControlStats }) {
  const router = useRouter();
  const { snap } = useEventSnapshot(initial);
  const [now, setNow] = useState(() => Date.now());
  const [undo, setUndo] = useState<{ sessionId: string; title: string; until: number } | null>(
    null,
  );
  const [conflict, setConflict] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const lastRev = useRef(initial.event.rev);
  const me = useRef<string>("");

  // Jam berjalan untuk timer & countdown.
  useEffect(() => {
    me.current = deviceId();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Statistik (check-in, foto, pertanyaan) dari server tiap 10 dtk.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, STATS_REFRESH_MS);
    return () => clearInterval(t);
  }, [router]);

  // BP02b: perubahan dari HP panitia lain → toast + layar ikut update.
  useEffect(() => {
    if (snap.event.rev <= lastRev.current) return;
    lastRev.current = snap.event.rev;
    if (snap.event.by && me.current && snap.event.by !== me.current) {
      const t0 = setTimeout(() => {
        setConflict("Diubah oleh panitia lain");
        setUndo(null);
      }, 0);
      const t1 = setTimeout(() => setConflict(null), 3000);
      return () => {
        clearTimeout(t0);
        clearTimeout(t1);
      };
    }
  }, [snap.event.rev, snap.event.by]);

  useEffect(() => {
    if (!failed) return;
    const t = setTimeout(() => setFailed(false), 3000);
    return () => clearTimeout(t);
  }, [failed]);

  const ordered = [...snap.sessions].sort((a, b) => a.order - b.order);
  const active = ordered.find((s) => s.id === snap.event.activeSession) ?? null;
  const next = ordered.find((s) => s.id === snap.event.nextSession) ?? null;
  const doneCount = ordered.filter((s) => s.status === "selesai").length;
  const undoLeft = undo ? Math.ceil((undo.until - now) / 1000) : 0;

  async function run(body: Record<string, unknown>) {
    setBusy(true);
    const res = await act(body);
    setBusy(false);
    if (!res) setFailed(true);
    else lastRev.current = Math.max(lastRev.current, res.event.rev);
    return res;
  }

  async function start(s: Session) {
    const res = await run({ action: "start", sessionId: s.id });
    if (res?.event.activeSession === s.id) {
      setUndo({ sessionId: s.id, title: s.title, until: undoDeadline() });
    }
  }

  async function finish(startNext: boolean) {
    if (!active) return;
    setConfirmFinish(false);
    const nextTitle = next?.title;
    const res = await run({ action: "finish", sessionId: active.id, startNext });
    if (startNext && res?.event.activeSession && nextTitle) {
      setUndo({
        sessionId: res.event.activeSession,
        title: nextTitle,
        until: undoDeadline(),
      });
    }
  }

  async function cancelStart() {
    if (!undo) return;
    const id = undo.sessionId;
    setUndo(null);
    await run({ action: "undo", sessionId: id });
  }

  async function closeEvent() {
    setConfirmClose(false);
    await run({ action: "close" });
  }

  const statRow = (
    <div className={styles.stats}>
      <StatTile
        icon={<Users />}
        value={`${stats.checkedIn}/${stats.total}`}
        label="Check-in"
        href="/panitia/tamu"
      />
      <StatTile icon={<Camera />} value={stats.photos} label="Foto" />
      <StatTile icon={<ChatCircle />} value={stats.questions} label="Pertanyaan" />
    </div>
  );

  const rundownCard = (
    <Card className={styles.rundown}>
      <div className={styles.between}>
        <span className="t-body-emph">Rundown</span>
        <span className="t-label c-label-2">
          {doneCount} dari {ordered.length} selesai
        </span>
      </div>
      <RundownSegments sessions={ordered} tone="crew" />
      <RundownList
        sessions={ordered}
        tone="crew"
        onSelect={snap.event.mode === "closed" ? undefined : setEditing}
        sub={(s) =>
          s.status === "selesai"
            ? "Selesai"
            : s.status === "berlangsung"
              ? `Berlangsung · PIC ${s.pic}`
              : s.status === "berikutnya"
                ? `Berikutnya · PIC ${s.pic}`
                : `PIC ${s.pic}`
        }
      />
    </Card>
  );

  let hero: React.ReactNode;
  if (snap.event.mode === "closed") {
    hero = (
      <Card>
        <span className="t-label c-label-2">Layar tamu sekarang</span>
        <h2 className="t-title">Buku tamu</h2>
        <p className="t-body c-label-2">
          Acara ditutup. Semua HP tamu pindah ke buku tamu dan kolase.
        </p>
      </Card>
    );
  } else if (active) {
    hero = (
      <LiveCard
        session={active}
        next={next}
        now={now}
        onFinish={() => setConfirmFinish(true)}
        busy={busy}
      />
    );
  } else if (next) {
    const mins = minutesUntil(next.startsAt, new Date(now));
    const until = untilLabel(mins);
    hero = (
      <Card>
        <span className="t-label c-label-2">Layar tamu sekarang</span>
        <h2 className="t-title">Jeda</h2>
        <p className="t-body c-label-2">
          {next.title} dijadwalkan {next.startsAt} ·{" "}
          {mins <= 0 ? "sudah waktunya" : `${until.value} ${until.unit}`}
        </p>
        <Button icon={<Play weight="fill" />} onClick={() => start(next)} disabled={busy}>
          Mulai {next.title}
        </Button>
      </Card>
    );
  } else {
    const last = ordered[ordered.length - 1];
    hero = (
      <Card>
        <span className="t-label c-label-2">Layar tamu sekarang</span>
        <h2 className="t-title">Jeda terakhir</h2>
        <p className="t-body c-label-2">
          {last?.title.split(" ")[0]} selesai {last?.endedAt ? timeWib(last.endedAt) : ""}. Tamu
          masih bisa foto &amp; lihat peserta.
        </p>
        <Button icon={<BookOpen />} onClick={() => setConfirmClose(true)} disabled={busy}>
          Tutup acara &amp; buka buku tamu
        </Button>
      </Card>
    );
  }

  return (
    <Screen bottom={<TabBar active="kontrol" />} bottomHeight={57}>
      <ScreenHeader
        eyebrow="HMD · Minggu, 8 Nov"
        title="Kontrol acara"
        trailing={<Badge tone="crew">Panitia</Badge>}
      />
      {hero}
      {active ? (
        <Card inset className={styles.actions}>
          <Link className={styles.actionRow} href="/panitia/tanya">
            <span className={styles.actionIcon}>
              <ChatCircle size={18} />
            </span>
            <span className={styles.stack}>
              <span className="t-body-emph">
                {stats.questionsBySession[active.id] ?? 0} pertanyaan masuk
              </span>
              <span className="t-label c-label-2">Lihat di tab Tanya</span>
            </span>
            <CaretRight size={16} className={styles.caret} />
          </Link>
          <Link className={styles.actionRow} href="/panitia/naskah">
            <span className={styles.actionIcon}>
              <Scroll size={18} />
            </span>
            <span className={styles.stack}>
              <span className="t-body-emph">Naskah MC</span>
              <span className="t-label c-label-2">
                {next ? `Transisi ke ${next.title.toLowerCase()}` : "Penutupan acara"}
              </span>
            </span>
            <CaretRight size={16} className={styles.caret} />
          </Link>
        </Card>
      ) : (
        <>
          {statRow}
          {rundownCard}
        </>
      )}

      {/* Toast Batalkan (BP02): glass, hitung mundur 5 dtk. */}
      {undo && undoLeft > 0 && (
        <div className={styles.toastWrap}>
          <div className={styles.undoToast} role="status" aria-live="polite">
            <span className={styles.undoCheck}>
              <Check size={14} />
            </span>
            <span className="t-label-emph">
              {undo.title} dimulai · {stats.checkedIn} HP pindah
            </span>
            <button type="button" className={styles.undoBtn} onClick={cancelStart}>
              Batalkan · {undoLeft}
            </button>
          </div>
        </div>
      )}
      {conflict && (
        <div className={styles.toastWrap}>
          <Toast icon={<ArrowClockwise />}>{conflict}</Toast>
        </div>
      )}
      {failed && (
        <div className={styles.toastWrap}>
          <Toast icon={<ArrowClockwise />}>Gagal kirim, sinyalnya lemah. Coba lagi ya.</Toast>
        </div>
      )}

      {/* BP03 · Konfirmasi selesai (sheet mengambang). */}
      <Sheet
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="Selesaikan sesi"
        floating
      >
        {active && (
          <>
            <div className={styles.sheetText}>
              <h3 className="t-card-title">Selesaikan {active.title}?</h3>
              <p className="t-body c-label-2">
                Semua HP tamu pindah. Pertanyaan yang masuk tetap tersimpan.
              </p>
            </div>
            <div className={styles.miniStats}>
              <div className={styles.miniStat}>
                <span className="t-number-m">{mmss(elapsedSec(active, now))}</span>
                <span className="t-label c-label-2">Durasi</span>
              </div>
              <div className={styles.miniStat}>
                <span className="t-number-m">{stats.questionsBySession[active.id] ?? 0}</span>
                <span className="t-label c-label-2">Pertanyaan</span>
              </div>
            </div>
            <div className={styles.sheetActions}>
              {next ? (
                <>
                  <Button icon={<Play />} onClick={() => finish(true)} disabled={busy}>
                    Selesai &amp; mulai {next.title}
                  </Button>
                  <Button variant="secondary" onClick={() => finish(false)} disabled={busy}>
                    Selesai aja, tamu ke Jeda
                  </Button>
                </>
              ) : (
                <Button icon={<Stop weight="fill" />} onClick={() => finish(false)} disabled={busy}>
                  Selesaikan {active.title}
                </Button>
              )}
              <button
                type="button"
                className={cx("t-body-emph", styles.textBtn)}
                onClick={() => setConfirmFinish(false)}
              >
                Batal
              </button>
            </div>
          </>
        )}
      </Sheet>

      {/* BP04b · Konfirmasi tutup acara (sheet bawah). */}
      <Sheet open={confirmClose} onClose={() => setConfirmClose(false)} title="Tutup acara">
        <span className={styles.closeIcon}>
          <BookOpen size={30} />
        </span>
        <h3 className={cx("t-card-title", styles.center)}>Tutup acara sekarang?</h3>
        <p className={cx("t-body c-label-2", styles.center)}>
          Semua HP tamu ({stats.checkedIn}) langsung pindah ke buku tamu dan kolase. Layar acara
          nggak bisa dibuka lagi.
        </p>
        <div className={styles.full}>
          <InnerBox icon={<CheckCircle size={20} />}>
            <span className="t-label-emph">
              Semua sesi udah selesai · {doneCount}/{ordered.length}
            </span>
          </InnerBox>
        </div>
        <div className={styles.sheetActions}>
          <Button icon={<BookOpen />} onClick={closeEvent} disabled={busy}>
            Ya, tutup acara
          </Button>
          <Button variant="secondary" onClick={() => setConfirmClose(false)}>
            Belum, kembali
          </Button>
        </div>
      </Sheet>

      <RundownEditor
        session={editing}
        count={ordered.length}
        onClose={() => setEditing(null)}
        onSave={async (edits) => {
          setEditing(null);
          await run({ action: "rundown", edits });
        }}
      />
    </Screen>
  );
}

function elapsedSec(s: Session, now: number): number {
  return s.startedAt ? Math.max(0, (now - new Date(s.startedAt).getTime()) / 1000) : 0;
}

// BP02 kartu sesi aktif: timer naik, progress amber; lewat durasi → merah (BP02c), tidak memaksa selesai.
function LiveCard({
  session,
  next,
  now,
  onFinish,
  busy,
}: {
  session: Session;
  next: Session | null;
  now: number;
  onFinish: () => void;
  busy: boolean;
}) {
  const elapsed = elapsedSec(session, now);
  const total = session.durationMin * 60;
  const over = elapsed > total;
  const pct = Math.min(100, (elapsed / total) * 100);
  const leftMin = Math.max(0, Math.ceil((total - elapsed) / 60));
  const overMin = Math.max(1, Math.floor((elapsed - total) / 60));
  return (
    <Card>
      <div className={styles.between}>
        <span className="t-label c-label-2">Sedang berlangsung · {session.room}</span>
        <Badge tone="live" pulse>
          Live
        </Badge>
      </div>
      <h2 className="t-card-title">{session.title}</h2>
      <div className={styles.timer}>
        <span className={cx("t-display", over && styles.danger)} role="timer">
          {mmss(elapsed)}
        </span>
        <span className="t-body c-label-2">/ {mmss(total)}</span>
      </div>
      <div className={styles.track}>
        <span className={cx(styles.fill, over && styles.fillDanger)} style={{ width: `${pct}%` }} />
      </div>
      <p className={cx("t-label", over ? styles.danger : "c-label-2")}>
        {over
          ? `Lewat ${overMin} menit · selesaikan kalau udah pas`
          : `Sisa ${leftMin} menit${next ? ` · berikutnya ${next.title} ${next.startsAt}` : ""}`}
      </p>
      <Button variant="secondary" icon={<Stop weight="fill" />} onClick={onFinish} disabled={busy}>
        Selesaikan sesi
      </Button>
    </Card>
  );
}

// Edit rundown: judul, jam, durasi, tipe, PIC, ruang, urutan (prd.md §6 "bisa diubah panitia").
function RundownEditor({
  session,
  count,
  onClose,
  onSave,
}: {
  session: Session | null;
  count: number;
  onClose: () => void;
  onSave: (edits: SessionEdit[]) => void;
}) {
  const [draft, setDraft] = useState<Session | null>(session);
  const [shown, setShown] = useState<string | null>(session?.id ?? null);
  if ((session?.id ?? null) !== shown) {
    setShown(session?.id ?? null);
    setDraft(session);
  }
  const set = (patch: Partial<Session>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const validTime = !!draft && /^\d{2}\.\d{2}$/.test(draft.startsAt);

  return (
    <Sheet open={!!session} onClose={onClose} title="Ubah bagian rundown">
      {draft && (
        <>
          <div className={styles.sheetText}>
            <h3 className="t-card-title">Ubah bagian {draft.order}</h3>
            <p className="t-label c-label-2">Perubahan langsung tampil di semua HP tamu.</p>
          </div>
          <Field
            label="Nama bagian"
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
          />
          <div className={styles.twoCol}>
            <Field
              label="Jam mulai"
              value={draft.startsAt}
              inputMode="decimal"
              placeholder="14.00"
              onChange={(e) => set({ startsAt: e.target.value })}
              error={validTime ? undefined : "Format jam 14.00"}
            />
            <Field
              label="Durasi (menit)"
              type="number"
              inputMode="numeric"
              value={String(draft.durationMin)}
              onChange={(e) => set({ durationMin: Number(e.target.value) || 0 })}
            />
          </div>
          <div className={styles.twoCol}>
            <Field label="PIC" value={draft.pic} onChange={(e) => set({ pic: e.target.value })} />
            <Field
              label="Ruang"
              value={draft.room}
              onChange={(e) => set({ room: e.target.value })}
            />
          </div>
          <div className={styles.full}>
            <Segmented
              label="Tipe sesi"
              value={draft.type}
              onChange={(type) => set({ type })}
              options={[
                { value: "info", label: "Info" },
                { value: "talkshow", label: "Talkshow + tanya" },
              ]}
            />
          </div>
          <div className={styles.sheetActions}>
            <Button
              onClick={() =>
                onSave([
                  {
                    id: draft.id,
                    title: draft.title,
                    startsAt: draft.startsAt,
                    durationMin: draft.durationMin,
                    pic: draft.pic,
                    room: draft.room,
                    type: draft.type,
                  },
                ])
              }
              disabled={!validTime}
            >
              Simpan
            </Button>
            <div className={styles.twoCol}>
              <Button
                variant="secondary"
                disabled={draft.order <= 1}
                onClick={() => onSave([{ id: draft.id, order: draft.order - 1.5 }])}
              >
                Naikkan
              </Button>
              <Button
                variant="secondary"
                disabled={draft.order >= count}
                onClick={() => onSave([{ id: draft.id, order: draft.order + 1.5 }])}
              >
                Turunkan
              </Button>
            </div>
          </div>
        </>
      )}
    </Sheet>
  );
}
