import { describe, expect, it } from "vitest";
import { csvCell, feedbackCsv } from "./csv";

// F5 · Unduh CSV rekap buku tamu (P11).

describe("CSV buku tamu", () => {
  const row = {
    name: "Rara Wening",
    ig: "rara.w",
    rating: 5,
    highlight: "Talkshow",
    improve: null,
    inviteAgain: true,
    at: "2026-11-08 17.10",
  };

  it("UTF-8 BOM, judul kolom, baris CRLF, ig tanpa @", () => {
    const csv = feedbackCsv([row]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1).split("\r\n")).toEqual([
      "nama,ig,rating,paling_seru,perbaikan,mau_diundang,waktu_isi",
      "Rara Wening,rara.w,5,Talkshow,,ya,2026-11-08 17.10",
      "",
    ]);
  });

  it("koma, kutip, titik koma, baris baru → dikutip", () => {
    expect(csvCell('AC "dingin", ya')).toBe('"AC ""dingin"", ya"');
    expect(csvCell("satu\ndua")).toBe('"satu\ndua"');
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(4)).toBe("4");
  });

  it("CSV injection: sel diawali = + - @ diberi '", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+62")).toBe("'+62");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell("=1,2")).toBe('"\'=1,2"');
    const csv = feedbackCsv([{ ...row, improve: "=cmd|' /C calc'!A0", inviteAgain: null }]);
    expect(csv).toContain(",'=cmd|' /C calc'!A0,,");
  });
});
