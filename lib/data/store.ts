import type { EventState } from "./types";

// Satu pintu ke data. Sekarang selalu mock (in-memory di server);
// adapter database asli dipasang di akhir proyek tanpa mengubah pemanggil.
export interface DataStore {
  readonly kind: "mock";
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
  getEventState(): Promise<EventState>;
}
