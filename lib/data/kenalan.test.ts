import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { parseGuestCsv } from "../csv";
import { kenalanBoard, kenalanFileId, kenalanIntro, kenalanRanking, kenalanView } from "../kenalan";
import { signKenalan, signTicket, verifyKenalan } from "../server/crypto";
import { HMD_ID, seedData } from "./seed";
import { createStore, type StoreError } from "./store";

// N5 · Kenalan & hadiah: kode QR, aturan kenalan, peringkat & seri, pengumuman pemenang, H+30,
// selfie nggak bocor ke foto kolase.

const t = (hhmm: string) => `2026-11-08T${hhmm}:00+07:00`;
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const S = "test-secret-that-is-long-enough-123456";

// 5 tamu hadir, 4 udah masuk; event dimulai (kecuali started false).
function setup(started = true) {
  const store = createStore(seedData(), { persist: vi.fn() });
  const csv = parseGuestCsv(
    readFileSync(join(__dirname, "..", "..", "public", "dev", "tamu-hmd-dummy.csv"), "utf8"),
  );
  if (!csv.ok) throw new Error(csv.message);
  store.importCsv(HMD_ID, "tamu-hmd-dummy.csv", csv.valid, null);
  const guests = store.listGuests(HMD_ID).slice(0, 5);
  guests.forEach((g, i) => {
    store.setRsvp(g.id, {
      rsvp: "hadir",
      name: g.name,
      ig: g.ig,
      wa: "6281234567890",
      followConfirmed: true,
    });
    if (i < 4) {
      store.checkIn(
        HMD_ID,
        { ticketId: store.ticketFor(g.id)!.ticketId },
        { opId: `op${i}`, method: "manual", by: "HP 1", at: t("13:05") },
      );
    }
  });
  if (started) store.startEvent(HMD_ID, t("13:00"));
  const [a, b, c, d, out] = guests as [(typeof guests)[0], ...typeof guests];
  return { store, a: a!, b: b!, c: c!, d: d!, out: out! };
}

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as StoreError).code;
  }
  return null;
};

describe("kode QR kenalan (K1)", () => {
  it("kode asli → guestId; tanpa data pribadi", () => {
    const c = signKenalan(S, "g-123");
    expect(c).toMatch(/^k1\.g-123\.[A-Za-z0-9_-]{12}$/);
    expect(verifyKenalan(S, c)).toEqual({ ok: true, guestId: "g-123" });
    expect(verifyKenalan(S, `  ${c}\n`)).toEqual({ ok: true, guestId: "g-123" });
  });

  it("palsu / diubah / secret lain → qr-asing", () => {
    const c = signKenalan(S, "g-123");
    expect(verifyKenalan(S, c.replace("g-123", "g-124"))).toEqual({
      ok: false,
      reason: "qr-asing",
    });
    expect(verifyKenalan("secret-lain-yang-juga-cukup-panjang-000", c).ok).toBe(false);
    expect(verifyKenalan(S, "https://example.com")).toEqual({ ok: false, reason: "qr-asing" });
  });

  it("QR tiket ditolak dengan alasan sendiri, dan kode kenalan bukan tiket", () => {
    expect(verifyKenalan(S, signTicket(S, "tk_g014"))).toEqual({ ok: false, reason: "qr-tiket" });
    expect(signKenalan(S, "tk_g014")).not.toBe(signTicket(S, "tk_g014"));
  });
});

