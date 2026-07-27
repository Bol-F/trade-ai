import { describe, expect, it } from "vitest";

import { normalizeHsProduct } from "@/lib/api";

describe("normalizeHsProduct", () => {
  it.each([
    ["4", "04"],
    ["101", "0101"],
    ["10101", "010101"],
    ["04", "04"],
    ["0101", "0101"],
    ["010101", "010101"],
  ])("normalizes %s to a complete HS level", (input, expected) => {
    expect(normalizeHsProduct(input)).toBe(expected);
  });

  it("leaves invalid input unchanged for API validation", () => {
    expect(normalizeHsProduct("1234567")).toBe("1234567");
  });
});
