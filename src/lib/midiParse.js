const DEFAULT_NOTES = [54, 48, 50, 55, 52, 57, 60, 59];

export const DEFAULT_NOTES_STRING = "54, 48, 50, 55, 52, 57, 60, 59";

/** Parse comma-separated MIDI note values; default if empty or invalid. */
export function parseNotesInput(input) {
  if (!input || typeof input !== "string") return DEFAULT_NOTES;
  const parts = input.split(",").map((s) => parseInt(s.trim(), 10));
  const valid = parts.filter((n) => !isNaN(n) && n >= 0 && n <= 127);
  return valid.length > 0 ? valid : DEFAULT_NOTES;
}

export function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
  return (a * b) / gcd(a, b);
}
