import { describe, expect, it } from "vitest";
import {
  YYZ_PRESET,
  STANDARD_PRESET,
  detectPresetMode,
  timingMatchesPreset,
} from "./morsePresets.js";

describe("morsePresets", () => {
  it("detects yyz and standard", () => {
    expect(detectPresetMode(YYZ_PRESET)).toBe("yyz");
    expect(detectPresetMode(STANDARD_PRESET)).toBe("standard");
  });

  it("detects custom when dash duration differs", () => {
    expect(
      detectPresetMode({ ...YYZ_PRESET, dashDuration: 3 })
    ).toBe("custom");
  });

  it("timingMatchesPreset is exact", () => {
    expect(timingMatchesPreset(YYZ_PRESET, { ...YYZ_PRESET })).toBe(true);
    expect(timingMatchesPreset(YYZ_PRESET, STANDARD_PRESET)).toBe(false);
  });
});
