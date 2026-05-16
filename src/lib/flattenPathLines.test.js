import { describe, expect, it } from "vitest";
import {
  flattenPathLinesToString,
  reorderPathLines,
} from "./flattenPathLines.js";

describe("flattenPathLinesToString", () => {
  it("returns empty for empty array", () => {
    expect(flattenPathLinesToString([])).toBe("");
  });

  it("joins one path", () => {
    expect(flattenPathLinesToString(["0, 1, 2"])).toBe("0, 1, 2");
  });

  it("order of paths changes flattened order", () => {
    const a = ["0, 1", "2, 3"];
    const b = ["2, 3", "0, 1"];
    expect(flattenPathLinesToString(a)).toBe("0, 1, 2, 3");
    expect(flattenPathLinesToString(b)).toBe("2, 3, 0, 1");
  });

  it("skips invalid tokens", () => {
    expect(flattenPathLinesToString(["0, x, 2"])).toBe("0, 2");
  });
});

describe("reorderPathLines", () => {
  it("moves first to last", () => {
    expect(reorderPathLines(["a", "b", "c"], 0, 3)).toEqual(["b", "c", "a"]);
  });

  it("moves last to first", () => {
    expect(reorderPathLines(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("returns same ref identity when no-op", () => {
    const p = ["x", "y"];
    expect(reorderPathLines(p, 1, 1)).toBe(p);
  });
});
