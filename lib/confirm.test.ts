import { describe, expect, it } from "vitest";
import { validateConfirm } from "./confirm";

describe("validateConfirm (T02c)", () => {
  const base = { name: "Rara Sekar", ig: "rarasekar", wa: "", follow: true };

  it("WA opsional: kosong lolos (pengingat H-1 lewat DM IG)", () => {
    expect(validateConfirm(base)).toEqual({});
  });

  it("WA diisi tetap dicek formatnya", () => {
    expect(validateConfirm({ ...base, wa: "0812 3456 7890" })).toEqual({});
    expect(validateConfirm({ ...base, wa: "0812" }).wa).toBeTruthy();
  });

  it("IG & follow tetap wajib", () => {
    const e = validateConfirm({ ...base, ig: "", follow: false });
    expect(e.ig).toBeTruthy();
    expect(e.follow).toBeTruthy();
  });
});
