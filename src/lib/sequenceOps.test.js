import { describe, it, expect } from "vitest";
import {
  commaSepStrToIntVector,
  whatevToString,
  modAndAdd,
  addTwoVectorsWithScalars,
  sumInversion,
  interleave,
  subsequenceReplace,
  replaceWithString,
  towerOfHanoiSequence,
  rotateLeft,
  rotateRight,
  reverse,
} from "./sequenceOps.js";

describe("commaSepStrToIntVector", () => {
  it("parses a comma separated list", () => {
    expect(commaSepStrToIntVector("1, 2, 3")).toEqual([1, 2, 3]);
  });
  it("parses negatives and tight commas", () => {
    expect(commaSepStrToIntVector("-1,2,-3")).toEqual([-1, 2, -3]);
  });
  it("throws on a non-numeric token (matches C++ stoi throw)", () => {
    expect(() => commaSepStrToIntVector("1,abc,3")).toThrow();
  });
});

describe("whatevToString", () => {
  it("joins with commas when keepCommas is true", () => {
    expect(whatevToString([1, 2, 3], true)).toBe("1, 2, 3");
  });
  it("concatenates with trailing newline when keepCommas is false", () => {
    expect(whatevToString([1, 2, 3], false)).toBe("123\n");
  });
});

describe("modAndAdd", () => {
  it("mod-then-add (addFirst=false)", () => {
    // (10 % 7) + 2 = 5 ; (14 % 7) + 2 = 2
    expect(modAndAdd([10, 14], 7, 2, false)).toEqual([5, 2]);
  });
  it("add-then-mod (addFirst=true)", () => {
    // (10 + 2) % 7 = 5 ; (14 + 2) % 7 = 2
    expect(modAndAdd([10, 14], 7, 2, true)).toEqual([5, 2]);
  });
  it("matches C++ truncated mod for negatives", () => {
    // (-1 % 12) + 0 = -1 in both JS and C++
    expect(modAndAdd([-1], 12, 0, false)).toEqual([-1]);
  });
});

describe("addTwoVectorsWithScalars", () => {
  it("multiplies by scalars and adds, no mod when modBy is 0", () => {
    // 1*2 + 3*1 = 5 ; 2*2 + 4*1 = 8
    expect(addTwoVectorsWithScalars([1, 2], 2, [3, 4], 1, 0)).toEqual([5, 8]);
  });
  it("mods the result when modBy is non-zero", () => {
    // 5 % 4 = 1 ; 8 % 4 = 0
    expect(addTwoVectorsWithScalars([1, 2], 2, [3, 4], 1, 4)).toEqual([1, 0]);
  });
  it("truncates to the shorter vector", () => {
    expect(addTwoVectorsWithScalars([1, 2, 3], 1, [10], 1, 0)).toEqual([11]);
  });
});

describe("sumInversion", () => {
  it("inverts within an octave around the sum value", () => {
    // For 0: reduces to 0, numOctaves 0; (sum+12-0)%12 = sum%12
    // sum=0 -> 0, 7 -> 5, 5 -> 7 (classic sum-0 inversion within octave)
    expect(sumInversion([0, 7, 5], 0)).toEqual([0, 5, 7]);
  });
  it("preserves octave offset", () => {
    // 12 -> reduce to 0, numOctaves 1; inverted (0+12-0)%12=0 + 12 = 12
    expect(sumInversion([12], 0)).toEqual([12]);
  });
});

describe("interleave (splice)", () => {
  it("round-robins front elements across vectors", () => {
    expect(interleave([[1, 2, 3], [10, 20]])).toEqual([1, 10, 2, 20, 3]);
  });
  it("does not mutate the inputs", () => {
    const a = [1, 2];
    const b = [3, 4];
    interleave([a, b]);
    expect(a).toEqual([1, 2]);
    expect(b).toEqual([3, 4]);
  });
});

describe("subsequenceReplace", () => {
  it("replaces a multi-element subsequence", () => {
    expect(subsequenceReplace([1, 2, 3, 2, 3], [2, 3], [9])).toEqual([1, 9, 9]);
  });
  it("leaves the sequence unchanged when there is no match", () => {
    expect(subsequenceReplace([1, 2, 3], [5, 6], [9])).toEqual([1, 2, 3]);
  });
});

describe("replaceWithString", () => {
  it("regex-replaces all matches in the raw text", () => {
    expect(replaceWithString("0, 5, 0, 7", "0", "rest")).toBe(
      "rest, 5, rest, 7"
    );
  });
});

describe("rotate / reverse", () => {
  it("rotateLeft shifts elements left cyclically", () => {
    expect(rotateLeft([1, 2, 3, 4])).toEqual([2, 3, 4, 1]);
  });
  it("rotateRight shifts elements right cyclically", () => {
    expect(rotateRight([1, 2, 3, 4])).toEqual([4, 1, 2, 3]);
  });
  it("reverse reverses the order", () => {
    expect(reverse([1, 2, 3, 4])).toEqual([4, 3, 2, 1]);
  });
});

describe("towerOfHanoiSequence", () => {
  it("handles a single disc", () => {
    expect(towerOfHanoiSequence([60, 62, 64], 1)).toEqual([60, 60]);
  });
  it("produces the expected interleaved scale sequence for 2 discs", () => {
    expect(towerOfHanoiSequence([60, 62, 64], 2)).toEqual([
      60, 62, 60, 62, 62, 60, 60, 62,
    ]);
  });
});
