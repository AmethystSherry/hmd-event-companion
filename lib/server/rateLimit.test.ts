import { describe, expect, it } from "vitest";
import { rateLimiter } from "./rateLimit";

describe("rateLimiter", () => {
  it("10 per menit per kunci, kebuka lagi setelah jendela lewat", () => {
    const limited = rateLimiter(10);
    for (let i = 0; i < 10; i++) expect(limited("a", 1000 + i)).toBe(false);
    expect(limited("a", 1100)).toBe(true);
    expect(limited("b", 1100)).toBe(false);
    expect(limited("a", 1000 + 61_200)).toBe(false);
  });
});
