import { describe, expect, it } from "vitest";
import {
  applyOps,
  cleanWalkIn,
  doorCardCopy,
  doorCounts,
  searchGuests,
  ticketIdFromPayload,
  validateLocally,
  type DoorGuest,
} from "./door";
import { decodeFakeNow, encodeFakeNow, isEventDay } from "./server/clock";
import { timeWib } from "./format";

const SIG = "abcdefghijklmnop"; // 16 karakter
const at = "2026-11-08T06:04:00.000Z";

function guest(id: string, extra: Partial<DoorGuest> = {}): DoorGuest {
  return {
    id,
    name: `Tamu ${id}`,
    ig: `ig${id}`,
    keyNo: Number(id.replace(/\D/g, "")) || 1,
    rsvp: "hadir",
    source: "csv",
    ticketId: `t-${id}`,
    shortCode: `HMD-00${id}-7F3K`,
    status: "aktif",
    checkedInAt: null,
    guestNo: null,
    method: null,
    opId: null,
    ...extra,
  };
}

const manifest = [
  guest("1"),
  guest("2", { rsvp: "nggak" }),
  guest("3", { status: "dipakai", checkedInAt: at, guestNo: 1, method: "scan", opId: "x" }),
];

describe("validasi lokal di HP panitia (offline)", () => {
  it("isi QR harus <ticketId>.<sig 16>", () => {
    expect(ticketIdFromPayload(`t-1.${SIG}`)).toBe("t-1");
    expect(ticketIdFromPayload("https://contoh.com")).toBeNull();
    expect(ticketIdFromPayload("t-1.pendek")).toBeNull();
  });

  it("valid / sudah dipakai / tidak dikenal", () => {
    expect(validateLocally(manifest, `t-1.${SIG}`, at)).toMatchObject({
      kind: "valid",
      guestNo: 2,
    });
    expect(validateLocally(manifest, `t-3.${SIG}`, at)).toMatchObject({ kind: "sudah-dipakai" });
    expect(validateLocally(manifest, `t-9.${SIG}`, at)).toEqual({ kind: "tidak-dikenal" });
  });
});

describe("antrean check-in diterapkan di atas manifest", () => {
  it("scan + manual menambah hitungan; RSVP 'Nggak bisa' jadi hadir; Batalkan mengembalikan", () => {
    const view = applyOps(manifest, [
      { opId: "a", kind: "scan", payload: `t-1.${SIG}`, at },
      { opId: "b", kind: "manual", guestId: "2", at },
    ]);
    expect(doorCounts(view)).toEqual({ checkedIn: 3, expected: 3, total: 3 });
    expect(view.find((g) => g.id === "2")).toMatchObject({ status: "dipakai", pending: true });
    const undone = applyOps(manifest, [
      { opId: "b", kind: "manual", guestId: "2", at },
      { opId: "c", kind: "undo", target: "b", at },
    ]);
    expect(undone.find((g) => g.id === "2")?.status).toBe("aktif");
    expect(manifest[1].status).toBe("aktif"); // manifest asli tidak berubah
  });

  it("scan dobel tiket yang sama nggak menambah hitungan; walk-in muncul langsung masuk", () => {
    const view = applyOps(manifest, [
      { opId: "a", kind: "scan", payload: `t-1.${SIG}`, at },
      { opId: "a2", kind: "scan", payload: `t-1.${SIG}`, at },
      { opId: "w", kind: "walkin", name: "Budi Santoso", ig: "", at },
    ]);
    expect(doorCounts(view).checkedIn).toBe(3);
    expect(view.at(-1)).toMatchObject({ name: "Budi Santoso", status: "dipakai", guestNo: 3 });
  });
});

describe("P07 cari & P07c walk-in", () => {
  it("cari nama, @ig, atau kode pendek + filter", () => {
    expect(searchGuests(manifest, "@ig2", "semua").map((g) => g.id)).toEqual(["2"]);
    expect(searchGuests(manifest, "hmd-003", "semua").map((g) => g.id)).toEqual(["3"]);
    expect(searchGuests(manifest, "", "udah").map((g) => g.id)).toEqual(["3"]);
    expect(searchGuests(manifest, "", "belum")).toHaveLength(2);
  });

  it("nama wajib, IG opsional tapi harus valid & belum dipakai", () => {
    expect(cleanWalkIn({ name: "  ", ig: "" })).toMatchObject({ ok: false, field: "name" });
    expect(cleanWalkIn({ name: "Budi", ig: "" })).toEqual({ ok: true, name: "Budi", ig: "" });
    expect(cleanWalkIn({ name: "Budi", ig: "@Budi.S" })).toMatchObject({ ok: true, ig: "budi.s" });
    expect(cleanWalkIn({ name: "Budi", ig: "@ig1" }, manifest)).toMatchObject({ field: "ig" });
  });
});

describe("BP00 card Pintu masuk & hari-H", () => {
  const base = { date: "2026-11-08", startsAt: "13.00", secondSessionAt: "14.00", eventDay: true };
  const wib = (hhmm: string) => new Date(`2026-11-08T${hhmm}:00+07:00`);

  it("copy ikut kondisi", () => {
    expect(doorCardCopy({ ...base, checkedIn: 0, expected: 20, now: wib("12:35") })).toEqual({
      eyebrow: "Pintu masuk",
      title: "Buka 13.00",
      sub: "25 menit lagi · 20 tamu terdaftar",
    });
    expect(doorCardCopy({ ...base, checkedIn: 9, expected: 20, now: wib("13:30") })).toEqual({
      eyebrow: "Pintu masuk · buka sejak 13.00",
      title: "9 tamu udah masuk",
      sub: "11 lagi belum datang",
    });
    expect(doorCardCopy({ ...base, checkedIn: 15, expected: 20, now: wib("14:10") }).sub).toBe(
      "Yang telat tetap bisa masuk",
    );
    expect(doorCardCopy({ ...base, checkedIn: 20, expected: 20, now: wib("14:10") }).title).toBe(
      "Semua tamu udah masuk",
    );
  });

  it("hari-H mulai 00.00 WIB; jam palsu dev tetap berjalan", () => {
    expect(isEventDay("2026-11-08", new Date("2026-11-07T16:59:00Z"))).toBe(false); // 23.59 WIB
    expect(isEventDay("2026-11-08", new Date("2026-11-07T17:00:00Z"))).toBe(true); // 00.00 WIB
    const v = encodeFakeNow("2026-11-08T12:55:00+07:00", 1_000);
    expect(timeWib(decodeFakeNow(v, 61_000)!.toISOString())).toBe("12.56");
    expect(decodeFakeNow("bukan-tanggal")).toBeNull();
  });
});
