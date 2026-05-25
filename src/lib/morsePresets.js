/** @typedef {import('./morseToRhythm.js').MorseTiming} MorseTiming */

/** @type {MorseTiming} */
export const YYZ_PRESET = {
  dotDuration: 1,
  dashDuration: 2,
  gapBetweenSymbols: false,
  gapBetweenSymbolsDuration: 1,
  gapBetweenLetters: false,
  gapBetweenLettersDuration: 3,
  gapBetweenWords: false,
  gapBetweenWordsDuration: 7,
};

/** @type {MorseTiming} */
export const STANDARD_PRESET = {
  dotDuration: 1,
  dashDuration: 3,
  gapBetweenSymbols: true,
  gapBetweenSymbolsDuration: 1,
  gapBetweenLetters: true,
  gapBetweenLettersDuration: 3,
  gapBetweenWords: true,
  gapBetweenWordsDuration: 7,
};

/** @param {MorseTiming} a @param {MorseTiming} b */
export function timingMatchesPreset(a, b) {
  return (
    a.dotDuration === b.dotDuration &&
    a.dashDuration === b.dashDuration &&
    a.gapBetweenSymbols === b.gapBetweenSymbols &&
    a.gapBetweenSymbolsDuration === b.gapBetweenSymbolsDuration &&
    a.gapBetweenLetters === b.gapBetweenLetters &&
    a.gapBetweenLettersDuration === b.gapBetweenLettersDuration &&
    a.gapBetweenWords === b.gapBetweenWords &&
    a.gapBetweenWordsDuration === b.gapBetweenWordsDuration
  );
}

/** @param {MorseTiming} timing @returns {"yyz" | "standard" | "custom"} */
export function detectPresetMode(timing) {
  if (timingMatchesPreset(timing, YYZ_PRESET)) return "yyz";
  if (timingMatchesPreset(timing, STANDARD_PRESET)) return "standard";
  return "custom";
}

/** @param {"yyz" | "standard"} name @returns {MorseTiming} */
export function applyPreset(name) {
  if (name === "standard") return { ...STANDARD_PRESET };
  return { ...YYZ_PRESET };
}

/** @param {MorseTiming} timing */
export function timingToFormStrings(timing) {
  return {
    dotDurationInput: String(timing.dotDuration),
    dashDurationInput: String(timing.dashDuration),
    gapBetweenSymbols: timing.gapBetweenSymbols,
    gapBetweenSymbolsDurationInput: String(timing.gapBetweenSymbolsDuration),
    gapBetweenLetters: timing.gapBetweenLetters,
    gapBetweenLettersDurationInput: String(timing.gapBetweenLettersDuration),
    gapBetweenWords: timing.gapBetweenWords,
    gapBetweenWordsDurationInput: String(timing.gapBetweenWordsDuration),
    presetMode: detectPresetMode(timing),
  };
}
