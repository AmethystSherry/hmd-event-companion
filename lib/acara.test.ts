import { describe, expect, it } from "vitest";
import { acaraView, filterGuests, rundownSubtitle } from "./acara";
import { HMD_ID, seedData } from "./data/seed";
import { backfillSessionInfo } from "./data/sessionInfo";
import { createStore } from "./data/store";
import {
  actualMin,
  lateToStart,
  minutesUntil,
  overdueMin,
  roomLabel,
  rundownView,
} from "./rundown";

const t = (hhmm: string) => `2026-11-08T${hhmm}:00+07:00`;
const ms = (hhmm: string) => Date.parse(t(hhmm));

function withGuests() {
  const store = createStore(seedData());
  const names = ["Rara Wening", "Budi Santoso", "Citra Ayu", "Dodi Nggak"];
  for (const name of names) {
    const g = store.addGuest(HMD_ID, { name, ig: name.split(" ")[0].toLowerCase(), wa: null });
    if (name !== "Dodi Nggak")
      store.setRsvp(g.id, {
        rsvp: "hadir",
        name,
        ig: g.ig,
        wa: "6281234567890",
        followConfirmed: true,
      });
  }
  const [rara, budi, citra] = store.listGuests(HMD_ID);
  const op = (id: string, at: string) => ({ opId: id, method: "scan" as const, by: "HP A", at });
  store.checkIn(HMD_ID, { guestId: rara.id }, op("1", t("12:55")));
  store.checkIn(HMD_ID, { guestId: citra.id }, op("2", t("13:05")));
  store.setGuestCard(rara.id, { role: "Product designer", askAbout: ["UX writing", "Kopi"] });
  return { store, rara, budi, citra };
}

function view(store: ReturnType<typeof createStore>, meId: string, hhmm = "13:10") {
  return acaraView({
    event: store.getEvent(HMD_ID)!,
    sessions: store.listSessions(HMD_ID),
    guests: store.listGuests(HMD_ID),
    tickets: store.listTickets(HMD_ID),
    me: store.getGuest(meId)!,
    now: new Date(t(hhmm)),
    rev: store.rev,
  });
}

describe("layar acara tamu (F4)", () => {
  it("sebelum sesi 1 → JEDA, berikutnya Open space, 0 selesai", () => {
    const { store, rara } = withGuests();
    const v = view(store, rara.id);
    expect(v).toMatchObject({ mode: "jeda", done: 0, finale: false });
    expect(v.next).toMatchObject({ title: "Open space", room: "Ruang 01", art: "open-space" });
  });

  it("sesi jalan → SESI; sesi terakhir selesai → jeda terakhir (finale)", () => {
    const { store, rara } = withGuests();
    store.startSession(HMD_ID, "s02", t("14:00"));
    const v = view(store, rara.id);
    expect(v.mode).toBe("sesi");
    expect(v.active?.speaker).toEqual({
      name: "Alfin Ganteng",
      ig: "alfinganteng",
      label: "Guest star",
    });
    for (const id of ["s03", "s04"]) {
      store.startSession(HMD_ID, id, t("15:00"));
      store.finishSession(HMD_ID, id, t("16:00"));
    }
    expect(view(store, rara.id)).toMatchObject({ mode: "jeda", finale: true, next: null });
  });

  it("BT05: cuma hadir / udah masuk, tanpa WA; yang baru datang di depan, belum datang belakang", () => {
    const { store, budi } = withGuests();
    const v = view(store, budi.id);
    expect(v.guests.map((g) => g.name)).toEqual(["Citra Ayu", "Rara Wening"]);
    expect(v).toMatchObject({ total: 3, hereCount: 2 });
    expect(v.guests[1]).toMatchObject({ role: "Product designer", here: true });
    expect(JSON.stringify(v)).not.toContain("6281234567890");
    expect(JSON.stringify(v)).not.toContain(budi.token);
    expect(filterGuests(v.guests, "@citra").map((g) => g.name)).toEqual(["Citra Ayu"]);
    expect(filterGuests(v.guests, "wening")).toHaveLength(1);
  });

  it("BT05 (N3): tanpa card → kartu dari isian T02; cari tetap nama/@ig, bukan minat", () => {
    const { store, budi, citra } = withGuests();
    store.setRsvp(citra.id, {
      rsvp: "hadir",
      name: citra.name,
      ig: citra.ig,
      wa: "6281234567890",
      followConfirmed: true,
      job: "Motion designer",
      interests: "Rive, film horor",
    });
    const v = view(store, budi.id);
    expect(v.guests[0]).toMatchObject({
      name: "Citra Ayu",
      role: "Motion designer",
      askAbout: ["Rive", "film horor"],
    });
    expect(filterGuests(v.guests, "rive")).toEqual([]);
    expect(filterGuests(v.guests, "citra")).toHaveLength(1);
  });

  it("subjudul rundown BT04", () => {
    const store = createStore(seedData());
    store.startSession(HMD_ID, "s01", t("13:00"));
    const v = rundownView(store.getEvent(HMD_ID)!, store.listSessions(HMD_ID));
    expect(v.sessions.map(rundownSubtitle)).toEqual([
      "Sedang berjalan · Ruang 01",
      "Berikutnya · Alfin Ganteng",
      "Ruang 03",
      "Ruang 01",
    ]);
    expect(roomLabel(v.sessions[0])).toBe("Ruang 01 · lantai 1");
  });
});

