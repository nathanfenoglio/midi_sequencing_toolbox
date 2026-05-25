import { describe, expect, it } from "vitest";
import { lookupMorseChar } from "./morseTable.js";

describe("lookupMorseChar", () => {
  it("looks up letters case-insensitively", () => {
    expect(lookupMorseChar("y")).toBe("-.--");
    expect(lookupMorseChar("Z")).toBe("--..");
  });

  it("looks up digits and punctuation", () => {
    expect(lookupMorseChar("5")).toBe(".....");
    expect(lookupMorseChar("?")).toBe("..--..");
  });

  it("returns null for unknown or space", () => {
    expect(lookupMorseChar("@")).toBeNull();
    expect(lookupMorseChar(" ")).toBeNull();
  });
});
