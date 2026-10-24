import type { Event, Session, SessionArt, SessionType, Speaker } from "./data/types";
import { eventStart, fromMinutes, toMinutes } from "./format";

// Tampilan rundown hari-H (BP00 + layar tamu): status per sesi diturunkan dari state acara
// (prd.md §6). Logika murni — dipakai server, klien & /dev/states/f2.

export type SessionState = "berlangsung" | "selesai" | "berikutnya" | "nanti";

export type SessionView = {
  id: string;
  no: number; // 1-based, urut jam
  title: string;
  pic: string;
  startsAt: string; // "13.00"
  endsAt: string; // "14.00"
  durationMin: number;
  type: SessionType;
  state: SessionState;
  startedAt: string | null;
  endedAt: string | null;
  // F4 · info layar acara tamu (kosong = nggak ditampilkan)
  room: string | null;
  roomNote: string | null;
  description: string | null;
  speaker: Speaker | null;
  topic: string | null;
  art: SessionArt;
};

export type RundownView = {
  sessions: SessionView[];
  active: SessionView | null;
  next: SessionView | null;
  focusIndex: number; // kartu yang dibuka pertama di carousel BP00
  done: number; // jumlah sesi selesai (Jejak acara "1 dari 4 selesai")
};

type EventState = Pick<Event, "mode" | "activeSessionId" | "nextSessionId">;

// K4: ilustrasi dari Session.art; kosong → talkshow untuk sesi talkshow, lainnya open space.
const artOf = (s: Session): SessionArt =>
  s.art ?? (s.type === "talkshow" ? "talkshow" : "open-space");

export function rundownView(event: EventState, sessions: Session[]): RundownView {
  const ordered = [...sessions].sort((a, b) => toMinutes(a.startsAt) - toMinutes(b.startsAt));
  const active = ordered.find((s) => s.status === "berlangsung") ?? null;
  // Berikutnya: dari state acara; sebelum ada yang dimulai = sesi pertama yang belum selesai.
  const nextId =
    event.nextSessionId !== undefined && event.mode && event.mode !== "pre"
      ? event.nextSessionId
      : (ordered.find((s) => s.status !== "selesai" && s.id !== active?.id)?.id ?? null);
  const views = ordered.map<SessionView>((s, i) => ({
    id: s.id,
    no: i + 1,
    title: s.title,
    pic: s.pic,
    startsAt: s.startsAt,
    endsAt: fromMinutes(toMinutes(s.startsAt) + s.durationMin),
    durationMin: s.durationMin,
    type: s.type,
    state:
      s.status === "berlangsung"
        ? "berlangsung"
        : s.status === "selesai"
          ? "selesai"
          : s.id === nextId
            ? "berikutnya"
            : "nanti",
    startedAt: s.startedAt ?? null,
    endedAt: s.endedAt ?? null,
    room: s.room ?? null,
    roomNote: s.roomNote ?? null,
    description: s.description ?? null,
    speaker: s.speaker ?? null,
    topic: s.topic ?? null,
    art: artOf(s),
  }));
  const activeView = views.find((v) => v.state === "berlangsung") ?? null;
  const nextView = views.find((v) => v.state === "berikutnya") ?? null;
  const focus = activeView ?? nextView;
  return {
    sessions: views,
    active: activeView,
    next: nextView,
    focusIndex: focus ? views.indexOf(focus) : 0,
    done: views.filter((v) => v.state === "selesai").length,
  };
}

// Stopwatch: dari startedAt server sampai sekarang (atau endedAt kalau sudah selesai).
export function elapsedMs(s: Pick<SessionView, "startedAt" | "endedAt">, nowMs: number): number {
  if (!s.startedAt) return 0;
  const end = s.endedAt ? new Date(s.endedAt).getTime() : nowMs;
  return Math.max(0, end - new Date(s.startedAt).getTime());
}

// BP02c · menit lewat dari durasi (K11: stopwatch − durasi, nggak maksa selesai). Belum lewat →
// null; lewat < 1 menit tetap "1 mnt" (dibulatkan ke bawah, min 1).
export function overdueMin(
  s: Pick<SessionView, "startedAt" | "endedAt" | "durationMin">,
  nowMs: number,
): number | null {
  const over = elapsedMs(s, nowMs) - s.durationMin * 60_000;
  return s.startedAt && over > 0 ? Math.max(1, Math.floor(over / 60_000)) : null;
}

// Durasi asli sesi yang udah selesai (BP01 rundown "Selesai · 62 mnt", BT22), dibulatkan.
export function actualMin(s: Pick<SessionView, "startedAt" | "endedAt">): number | null {
  if (!s.startedAt || !s.endedAt) return null;
  return Math.round(elapsedMs(s, 0) / 60_000);
}

// Menit sampai jam mulai terjadwal (dibulatkan ke atas; ≤ 0 = udah lewat jamnya).
export function minutesUntil(date: string, startsAt: string, nowMs: number): number {
  return Math.ceil((eventStart(date, startsAt).getTime() - nowMs) / 60_000);
}

// Kolom kiri kartu tiket Berikutnya (BT03). K5: ≤ 0 → "Sebentar lagi · mulai" (bukan minus);
// > 99 menit → "{j} jam · lagi".
export function countdownParts(min: number): { value: string; unit: string; soon: boolean } {
  if (min <= 0) return { value: "Sebentar lagi", unit: "mulai", soon: true };
  if (min > 99) return { value: `${Math.round(min / 60)} jam`, unit: "lagi", soon: false };
  return { value: String(min), unit: "mnt lagi", soon: false };
}

// Pengingat BP01: jam server udah lewat jam mulai sesi berikutnya (selagi jeda).
export function lateToStart(
  date: string,
  s: Pick<SessionView, "startsAt">,
  nowMs: number,
): boolean {
  return minutesUntil(date, s.startsAt, nowMs) < 0;
}

// "Ruang 01 · lantai 1" (BT22) · kosong → null.
export function roomLabel(s: Pick<SessionView, "room" | "roomNote">): string | null {
  if (!s.room) return null;
  return s.roomNote ? `${s.room} · ${s.roomNote}` : s.room;
}