describe("Tiket acara (F4 v3) & BT03s", () => {
  const states = (v: ReturnType<typeof view>) => v.tickets.map((x) => `${x.no}:${x.state}`);

  it("sebelum sesi 1: tiket 01 berikutnya; lewat 13.00 belum dimulai → sebentar lagi (BT03s)", () => {
    const { store, rara } = withGuests();
    expect(states(view(store, rara.id, "12:50"))).toEqual([
      "1:next",
      "2:later",
      "3:later",
      "4:later",
    ]);
    const late = view(store, rara.id, "13:00");
    expect(late).toMatchObject({ soon: true, soonAt: null });
    expect(late.tickets[0].state).toBe("soon");
    expect(view(store, rara.id, "12:50").soonAt).toBe(new Date(t("13:00")).toISOString());
  });

  it("sesi jalan: selesai = sobekan, sekarang, berikutnya, nanti; nggak pernah soon", () => {
    const { store, rara } = withGuests();
    store.startSession(HMD_ID, "s01", t("13:00"));
    store.startSession(HMD_ID, "s02", t("14:00"));
    const v = view(store, rara.id, "15:00");
    expect(states(v)).toEqual(["1:done", "2:now", "3:next", "4:later"]);
    expect(v).toMatchObject({ soon: false, soonAt: null });
    expect(v.tickets[1]).toMatchObject({
      title: "Talkshow",
      startsAt: "14.00",
      endsAt: "14.45",
      room: "Ruang 02",
    });
  });

  it("jeda setelah sesi 1: berikutnya → soon setelah 14.00; jeda terakhir semua sobekan", () => {
    const { store, rara } = withGuests();
    store.startSession(HMD_ID, "s01", t("13:00"));
    store.finishSession(HMD_ID, "s01", t("13:58"));
    expect(states(view(store, rara.id, "13:59"))).toEqual([
      "1:done",
      "2:next",
      "3:later",
      "4:later",
    ]);
    expect(states(view(store, rara.id, "14:01"))).toEqual([
      "1:done",
      "2:soon",
      "3:later",
      "4:later",
    ]);
    for (const id of ["s02", "s03", "s04"]) {
      store.startSession(HMD_ID, id, t("15:00"));
      store.finishSession(HMD_ID, id, t("16:00"));
    }
    const end = view(store, rara.id, "16:30");
    expect(end.tickets.every((x) => x.state === "done")).toBe(true);
    expect(end).toMatchObject({ finale: true, soon: false, soonAt: null });
  });

  it('BT04 subjudul sesi jalan pakai "Sedang berjalan"', () => {
    const { store } = withGuests();
    store.startSession(HMD_ID, "s01", t("13:00"));
    const v = rundownView(store.getEvent(HMD_ID)!, store.listSessions(HMD_ID));
    expect(rundownSubtitle(v.sessions[0])).toBe("Sedang berjalan · Ruang 01");
  });
});

describe("waktu sesi (BP02c, pengingat BP01)", () => {
  it("lewat = stopwatch − durasi, dibulatkan ke bawah min 1", () => {
    const s = { startedAt: t("13:00"), endedAt: null, durationMin: 60 };
    expect(overdueMin(s, ms("13:59"))).toBeNull();
    expect(overdueMin(s, ms("14:00") + 20_000)).toBe(1);
    expect(overdueMin(s, ms("14:02") + 10_000)).toBe(2);
    expect(actualMin({ startedAt: t("13:00"), endedAt: t("14:02") })).toBe(62);
  });

  it("menit ke jam mulai dibulatkan ke atas; pengingat lewat jam mulai", () => {
    expect(minutesUntil("2026-11-08", "14.00", ms("13:48") + 30_000)).toBe(12);
    expect(lateToStart("2026-11-08", { startsAt: "14.00" }, ms("14:01"))).toBe(true);
    expect(lateToStart("2026-11-08", { startsAt: "14.00" }, ms("13:59"))).toBe(false);
  });
});

describe("store lama dilengkapi info sesi (K3)", () => {
  it("field kosong diisi, seed lama diganti, ubahan panitia tetap", () => {
    const data = seedData();
    for (const s of data.sessions) {
      delete s.room;
      delete s.art;
      delete s.speaker;
    }
    data.sessions[0].title = "Pintu dibuka & open space";
    data.sessions[1].tagline = "Guest star (menyusul)";
    data.sessions[3].pic = "Mas Gilang";
    backfillSessionInfo(data);
    expect(data.sessions[0]).toMatchObject({
      title: "Open space",
      room: "Ruang 01",
      art: "open-space",
    });
    expect(data.sessions[1]).toMatchObject({ tagline: "Bareng Alfin Ganteng" });
    expect(data.sessions[1].speaker?.name).toBe("Alfin Ganteng");
    expect(data.sessions[3].pic).toBe("Mas Gilang");
    const again = JSON.stringify(data);
    backfillSessionInfo(data);
    expect(JSON.stringify(data)).toBe(again);
  });
});