describe("addIntroduction (BTk3 → BTk4)", () => {
  it("pasangan tercatat terurut, +1 buat dua-duanya, rev naik", () => {
    const { store, a, b } = setup();
    const rev = store.rev;
    const { introduction, created } = store.addIntroduction(
      b.id,
      a.id,
      { id: uuid(1) },
      t("14:00"),
    );
    expect(created).toBe(true);
    expect(store.rev).toBe(rev + 1);
    expect([introduction.a, introduction.b]).toEqual([a.id, b.id].sort());
    expect(introduction.scannerId).toBe(b.id);
    expect(kenalanView(store, a.id)).toMatchObject({ count: 1, rank: 1 });
    expect(kenalanView(store, b.id)).toMatchObject({ count: 1 });
  });

  it("idempoten per id: kirim ulang = kenalan yang sama, rev tetap", () => {
    const { store, a, b } = setup();
    store.addIntroduction(a.id, b.id, { id: uuid(1) }, t("14:00"));
    const rev = store.rev;
    const again = store.addIntroduction(a.id, b.id, { id: uuid(1) }, t("14:01"));
    expect(again.created).toBe(false);
    expect(store.rev).toBe(rev);
  });

  it("pasangan a-b = b-a → udah-kenalan (bawa id & jam lama)", () => {
    const { store, a, b } = setup();
    store.addIntroduction(a.id, b.id, { id: uuid(1) }, t("14:00"));
    try {
      store.addIntroduction(b.id, a.id, { id: uuid(2) }, t("14:05"));
      expect.unreachable();
    } catch (e) {
      expect((e as StoreError).code).toBe("udah-kenalan");
      expect((e as StoreError).meta).toMatchObject({ id: uuid(1), at: t("14:00") });
    }
    expect(store.listIntroductions(HMD_ID)).toHaveLength(1);
  });

  it("id sama dari pasangan lain → ditolak", () => {
    const { store, a, b, c } = setup();
    store.addIntroduction(a.id, b.id, { id: uuid(1) }, t("14:00"));
    expect(code(() => store.addIntroduction(a.id, c.id, { id: uuid(1) }, t("14:01")))).toBe(
      "isian-tidak-valid",
    );
  });

  it("aturan: QR sendiri, belum check-in (pemindai / pemilik), belum mulai", () => {
    const { store, a, out } = setup();
    expect(code(() => store.addIntroduction(a.id, a.id, { id: uuid(1) }, t("14:00")))).toBe(
      "qr-sendiri",
    );
    let err: StoreError | null = null;
    try {
      store.checkIntroduction(a.id, out.id);
    } catch (e) {
      err = e as StoreError;
    }
    expect(err?.code).toBe("belum-masuk");
    expect(err?.meta?.who).toBe("owner");
    try {
      store.checkIntroduction(out.id, a.id);
    } catch (e) {
      err = e as StoreError;
    }
    expect(err?.meta?.who).toBe("scanner");

    const pre = setup(false);
    expect(code(() => pre.store.checkIntroduction(pre.a.id, pre.b.id))).toBe("belum-mulai");
  });

  it("checkIntroduction nggak menulis apa pun", () => {
    const { store, a, b } = setup();
    const rev = store.rev;
    expect(store.checkIntroduction(a.id, b.id).id).toBe(b.id);
    expect(store.rev).toBe(rev);
    expect(store.listIntroductions(HMD_ID)).toHaveLength(0);
  });

  it("acara ditutup → acara-ditutup", () => {
    const { store, a, b } = setup();
    for (const s of store.listSessions(HMD_ID)) {
      store.startSession(HMD_ID, s.id, t("14:00"));
      store.finishSession(HMD_ID, s.id, t("14:30"));
    }
    store.closeEvent(HMD_ID, t("17:00"));
    expect(code(() => store.checkIntroduction(a.id, b.id))).toBe("acara-ditutup");
  });
});

describe("peringkat & seri (K10)", () => {
  it("jumlah turun; seri → yang duluan sampai angka itu di atas", () => {
    const intros = [
      { id: "1", eventId: "e", a: "A", b: "B", scannerId: "A", createdAt: t("14:00") },
      { id: "2", eventId: "e", a: "C", b: "D", scannerId: "C", createdAt: t("14:01") },
      { id: "3", eventId: "e", a: "A", b: "C", scannerId: "A", createdAt: t("14:02") },
      { id: "4", eventId: "e", a: "B", b: "D", scannerId: "B", createdAt: t("14:03") },
    ];
    const guests = ["A", "B", "C", "D"].map((id) => ({ id, name: `Tamu ${id}` }));
    // Semua 2 kenalan; terakhir: A 14.02, C 14.02, B 14.03, D 14.03 → seri jam → nama.
    expect(kenalanRanking(intros, guests).map((r) => [r.rank, r.guestId, r.count])).toEqual([
      [1, "A", 2],
      [2, "C", 2],
      [3, "B", 2],
      [4, "D", 2],
    ]);
    const more = [
      ...intros,
      { id: "5", eventId: "e", a: "B", b: "C", scannerId: "B", createdAt: t("14:10") },
    ];
    expect(kenalanRanking(more, guests).map((r) => r.guestId)).toEqual(["B", "C", "A", "D"]); // B & C sampai 3 bareng (14.10) → nama
  });

  it("view: of = tamu check-in, top, kenal, latest, kenalanIntro", () => {
    const { store, a, b, c } = setup();
    store.addIntroduction(a.id, b.id, { id: uuid(1) }, t("14:00"));
    store.addIntroduction(c.id, a.id, { id: uuid(2) }, t("14:10"));
    const v = kenalanView(store, a.id)!;
    expect(v).toMatchObject({ open: true, inside: true, count: 2, rank: 1, of: 4 });
    expect(v.top).toMatchObject({ count: 2 });
    expect(Object.keys(v.kenal).sort()).toEqual([b.id, c.id].sort());
    expect(v.latest).toMatchObject({ id: uuid(2), no: 2, friendId: c.id, scannedByMe: false });
    expect(kenalanIntro(store, b.id, uuid(1))).toMatchObject({ no: 1, friendId: a.id });
    expect(kenalanIntro(store, b.id, uuid(2))).toBeNull(); // bukan pasangannya
    expect(kenalanView(store, c.id)!.rank).toBe(3); // b (1, 14.00) duluan dari c (1, 14.10)
    const board = kenalanBoard(store, HMD_ID);
    expect(board).toMatchObject({ pairs: 2, joined: 3, open: true, winner: null, tie: false });
  });
});

