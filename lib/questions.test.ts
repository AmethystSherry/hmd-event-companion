import { describe, expect, it } from "vitest";
import type { Question } from "./data/types";
import {
  displayNames,
  myQuestions,
  parseQuestionBody,
  questionsView,
  talkshowFor,
  toggleAnswered,
} from "./questions";
import type { SessionView } from "./rundown";

const uuid = "00000000-0000-4000-8000-000000000001";
const t = (hhmm: string) => `2026-11-08T${hhmm}:00+07:00`;

describe("parseQuestionBody", () => {
  it("trim, 1–280 huruf, clientId UUID", () => {
    expect(parseQuestionBody({ clientId: uuid, text: "  Halo  " })).toEqual({
      clientId: uuid,
      text: "Halo",
    });
    expect(parseQuestionBody({ clientId: uuid, text: "   " })).toBeNull();
    expect(parseQuestionBody({ clientId: uuid, text: "a".repeat(281) })).toBeNull();
    expect(parseQuestionBody({ clientId: uuid, text: "a".repeat(280) })).not.toBeNull();
    expect(parseQuestionBody({ clientId: "abc", text: "Halo" })).toBeNull();
    expect(parseQuestionBody(null)).toBeNull();
  });
});

describe("displayNames", () => {
  it("nama depan; nama depan dobel → + inisial belakang", () => {
    const names = displayNames([
      { id: "a", name: "Rara Sekar" },
      { id: "b", name: "Rara Wulan" },
      { id: "c", name: "Dimas Anggara" },
      { id: "d", name: "rara" },
    ]);
    expect(names.get("a")).toBe("Rara S.");
    expect(names.get("b")).toBe("Rara W.");
    expect(names.get("c")).toBe("Dimas");
    expect(names.get("d")).toBe("rara"); // satu kata: nggak ada inisial
  });
});

describe("questionsView", () => {
  const q = (
    id: string,
    at: string,
    answeredAt: string | null = null,
    sessionId = "s02",
  ): Question => ({
    id,
    clientId: id,
    eventId: "e",
    guestId: "a",
    sessionId,
    text: id,
    createdAt: t(at),
    answeredAt,
  });
  const list = [
    q("q1", "14:05", t("14:30")),
    q("q2", "14:10"),
    q("q3", "14:20"),
    q("q4", "14:08", t("14:40")),
    q("lain", "13:10", null, "s01"),
  ];

  it("belum dijawab terbaru dulu, udah dijawab = terakhir dijawab di atas, sesi lain dibuang", () => {
    const v = questionsView(list, [{ id: "a", name: "Rara Sekar" }], "s02");
    expect(v.total).toBe(4);
    expect(v.answeredCount).toBe(2);
    expect(v.open.map((r) => r.id)).toEqual(["q3", "q2"]);
    expect(v.answered.map((r) => r.id)).toEqual(["q4", "q1"]);
    expect(v.open[0]).toMatchObject({ name: "Rara", time: "14.20" });
  });

  it("toggleAnswered memindahkan baris", () => {
    const v = questionsView(list, [], "s02");
    const moved = toggleAnswered(v, "q2", t("14:50"));
    expect(moved.open.map((r) => r.id)).toEqual(["q3"]);
    expect(moved.answered.map((r) => r.id)).toEqual(["q2", "q4", "q1"]);
    const back = toggleAnswered(moved, "q2", null);
    expect(back.open.map((r) => r.id)).toEqual(["q3", "q2"]);
  });
});

describe("talkshowFor", () => {
  const s = (
    id: string,
    type: "info" | "talkshow",
    state: SessionView["state"],
    startedAt: string | null = null,
  ) => ({ id, type, state, startedAt }) as SessionView;

  it("yang jalan → terakhir dimulai → berikutnya", () => {
    expect(talkshowFor([s("a", "talkshow", "berlangsung", t("14:00"))])?.id).toBe("a");
    expect(
      talkshowFor([s("a", "talkshow", "selesai", t("14:00")), s("b", "info", "berlangsung")])?.id,
    ).toBe("a");
    expect(talkshowFor([s("a", "info", "berlangsung"), s("b", "talkshow", "berikutnya")])?.id).toBe(
      "b",
    );
    expect(talkshowFor([s("a", "info", "nanti")])).toBeNull();
  });
});

describe("myQuestions", () => {
  const q = (id: string, guestId: string, at: string, answeredAt?: string): Question => ({
    id,
    clientId: uuid,
    eventId: "e",
    guestId,
    sessionId: "s02",
    text: `Tanya ${id}`,
    createdAt: t(at),
    answeredAt,
  });
  it("cuma milik tamu itu, terbaru dulu, + status dijawab", () => {
    const list = [q("a", "g1", "14:05"), q("b", "g2", "14:06"), q("c", "g1", "14:10", t("14:20"))];
    expect(myQuestions(list, "g1")).toEqual([
      { id: "c", text: "Tanya c", time: "14.10", answered: true },
      { id: "a", text: "Tanya a", time: "14.05", answered: false },
    ]);
  });
});
