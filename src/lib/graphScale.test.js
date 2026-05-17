import { describe, expect, it } from "vitest";
import {
  applyScaleToNodes,
  getScaleDegrees,
  midiNoteForNodeIndex,
} from "./graphScale.js";

describe("getScaleDegrees", () => {
  it("returns null for empty key", () => {
    expect(getScaleDegrees("")).toBeNull();
  });

  it("returns array for valid scale key", () => {
    const d = getScaleDegrees("Minor pentatonic scale");
    expect(d).not.toBeNull();
    expect(d.length).toBeGreaterThan(0);
  });
});

describe("midiNoteForNodeIndex", () => {
  it("uses node index when no scale", () => {
    expect(midiNoteForNodeIndex(3, null)).toBe(3);
    expect(midiNoteForNodeIndex(2, [])).toBe(2);
  });

  it("cycles scale degrees", () => {
    const scale = [48, 50, 52];
    expect(midiNoteForNodeIndex(0, scale)).toBe(48);
    expect(midiNoteForNodeIndex(2, scale)).toBe(52);
    expect(midiNoteForNodeIndex(3, scale)).toBe(48);
  });
});

describe("applyScaleToNodes", () => {
  it("maps all nodes in order", () => {
    const nodes = [
      { id: "a", x: 0, y: 0, midiNote: 0 },
      { id: "b", x: 1, y: 1, midiNote: 1 },
    ];
    const out = applyScaleToNodes(nodes, [60, 62, 64]);
    expect(out[0].midiNote).toBe(60);
    expect(out[1].midiNote).toBe(62);
    expect(out[0].id).toBe("a");
  });
});
