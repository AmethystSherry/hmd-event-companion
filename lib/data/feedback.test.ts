import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { parseGuestCsv } from "../csv";
import { HMD_ID, seedData } from "./seed";
import { createStore, StoreError } from "./store";
import type { FeedbackInput } from "./types";

// F5 · tutup acara, buku tamu, rekap, ringkasan (cache), hapus data H+30.

const t = (hhmm: string) => `2026-11-08T${hhmm}:00+07:00`;
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function fresh() {
  return createStore(seedData(), { persist: vi.fn() });
}

const input = (n: number, over: Partial<FeedbackInput> = {}): FeedbackInput => ({
  id: uuid(n),
  rating: 5,
  highlightSessionId: "s02",
  improve: null,
  inviteAgain: true,
  ...over,
});

// n tamu hadir & udah masuk (+1 hadir belum masuk), sesi terakhir selesai, acara ditutup.
function closedWith(n: number, close = true) {
  const store = fresh();
  const csv = parseGuestCsv(
    readFileSync(join(__dirname, "..", "..", "public", "dev", "tamu-hmd-dummy.csv"), "utf8"),
  );
  if (!csv.ok) throw new Error(csv.message);
  store.importCsv(HMD_ID, "tamu-hmd-dummy.csv", csv.valid, null);
  const guests = store.listGuests(HMD_ID).slice(0, n + 1);
  guests.forEach((g, i) => {
    store.setRsvp(g.id, {
      rsvp: "hadir",
      name: g.name,
      ig: g.ig,
      wa: "6281234567890",
      followConfirmed: true,
    });
    if (i < n) {
      const ticket = store.ticketFor(g.id)!;
      store.checkIn(
        HMD_ID,
        { ticketId: ticket.ticketId },
        { opId: `op${i}`, method: "manual", by: "HP 1", at: t("13:05") },
      );
    }
  });
  store.startSession(HMD_ID, "s04", t("15:30"));
  store.finishSession(HMD_ID, "s04", t("16:58"));
  if (close) store.closeEvent(HMD_ID, t("17:00"));
  return { store, inside: store.listGuests(HMD_ID).slice(0, n), outside: guests[n] };
}

describe("tutup acara (BP04 / BP04b)", () => {
  it("sesi terakhir belum selesai → ditolak; ada sesi jalan → ditolak", () => {
    const store = fresh();
    expect(() => store.closeEvent(HMD_ID, t("17:00"))).toThrow(StoreError);
    store.startSession(HMD_ID, "s04", t("15:30"));
    expect(store.canClose(HMD_ID)).toBe(false);
    expect(() => store.closeEvent(HMD_ID, t("17:00"))).toThrow(
      expect.objectContaining({ code: "sesi-belum-selesai" }),
    );
  });

  it("sesi terakhir selesai (yang dilewati boleh) → closed; dobel tap = false, rev tetap", () => {
    const store = fresh();
    store.startSession(HMD_ID, "s01", t("13:00"));
    store.startSession(HMD_ID, "s04", t("15:30")); // s02 & s03 dilewati
    store.finishSession(HMD_ID, "s04", t("16:58"));
    expect(store.canClose(HMD_ID)).toBe(true);
    expect(store.closeEvent(HMD_ID, t("17:02"))).toBe(true);
    const rev = store.rev;
    expect(store.closeEvent(HMD_ID, t("17:03"))).toBe(false);
    expect(store.rev).toBe(rev);
    expect(store.getEvent(HMD_ID)).toMatchObject({
      mode: "closed",
      closedAt: t("17:02"),
      activeSessionId: null,
      nextSessionId: null,
    });
  });

  it("setelah ditutup sesi nggak bisa dimulai lagi; buka lagi (dev) → jeda", () => {
    const store = fresh();
    store.startSession(HMD_ID, "s04", t("15:30"));
    store.finishSession(HMD_ID, "s04", t("16:58"));
    store.closeEvent(HMD_ID, t("17:02"));
    expect(() => store.startSession(HMD_ID, "s01", t("17:05"))).toThrow(
      expect.objectContaining({ code: "acara-ditutup" }),
    );
    expect(store.reopenEvent(HMD_ID, t("17:06"))).toBe(true);
    expect(store.getEvent(HMD_ID)).toMatchObject({ mode: "jeda", closedAt: null });
    expect(store.reopenEvent(HMD_ID, t("17:07"))).toBe(false);
  });
});

