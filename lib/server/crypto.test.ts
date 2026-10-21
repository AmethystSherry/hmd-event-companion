import { describe, expect, it } from "vitest";
import {
  guestToken,
  shortCode,
  signSession,
  signTicket,
  verifySession,
  verifyTicket,
} from "./crypto";

const S = "test-secret-that-is-long-enough-123456";

describe("tanda tangan tiket (QR)", () => {
  it("QR asli lolos verifikasi dan mengembalikan ticketId", () => {
    expect(verifyTicket(S, signTicket(S, "tk_g014"))).toBe("tk_g014");
  });

  it("QR palsu / acak / diubah ditolak", () => {
    const real = signTicket(S, "tk_g014");
    expect(verifyTicket(S, "tk_g015" + real.slice(real.indexOf(".")))).toBeNull();
    expect(verifyTicket(S, "random-text")).toBeNull();
    expect(verifyTicket(S, "https://example.com/qr")).toBeNull();
    expect(verifyTicket("secret-lain-yang-juga-cukup-panjang-000", real)).toBeNull();
  });

  it("QR tidak berisi nama atau data pribadi", () => {
    expect(signTicket(S, "tk_g014")).toMatch(/^tk_g014\.[A-Za-z0-9_-]{16}$/);
  });

  it("kode pendek berformat HMD-014-XXXX dan stabil", () => {
    const c = shortCode(S, "tk_g014", 14);
    expect(c).toMatch(/^HMD-014-[2-9A-HJ-NP-Z]{4}$/);
    expect(shortCode(S, "tk_g014", 14)).toBe(c);
  });
});

describe("token tamu", () => {
  it("≥16 karakter, unik per tamu, stabil", () => {
    const a = guestToken(S, "g001");
    expect(a.length).toBeGreaterThanOrEqual(16);
    expect(guestToken(S, "g001")).toBe(a);
    expect(guestToken(S, "g002")).not.toBe(a);
  });
});

describe("cookie sesi panitia", () => {
  it("valid sebelum kedaluwarsa, ditolak setelahnya atau kalau diubah", () => {
    const v = signSession(S, 2_000);
    expect(verifySession(S, v, 1_000)).toBe(true);
    expect(verifySession(S, v, 3_000)).toBe(false);
    expect(verifySession(S, v.replace("2000", "9999"), 1_000)).toBe(false);
    expect(verifySession(S, undefined, 1_000)).toBe(false);
  });
});
