import { SCALES } from "./scales.js";

/** @returns {number[] | null} */
export function getScaleDegrees(scaleKey) {
  if (!scaleKey) return null;
  const arr = SCALES[scaleKey];
  return arr?.length ? arr : null;
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
