import { describe, expect, it } from "vitest";
import { KOLASE_H, KOLASE_W, kolaseLayout, masonry } from "./kolase";

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

describe("tata letak gambar 9:16", () => {
  const inside = (l: ReturnType<typeof kolaseLayout>) =>
    l.cells.every(
      (c) => c.x >= 0 && c.x + c.w <= KOLASE_W && c.y >= 0 && c.y + c.h + l.captionH <= KOLASE_H,
    );

  it("12 foto 5:6 muat semua di 1080×1920, 3 kolom, nggak tumpang tindih", () => {
    const l = kolaseLayout(new Array(12).fill(1.2));
    expect(l.columns).toBe(3);
    expect(l.cells).toHaveLength(12);
    expect(inside(l)).toBe(true);
    for (const a of l.cells)
      for (const b of l.cells) {
        if (a === b) continue;
        const overlap =
          a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h + 44 && b.y < a.y + a.h + 44;
        expect(overlap).toBe(false);
      }
  });

  it("sedikit foto → 2 kolom, lebar penuh, di tengah", () => {
    const l = kolaseLayout([1.2, 1.2, 1.2]);
    expect(l.columns).toBe(2);
    expect(inside(l)).toBe(true);
    const left = Math.min(...l.cells.map((c) => c.x));
    const right = Math.max(...l.cells.map((c) => c.x + c.w));
    expect(Math.abs(left - (KOLASE_W - right))).toBeLessThanOrEqual(1);
  });
});
