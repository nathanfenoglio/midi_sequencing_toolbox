import { describe, expect, it } from "vitest";
import { textToMorsePreview } from "./textToMorse.js";

describe("textToMorsePreview", () => {
  it("formats YYZ with word separator", () => {
    expect(textToMorsePreview("YYZ").preview).toBe("-.-- -.-- --..");
  });

  it("formats SOS", () => {
    expect(textToMorsePreview("SOS").preview).toBe("... --- ...");
  });

  it("skips unknown characters", () => {
    const { preview, letterPatterns } = textToMorsePreview("A@B");
    expect(preview).toBe(".- -...");
    expect(letterPatterns[0]).toEqual([".-", "-..."]);
  });
});
