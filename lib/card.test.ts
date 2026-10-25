import { describe, expect, it } from "vitest";
import { cardOf, cardSubtitle, normalizeCard, splitInterests } from "./card";

// N3 · kartu kenalan: satu sumber tampilan (cardOf) + validasi simpan T11 (normalizeCard).

describe("cardOf", () => {
  it("pakai Guest.card kalau ada", () => {
    expect(
      cardOf({
        card: { role: "Product designer", askAbout: ["UX writing", "Kopi"] },
        job: "Lain",
        interests: "lain juga",
      }),
    ).toEqual({ role: "Product designer", askAbout: ["UX writing", "Kopi"] });
  });

  it("card kosong tetap menang (simpan kosong dari T11)", () => {
    expect(cardOf({ card: { role: null, askAbout: [] }, job: "Lama", interests: "x" })).toEqual({
      role: null,
      askAbout: [],
    });
  });

  it("tanpa card → turunan job + interests T02", () => {
    expect(cardOf({ job: "  Motion   designer ", interests: "Rive, film horor" })).toEqual({
      role: "Motion designer",
      askAbout: ["Rive", "film horor"],
    });
    expect(cardOf({ job: null, interests: null })).toEqual({ role: null, askAbout: [] });
  });

  it("interests dipecah koma / titik koma, dobel & kosong dibuang, maks 3, ≤ 20 huruf", () => {
    expect(splitInterests("Kopi; kopi, , UX writing,Design system, Rive")).toEqual([
      "Kopi",
      "UX writing",
      "Design system",
    ]);
    expect(splitInterests("Fotografi analog dan film 35mm")).toEqual(["Fotografi analog dan"]);
  });
});

describe("normalizeCard", () => {
  it("trim, role kosong = null, minat dobel dibuang", () => {
    expect(normalizeCard({ role: "  ", askAbout: [" Kopi ", "kopi", ""] })).toEqual({
      role: null,
      askAbout: ["Kopi"],
    });
    expect(normalizeCard({ role: null, askAbout: [] })).toEqual({ role: null, askAbout: [] });
  });

  it("lewat batas ditolak, bukan dipotong", () => {
    expect(normalizeCard({ role: "x".repeat(41), askAbout: [] })).toBeNull();
    expect(normalizeCard({ role: "x".repeat(40), askAbout: [] })).not.toBeNull();
    expect(normalizeCard({ role: null, askAbout: ["a", "b", "c", "d"] })).toBeNull();
    expect(normalizeCard({ role: null, askAbout: ["y".repeat(21)] })).toBeNull();
  });

  it("bentuk aneh ditolak", () => {
    expect(normalizeCard(null)).toBeNull();
    expect(normalizeCard({ role: 3, askAbout: [] })).toBeNull();
    expect(normalizeCard({ role: null, askAbout: "Kopi" })).toBeNull();
    expect(normalizeCard({ role: null, askAbout: [1] })).toBeNull();
  });
});

it("cardSubtitle: kosong → belum isi pekerjaan (T11e)", () => {
  expect(cardSubtitle("rarawening", null)).toBe("@rarawening · belum isi pekerjaan");
  expect(cardSubtitle("rarawening", "Product designer")).toBe("@rarawening · Product designer");
});
