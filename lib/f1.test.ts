import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { csvEyebrow, isIgIssue, parseGuestCsv } from "./csv";
import { HMD_ID, seedData } from "./data/seed";
import { createStore } from "./data/store";
import type { Guest, Session } from "./data/types";
import { buildIcs, googleCalendarUrl } from "./ics";
import { rundownTiles } from "./invite";
import { cleanSession, EMPTY_SESSION_FORM, sessionForGuest, sessionToForm } from "./sessionForm";
import { eventCountLabel, guestStatus, statusBadge } from "./view";

// F1 update 23 & 25 Okt: status baris tamu, CSV IG (P04i), form sesi (PE04a/PE04b), T01, T03k,
// titip ucapan (T02b), Pekerjaan & Minat (T02).

const now = new Date("2026-10-25T10:00:00+07:00");
const ago = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();
const dev = (f: string) => readFileSync(join(__dirname, "..", "public", "dev", f), "utf8");

describe("guestStatus (satu badge per baris P04*)", () => {
  const g = (inviteStatus: Guest["inviteStatus"], rsvp: Guest["rsvp"], invitedAt: string | null) =>
    guestStatus({ inviteStatus, rsvp, invitedAt }, now);

  it.each([
    ["diundang", "hadir", ago(1), "hadir", "success", "Hadir"],
    ["belum", "hadir", null, "hadir", "success", "Hadir"],
    ["diundang", "nggak", ago(1), "nggak", "danger", "Nggak bisa"],
    ["diundang", "belum", ago(9), "barusan", "success", "Diundang barusan"],
    ["diundang", "belum", ago(10), "belumJawab", "crew", "Belum jawab"],
    ["diundang", "belum", null, "belumJawab", "crew", "Belum jawab"],
    ["belum", "belum", null, "belum", "neutral", "Belum diundang"],
  ] as const)("%s + %s → %s", (inv, rsvp, at, key, tone, label) => {
    expect(g(inv, rsvp, at)).toEqual({ key, tone, label });
    expect(statusBadge(key)).toEqual({ tone, label });
  });

  it("jumlah per filter = jumlah baris (Belum jawab termasuk Diundang barusan)", () => {
    const rows = [
      g("belum", "belum", null),
      g("belum", "belum", null),
      g("diundang", "belum", ago(2)),
      g("diundang", "belum", ago(60)),
      g("diundang", "hadir", ago(60)),
      g("diundang", "nggak", ago(60)),
    ].map((s) => s.key);
    const count = {
      belum: rows.filter((k) => k === "belum").length,
      belumJawab: rows.filter((k) => k === "belumJawab" || k === "barusan").length,
      hadir: rows.filter((k) => k === "hadir").length,
      nggak: rows.filter((k) => k === "nggak").length,
    };
    expect(count).toEqual({ belum: 2, belumJawab: 2, hadir: 1, nggak: 1 });
    expect(Object.values(count).reduce((a, b) => a + b)).toBe(rows.length);
  });
});

describe("CSV username IG (P04i)", () => {
  it("IG kosong, ada spasi, dan URL masuk kartu IG dengan saran", () => {
    const r = parseGuestCsv(dev("tamu-hmd-ig.csv"));
    if (!r.ok) throw new Error(r.message);
    expect(r.rows).toHaveLength(23);
    expect(r.valid).toHaveLength(20);
    expect(r.issues.map((i) => [i.line, i.title, i.detail])).toEqual([
      [4, "IG kosong", "Bima Nugraha · nggak bisa diundang lewat DM"],
      [9, "Ada spasi", '"laras putri" → maksudnya larasputri?'],
      [15, "Bukan username", '"instagram.com/yurara" → cukup yurara'],
    ]);
    expect(r.issues.every(isIgIssue)).toBe(true);
    expect(csvEyebrow(r)).toBe("23 baris kebaca · 3 IG perlu dicek");
  });

  it("baris error biasa tetap di P04c (IG dobel bukan kartu IG)", () => {
    const r = parseGuestCsv(dev("tamu-hmd-error.csv"));
    if (!r.ok) throw new Error(r.message);
    expect(r.issues.some(isIgIssue)).toBe(false);
    expect(csvEyebrow(r)).toBe("24 baris kebaca · 3 perlu dicek");
  });

  it("template CSV bisa langsung diunggah tanpa error", () => {
    const r = parseGuestCsv(
      readFileSync(join(__dirname, "..", "public", "template-tamu-hmd.csv"), "utf8"),
    );
    expect(r.ok && r.issues).toEqual([]);
  });
});

