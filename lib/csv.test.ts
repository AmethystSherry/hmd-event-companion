import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { importGuests, importSummary, normalizeWa, parseCsv } from "./csv";

describe("CSV import (P04)", () => {
  it("CSV dummy 20 baris ter-import tanpa error", () => {
    const text = readFileSync(join(process.cwd(), "data/tamu-hmd-dummy.csv"), "utf8");
    const r = importGuests(text);
    expect(r.errors).toEqual([]);
    expect(r.rows).toHaveLength(20);
    expect(importSummary(r)).toBe("20 baris · 0 error · 3 tanpa WA");
  });

  it("menandai baris kosong, IG dobel, dan format WA salah", () => {
    const r = importGuests(
      [
        "nama,ig,wa",
        "Rara,@rara,0812345678",
        ",@kosong,",
        "Rara Dua,@RARA,",
        "Bima,@bima,12ab",
        "",
      ].join("\n"),
    );
    expect(r.rows.map((x) => x.ig)).toEqual(["rara"]);
    expect(r.errors.map((e) => e.line)).toEqual([3, 4, 5]);
    expect(r.errors[1].message).toContain("dobel");
    expect(r.total).toBe(4);
  });

  it("header wajib punya nama dan ig", () => {
    expect(importGuests("foo,bar\n1,2").errors[0].message).toContain("Header");
  });

  it("menormalkan nomor WA ke 62…", () => {
    expect(normalizeWa("0812-0000-0101")).toBe("6281200000101");
    expect(normalizeWa("+62 812 0000 0101")).toBe("6281200000101");
    expect(normalizeWa("  ")).toBeNull();
  });

  it("parser mendukung kutip, titik koma, dan CRLF", () => {
    expect(parseCsv('nama;ig\r\n"Putri, S.";@putri\r\n')).toEqual([
      ["nama", "ig"],
      ["Putri, S.", "@putri"],
    ]);
  });
});

describe("ringkasan error CSV (P04c)", () => {
  it("jenis + detail per baris dan ringkasan 'perlu dicek'", () => {
    const r = importGuests(
      ["nama,ig,wa", "Bima,@bimanug,", ",@x,", "Bima Lagi,@bimanug,", "Sari,@sari,8123-45"].join(
        "\n",
      ),
    );
    expect(r.errors.map((e) => [e.line, e.kind, e.detail])).toEqual([
      [3, "Kosong", "Nama belum diisi"],
      [4, "IG dobel", "@bimanug dipakai di baris 2 & 4"],
      [5, "Format WA salah", "8123-45 — kurang digit"],
    ]);
    expect(importSummary(r)).toBe("4 baris · 3 perlu dicek");
  });
});

describe("alasan format WA salah", () => {
  it("nomor berisi huruf → 'ada huruf'", () => {
    expect(importGuests("nama,ig,wa\nBima,@bima,0812abc").errors[0].detail).toBe(
      "0812abc — ada huruf",
    );
  });
});
