import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";
import { countdownTo, fillTemplate, firstName, INVITE_TEMPLATE, waLink } from "./invite";

describe("undangan WA (P04)", () => {
  it("template berisi nama & link tamu, wa.me terisi pesan", () => {
    const msg = fillTemplate(INVITE_TEMPLATE, { nama: "Rara", link: "https://x.test/t/abc" });
    expect(msg).toContain("Halo Rara!");
    expect(msg).toContain("https://x.test/t/abc");
    const url = waLink("6281200000101", msg);
    expect(url.startsWith("https://wa.me/6281200000101?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toBe(msg);
  });

  it("nama depan", () => {
    expect(firstName("Rara Wening")).toBe("Rara");
  });
});

describe("countdown H-1 (T04)", () => {
  it("menghitung hari/jam/menit dan tidak negatif", () => {
    const start = "2026-11-08T13:00:00+07:00";
    expect(countdownTo(start, new Date("2026-11-07T20:30:00+07:00"))).toEqual({
      days: 0,
      hours: 16,
      minutes: 30,
      done: false,
    });
    expect(countdownTo(start, new Date("2026-11-08T14:00:00+07:00")).done).toBe(true);
  });
});

describe(".ics (T03)", () => {
  it("event 8 Nov 13.00–17.00 WIB dalam UTC", () => {
    const ics = buildIcs({ uid: "g001", ticketUrl: "https://x.test/t/abc/tiket" });
    expect(ics).toContain("DTSTART:20261108T060000Z");
    expect(ics).toContain("DTEND:20261108T100000Z");
    expect(ics).toContain("LOCATION:Kantor baru Potara");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