describe("form sesi (PE04a Talkshow / PE04b Info)", () => {
  const talkshow = {
    ...EMPTY_SESSION_FORM,
    title: "Talkshow",
    startsAt: "14:00",
    durationMin: 45,
    type: "talkshow" as const,
    room: "Ruang 02",
    topic: "Cara pakai AI tanpa ngabisin air di rumah",
    speaker: "Alfin Ganteng",
    speakerIg: "@alfinganteng",
    description: "Ngobrol santai soal AI.",
  };

  it("talkshow menyimpan ruang, topik, pembicara (IG tanpa @), deskripsi", () => {
    const r = cleanSession(talkshow);
    expect(r).toMatchObject({
      ok: true,
      value: {
        startsAt: "14.00",
        room: "Ruang 02",
        topic: "Cara pakai AI tanpa ngabisin air di rumah",
        speaker: { name: "Alfin Ganteng", ig: "alfinganteng", label: "Guest star" },
        description: "Ngobrol santai soal AI.",
      },
    });
  });

  it("IG pembicara cuma huruf/angka/titik/garis bawah", () => {
    for (const ig of ["@alfin ganteng", "alfin-ganteng", "alfin!"]) {
      expect(cleanSession({ ...talkshow, speakerIg: ig })).toMatchObject({
        ok: false,
        field: "speakerIg",
      });
    }
    expect(cleanSession({ ...talkshow, speakerIg: "@alfin.g_01" }).ok).toBe(true);
  });

  it("simpan sebagai Info mengosongkan topik & pembicara, deskripsi tetap", () => {
    const r = cleanSession({ ...talkshow, type: "info" });
    expect(r).toMatchObject({
      ok: true,
      value: { type: "info", topic: null, speaker: null, description: "Ngobrol santai soal AI." },
    });
  });

  it("deskripsi maks 140 huruf; label pembicara lama dipertahankan", () => {
    expect(cleanSession({ ...talkshow, description: "x".repeat(141) })).toMatchObject({
      ok: false,
      field: "description",
    });
    const prev = { speaker: { name: "A", ig: "a", label: "Host" } } as Session;
    const r = cleanSession(talkshow, prev);
    expect(r.ok && r.value.speaker?.label).toBe("Host");
  });

  it("buka lagi sheet → field sesi talkshow terisi (sessionToForm)", () => {
    const s = seedData().sessions.find((x) => x.type === "talkshow")!;
    expect(sessionToForm(s)).toMatchObject({
      speaker: "Alfin Ganteng",
      speakerIg: "@alfinganteng",
    });
  });

  it("sessionForGuest nggak mengirim PIC ke HP tamu", () => {
    const s = seedData().sessions[0];
    expect(sessionForGuest(s)).not.toHaveProperty("pic");
    expect(sessionForGuest(s).title).toBe(s.title);
  });
});