describe("umumkan pemenang (P14b)", () => {
  it("papan kosong ditolak; #1 jadi pemenang; idempoten; papan dikunci", () => {
    const { store, a, b, c } = setup();
    expect(code(() => store.announceKenalanWinner(HMD_ID, t("16:30"), "HP 1"))).toBe(
      "papan-kosong",
    );
    store.addIntroduction(a.id, b.id, { id: uuid(1) }, t("14:00"));
    store.addIntroduction(a.id, c.id, { id: uuid(2) }, t("14:05"));
    expect(store.announceKenalanWinner(HMD_ID, t("16:30"), "HP 1")).toBe(true);
    const rev = store.rev;
    expect(store.announceKenalanWinner(HMD_ID, t("16:31"), "HP 2")).toBe(false);
    expect(store.rev).toBe(rev);
    expect(store.getEvent(HMD_ID)!.kenalanWinner).toMatchObject({
      guestId: a.id,
      count: 2,
      by: "HP 1",
      announcedAt: t("16:30"),
    });
    expect(code(() => store.checkIntroduction(b.id, c.id))).toBe("papan-dikunci");
    const v = kenalanView(store, a.id)!;
    expect(v.open).toBe(false);
    expect(v.winner).toMatchObject({ guestId: a.id, isMe: true, count: 2 });
    expect(kenalanView(store, b.id)!.winner?.isMe).toBe(false);
  });
});

describe("selfie terpisah dari foto kolase & hapus", () => {
  it("kenalan nggak mengubah listPhotos / photoCount / photoSummary", () => {
    const { store, a, b } = setup();
    store.addIntroduction(a.id, b.id, { id: uuid(1) }, t("14:00"));
    expect(store.listPhotos(HMD_ID)).toHaveLength(0);
    expect(store.photoCount(HMD_ID)).toBe(0);
    expect(store.photoSummary(HMD_ID, a.id)).toMatchObject({ total: 0, mine: 0 });
  });

  it("H+30: kenalan dihapus, id file selfie dikembalikan ber-folder kenalan/", () => {
    const { store, a, b } = setup();
    store.addIntroduction(a.id, b.id, { id: uuid(1) }, t("14:00"));
    const ids = store.purgePersonalData(HMD_ID, "2026-12-08T00:00:00+07:00");
    expect(ids).toEqual([kenalanFileId(uuid(1))]);
    expect(ids[0]).toBe(`kenalan/${uuid(1)}`);
    expect(store.listIntroductions(HMD_ID)).toHaveLength(0);
    expect(code(() => store.checkIntroduction(a.id, b.id))).toBe("data-dihapus");
  });

  it("hapus tamu → kenalannya ikut hilang; resetKenalan (dev) kosongkan + pemenang", () => {
    const { store, a, b, c } = setup();
    store.addIntroduction(a.id, b.id, { id: uuid(1) }, t("14:00"));
    store.addIntroduction(c.id, b.id, { id: uuid(2) }, t("14:01"));
    store.deleteGuest(a.id);
    expect(store.listIntroductions(HMD_ID).map((i) => i.id)).toEqual([uuid(2)]);
    store.announceKenalanWinner(HMD_ID, t("16:00"), null);
    expect(store.resetKenalan(HMD_ID)).toEqual([kenalanFileId(uuid(2))]);
    expect(store.getEvent(HMD_ID)!.kenalanWinner).toBeNull();
    expect(store.listIntroductions(HMD_ID)).toHaveLength(0);
  });
});
