import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { guestToken, shortCode } from "../server/crypto";
import { createMockStore } from "./mock";
import type { DataStore } from "./store";
import type { EventSnapshot } from "./types";

const S = "test-secret-that-is-long-enough-123456";
let clock = new Date("2026-11-08T13:00:00+07:00");
let store: DataStore;

beforeEach(async () => {
  clock = new Date("2026-11-08T13:00:00+07:00");
  store = createMockStore({
    tokenFor: (id) => guestToken(S, id),
    ticketCode: (t, k) => shortCode(S, t, k),
    seedCsv: () => readFileSync(join(process.cwd(), "data/tamu-hmd-dummy.csv"), "utf8"),
    now: () => clock,
  });
  await store.seed();
});

const status = (snap: EventSnapshot) => snap.sessions.map((s) => `${s.id}:${s.status}`).join(" ");

describe("mode acara JEDA ⇄ SESI (prd.md §6)", () => {
  it("Mulai → sesi; Selesaikan → jeda dengan sesi berikutnya", async () => {
    let snap = await store.startSession("s01", "hp-a");
    expect(snap.event).toMatchObject({ mode: "sesi", activeSession: "s01", nextSession: "s02" });
    expect(status(snap)).toBe("s01:berlangsung s02:berikutnya s03:nanti s04:nanti");

    snap = await store.finishSession("s01", "hp-a", { startNext: false });
    expect(snap.event).toMatchObject({ mode: "jeda", activeSession: null, nextSession: "s02" });
    expect(status(snap)).toBe("s01:selesai s02:berikutnya s03:nanti s04:nanti");
  });

  it("'Selesai & mulai berikutnya' = 1 aksi", async () => {
    await store.startSession("s01", "hp-a");
    const snap = await store.finishSession("s01", "hp-a", { startNext: true });
    expect(snap.event).toMatchObject({ mode: "sesi", activeSession: "s02", nextSession: "s03" });
  });

  it("Batalkan ≤5 dtk mengembalikan state sebelumnya; lewat batas tidak", async () => {
    const before = await store.getSnapshot();
    await store.startSession("s01", "hp-a");
    clock = new Date(clock.getTime() + 4000);
    const undone = await store.undoStart("s01", "hp-a");
    expect(undone.event.mode).toBe(before.event.mode);
    expect(status(undone)).toBe(status(before));

    await store.startSession("s01", "hp-a");
    clock = new Date(clock.getTime() + 60_000);
    expect((await store.undoStart("s01", "hp-a")).event.mode).toBe("sesi");
  });

  it("aksi basi dari HP lain = no-op (Mulai dua kali, Selesai sesi yang sudah selesai)", async () => {
    const a = await store.startSession("s01", "hp-a");
    const b = await store.startSession("s01", "hp-b");
    expect(b.event.rev).toBe(a.event.rev);
    await store.finishSession("s01", "hp-a", { startNext: false });
    const stale = await store.finishSession("s01", "hp-b", { startNext: true });
    expect(stale.event.mode).toBe("jeda");
  });

  it("rev & by berubah + listener dipanggil (realtime)", async () => {
    const seen: EventSnapshot[] = [];
    const stop = store.subscribe((s) => seen.push(s));
    await store.startSession("s01", "hp-a");
    stop();
    await store.finishSession("s01", "hp-a", { startNext: false });
    expect(seen).toHaveLength(1);
    expect(seen[0].event.by).toBe("hp-a");
  });

  it("sesi terakhir selesai → nextSession null; tutup acara → closed", async () => {
    for (const id of ["s01", "s02", "s03", "s04"]) {
      await store.startSession(id, "hp-a");
      await store.finishSession(id, "hp-a", { startNext: false });
    }
    expect((await store.getSnapshot()).event.nextSession).toBeNull();
    expect((await store.closeEvent("hp-a")).event.mode).toBe("closed");
  });

  it("edit rundown: jam, PIC, tipe, urutan", async () => {
    const snap = await store.updateRundown(
      [
        { id: "s03", order: 2, startsAt: "14.15", pic: "Gema", type: "talkshow" },
        { id: "s02", order: 3, startsAt: "bukan jam" },
      ],
      "hp-a",
    );
    expect(snap.sessions.find((s) => s.id === "s03")).toMatchObject({
      order: 2,
      startsAt: "14.15",
      pic: "Gema",
      type: "talkshow",
    });
    expect(snap.sessions.find((s) => s.id === "s02")).toMatchObject({
      order: 3,
      startsAt: "14.00",
    });
  });
});
