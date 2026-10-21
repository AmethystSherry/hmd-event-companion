import { describe, expect, it } from "vitest";
import { createMockStore } from "./mock";

describe("mock store", () => {
  it("ping ok", async () => {
    const res = await createMockStore().ping();
    expect(res.ok).toBe(true);
  });

  it("state awal acara = pre", async () => {
    const s = await createMockStore().getEventState();
    expect(s.mode).toBe("pre");
    expect(s.activeSession).toBeNull();
  });
});
