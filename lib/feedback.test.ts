import { describe, expect, it } from "vitest";
import type { FeedbackSummary } from "./data/types";
import { parseFeedbackBody, purgeAt, summaryDue, summaryView } from "./feedback";

const ID = "00000000-0000-4000-8000-000000000001";

describe("tanggal hapus H+30", () => {
  it("HMD 8 Nov 2026 → 8 Des 2026 00.00 WIB", () => {
    expect(purgeAt("2026-11-08").toISOString()).toBe("2026-12-07T17:00:00.000Z");
  });
});

describe("body POST buku tamu", () => {
  it("bentuk benar → FeedbackInput; opsional boleh kosong", () => {
    expect(parseFeedbackBody({ clientId: ID, rating: 4 })).toEqual({
      id: ID,
      rating: 4,
      highlightSessionId: null,
      improve: null,
      inviteAgain: null,
    });
  });

  it("clientId bukan UUID / rating bukan angka / tipe salah → null", () => {
    expect(parseFeedbackBody(null)).toBeNull();
    expect(parseFeedbackBody({ clientId: "x", rating: 4 })).toBeNull();
    expect(parseFeedbackBody({ clientId: ID, rating: "4" })).toBeNull();
    expect(parseFeedbackBody({ clientId: ID, rating: 4, inviteAgain: "ya" })).toBeNull();
    expect(parseFeedbackBody({ clientId: ID, rating: 4, improve: 3 })).toBeNull();
  });
});

describe("kapan ringkasan dibuat", () => {
  const state = (over: Partial<FeedbackSummary> = {}): FeedbackSummary => ({
    points: ["a", "b", "c"],
    basedOn: 3,
    createdAt: "2026-11-08T10:00:00Z",
    error: null,
    errorAt: null,
    pendingSince: null,
    ...over,
  });
  const now = Date.parse("2026-11-08T10:10:00Z");

  it("minimal 3 jawaban", () => {
    expect(summaryDue(null, 2, now)).toBe(false);
    expect(summaryDue(null, 3, now)).toBe(true);
  });

  it("cache dipakai sampai ada ≥ 3 jawaban baru; force selalu", () => {
    expect(summaryDue(state(), 5, now)).toBe(false);
    expect(summaryDue(state(), 6, now)).toBe(true);
    expect(summaryDue(state(), 3, now, true)).toBe(true);
  });

  it("sedang dibuat (< 30 dtk) → nggak dobel, juga kalau force; kedaluwarsa → boleh", () => {
    const pending = state({ pendingSince: "2026-11-08T10:09:50Z" });
    expect(summaryDue(pending, 9, now, true)).toBe(false);
    const stale = state({ pendingSince: "2026-11-08T10:09:00Z" });
    expect(summaryDue(stale, 9, now)).toBe(true);
  });
});

describe("kartu ringkasan P11", () => {
  const now = Date.parse("2026-11-08T10:10:00Z");
  const base = { respondents: 5, purgedAt: null, summary: null };
  const state = {
    points: null,
    basedOn: 5,
    createdAt: null,
    error: null,
    errorAt: null,
    pendingSince: null,
  };

  it("< 3 jawaban → nunggu; belum pernah → minta dibuat", () => {
    expect(summaryView(null, { ...base, respondents: 2 }, now)).toEqual({ kind: "waiting" });
    expect(summaryView(null, base, now)).toEqual({ kind: "pending", request: true });
  });

  it("poin segar → siap; basi → poin lama + minta dibuat ulang", () => {
    const ready = { ...state, points: ["a", "b", "c"] };
    expect(summaryView(ready, base, now)).toEqual({
      kind: "ready",
      points: ready.points,
      request: false,
    });
    expect(summaryView(ready, { ...base, respondents: 8 }, now)).toMatchObject({ request: true });
  });

  it("gagal tanpa poin → P11b; HP lain lagi membuat → skeleton tanpa minta", () => {
    expect(summaryView({ ...state, error: "x" }, base, now)).toEqual({ kind: "failed" });
    const busy = { ...state, pendingSince: "2026-11-08T10:09:55Z" };
    expect(summaryView(busy, base, now)).toEqual({ kind: "pending", request: false });
  });

  it("data udah dihapus → poin arsip atau nggak ada kartu", () => {
    const purged = { ...base, purgedAt: "2026-12-08T00:00:00+07:00" };
    expect(summaryView(null, { ...purged, summary: ["a"] }, now)).toEqual({
      kind: "ready",
      points: ["a"],
    });
    expect(summaryView(null, purged, now)).toEqual({ kind: "none" });
  });
});