describe("T01 · grid bagian acara (rundownTiles)", () => {
  it("semua sesi seed, nomor 2 digit, jam, nama lengkap tanpa pembicara", () => {
    expect(rundownTiles(seedData().sessions)).toEqual([
      { no: "01", time: "13.00", name: "Open space" },
      { no: "02", time: "14.00", name: "Talkshow" },
      { no: "03", time: "14.45", name: "Tur kantor" },
      { no: "04", time: "15.30", name: "Closing & networking" },
    ]);
  });

  it("urut jam mulai walau masukan acak; jumlah ganjil tetap semua tampil", () => {
    const tiles = rundownTiles([
      { title: "C", startsAt: "15.00" },
      { title: "A", startsAt: "09.30" },
      { title: "B", startsAt: "13.00" },
    ]);
    expect(tiles.map((t) => `${t.no} ${t.time} ${t.name}`)).toEqual([
      "01 09.30 A",
      "02 13.00 B",
      "03 15.00 C",
    ]);
    expect(rundownTiles([])).toEqual([]);
  });

  it("lebih dari 9 sesi tetap 2 digit", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      title: `S${i}`,
      startsAt: `${String(10 + i).padStart(2, "0")}.00`,
    }));
    expect(rundownTiles(many).at(-1)?.no).toBe("10");
  });
});

describe("T03k · simpan ke kalender", () => {
  const event = seedData().events[0];
  it("Google Calendar pakai jam UTC (13.00–17.00 WIB = 06–10 UTC) + link tiket", () => {
    const url = new URL(googleCalendarUrl(event, "https://hmd.example/t/abc"));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("dates")).toBe("20261108T060000Z/20261108T100000Z");
    expect(url.searchParams.get("details")).toContain("https://hmd.example/t/abc");
    expect(url.searchParams.get("location")).toBe(event.location);
  });

  it(".ics punya pengingat 1 jam sebelum", () => {
    const ics = buildIcs({ event, uid: "g1", ticketUrl: "https://hmd.example/t/abc" });
    expect(ics).toContain("TRIGGER:-PT1H");
  });
});

describe("T02 & T02b di store", () => {
  const fresh = () => {
    const store = createStore(seedData(), { persist: vi.fn() });
    const g = store.addGuest(HMD_ID, { name: "Rara Wening", ig: "rarawening", wa: null });
    return { store, g };
  };

  it("Pekerjaan & Minat tersimpan (opsional), jawab Nggak bisa nggak menghapusnya", () => {
    const { store, g } = fresh();
    const base = { name: "Rara Wening", ig: "rarawening", wa: "6281234567890" };
    store.setRsvp(g.id, {
      ...base,
      rsvp: "hadir",
      followConfirmed: true,
      job: "Product designer",
      interests: "UX writing, kopi",
    });
    expect(store.listGuests(HMD_ID).find((x) => x.id === g.id)).toMatchObject({
      job: "Product designer",
      interests: "UX writing, kopi",
    });
    store.setRsvp(g.id, { ...base, rsvp: "nggak", followConfirmed: false });
    expect(store.listGuests(HMD_ID).find((x) => x.id === g.id)?.job).toBe("Product designer");
  });

  it("titip ucapan sekali kirim; kirim lagi nggak menimpa", () => {
    const { store, g } = fresh();
    const rev = store.rev;
    expect(store.setFarewell(g.id, "Selamat pindahan!")).toBe(true);
    expect(store.rev).toBe(rev + 1);
    expect(store.setFarewell(g.id, "Lain")).toBe(false);
    expect(store.listGuests(HMD_ID).find((x) => x.id === g.id)?.farewellMessage).toBe(
      "Selamat pindahan!",
    );
  });

  it("hapus H+30 ikut menghapus ucapan, pekerjaan, minat", () => {
    const { store, g } = fresh();
    store.setRsvp(g.id, {
      name: "Rara",
      ig: "rarawening",
      wa: null,
      rsvp: "hadir",
      followConfirmed: true,
      job: "Designer",
      interests: "Kopi",
    });
    store.setFarewell(g.id, "Halo");
    store.purgePersonalData(HMD_ID, "2026-12-08T00:00:00+07:00");
    expect(store.listGuests(HMD_ID).find((x) => x.id === g.id)).toMatchObject({
      job: null,
      interests: null,
      farewellMessage: null,
    });
  });
});

describe("PE01 · header Daftar event", () => {
  it("angka event di kanan judul", () => {
    expect(eventCountLabel(0)).toBe("0 event");
    expect(eventCountLabel(2)).toBe("2 event");
  });
});
