import { describe, expect, it } from "vitest";
import {
  applyScaleToNodes,
  buildSequentialScaleNotes,
  getScaleDegrees,
  midiNoteForNodeIndex,
  parseGraphNodeMidiNote,
  randomizeNodeMidiNotes,
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

describe("parseGraphNodeMidiNote", () => {
  it("returns 0 for empty or whitespace", () => {
    expect(parseGraphNodeMidiNote("")).toBe(0);
    expect(parseGraphNodeMidiNote("   ")).toBe(0);
  });

  it("parses valid integers", () => {
    expect(parseGraphNodeMidiNote("60")).toBe(60);
    expect(parseGraphNodeMidiNote(" 60 ")).toBe(60);
  });

  it("returns 0 for non-numeric input", () => {
    expect(parseGraphNodeMidiNote("abc")).toBe(0);
  });

  it("uses parseInt prefix for mixed input", () => {
    expect(parseGraphNodeMidiNote("12abc")).toBe(12);
  });

  it("clamps to 0..127", () => {
    expect(parseGraphNodeMidiNote("-5")).toBe(0);
    expect(parseGraphNodeMidiNote("200")).toBe(127);
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

describe("buildSequentialScaleNotes", () => {
  it("cycles scale degrees to match count", () => {
    expect(buildSequentialScaleNotes(5, [48, 50, 52])).toEqual([
      48, 50, 52, 48, 50,
    ]);
  });
});

describe("randomizeNodeMidiNotes", () => {
  const nodes = () => [
    { id: "a", x: 0, y: 0, midiNote: 99 },
    { id: "b", x: 1, y: 1, midiNote: 99 },
    { id: "c", x: 2, y: 2, midiNote: 99 },
  ];

  it("with no scale assigns a permutation of 0..n-1", () => {
    const out = randomizeNodeMidiNotes(nodes(), "");
    const notes = out.map((n) => n.midiNote).sort((a, b) => a - b);
    expect(notes).toEqual([0, 1, 2]);
  });

  it("with scale assigns multiset of cycled scale degrees", () => {
    const degrees = getScaleDegrees("Minor pentatonic scale");
    const out = randomizeNodeMidiNotes(nodes(), "Minor pentatonic scale");
    const expected = buildSequentialScaleNotes(3, degrees).sort(
      (a, b) => a - b
    );
    expect(out.map((n) => n.midiNote).sort((a, b) => a - b)).toEqual(expected);

  });

  it("with scale and more nodes cycles then shuffles multiset", () => {
    const pentatonic = getScaleDegrees("Minor pentatonic scale");
    const fiveNodes = [
      { id: "a", x: 0, y: 0, midiNote: 0 },
      { id: "b", x: 1, y: 1, midiNote: 0 },
      { id: "c", x: 2, y: 2, midiNote: 0 },
      { id: "d", x: 3, y: 3, midiNote: 0 },
      { id: "e", x: 4, y: 4, midiNote: 0 },
    ];
    const out = randomizeNodeMidiNotes(fiveNodes, "Minor pentatonic scale");
    const expectedMultiset = buildSequentialScaleNotes(5, pentatonic).sort(
      (a, b) => a - b
    );
    expect(out.map((n) => n.midiNote).sort((a, b) => a - b)).toEqual(
      expectedMultiset
    );
  });

  it("returns same array reference content for zero nodes", () => {
    const empty = [];
    expect(randomizeNodeMidiNotes(empty, "")).toBe(empty);
  });
});
