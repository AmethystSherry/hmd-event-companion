import { beforeEach, describe, expect, it, vi } from "vitest";
import { HMD_ID, seedData } from "../../../../../lib/data/seed";
import { createStore, type DataStore } from "../../../../../lib/data/store";

// N3 · POST /api/t/[token]/kartu: store di memori, akses & purge dipalsukan.

let store: DataStore;
vi.mock("@/lib/data", async () => {
  const real = await import("../../../../../lib/data/store");
  return {
    isStoreError: real.isStoreError,
    mutateStore: async <T>(fn: (s: DataStore) => T) => fn(store),
  };
});
vi.mock("@/lib/card", () => import("../../../../../lib/card"));
vi.mock("@/lib/server/rateLimit", () => import("../../../../../lib/server/rateLimit"));
vi.mock("@/lib/server/access", () => ({
  guestFromToken: async (token: string) => store.getGuestByToken(token),
}));
vi.mock("@/lib/server/feedback", () => ({ ensurePurged: async () => false }));
vi.mock("@/lib/server/url", () => ({ isSameOrigin: () => true }));

const { POST } = await import("./route");

const t = (hhmm: string) => `2026-11-08T${hhmm}:00+07:00`;

function post(token: string, body: unknown) {
  const req = new Request("http://localhost/api/t/x/kartu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req, { params: Promise.resolve({ token }) } as never);
}

let n = 0;
function guest(rsvp: boolean) {
  n += 1;
  const g = store.addGuest(HMD_ID, { name: `Tamu ${n}`, ig: `tamu${n}`, wa: null });
  if (rsvp) {
    store.setRsvp(g.id, {
      rsvp: "hadir",
      name: g.name,
      ig: g.ig,
      wa: "6281234567890",
      followConfirmed: true,
    });
  }
  return store.getGuest(g.id)!;
}

beforeEach(() => {
  store = createStore(seedData(), { persist: vi.fn() });
});

describe("POST kartu", () => {
  it("simpan → ok + card, rev naik, job/interests ikut sinkron", async () => {
    const g = guest(true);
    const rev = store.rev;
    const res = await post(g.token, {
      role: " Product designer ",
      askAbout: ["UX writing", "Kopi"],
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      card: { role: "Product designer", askAbout: ["UX writing", "Kopi"] },
    });
    expect(store.rev).toBe(rev + 1);
    const saved = store.getGuest(g.id)!;
    expect([saved.job, saved.interests]).toEqual(["Product designer", "UX writing, Kopi"]);
  });

  it("idempoten: kirim ulang isi sama → ok, rev tetap", async () => {
    const g = guest(true);
    await post(g.token, { role: "PM", askAbout: [] });
    const rev = store.rev;
    const res = await post(g.token, { role: "PM", askAbout: [] });
    expect(res.status).toBe(200);
    expect(store.rev).toBe(rev);
  });

  it("tamu belum RSVP hadir & belum masuk → 403", async () => {
    const g = guest(false);
    expect((await post(g.token, { role: null, askAbout: [] })).status).toBe(403);
  });

  it("isian lewat batas → 400; token salah → 404", async () => {
    const g = guest(true);
    expect((await post(g.token, { role: "x".repeat(41), askAbout: [] })).status).toBe(400);
    expect((await post(g.token, { role: null, askAbout: ["a", "b", "c", "d"] })).status).toBe(400);
    expect((await post("salah", { role: null, askAbout: [] })).status).toBe(404);
  });

  it("acara ditutup → 409 acara-selesai", async () => {
    const g = guest(true);
    for (const s of store.listSessions(HMD_ID)) {
      store.startSession(HMD_ID, s.id, t("14:00"));
      store.finishSession(HMD_ID, s.id, t("14:30"));
    }
    store.closeEvent(HMD_ID, t("17:00"));
    const res = await post(g.token, { role: null, askAbout: [] });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ ok: false, error: "acara-selesai" });
  });

  it("rate-limit 20 / menit per tamu → 429", async () => {
    const g = guest(true);
    for (let i = 0; i < 20; i++) {
      expect((await post(g.token, { role: `Peran ${i}`, askAbout: [] })).status).toBe(200);
    }
    expect((await post(g.token, { role: "lagi", askAbout: [] })).status).toBe(429);
  });
});
