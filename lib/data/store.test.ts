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

describe("check-in di pintu (F2)", () => {
  const at = "2026-11-08T06:04:00.000Z"; // 13.04 WIB
  const op = (opId: string, method: "scan" | "manual" = "scan") => ({
    opId,
    method,
    by: "HP A",
    at,
  });

  function withTicket() {
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
    return { store, g, ticket: store.ticketFor(g.id)! };
  }

  it("scan pertama valid (tamu ke-1), scan kedua dari HP lain → sudah dipakai, hitungan tetap", () => {
    const { store, g, ticket } = withTicket();
    expect(store.checkIn(HMD_ID, { ticketId: ticket.ticketId }, op("a"))).toEqual({
      kind: "valid",
      guestId: g.id,
      guestNo: 1,
      at,
    });
    expect(store.checkIn(HMD_ID, { ticketId: ticket.ticketId }, op("b"))).toMatchObject({
      kind: "sudah-dipakai",
      method: "scan",
    });
    expect(store.doorStats(HMD_ID)).toEqual({ checkedIn: 1, expected: 1, total: 20 });
  });

  it("op yang dikirim ulang (sinyal putus) idempoten: hasil sama, rev tidak naik", () => {
    const { store, ticket } = withTicket();
    const first = store.checkIn(HMD_ID, { ticketId: ticket.ticketId }, op("a"));
    const rev = store.rev;
    expect(store.checkIn(HMD_ID, { ticketId: ticket.ticketId }, op("a"))).toEqual(first);
    expect(store.rev).toBe(rev);
  });

  it("tiket acak / milik event lain → tidak dikenal", () => {
    const { store, ticket } = withTicket();
    expect(store.checkIn(HMD_ID, { ticketId: "acak" }, op("a")).kind).toBe("tidak-dikenal");
    expect(store.checkIn("open-studio", { ticketId: ticket.ticketId }, op("b")).kind).toBe(
      "tidak-dikenal",
    );
  });

  it("RSVP 'Nggak bisa' tapi datang → check-in manual, RSVP jadi hadir; Batalkan memulihkan", () => {
    const { store } = fresh();
    importDummy(store);
    const g = store.listGuests(HMD_ID)[1];
    store.setRsvp(g.id, {
      rsvp: "nggak",
      name: g.name,
      ig: g.ig,
      wa: null,
      followConfirmed: false,
    });
    expect(store.checkIn(HMD_ID, { guestId: g.id }, op("m", "manual")).kind).toBe("valid");
    expect(store.getGuest(g.id)?.rsvp).toBe("hadir");
    expect(store.ticketFor(g.id)).toMatchObject({ status: "dipakai", method: "manual" });
    expect(store.undoCheckIn("m")).toBe(true);
    expect(store.getGuest(g.id)?.rsvp).toBe("nggak");
    expect(store.ticketFor(g.id)).toMatchObject({ status: "aktif", checkedInAt: null });
    expect(store.undoCheckIn("m")).toBe(false);
  });

  it("walk-in tercatat masuk, ikut pembagi, IG yang sudah dipakai ditolak", () => {
    const { store } = withTicket();
    const r = store.addWalkIn(HMD_ID, { name: "Budi Santoso", ig: "budisantoso" }, op("w"));
    expect(r).toMatchObject({ kind: "valid", guestNo: 1 });
    expect(store.addWalkIn(HMD_ID, { name: "Budi Santoso", ig: "budisantoso" }, op("w"))).toEqual(
      r,
    );
    expect(store.listGuests(HMD_ID).filter((g) => g.source === "walkin")).toHaveLength(1);
    expect(store.doorStats(HMD_ID)).toEqual({ checkedIn: 1, expected: 2, total: 21 });
    const taken = store.listGuests(HMD_ID)[0].ig;
    expect(() => store.addWalkIn(HMD_ID, { name: "X", ig: taken }, op("w2"))).toThrow(StoreError);
  });
});

