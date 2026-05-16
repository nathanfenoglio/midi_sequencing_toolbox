import { describe, expect, it } from "vitest";
import { trimEdgeToCircles } from "./svgEdgeGeometry.js";

describe("trimEdgeToCircles", () => {
  it("returns null for coincident centers", () => {
    expect(trimEdgeToCircles(100, 100, 100, 100, 20)).toBeNull();
  });

  it("horizontal segment trims by radius from each center", () => {
    const t = trimEdgeToCircles(0, 0, 100, 0, 10);
    expect(t).not.toBeNull();
    expect(t.x1).toBeCloseTo(10.5);
    expect(t.y1).toBeCloseTo(0);
    expect(t.x2).toBeCloseTo(89.5);
    expect(t.y2).toBeCloseTo(0);
  });

  it("vertical segment", () => {
    const t = trimEdgeToCircles(50, 0, 50, 100, 28);
    expect(t).not.toBeNull();
    expect(t.x1).toBeCloseTo(50);
    expect(t.y1).toBeCloseTo(28.5);
    expect(t.x2).toBeCloseTo(50);
    expect(t.y2).toBeCloseTo(71.5);
  });
});
