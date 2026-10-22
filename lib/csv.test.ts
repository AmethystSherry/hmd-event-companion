import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  commonMessage,
  csvSummary,
  formatWa,
  normalizeIg,
  normalizeWa,
  parseGuestCsv,
} from "./csv";

const read = (f: string) => readFileSync(join(__dirname, "..", "public", "dev", f), "utf8");

describe("normalisasi", () => {
  it("IG: buang @, URL, huruf besar", () => {
    expect(normalizeIg(" @Rara.W ")).toBe("rara.w");
    expect(normalizeIg("https://www.instagram.com/rara.w/?hl=id")).toBe("rara.w");
  });

  it("WA: 08… / +62 / 8… → 62…, kosong → null", () => {
    expect(normalizeWa("0812-3456-7890")).toBe("6281234567890");
    expect(normalizeWa("+62 812 3456 7890")).toBe("6281234567890");
    expect(normalizeWa("812345")).toBe("62812345");
    expect(normalizeWa("  ")).toBeNull();
    expect(formatWa("6281234567890")).toBe("0812 3456 7890");
  });
});

describe("parseGuestCsv", () => {
  it("CSV dummy 20 baris: 0 error, 3 WA kosong (P04a)", () => {
    const r = parseGuestCsv(read("tamu-hmd-dummy.csv"));
    if (!r.ok) throw new Error(r.message);
    expect(r.rows).toHaveLength(20);
    expect(r.valid).toHaveLength(20);
    expect(r.columns.waEmpty).toBe(3);
    expect(csvSummary(r)).toBe("20 baris · 0 error · semua punya IG");
  });

  it("CSV error: nama kosong, IG dobel, format WA salah ditandai per baris (P04c)", () => {
    const r = parseGuestCsv(read("tamu-hmd-error.csv"));
    if (!r.ok) throw new Error(r.message);
    expect(r.rows).toHaveLength(24);
    expect(r.issues.map((i) => [i.line, i.title])).toEqual([
      [22, "Kosong"],
      [23, "IG dobel"],
      [24, "Format WA salah"],
    ]);
    expect(r.issues[1].detail).toBe("@bimanug dipakai di baris 6 & 23");
    expect(r.issues[2].detail).toBe("8123-45 — kurang digit");
    expect(r.valid).toHaveLength(21);
    expect(csvSummary(r)).toBe("24 baris · 3 perlu dicek");
  });

  it("pemisah ; (Excel ID), kutip berisi koma, BOM", () => {
    const r = parseGuestCsv('﻿nama;ig;pesan\n"Rara, W";rara;"Halo {nama}, ini {link}"\n');
    if (!r.ok) throw new Error(r.message);
    expect(r.rows[0]).toMatchObject({
      name: "Rara, W",
      ig: "rara",
      message: "Halo {nama}, ini {link}",
    });
    expect(commonMessage(r.rows)).toBe("Halo {nama}, ini {link}");
  });

  it("tanpa kolom wajib / kosong → ditolak", () => {
    expect(parseGuestCsv("nama,wa\nRara,0812").ok).toBe(false);
    expect(parseGuestCsv("nama,ig\n").ok).toBe(false);
  });
});
