import type { DataStore } from "./store";
import type { EventState } from "./types";

// Disimpan di globalThis supaya bertahan saat hot reload di `next dev`.
const g = globalThis as typeof globalThis & { __hmdEventState?: EventState };

function state(): EventState {
  g.__hmdEventState ??= {
    mode: "pre",
    activeSession: null,
    nextSession: null,
    updatedAt: new Date().toISOString(),
  };
  return g.__hmdEventState;
}

export function createMockStore(): DataStore {
  return {
    kind: "mock",
    async ping() {
      const start = performance.now();
      state();
      return { ok: true, latencyMs: Math.round(performance.now() - start) };
    },
    async getEventState() {
      return { ...state() };
    },
  };
}