describe("buku tamu (T14)", () => {
  it("belum ditutup → ditolak; belum check-in → ditolak", () => {
    const open = closedWith(2, false);
    expect(() => open.store.addFeedback(open.inside[0].id, input(1), t("16:59"))).toThrow(
      expect.objectContaining({ code: "acara-belum-ditutup" }),
    );
    const { store, outside } = closedWith(2);
    expect(() => store.addFeedback(outside.id, input(1), t("17:10"))).toThrow(
      expect.objectContaining({ code: "belum-masuk" }),
    );
  });

  it("rating kosong / 6 / pecahan ditolak; sesi asing & teks > 280 ditolak", () => {
    const { store, inside } = closedWith(1);
    const g = inside[0].id;
    for (const rating of [0, 6, 4.5, Number.NaN]) {
      expect(() => store.addFeedback(g, input(1, { rating }), t("17:10"))).toThrow(StoreError);
    }
    expect(() => store.addFeedback(g, input(1, { highlightSessionId: "x" }), t("17:10"))).toThrow(
      StoreError,
    );
    expect(() => store.addFeedback(g, input(1, { improve: "a".repeat(281) }), t("17:10"))).toThrow(
      StoreError,
    );
    expect(store.listFeedback(HMD_ID)).toHaveLength(0);
  });

  it("kirim ulang id sama aman (rev tetap); isian kedua id lain → sudah-isi", () => {
    const { store, inside } = closedWith(1);
    const g = inside[0].id;
    expect(store.addFeedback(g, input(1, { improve: "  Parkir  " }), t("17:10")).created).toBe(
      true,
    );
    expect(store.feedbackFor(g)?.improve).toBe("Parkir");
    const rev = store.rev;
    expect(store.addFeedback(g, input(1), t("17:11")).created).toBe(false);
    expect(store.rev).toBe(rev);
    expect(() => store.addFeedback(g, input(2), t("17:12"))).toThrow(
      expect.objectContaining({ code: "sudah-isi" }),
    );
  });

  it("hapus tamu → isian buku tamunya ikut hilang", () => {
    const { store, inside } = closedWith(1);
    store.addFeedback(inside[0].id, input(1), t("17:10"));
    store.deleteGuest(inside[0].id);
    expect(store.listFeedback(HMD_ID)).toHaveLength(0);
  });
});

describe("rekap (P11 / P11c)", () => {
  it("rata-rata 1 desimal, % dari yang jawab, paling seru urut turun, nomor jawaban", () => {
    const { store, inside } = closedWith(5);
    const add = (i: number, over: Partial<FeedbackInput>, hhmm: string) =>
      store.addFeedback(inside[i].id, input(i + 1, over), t(hhmm));
    add(0, { rating: 5, highlightSessionId: "s02", inviteAgain: true }, "17:10");
    add(1, { rating: 4, highlightSessionId: "s03", inviteAgain: false, improve: "AC" }, "17:11");
    add(2, { rating: 4, highlightSessionId: "s02", inviteAgain: null }, "17:12");
    add(3, { rating: 4, highlightSessionId: null, inviteAgain: true, improve: "Snack" }, "17:13");
    const r = store.feedbackRecap(HMD_ID);
    expect(r).toMatchObject({ respondents: 4, expected: 5, avgRating: 4.3, inviteAgainPct: 67 });
    expect(r.highlights.map((h) => [h.sessionId, h.count])).toEqual([
      ["s02", 2],
      ["s03", 1],
      ["s01", 0],
      ["s04", 0],
    ]);
    expect(r.improvements).toEqual([
      { no: 2, text: "AC", at: t("17:11") },
      { no: 4, text: "Snack", at: t("17:13") },
    ]);
  });

  it("belum ada yang ngisi: angka kosong, pembagi = yang udah masuk", () => {
    const { store } = closedWith(3);
    expect(store.feedbackRecap(HMD_ID)).toMatchObject({
      respondents: 0,
      expected: 3,
      avgRating: null,
      inviteAgainPct: null,
      improvements: [],
    });
  });
});

