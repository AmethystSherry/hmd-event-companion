import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { guestToken, shortCode } from "../server/crypto";
import { createMockStore } from "./mock";
import type { DataStore } from "./store";

const S = "test-secret-that-is-long-enough-123456";
let clock = new Date("2026-10-22T10:00:00+07:00");

function makeStore(): DataStore {
  return createMockStore({
    tokenFor: (id) => guestToken(S, id),
    ticketCode: (t, k) => shortCode(S, t, k),
    seedCsv: () => readFileSync(join(process.cwd(), "data/dummy-guests.csv"), "utf8"),
    now: () => clock,
  });
}

let store: DataStore;
beforeEach(async () => {
  clock = new Date("2026-10-22T10:00:00+07:00");
  store = makeStore();
  await store.seed();
});

describe("seed dummy", () => {
  it("20 tamu + 4 sesi, state acara awal = pre", async () => {
    expect(await store.listGuests()).toHaveLength(20);
    expect((await store.listSessions()).map((s) => s.title)).toEqual([
      "Open space",
      "Talkshow",
      "Tur kantor",
      "Closing & networking",
    ]);
    expect((await store.getEventState()).mode).toBe("pre");
  });

  it("idempoten: seed ulang & import CSV yang sama tidak menduplikasi", async () => {
    await store.seed();
    const { importGuests } = await import("../csv");
    const csv = readFileSync(join(process.cwd(), "data/dummy-guests.csv"), "utf8");
    const res = await store.importGuests(importGuests(csv).rows);
    expect(res).toEqual({ added: 0, updated: 20 });
    expect(await store.listGuests()).toHaveLength(20);
  });

  it("status beragam untuk P03 (17 hadir, 1 tidak, 2 belum)", async () => {
    const gs = await store.listGuests();
    const count = (r: string) => gs.filter((g) => g.rsvp === r).length;
    expect([count("hadir"), count("tidak"), count("belum")]).toEqual([17, 1, 2]);
  });
});

describe("akses tamu via token", () => {
  it("token benar → tamu yang tepat; token salah → null", async () => {
    const rara = (await store.listGuests())[0];
    expect(rara.name).toBe("Rara Wening");
    expect((await store.getGuestByToken(store.linkToken(rara.id)))?.id).toBe(rara.id);
    expect(await store.getGuestByToken("tebak-tebakan-token-xx")).toBeNull();
  });
});

describe("check-in (F2)", () => {
  it("valid sekali, scan kedua = sudah dipakai, hitungan tidak bertambah", async () => {
    const t = (await store.getTicketForGuest("g001"))!;
    const first = await store.checkIn({ ticketId: t.ticketId }, "hp-1", "scan");
    expect(first.kind).toBe("valid");
    if (first.kind === "valid") expect(first.ticket.guestNo).toBe(1);

    const second = await store.checkIn({ ticketId: t.ticketId }, "hp-2", "scan");
    expect(second.kind).toBe("used");
    if (second.kind === "used") expect(second.ticket.checkedInBy).toBe("hp-1");

    const next = await store.checkIn(
      { ticketId: (await store.getTicketForGuest("g002"))!.ticketId },
      "hp-1",
      "scan",
    );
    if (next.kind === "valid") expect(next.ticket.guestNo).toBe(2);
  });

  it("ticketId tidak dikenal → unknown", async () => {
    expect((await store.checkIn({ ticketId: "tk_g999" }, "hp-1", "scan")).kind).toBe("unknown");
  });

  it("check-in manual (P07) untuk tamu yang belum jawab tetap bisa", async () => {
    const r = await store.checkIn({ guestId: "g020" }, "hp-1", "manual");
    expect(r.kind).toBe("valid");
    expect((await store.getGuest("g020"))?.rsvp).toBe("hadir");
  });

  it("walk-in (P07c) dapat tiket dan nomor kunci baru", async () => {
    const g = await store.addWalkIn({ name: "Tamu Baru", ig: "@tamubaru" });
    expect(g.keyNo).toBe(21);
    expect(await store.getTicketForGuest(g.id)).not.toBeNull();
  });
});

describe("hapus otomatis 8 Des 2026", () => {
  it("tidak menghapus sebelum tanggalnya", async () => {
    expect((await store.purgePersonalData(new Date("2026-12-07T23:59:00+07:00"))).purged).toBe(
      false,
    );
    expect(await store.listGuests()).toHaveLength(20);
  });

  it("menghapus data per orang, rekap agregat tanpa identitas tetap ada", async () => {
    await store.checkIn({ guestId: "g001" }, "hp-1", "manual");
    clock = new Date("2026-12-08T00:00:01+07:00");
    expect(await store.listGuests()).toHaveLength(0); // purge malas saat diakses
    const agg = await store.aggregates();
    expect(agg).toMatchObject({ invited: 20, confirmed: 17, checkedIn: 1 });
    expect(JSON.stringify(agg)).not.toContain("Rara");
  });
});
