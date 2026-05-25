import { describe, expect, it } from "vitest";
import { YYZ_PRESET, STANDARD_PRESET } from "./morsePresets.js";
import {
  expandDash,
  expandDot,
  expandRest,
  morsePatternToRhythm,
  textToRhythm,
} from "./morseToRhythm.js";
import { serializeRhythmForMain } from "./wolframRow.js";

describe("expandDot/Dash/Rest", () => {
  it("expandDot gives M ones", () => {
    expect(expandDot(1)).toEqual([1]);
    expect(expandDot(2)).toEqual([1, 1]);
  });

  it("expandDash gives 1 then zeros", () => {
    expect(expandDash(2)).toEqual([1, 0]);
    expect(expandDash(3)).toEqual([1, 0, 0]);
  });

  it("expandRest respects duration", () => {
    expect(expandRest(0)).toEqual([]);
    expect(expandRest(3)).toEqual([0, 0, 0]);
  });
});

describe("morsePatternToRhythm", () => {
  it("YYZ dash is 1,0 and dot is 1", () => {
    expect(morsePatternToRhythm("-", YYZ_PRESET)).toEqual([1, 0]);
    expect(morsePatternToRhythm(".", YYZ_PRESET)).toEqual([1]);
  });

  it("standard dash is 1,0,0", () => {
    expect(morsePatternToRhythm("-", STANDARD_PRESET)).toEqual([1, 0, 0]);
  });
});

describe("textToRhythm", () => {
  it("YYZ has no gaps between letters", () => {
    const { rhythm } = textToRhythm("YY", YYZ_PRESET);
    const yPattern = [1, 0, 1, 1, 0, 1, 0];
    expect(rhythm).toEqual([...yPattern, ...yPattern]);
  });

  it("standard SOS includes symbol and letter gaps", () => {
    const { rhythm } = textToRhythm("SOS", STANDARD_PRESET);
    expect(rhythm.length).toBeGreaterThan(9);
    expect(rhythm.filter((x) => x === 1).length).toBeGreaterThan(0);
    const s = morsePatternToRhythm("...", STANDARD_PRESET);
    expect(s).toEqual([1, 0, 1, 0, 1]);
  });

  it("letter gap duration 3 inserts three zeros", () => {
    const timing = {
      ...YYZ_PRESET,
      gapBetweenLetters: true,
      gapBetweenLettersDuration: 3,
    };
    const { rhythm } = textToRhythm("AB", timing);
    const aEnd = morsePatternToRhythm(".-", timing);
    expect(rhythm.slice(0, aEnd.length)).toEqual(aEnd);
    expect(rhythm.slice(aEnd.length, aEnd.length + 3)).toEqual([0, 0, 0]);
  });

  it("returns empty when no encodable content", () => {
    const { hasContent, rhythm } = textToRhythm("@@@", YYZ_PRESET);
    expect(hasContent).toBe(false);
    expect(rhythm).toEqual([]);
  });
});

describe("serializeRhythmForMain", () => {
  it("joins with comma space", () => {
    expect(serializeRhythmForMain([1, 0, 1])).toBe("1, 0, 1");
  });
});
