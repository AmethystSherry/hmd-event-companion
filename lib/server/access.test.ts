import { describe, expect, it } from "vitest";
import { safeNext } from "./access";

describe("safeNext (redirect setelah P01)", () => {
  it("hanya mengizinkan halaman panitia", () => {
    expect(safeNext("/panitia/undangan?mode=pengingat")).toBe("/panitia/undangan?mode=pengingat");
    expect(safeNext("/panitia")).toBe("/panitia");
    expect(safeNext("https://evil.example/panitia")).toBe("/panitia/tamu");
    expect(safeNext("//evil.example")).toBe("/panitia/tamu");
    expect(safeNext("/t/abc")).toBe("/panitia/tamu");
    expect(safeNext(undefined)).toBe("/panitia/tamu");
  });
});
