export const MAX_RHYTHM_SPACE = 16;

/**
 * All ordered compositions: positive integers summing to spaceSize, exactly numNotes parts.
 * @param {number} spaceSize
 * @param {number} numNotes
 * @returns {number[][]}
 */
export function getRhythmCompositions(spaceSize, numNotes) {
  if (
    !Number.isFinite(spaceSize) ||
    !Number.isFinite(numNotes) ||
    spaceSize < 1 ||
    numNotes < 1 ||
    numNotes > spaceSize
  ) {
    return [];
  }

  const allCompositions = [];

  function backtrack(remainingSpace, divisions, oneComposition) {
    if (remainingSpace === 0) {
      if (divisions === numNotes) {
        allCompositions.push(oneComposition.slice());
      }
      return;
    }

    for (let i = remainingSpace; i >= 1; i--) {
      oneComposition.push(i);
      backtrack(remainingSpace - i, divisions + 1, oneComposition);
      oneComposition.pop();
    }
  }

  backtrack(spaceSize, 0, []);
  return allCompositions;
}

/**
 * @param {number[]} composition
 * @returns {number[]}
 */
export function compositionToBinaryPattern(composition) {
  const out = [];
  for (const d of composition) {
    out.push(1);
    for (let z = 0; z < d - 1; z++) out.push(0);
  }
  return out;
}

/** @param {number[]} composition */
export function formatCompositionBrackets(composition) {
  return `[${composition.join(", ")}]`;
}

/** @param {number[]} pattern */
export function formatBinaryBrackets(pattern) {
  return `[${pattern.join(", ")}]`;
}

/** @param {number[]} composition */
export function formatCompositionLine(composition) {
  return `${formatCompositionBrackets(composition)} ${formatBinaryBrackets(compositionToBinaryPattern(composition))}`;
}

/**
 * @param {string} str
 * @returns {number | null} positive integer or null
 */
export function parsePositiveIntInput(str) {
  const t = String(str).trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null;
  return n;
}

/** @param {string} str @returns {number | null} 1..MAX_RHYTHM_SPACE or null */
export function parseRhythmSpaceInput(str) {
  const n = parsePositiveIntInput(str);
  if (n === null || n > MAX_RHYTHM_SPACE) return null;
  return n;
}
