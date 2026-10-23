import { describe, expect, it } from "vitest";
import { seedData } from "./data/seed";
import { createStore } from "./data/store";
import { hms, maskWa, msLabel } from "./format";
import { elapsedMs, rundownView } from "./rundown";

const t = (hhmm: string) => `2026-11-08T${hhmm}:00+07:00`;

function view(fn?: (s: ReturnType<typeof createStore>) => void) {
  const store = createStore(seedData());
  fn?.(store);
  return rundownView(store.getEvent("hmd-2026")!, store.listSessions("hmd-2026"));
}

describe("rundown hari-H (BP00)", () => {
  it("belum ada yang mulai → sesi 1 berikutnya, carousel di kartu 1", () => {
    const v = view();
    expect(v.sessions.map((s) => s.state)).toEqual(["berikutnya", "nanti", "nanti", "nanti"]);
    expect(v.sessions[0]).toMatchObject({ startsAt: "13.00", endsAt: "14.00" });
    expect(v.focusIndex).toBe(0);
  });

  it("sesi 2 jalan → sesi 1 selesai, 3 berikutnya, carousel di kartu 2", () => {
    const v = view((s) => {
      s.startSession("hmd-2026", "s01", t("13:00"));
      s.startSession("hmd-2026", "s02", t("14:00"));
    });
    expect(v.sessions.map((s) => s.state)).toEqual([
      "selesai",
      "berlangsung",
      "berikutnya",
      "nanti",
    ]);
    expect(v.focusIndex).toBe(1);
    expect(v.active?.title).toBe("Talkshow");
  });

  it("jeda → fokus ke sesi berikutnya; stopwatch dari startedAt server", () => {
    const v = view((s) => {
      s.startSession("hmd-2026", "s01", t("13:00"));
      s.finishSession("hmd-2026", "s01", t("13:58"));
    });
    expect(v.active).toBeNull();
    expect(v.focusIndex).toBe(1);
    expect(hms(elapsedMs(v.sessions[0], Date.parse(t("16:00"))))).toBe("00:58:00");
    expect(elapsedMs(v.sessions[1], Date.now())).toBe(0);
    expect(hms(754_000)).toBe("00:12:34");
    expect(msLabel(754_000)).toBe("12:34");
  });

  it("nomor WA disamarkan", () => {
    expect(maskWa("6285712342210")).toBe("0857-xxxx-2210");
    expect(maskWa(null)).toBeNull();
  });
});
