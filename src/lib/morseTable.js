/** ITU International Morse — letters, digits, basic punctuation */
export const MORSE_TABLE = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  0: "-----",
  1: ".----",
  2: "..---",
  3: "...--",
  4: "....-",
  5: ".....",
  6: "-....",
  7: "--...",
  8: "---..",
  9: "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
};

/**
 * @param {string} char single character
 * @returns {string | null} morse pattern without spaces, or null if unknown
 */
export function lookupMorseChar(char) {
  if (!char || char.length !== 1) return null;
  if (char === " ") return null;
  const key =
    char >= "a" && char <= "z" ? char.toUpperCase() : char.toUpperCase?.() ?? char;
  if (key >= "A" && key <= "Z") return MORSE_TABLE[key] ?? null;
  if (key >= "0" && key <= "9") return MORSE_TABLE[key] ?? null;
  return MORSE_TABLE[char] ?? null;
}
