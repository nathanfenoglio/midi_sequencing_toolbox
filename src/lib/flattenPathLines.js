/**
 * @param {string[]} pathLines
 * @returns {number[]}
 */
function parseFlattenedPathLines(pathLines) {
  if (!Array.isArray(pathLines) || pathLines.length === 0) return [];

  return pathLines.flatMap((line) =>
    String(line)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 127)
  );
}

/**
 * Flatten ordered path lines (each line comma-separated MIDI ints) into one string.
 * @param {string[]} pathLines
 * @returns {string}
 */
export function flattenPathLinesToString(pathLines) {
  const nums = parseFlattenedPathLines(pathLines);
  if (nums.length === 0) return "";
  return nums.join(", ");
}

/**
 * Count valid MIDI notes across all path lines (same rules as flatten).
 * @param {string[]} pathLines
 * @returns {number}
 */
export function countFlattenedNotes(pathLines) {
  return parseFlattenedPathLines(pathLines).length;
}

/**
 * Move one item from fromIndex to toIndex (indices in the array before the move).
 * @param {string[]} paths
 * @param {number} fromIndex
 * @param {number} toIndex
 * @returns {string[]}
 */
export function reorderPathLines(paths, fromIndex, toIndex) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= paths.length ||
    toIndex > paths.length
  ) {
    return paths;
  }

  const next = [...paths];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
