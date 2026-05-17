/**
 * Flatten ordered path lines (each line comma-separated MIDI ints) into one string.
 * @param {string[]} pathLines
 * @returns {string}
 */
export function flattenPathLinesToString(pathLines) {
  if (!Array.isArray(pathLines) || pathLines.length === 0) return "";

  // check that #s are valid and flatten into single array of #s
  const nums = pathLines.flatMap((line) =>
    String(line)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 127)
  );

  // return comma separated string of all of the paths flattened
  return nums.join(", ");
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
  const [item] = next.splice(fromIndex, 1); // remove from node from array
  next.splice(toIndex, 0, item); // insert from node in to index position of array, 0 signifies don't delete any elements
  return next;
}
