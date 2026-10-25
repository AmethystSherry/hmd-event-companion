import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { parseGuestCsv } from "../csv";
import { HMD_ID, seedData } from "./seed";
import { createStore, isStoreError, StoreError } from "./store";

// N1 · pertanyaan talkshow: kirim (cuma pas talkshow, idempoten per clientId), tandai dijawab,
// ikut dihapus H+30.

const t = (hhmm: string) => `2026-11-08T${hhmm}:00+07:00`;
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

// 3 tamu hadir, 2 udah masuk; sesi `live` dimulai (s02 = Talkshow).
function setup(live: string | null = "s02") {
  const store = createStore(seedData(), { persist: vi.fn() });
  const csv = parseGuestCsv(
    readFileSync(join(__dirname, "..", "..", "public", "dev", "tamu-hmd-dummy.csv"), "utf8"),
  );
  if (!csv.ok) throw new Error(csv.message);
  store.importCsv(HMD_ID, "tamu-hmd-dummy.csv", csv.valid, null);
  const guests = store.listGuests(HMD_ID).slice(0, 3);
  guests.forEach((g, i) => {
    store.setRsvp(g.id, {
      rsvp: "hadir",
      name: g.name,
      ig: g.ig,
      wa: "6281234567890",
      followConfirmed: true,
    });
    if (i < 2) {
      store.checkIn(
        HMD_ID,
        { ticketId: store.ticketFor(g.id)!.ticketId },
        { opId: `op${i}`, method: "manual", by: "HP 1", at: t("13:05") },
      );
    }
  });
  if (live) store.startSession(HMD_ID, live, t("14:00"));
  return { store, inside: guests.slice(0, 2), outside: guests[2]! };
}

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as StoreError).code;
  }
  return null;
};

describe("addQuestion (BT08 → BT09)", () => {
  it("talkshow jalan → tersimpan dengan sessionId talkshow, teks di-trim, rev naik", () => {
    const { store, inside } = setup();
    const rev = store.rev;
    const { question, created } = store.addQuestion(
      inside[0]!.id,
      { clientId: uuid(1), text: "  Gimana mulainya?  " },
      t("14:21"),
    );
    expect(created).toBe(true);
    expect(question).toMatchObject({
      sessionId: "s02",
      text: "Gimana mulainya?",
      answeredAt: null,
    });
    expect(store.rev).toBe(rev + 1);
  });

  it("kirim ulang clientId yang sama → pertanyaan sama, nggak dobel, rev tetap", () => {
    const { store, inside } = setup();
    const a = store.addQuestion(inside[0]!.id, { clientId: uuid(1), text: "Halo?" }, t("14:21"));
    const rev = store.rev;
    const b = store.addQuestion(inside[0]!.id, { clientId: uuid(1), text: "Halo?" }, t("14:22"));
    expect(b.created).toBe(false);
    expect(b.question.id).toBe(a.question.id);
    expect(store.listQuestions(HMD_ID)).toHaveLength(1);
    expect(store.rev).toBe(rev);
    // clientId yang sama dari tamu lain = bentrok
    expect(
      code(() => store.addQuestion(inside[1]!.id, { clientId: uuid(1), text: "x" }, t("14:23"))),
    ).toBe("isian-tidak-valid");
  });

  it("sesi yang jalan bukan talkshow / jeda / ditutup → bukan-talkshow", () => {
    const info = setup("s01");
    expect(
      code(() =>
        info.store.addQuestion(info.inside[0]!.id, { clientId: uuid(1), text: "a" }, t("13:30")),
      ),
    ).toBe("bukan-talkshow");
    const jeda = setup();
    jeda.store.finishSession(HMD_ID, "s02", t("14:45"));
    expect(
      code(() =>
        jeda.store.addQuestion(jeda.inside[0]!.id, { clientId: uuid(2), text: "a" }, t("14:46")),
      ),
    ).toBe("bukan-talkshow");
  });

  it("belum check-in → belum-masuk; teks kosong / > 280 → isian-tidak-valid", () => {
    const { store, inside, outside } = setup();
    expect(
      code(() => store.addQuestion(outside.id, { clientId: uuid(1), text: "a" }, t("14:10"))),
    ).toBe("belum-masuk");
    expect(
      code(() => store.addQuestion(inside[0]!.id, { clientId: uuid(2), text: "   " }, t("14:10"))),
    ).toBe("isian-tidak-valid");
    expect(
      code(() =>
        store.addQuestion(inside[0]!.id, { clientId: uuid(3), text: "a".repeat(281) }, t("14:10")),
      ),
    ).toBe("isian-tidak-valid");
    expect(
      store.addQuestion(inside[0]!.id, { clientId: uuid(4), text: "a".repeat(280) }, t("14:10"))
        .created,
    ).toBe(true);
  });
});

describe("isStoreError", () => {
  it("dikenali lewat name + code (route handler di dev bisa beda instance kelas)", () => {
    expect(isStoreError(new StoreError("bukan-talkshow", "x"))).toBe(true);
    const foreign = Object.assign(new Error("x"), { name: "StoreError", code: "bukan-talkshow" });
    expect(isStoreError(foreign)).toBe(true);
    expect(isStoreError(new Error("x"))).toBe(false);
  });
});

describe("setQuestionAnswered (P10 ✓ / ↺)", () => {
  it("bolak-balik idempoten", () => {
    const { store, inside } = setup();
    const { question } = store.addQuestion(
      inside[0]!.id,
      { clientId: uuid(1), text: "a" },
      t("14:10"),
    );
    expect(store.setQuestionAnswered(HMD_ID, question.id, true, t("14:20"))).toBe(true);
    const rev = store.rev;
    expect(store.setQuestionAnswered(HMD_ID, question.id, true, t("14:21"))).toBe(false);
    expect(store.rev).toBe(rev);
    expect(store.listQuestions(HMD_ID)[0]!.answeredAt).toBe(t("14:20"));
    expect(store.setQuestionAnswered(HMD_ID, question.id, false, t("14:22"))).toBe(true);
    expect(store.listQuestions(HMD_ID)[0]!.answeredAt).toBeNull();
    expect(store.setQuestionAnswered(HMD_ID, question.id, false, t("14:23"))).toBe(false);
    expect(code(() => store.setQuestionAnswered(HMD_ID, "nggak-ada", true, t("14:23")))).toBe(
      "pertanyaan-tidak-ada",
    );
  });

  it("ikut terhapus H+30", () => {
    const { store, inside } = setup();
    store.addQuestion(inside[0]!.id, { clientId: uuid(1), text: "a" }, t("14:10"));
    store.purgePersonalData(HMD_ID, "2026-12-08T00:00:00+07:00");
    expect(store.listQuestions(HMD_ID)).toHaveLength(0);
  });
});
