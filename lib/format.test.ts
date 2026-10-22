import { describe, expect, it } from "vitest";
import {
  countdownLabel,
  dateLong,
  dateShort,
  eventPhase,
  eventStart,
  fromMinutes,
  toMinutes,
} from "./format";

describe("format tanggal", () => {
  it("nama hari & bulan Indonesia", () => {
    expect(dateLong("2026-11-08")).toBe("Minggu, 8 Nov 2026");
    expect(dateShort("2026-11-08")).toBe("Min, 8 Nov");
  });

  it("fase event PE01: H-17 · Hari-H · Selesai (WIB)", () => {
    expect(eventPhase("2026-11-08", new Date("2026-10-22T10:00:00+07:00")).label).toBe(
      "Persiapan · H-17",
    );
    expect(eventPhase("2026-11-08", new Date("2026-11-08T00:30:00+07:00")).label).toBe("Hari-H");
    expect(eventPhase("2026-11-08", new Date("2026-11-09T08:00:00+07:00")).label).toBe("Selesai");
  });
});

describe("countdown T03 / T03h", () => {
  const start = eventStart("2026-11-08", "13.00");
  it("lebih dari 2 hari → hari & jam", () => {
    expect(countdownLabel(start, new Date("2026-10-22T09:00:00+07:00"))).toBe("17 hari 4 jam");
  });
  it("H-1 → jam & menit", () => {
    expect(countdownLabel(start, new Date("2026-11-07T18:18:00+07:00"))).toBe("18 jam 42 menit");
  });
  it("tidak pernah negatif", () => {
    expect(countdownLabel(start, new Date("2026-11-08T14:00:00+07:00"))).toBe("0 menit");
  });
});

describe("jam rundown", () => {
  it("HH.MM ↔ menit", () => {
    expect(toMinutes("14.45")).toBe(885);
    expect(fromMinutes(885 + 45)).toBe("15.30");
  });
});
