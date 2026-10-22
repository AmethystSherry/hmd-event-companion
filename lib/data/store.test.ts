import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { parseGuestCsv } from "../csv";
import { HMD_ID, seedData } from "./seed";
import { createStore, StoreError } from "./store";

function fresh() {
  const persist = vi.fn();
  return { store: createStore(seedData(), { persist }), persist };
}

function importDummy(store: ReturnType<typeof fresh>["store"]) {
  const csv = parseGuestCsv(
    readFileSync(join(__dirname, "..", "..", "public", "dev", "tamu-hmd-dummy.csv"), "utf8"),
  );
  if (!csv.ok) throw new Error(csv.message);
  store.importCsv(HMD_ID, "tamu-hmd-dummy.csv", csv.valid, null);
}

describe("CSV sekali per event (P04a)", () => {
  it("20 tamu tersimpan, unggah ulang ditolak", () => {
    const { store, persist } = fresh();
    importDummy(store);
    expect(store.listGuests(HMD_ID)).toHaveLength(20);
    expect(store.getEvent(HMD_ID)?.csvImportedAt).not.toBeNull();
    expect(persist).toHaveBeenCalled();
    expect(() => importDummy(store)).toThrow(StoreError);
  });

  it("tiap tamu dapat token unik ≥ 16 karakter dan nomor kunci berurutan", () => {
    const { store } = fresh();
    importDummy(store);
    const guests = store.listGuests(HMD_ID);
    expect(new Set(guests.map((g) => g.token)).size).toBe(20);
    expect(guests.every((g) => g.token.length >= 16)).toBe(true);
    expect(guests.map((g) => g.keyNo)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
});

describe("undangan & jawaban", () => {
  it("✈ menandai Diundang, Batalkan mengembalikan status sebelumnya (P04d)", () => {
    const { store } = fresh();
    importDummy(store);
    const g = store.listGuests(HMD_ID)[0];
    const prev = store.markInvited(g.id);
    expect(store.getGuest(g.id)?.inviteStatus).toBe("diundang");
    store.restoreInvite(g.id, prev);
    expect(store.getGuest(g.id)).toMatchObject({ inviteStatus: "belum", invitedAt: null });
  });

  it("konfirmasi hadir → tiket, statistik P04 ikut berubah, pelanggan diberi tahu", () => {
    const { store } = fresh();
    importDummy(store);
    const [a, b] = store.listGuests(HMD_ID);
    store.markInvited(a.id);
    store.markInvited(b.id);
    const seen: number[] = [];
    store.subscribe((rev) => seen.push(rev));
    store.setRsvp(a.id, {
      rsvp: "hadir",
      name: a.name,
      ig: a.ig,
      wa: "6281234567890",
      followConfirmed: true,
    });
    expect(store.ticketFor(a.id)?.shortCode).toMatch(/^HMD-001-[2-9A-HJ-NP-Z]{4}$/);
    expect(store.stats(HMD_ID)).toMatchObject({ invited: 2, hadir: 1, belumJawab: 1 });
    expect(seen).toHaveLength(1);
  });

  it("ubah data tamu tidak me-reset status undangan & jawaban (P04e)", () => {
    const { store } = fresh();
    importDummy(store);
    const g = store.listGuests(HMD_ID)[0];
    store.markInvited(g.id);
    store.setRsvp(g.id, {
      rsvp: "nggak",
      name: g.name,
      ig: g.ig,
      wa: null,
      followConfirmed: false,
    });
    store.updateGuest(g.id, { name: "Rara W.", ig: "rara.baru", wa: null });
    expect(store.getGuest(g.id)).toMatchObject({
      name: "Rara W.",
      inviteStatus: "diundang",
      rsvp: "nggak",
    });
  });

  it("tamu manual masuk Belum diundang; IG dobel ditolak (P04f)", () => {
    const { store } = fresh();
    importDummy(store);
    const g = store.addGuest(HMD_ID, { name: "Tamu Baru", ig: "tamubaru", wa: null });
    expect(g).toMatchObject({ inviteStatus: "belum", source: "manual", keyNo: 21 });
    expect(() => store.addGuest(HMD_ID, { name: "X", ig: "tamubaru", wa: null })).toThrow(
      StoreError,
    );
  });
});

describe("rundown (PE04)", () => {
  it("urutan ikut jam mulai", () => {
    const { store } = fresh();
    store.addSession(HMD_ID, {
      title: "Sambutan",
      startsAt: "13.30",
      durationMin: 15,
      type: "info",
      pic: "MC",
    });
    expect(store.listSessions(HMD_ID).map((s) => s.startsAt)).toEqual([
      "13.00",
      "13.30",
      "14.00",
      "14.45",
      "15.30",
    ]);
  });
});

describe("ubah & hapus event (PE03e / PE03h)", () => {
  it("ubah nama & tanggal tanpa menyentuh tamu dan rundown", () => {
    const { store } = fresh();
    importDummy(store);
    store.updateEvent(HMD_ID, { name: "HMD 2026", date: "2026-11-15" });
    expect(store.getEvent(HMD_ID)).toMatchObject({ name: "HMD 2026", date: "2026-11-15" });
    expect(store.listGuests(HMD_ID)).toHaveLength(20);
    expect(store.listSessions(HMD_ID)).toHaveLength(4);
  });

  it("hapus event ikut menghapus tamu, tiket, dan rundown-nya saja", () => {
    const { store } = fresh();
    importDummy(store);
    const g = store.listGuests(HMD_ID)[0];
    store.setRsvp(g.id, {
      rsvp: "hadir",
      name: g.name,
      ig: g.ig,
      wa: "6281234567890",
      followConfirmed: true,
    });
    store.deleteEvent(HMD_ID);
    expect(store.getEvent(HMD_ID)).toBeNull();
    expect(store.listGuests(HMD_ID)).toHaveLength(0);
    expect(store.listSessions(HMD_ID)).toHaveLength(0);
    expect(store.ticketFor(g.id)).toBeNull();
    expect(store.getGuestByToken(g.token)).toBeNull();
    expect(store.listEvents()).toHaveLength(1); // event lain tetap
  });
});
