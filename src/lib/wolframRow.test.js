import { describe, expect, it } from "vitest";
import { appendRhythmForMain, rhythmStats } from "./wolframRow.js";

describe("appendRhythmForMain", () => {
  it("appends new 0/1 values to valid existing rhythm", () => {
    const result = appendRhythmForMain("1", [0, 1]);
    expect(result).toEqual({ ok: true, value: "1, 0, 1" });
  });

  it("returns ok false when existing rhythm is invalid", () => {
    expect(appendRhythmForMain("1, 2", [0])).toEqual({ ok: false });
  });
});

describe("rhythmStats", () => {
  it("counts hits and total duration", () => {
    expect(rhythmStats([1, 0, 1, 0, 1])).toEqual({
      hitCount: 3,
      duration: 5,
    });
  });
});
