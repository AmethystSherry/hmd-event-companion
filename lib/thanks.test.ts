import { describe, expect, it } from "vitest";
import { THANKS_TEMPLATE, thanksLink, thanksMessage, thanksView } from "./thanks";

// F5 v2 · P12 Kirim makasih via WA.

const guest = (id: string, name: string, wa: string | null, sent: string | null = null) => ({
  id,
  name,
  wa,
  token: `tok-${id}`,
  thanksSentAt: sent,
});

describe("pesan makasih", () => {
  it("nama depan + link buku tamu ?dari=wa (copy Figma P12)", () => {
    const link = thanksLink("https://hmd.example", "abc");
    expect(link).toBe("https://hmd.example/t/abc/buku-tamu?dari=wa");
    expect(thanksMessage("Rara Wening", link)).toBe(
      "Makasih udah mampir ke rumah baru, Rara! Isi buku tamu ± 1 menit & lihat kolase kulkasnya di sini: https://hmd.example/t/abc/buku-tamu?dari=wa",
    );
    expect(THANKS_TEMPLATE).toContain("{nama}");
  });
});

describe("daftar P12", () => {
  const guests = [
    guest("a", "sekar Ayu", "6281111111111"),
    guest("b", "Bima Sakti", null, "2026-11-08T17:30:00+07:00"),
    guest("c", "Ádi Nugroho", "6282222222222"),
    guest("d", "Nggak Datang", "6283333333333"),
  ];
  const tickets = [
    { guestId: "a", status: "dipakai" as const },
    { guestId: "b", status: "dipakai" as const },
    { guestId: "c", status: "dipakai" as const },
    { guestId: "d", status: "aktif" as const },
  ];

  it("cuma tamu yang datang, urut nama (aksen & huruf besar diabaikan), hitungan terkirim", () => {
    const v = thanksView(guests, tickets, "https://hmd.example");
    expect(v.rows.map((r) => r.id)).toEqual(["c", "b", "a"]);
    expect(v).toMatchObject({ total: 3, sent: 1 });
  });

  it("tanpa WA → waHref null (K10); dengan WA → wa.me berisi pesan", () => {
    const v = thanksView(guests, tickets, "https://hmd.example");
    expect(v.rows.find((r) => r.id === "b")?.waHref).toBeNull();
    const href = v.rows.find((r) => r.id === "a")!.waHref!;
    expect(href.startsWith("https://wa.me/6281111111111?text=")).toBe(true);
    expect(decodeURIComponent(href.split("text=")[1])).toContain("sekar!");
  });
});