describe("kontrol acara: mulai & selesaikan sesi (BP00a/BP00b, prd §6)", () => {
  const t = (hhmm: string) => `2026-11-08T${hhmm}:00+07:00`;

  it("mulai sesi 1 → mode sesi, berikutnya sesi 2; dobel tap idempoten (rev tetap)", () => {
    const { store } = fresh();
    expect(store.startSession(HMD_ID, "s01", t("13:00"))).toBe(true);
    const rev = store.rev;
    expect(store.startSession(HMD_ID, "s01", t("13:00"))).toBe(false);
    expect(store.rev).toBe(rev);
    expect(store.getEvent(HMD_ID)).toMatchObject({
      mode: "sesi",
      activeSessionId: "s01",
      nextSessionId: "s02",
    });
    expect(store.listSessions(HMD_ID)[0]).toMatchObject({
      status: "berlangsung",
      startedAt: t("13:00"),
    });
  });

  it("selesaikan → jeda, sesi selesai (endedAt); selesaikan lagi nggak mengubah apa-apa", () => {
    const { store } = fresh();
    store.startSession(HMD_ID, "s01", t("13:00"));
    expect(store.finishSession(HMD_ID, "s01", t("13:58"))).toBe(true);
    expect(store.finishSession(HMD_ID, "s01", t("14:05"))).toBe(false);
    expect(store.getEvent(HMD_ID)).toMatchObject({
      mode: "jeda",
      activeSessionId: null,
      nextSessionId: "s02",
    });
    expect(store.listSessions(HMD_ID)[0]).toMatchObject({ status: "selesai", endedAt: t("13:58") });
  });

  it("mulai sesi lain saat ada yang jalan → sesi lama ikut selesai", () => {
    const { store } = fresh();
    store.startSession(HMD_ID, "s01", t("13:00"));
    store.startSession(HMD_ID, "s03", t("14:10"));
    const [s1, s2, s3] = store.listSessions(HMD_ID);
    expect(s1).toMatchObject({ status: "selesai", endedAt: t("14:10") });
    expect(s2.status).toBeUndefined();
    expect(s3).toMatchObject({ status: "berlangsung", startedAt: t("14:10") });
    expect(store.getEvent(HMD_ID)).toMatchObject({ activeSessionId: "s03", nextSessionId: "s04" });
    expect(store.listSessions(HMD_ID).filter((s) => s.status === "berlangsung")).toHaveLength(1);
  });

  it("sesi terakhir selesai → nggak ada berikutnya; sesi nggak dikenal ditolak", () => {
    const { store } = fresh();
    store.startSession(HMD_ID, "s04", t("15:30"));
    store.finishSession(HMD_ID, "s04", t("17:00"));
    expect(store.getEvent(HMD_ID)?.nextSessionId).toBeNull();
    expect(() => store.startSession(HMD_ID, "nggak-ada", t("15:00"))).toThrow(StoreError);
  });
});

describe("foto kolase (N4)", () => {
  const at = (hhmm: string) => `2026-11-08T${hhmm}:00+07:00`;
  const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const photo = (guestId: string, n: number, hhmm = "13:30") => ({
    id: id(n),
    guestId,
    at: at(hhmm),
    width: 1067,
    height: 1280,
    bytes: 200_000,
  });

  function withGuests() {
    const { store, persist } = fresh();
    importDummy(store);
    const [a, b] = store.listGuests(HMD_ID);
    return { store, persist, a, b };
  }

  it("kirim ulang id yang sama nggak dobel dan rev nggak naik", () => {
    const { store, a } = withGuests();
    expect(store.addPhoto(photo(a.id, 1)).created).toBe(true);
    const rev = store.rev;
    expect(store.addPhoto(photo(a.id, 1)).created).toBe(false);
    expect(store.rev).toBe(rev);
    expect(store.photoCount(HMD_ID)).toBe(1);
  });

  it("id milik tamu lain ditolak", () => {
    const { store, a, b } = withGuests();
    store.addPhoto(photo(a.id, 1));
    expect(() => store.addPhoto(photo(b.id, 1))).toThrow(StoreError);
  });

  it("foto ikut sesi yang jalan, atau sesi terakhir selesai pas jeda", () => {
    const { store, a } = withGuests();
    expect(store.addPhoto(photo(a.id, 1)).photo.sessionId).toBeNull();
    store.startSession(HMD_ID, "s01", at("13:00"));
    expect(store.addPhoto(photo(a.id, 2)).photo.sessionId).toBe("s01");
    store.finishSession(HMD_ID, "s01", at("13:58"));
    expect(store.addPhoto(photo(a.id, 3)).photo.sessionId).toBe("s01");
  });

  it("maksimal 20 foto per tamu; foto yang dihapus nggak dihitung", () => {
    const { store, a } = withGuests();
    for (let i = 0; i < 20; i++) store.addPhoto(photo(a.id, i));
    expect(() => store.addPhoto(photo(a.id, 99))).toThrow(StoreError);
    expect(store.deletePhoto(a.id, id(0), at("14:00"))).toBe(true);
    expect(store.addPhoto(photo(a.id, 99)).created).toBe(true);
  });

  it("ringkasan BT07: foto tamu lain, 4 terbaru, foto sendiri nggak masuk strip", () => {
    const { store, a, b } = withGuests();
    for (let i = 1; i <= 6; i++) store.addPhoto(photo(b.id, i, `13:${10 + i}`));
    store.addPhoto(photo(a.id, 7, "13:40"));
    expect(store.photoSummary(HMD_ID, a.id)).toEqual({
      total: 7,
      others: 6,
      mine: 1,
      latest: [id(6), id(5), id(4), id(3)],
    });
  });

  it("hapus cuma foto sendiri; acara ditutup → nggak bisa tambah/hapus", () => {
    const { store, a, b } = withGuests();
    store.addPhoto(photo(a.id, 1));
    expect(store.deletePhoto(b.id, id(1), at("14:00"))).toBe(false);
    store.getEvent(HMD_ID)!.mode = "closed";
    expect(() => store.addPhoto(photo(a.id, 2))).toThrow(StoreError);
    expect(() => store.deletePhoto(a.id, id(1), at("17:10"))).toThrow(StoreError);
  });

  it("hapus tamu → metadata fotonya ikut hilang", () => {
    const { store, a } = withGuests();
    store.addPhoto(photo(a.id, 1));
    store.deleteGuest(a.id);
    expect(store.photoCount(HMD_ID)).toBe(0);
  });
});
