import type { Event, Session } from "./data/types";
import { fromMinutes, toMinutes } from "./format";

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
  state: SessionState;
  startedAt: string | null;
  endedAt: string | null;
};

export type RundownView = {
  sessions: SessionView[];
  active: SessionView | null;
  next: SessionView | null;
  focusIndex: number; // kartu yang dibuka pertama di carousel BP00
};

type EventState = Pick<Event, "mode" | "activeSessionId" | "nextSessionId">;

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
  }));
  const activeView = views.find((v) => v.state === "berlangsung") ?? null;
  const nextView = views.find((v) => v.state === "berikutnya") ?? null;
  const focus = activeView ?? nextView;
  return {
    sessions: views,
    active: activeView,
    next: nextView,
    focusIndex: focus ? views.indexOf(focus) : 0,
  };
}

// Stopwatch: dari startedAt server sampai sekarang (atau endedAt kalau sudah selesai).
export function elapsedMs(s: Pick<SessionView, "startedAt" | "endedAt">, nowMs: number): number {
  if (!s.startedAt) return 0;
  const end = s.endedAt ? new Date(s.endedAt).getTime() : nowMs;
  return Math.max(0, end - new Date(s.startedAt).getTime());
}
