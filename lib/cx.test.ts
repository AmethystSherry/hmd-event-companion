import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("menggabung kelas dan membuang nilai falsy", () => {
    expect(cx("a", false, null, undefined, "b", "")).toBe("a b");
  });
});
