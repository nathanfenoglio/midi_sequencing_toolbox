import { describe, expect, it } from "vitest";
import {
  compositionToBinaryPattern,
  formatCompositionLine,
  getRhythmCompositions,
  parsePositiveIntInput,
  parseRhythmSpaceInput,
} from "./rhythmCompositions.js";

describe("getRhythmCompositions", () => {
  it("returns 21 compositions for space 8 and 3 notes", () => {
    const comps = getRhythmCompositions(8, 3);
    expect(comps).toHaveLength(21);
    expect(comps.some((c) => c.join() === [3, 3, 2].join())).toBe(true);
  });

  it("returns empty when numNotes exceeds space", () => {
    expect(getRhythmCompositions(4, 5)).toEqual([]);
  });

  it("returns single composition for 1 and 1", () => {
    expect(getRhythmCompositions(1, 1)).toEqual([[1]]);
  });
});

describe("compositionToBinaryPattern", () => {
  it("maps [3, 3, 2] to eight-slot pattern", () => {
    expect(compositionToBinaryPattern([3, 3, 2])).toEqual([
      1, 0, 0, 1, 0, 0, 1, 0,
    ]);
  });
});

describe("formatCompositionLine", () => {
  it("formats both bracket groups", () => {
    expect(formatCompositionLine([3, 3, 2])).toBe(
      "[3, 3, 2] [1, 0, 0, 1, 0, 0, 1, 0]"
    );
  });
});

describe("parsePositiveIntInput", () => {
  it("accepts positive integers", () => {
    expect(parsePositiveIntInput("16")).toBe(16);
    expect(parsePositiveIntInput(" 4 ")).toBe(4);
  });

  it("rejects invalid values", () => {
    expect(parsePositiveIntInput("")).toBeNull();
    expect(parsePositiveIntInput("0")).toBeNull();
    expect(parsePositiveIntInput("x")).toBeNull();
  });
});

describe("parseRhythmSpaceInput", () => {
  it("accepts 1 through 16", () => {
    expect(parseRhythmSpaceInput("16")).toBe(16);
    expect(parseRhythmSpaceInput("1")).toBe(1);
  });

  it("rejects over cap and invalid", () => {
    expect(parseRhythmSpaceInput("17")).toBeNull();
    expect(parseRhythmSpaceInput("0")).toBeNull();
    expect(parseRhythmSpaceInput("")).toBeNull();
  });
});
