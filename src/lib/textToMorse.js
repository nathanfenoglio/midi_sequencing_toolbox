import { lookupMorseChar } from "./morseTable.js";

/**
 * @param {string} text
 * @returns {{ preview: string, letterPatterns: string[][] }}
 */
export function textToMorsePreview(text) {
  const words = String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const letterPatterns = [];
  const wordPreviews = [];

  for (const word of words) {
    const patterns = [];
    for (const char of word) {
      const pattern = lookupMorseChar(char);
      if (pattern) patterns.push(pattern);
    }
    if (patterns.length > 0) {
      letterPatterns.push(patterns);
      wordPreviews.push(patterns.join(" "));
    }
  }

  return {
    preview: wordPreviews.join(" / "),
    letterPatterns,
  };
}