describe("ringkasan Claude (cache di store)", () => {
  it("< 3 jawaban nggak dibuat; tanpa nama; dobel dicegah; dibuat ulang tiap 3 jawaban baru", () => {
    const { store, inside } = closedWith(7);
    inside.slice(0, 2).forEach((g, i) => store.addFeedback(g.id, input(i + 1), t("17:10")));
    expect(store.beginSummary(HMD_ID, t("17:20"))).toBeNull();
    store.addFeedback(inside[2].id, input(3, { improve: "Parkir" }), t("17:11"));

    const job = store.beginSummary(HMD_ID, t("17:20"))!;
    expect(job.basedOn).toBe(3);
    expect(job.items[2]).toEqual({
      rating: 5,
      highlight: "Talkshow",
      improve: "Parkir",
      inviteAgain: true,
    });
    const sent = JSON.stringify(job.items);
    for (const g of inside) {
      expect(sent).not.toContain(g.name);
      expect(sent).not.toContain(g.ig);
    }
    // HP lain di saat yang sama → nggak ikut memanggil Claude.
    expect(store.beginSummary(HMD_ID, t("17:20"))).toBeNull();

    store.saveSummary(HMD_ID, 3, { points: ["a", "b", "c"] }, t("17:21"));
    expect(store.feedbackRecap(HMD_ID).summary).toEqual(["a", "b", "c"]);
    store.addFeedback(inside[3].id, input(4), t("17:22"));
    store.addFeedback(inside[4].id, input(5), t("17:23"));
    expect(store.beginSummary(HMD_ID, t("17:24"))).toBeNull(); // baru 2 jawaban baru
    store.addFeedback(inside[5].id, input(6), t("17:25"));
    expect(store.beginSummary(HMD_ID, t("17:26"))?.basedOn).toBe(6);
  });

  it("gagal → poin lama tetap, nggak diulang otomatis; Coba lagi (force) membuat ulang", () => {
    const { store, inside } = closedWith(3);
    inside.forEach((g, i) => store.addFeedback(g.id, input(i + 1), t("17:10")));
    store.beginSummary(HMD_ID, t("17:20"));
    store.saveSummary(HMD_ID, 3, { points: ["a", "b", "c"] }, t("17:21"));
    store.beginSummary(HMD_ID, t("17:30"), true);
    store.saveSummary(HMD_ID, 3, { error: "Claude kelamaan" }, t("17:31"));
    expect(store.getEvent(HMD_ID)?.summary).toMatchObject({
      points: ["a", "b", "c"],
      error: "Claude kelamaan",
      pendingSince: null,
    });
    expect(store.beginSummary(HMD_ID, t("17:40"))).toBeNull();
    expect(store.beginSummary(HMD_ID, t("17:40"), true)).not.toBeNull();
  });
});

describe("hapus data per orang H+30 (P11d)", () => {
  it("rekap tanpa nama tetap, data per orang & foto hilang, link lama mati, idempoten", () => {
    const { store, inside } = closedWith(3, false);
    store.addPhoto({
      id: uuid(9),
      guestId: inside[0].id,
      at: t("14:00"),
      width: 5,
      height: 6,
      bytes: 1,
    });
    store.closeEvent(HMD_ID, t("17:00"));
    inside.forEach((g, i) =>
      store.addFeedback(g.id, input(i + 1, { rating: 4, improve: "Parkir" }), t("17:10")),
    );
    store.saveSummary(HMD_ID, 3, { points: ["a", "b", "c"] }, t("17:21"));
    const before = store.feedbackRecap(HMD_ID);
    const oldToken = inside[0].token;
    const names = store.listGuests(HMD_ID).map((g) => g.name);

    const at = "2026-12-08T00:00:00+07:00";
    expect(store.purgePersonalData(HMD_ID, at)).toEqual([uuid(9)]);
    expect(store.feedbackRecap(HMD_ID)).toEqual({
      ...before,
      improvements: [],
      purgedAt: at,
    });
    expect(store.listFeedback(HMD_ID)).toHaveLength(0);
    expect(store.photoCount(HMD_ID)).toBe(0);
    expect(store.getGuestByToken(oldToken)).toBeNull();
    const guests = store.listGuests(HMD_ID);
    expect(guests.every((g) => g.wa === null && /^Tamu #\d+$/.test(g.name))).toBe(true);
    expect(guests.some((g) => names.includes(g.name))).toBe(false);

    const rev = store.rev;
    expect(store.purgePersonalData(HMD_ID, at)).toEqual([]);
    expect(store.rev).toBe(rev);
    expect(() => store.addFeedback(guests[0].id, input(8), at)).toThrow(StoreError);
  });
});
