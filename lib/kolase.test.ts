import { describe, expect, it } from "vitest";
import { KOLASE_H, KOLASE_W, kolaseWall, masonry } from "./kolase";

describe("masonry 2 kolom", () => {
  it("item masuk kolom terpendek, urutan tetap", () => {
    const cols = masonry([1.2, 0.8, 0.8, 1.2, 1], (r) => r);
    expect(cols).toEqual([
      [1.2, 1.2],
      [0.8, 0.8, 1],
    ]);
  });

  it("tinggi sama → bergantian kiri-kanan", () => {
    expect(masonry([1, 2, 3, 4], () => 1)).toEqual([
      [1, 3],
      [2, 4],
    ]);
  });
});

describe("kolase dinding 9:16", () => {
  const overlap = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  it.each([1, 3, 12, 37, 80])(
    "%i foto: semua masuk bidang, nggak tumpang tindih, tiap foto sekali",
    (n) => {
      const cells = kolaseWall(n, 7);
      expect(cells).toHaveLength(n);
      expect(new Set(cells.map((c) => c.index)).size).toBe(n);
      for (const c of cells) {
        expect(c.w).toBeGreaterThan(20);
        expect(c.h).toBeGreaterThan(20);
        expect(c.x - c.paper).toBeGreaterThanOrEqual(0);
        expect(c.y - c.paper).toBeGreaterThanOrEqual(0);
        expect(c.x + c.w + c.paper).toBeLessThanOrEqual(KOLASE_W);
        expect(c.y + c.h + c.paper).toBeLessThanOrEqual(KOLASE_H);
      }
      for (const a of cells) for (const b of cells) if (a !== b) expect(overlap(a, b)).toBe(false);
    },
  );

  it("seed sama → susunan sama; seed lain → beda (tombol Acak)", () => {
    expect(kolaseWall(20, 1)).toEqual(kolaseWall(20, 1));
    expect(kolaseWall(20, 2)).not.toEqual(kolaseWall(20, 1));
  });

  it("bidang hampir penuh terisi", () => {
    const cells = kolaseWall(30, 3);
    const area = cells.reduce((n, c) => n + (c.w + c.paper * 2) * (c.h + c.paper * 2), 0);
    expect(area / (KOLASE_W * KOLASE_H)).toBeGreaterThan(0.7);
  });
});
