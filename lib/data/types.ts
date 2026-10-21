// Model state acara (prd.md §6). Entitas lain ditambahkan saat fiturnya dibangun.

export type EventMode = "pre" | "jeda" | "sesi" | "closed";

export type SessionStatus = "nanti" | "berikutnya" | "berlangsung" | "selesai";

export interface EventState {
  mode: EventMode;
  activeSession: string | null;
  nextSession: string | null;
  updatedAt: string; // ISO
}
