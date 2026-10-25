import { describe, expect, it, vi } from "vitest";
import { cardOf } from "../card";
import { HMD_ID, seedData } from "./seed";
import { createStore, type StoreError } from "./store";

// N3 · simpan kartu (T11) & sinkron dengan isian T02 (job / interests).

const t = (hhmm: string) => `2026-11-08T${hhmm}:00+07:00`;

function setup() {
  const store = createStore(seedData(), { persist: vi.fn() });
  const add = (name: string, ig: string) => store.addGuest(HMD_ID, { name, ig, wa: null });
  const rara = add("Rara Wening", "rarawening");
  const budi = add("Budi Santoso", "budi");
  const walk = add("Citra Ayu", "citra");
  store.setRsvp(rara.id, {
    rsvp: "hadir",
    name: rara.name,
    ig: rara.ig,
    wa: "6281234567890",
    followConfirmed: true,
  });
  // Citra belum jawab RSVP tapi udah masuk di pintu → boleh simpan kartu.
  store.checkIn(
    HMD_ID,
    { guestId: walk.id },
    { opId: "1", method: "manual", by: "HP A", at: t("13:00") },
  );
  return { store, rara, budi, walk };
}

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as StoreError).code;
  }
  return null;
};

describe("saveGuestCard", () => {
  it("menyimpan card + sinkron job/interests, rev naik", () => {
    const { store, rara } = setup();
    const rev = store.rev;
    const card = { role: "Product designer", askAbout: ["UX writing", "Design system", "Kopi"] };
    expect(store.saveGuestCard(rara.id, card)).toBe(true);
    expect(store.rev).toBe(rev + 1);
    const g = store.getGuest(rara.id)!;
    expect(g.card).toEqual(card);
    expect(g.job).toBe("Product designer");
    expect(g.interests).toBe("UX writing, Design system, Kopi");
  });

  it("idempoten: isi sama → false, rev tetap", () => {
    const { store, rara } = setup();
    store.saveGuestCard(rara.id, { role: "PM", askAbout: ["Kopi"] });
    const rev = store.rev;
    expect(store.saveGuestCard(rara.id, { role: "PM", askAbout: ["Kopi"] })).toBe(false);
    expect(store.rev).toBe(rev);
  });

  it("simpan kosong boleh → job/interests jadi null", () => {
    const { store, rara } = setup();
    store.saveGuestCard(rara.id, { role: "PM", askAbout: ["Kopi"] });
    expect(store.saveGuestCard(rara.id, { role: null, askAbout: [] })).toBe(true);
    const g = store.getGuest(rara.id)!;
    expect([g.job, g.interests]).toEqual([null, null]);
    expect(cardOf(g)).toEqual({ role: null, askAbout: [] });
  });

  it("belum RSVP & belum masuk ditolak; udah masuk tanpa RSVP boleh", () => {
    const { store, budi, walk } = setup();
    expect(code(() => store.saveGuestCard(budi.id, { role: "x", askAbout: [] }))).toBe(
      "belum-rsvp",
    );
    expect(store.saveGuestCard(walk.id, { role: "x", askAbout: [] })).toBe(true);
  });

  it("acara ditutup → acara-ditutup", () => {
    const { store, rara } = setup();
    for (const s of store.listSessions(HMD_ID)) {
      store.startSession(HMD_ID, s.id, t("14:00"));
      store.finishSession(HMD_ID, s.id, t("14:30"));
    }
    store.closeEvent(HMD_ID, t("17:00"));
    expect(code(() => store.saveGuestCard(rara.id, { role: "x", askAbout: [] }))).toBe(
      "acara-ditutup",
    );
  });
});

describe("T02 ↔ kartu", () => {
  it("setRsvp dengan job/interests mengisi card (minat dipecah)", () => {
    const { store, rara } = setup();
    store.setRsvp(rara.id, {
      rsvp: "hadir",
      name: rara.name,
      ig: rara.ig,
      wa: "6281234567890",
      followConfirmed: true,
      job: "Motion designer",
      interests: "Rive, film horor, rive",
    });
    expect(store.getGuest(rara.id)!.card).toEqual({
      role: "Motion designer",
      askAbout: ["Rive", "film horor"],
    });
  });

  it("jawab tanpa job/interests (Nggak bisa) → kartu tetap", () => {
    const { store, rara } = setup();
    store.saveGuestCard(rara.id, { role: "PM", askAbout: ["Kopi"] });
    store.setRsvp(rara.id, {
      rsvp: "nggak",
      name: rara.name,
      ig: rara.ig,
      wa: null,
      followConfirmed: false,
    });
    expect(store.getGuest(rara.id)!.card).toEqual({ role: "PM", askAbout: ["Kopi"] });
  });

  it("hapus H+30 ikut menghapus kartu", () => {
    const { store, rara } = setup();
    store.saveGuestCard(rara.id, { role: "PM", askAbout: ["Kopi"] });
    store.purgePersonalData(HMD_ID, "2026-12-08T00:00:00+07:00");
    expect(cardOf(store.getGuest(rara.id)!)).toEqual({ role: null, askAbout: [] });
  });
});
