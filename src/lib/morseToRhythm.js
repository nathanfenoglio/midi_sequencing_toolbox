import { textToMorsePreview } from "./textToMorse.js";

/**
 * @typedef {{
 *   dotDuration: number,
 *   dashDuration: number,
 *   gapBetweenSymbols: boolean,
 *   gapBetweenSymbolsDuration: number,
 *   gapBetweenLetters: boolean,
 *   gapBetweenLettersDuration: number,
 *   gapBetweenWords: boolean,
 *   gapBetweenWordsDuration: number,
 * }} MorseTiming
 */

/** @param {number} m @returns {number[]} */
export function expandDot(m) {
  const n = Math.max(1, Math.floor(m));
  return Array(n).fill(1);
}

/** @param {number} n @returns {number[]} one 1 then (n-1) zeros */
export function expandDash(n) {
  const len = Math.max(1, Math.floor(n));
  return [1, ...Array(Math.max(0, len - 1)).fill(0)];
}

/** @param {number} duration @returns {number[]} */
export function expandRest(duration) {
  const d = Math.max(0, Math.floor(duration));
  return d > 0 ? Array(d).fill(0) : [];
}

/**
 * @param {string} pattern e.g. ".-"
 * @param {MorseTiming} timing
 * @returns {number[]}
 */
export function morsePatternToRhythm(pattern, timing) {
  const out = [];
  const symbols = [...pattern];

  for (let i = 0; i < symbols.length; i++) {
    if (i > 0 && timing.gapBetweenSymbols) {
      out.push(...expandRest(timing.gapBetweenSymbolsDuration));
    }
    const sym = symbols[i];
    if (sym === ".") {
      out.push(...expandDot(timing.dotDuration));
    } else if (sym === "-") {
      out.push(...expandDash(timing.dashDuration));
    }
  }

  return out;
}

/**
 * @param {string} text
 * @param {MorseTiming} timing
 * @returns {{ rhythm: number[], morsePreview: string, hasContent: boolean }}
 */
export function textToRhythm(text, timing) {
  const { preview, letterPatterns } = textToMorsePreview(text);
  const rhythm = [];

  for (let w = 0; w < letterPatterns.length; w++) {
    if (w > 0 && timing.gapBetweenWords) {
      rhythm.push(...expandRest(timing.gapBetweenWordsDuration));
    }

    const patterns = letterPatterns[w];
    for (let l = 0; l < patterns.length; l++) {
      if (l > 0 && timing.gapBetweenLetters) {
        rhythm.push(...expandRest(timing.gapBetweenLettersDuration));
      }
      rhythm.push(...morsePatternToRhythm(patterns[l], timing));
    }
  }

  return {
    rhythm,
    morsePreview: preview,
    hasContent: letterPatterns.length > 0,
  };
}

/** @param {string} str @returns {number | null} non-negative integer */
export function parseNonNegativeInt(str) {
  const t = String(str).trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
}

/**
 * @param {object} form
 * @returns {{ ok: true, timing: MorseTiming } | { ok: false, error: string }}
 */
export function parseTimingFromForm(form) {
  const dotDuration = parseNonNegativeInt(form.dotDurationInput);
  const dashDuration = parseNonNegativeInt(form.dashDurationInput);

  if (dotDuration === null || dotDuration < 1) {
    return { ok: false, error: "Dot duration must be a positive integer." };
  }
  if (dashDuration === null || dashDuration < 1) {
    return { ok: false, error: "Dash duration must be a positive integer." };
  }

  const symbolDur = parseNonNegativeInt(form.gapBetweenSymbolsDurationInput);
  const letterDur = parseNonNegativeInt(form.gapBetweenLettersDurationInput);
  const wordDur = parseNonNegativeInt(form.gapBetweenWordsDurationInput);

  if (symbolDur === null) {
    return { ok: false, error: "Inter dot/dash gap duration must be a non-negative integer." };
  }
  if (letterDur === null) {
    return { ok: false, error: "Inter letter gap duration must be a non-negative integer." };
  }
  if (wordDur === null) {
    return { ok: false, error: "Inter word gap duration must be a non-negative integer." };
  }

  return {
    ok: true,
    timing: {
      dotDuration,
      dashDuration,
      gapBetweenSymbols: form.gapBetweenSymbols,
      gapBetweenSymbolsDuration: symbolDur ?? 1,
      gapBetweenLetters: form.gapBetweenLetters,
      gapBetweenLettersDuration: letterDur ?? 3,
      gapBetweenWords: form.gapBetweenWords,
      gapBetweenWordsDuration: wordDur ?? 7,
    },
  };
}
