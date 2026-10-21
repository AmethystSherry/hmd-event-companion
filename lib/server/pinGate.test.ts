import { describe, expect, it } from "vitest";
import { LOCK_MS, createPinGate } from "./pinGate";

const PIN = "482913";

describe("PIN panitia", () => {
  it("PIN benar langsung masuk", () => {
    expect(createPinGate().attempt("ip-1", PIN, PIN)).toEqual({ kind: "ok" });
  });

  it("salah → sisa percobaan berkurang (P01b)", () => {
    const gate = createPinGate();
    expect(gate.attempt("ip-1", "000000", PIN)).toEqual({ kind: "wrong", remaining: 4 });
    expect(gate.attempt("ip-1", "000000", PIN)).toEqual({ kind: "wrong", remaining: 3 });
  });

  it("5× salah → terkunci 5 menit, PIN benar pun ditolak (P01c), lalu terbuka lagi", () => {
    let t = 1_000_000;
    const gate = createPinGate({ now: () => t });
    for (let i = 0; i < 4; i++) gate.attempt("ip-1", "111111", PIN);
    expect(gate.attempt("ip-1", "111111", PIN)).toEqual({ kind: "locked", retryAfterMs: LOCK_MS });

    t += 60_000;
    expect(gate.attempt("ip-1", PIN, PIN)).toEqual({
      kind: "locked",
      retryAfterMs: LOCK_MS - 60_000,
    });

    t += LOCK_MS;
    expect(gate.attempt("ip-1", PIN, PIN)).toEqual({ kind: "ok" });
  });

  it("kunci per klien: perangkat lain tidak ikut terkunci", () => {
    const gate = createPinGate();
    for (let i = 0; i < 5; i++) gate.attempt("ip-1", "111111", PIN);
    expect(gate.attempt("ip-2", PIN, PIN)).toEqual({ kind: "ok" });
  });

  it("berhasil masuk mereset hitungan salah", () => {
    const gate = createPinGate();
    gate.attempt("ip-1", "111111", PIN);
    gate.attempt("ip-1", PIN, PIN);
    expect(gate.attempt("ip-1", "111111", PIN)).toEqual({ kind: "wrong", remaining: 4 });
  });

  it("EVENT_PIN kosong → login nonaktif", () => {
    expect(createPinGate().attempt("ip-1", "123456", null)).toEqual({ kind: "disabled" });
  });
});
