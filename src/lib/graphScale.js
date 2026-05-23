import { SCALES } from "./scales.js";

/** @returns {number[] | null} */
export function getScaleDegrees(scaleKey) {
  if (!scaleKey) return null;
  const arr = SCALES[scaleKey];
  return arr?.length ? arr : null;
}

/** @param {string} raw @returns {number} 0..127 */
export function parseGraphNodeMidiNote(raw) {
  const trimmed = String(raw).trim();
  if (trimmed === "") return 0;
  const n = parseInt(trimmed, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.min(127, Math.max(0, n));
}

/** No scale: use node index; else cycle scale degrees. */
export function midiNoteForNodeIndex(nodeIndex, scaleDegrees) {
  if (!scaleDegrees?.length) return nodeIndex;
  return scaleDegrees[nodeIndex % scaleDegrees.length];
}

export function applyScaleToNodes(nodes, scaleDegrees) {
  return nodes.map((n, i) => ({
    ...n,
    midiNote: midiNoteForNodeIndex(i, scaleDegrees),
  }));
}

/** @param {number} count @param {number[]} scaleDegrees */
export function buildSequentialScaleNotes(count, scaleDegrees) {
  const L = scaleDegrees.length;
  // cycle through scale as many times as needed for array of length count
  return Array.from({ length: count }, (_, i) => scaleDegrees[i % L]);
}

/** Fisher–Yates shuffle; returns a new array. */
export function shuffleArray(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * @param {{ id: string, x: number, y: number, midiNote: number }[]} nodes
 * @param {string} scaleSelection
 */
export function randomizeNodeMidiNotes(nodes, scaleSelection) {
  const n = nodes.length;
  if (n === 0) return nodes;

  const degrees = getScaleDegrees(scaleSelection);
  // create note pool from degree to scale translation if user hasn't manually inputted the note values
  // if the user did input the note values use them for the note pool to randomize
  const pool = degrees
    ? buildSequentialScaleNotes(n, degrees)
    : nodes.map((n) => n.midiNote);

    const shuffled = shuffleArray(pool);

  return nodes.map((node, i) => ({ ...node, midiNote: shuffled[i] }));
}
