import { describe, expect, it } from "vitest";
import { signSession, signTicket, verifySession, verifyTicket } from "./crypto";

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
