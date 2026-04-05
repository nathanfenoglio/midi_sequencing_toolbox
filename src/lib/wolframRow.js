import { getRowAt } from "./cellularAutomata.js";

export function formatWithGrouping(row, groupSize) {
  if (!groupSize || groupSize < 1) return row.join(", ");
  const chunks = [];
  for (let i = 0; i < row.length; i += groupSize) {
    const chunk = row.slice(i, i + groupSize);
    chunks.push("[" + chunk.join(", ") + "]");
  }
  return chunks.join(", ");
}

export function rotateRowByStartIndex(row, startIndex) {
  const n = row.length;
  if (n === 0) return row;
  const k = ((startIndex % n) + n) % n;
  if (k === 0) return row;
  return [...row.slice(k), ...row.slice(0, k)];
}

/**
 * @param {string} str
 * @returns {{ ok: true, row: number[] } | { ok: false }}
 */
export function parseRhythmInput(str) {
  const parts = String(str).split(",");
  const row = [];
  for (const p of parts) {
    const t = p.trim();
    if (t === "") continue;
    const n = parseInt(t, 10);
    if (n !== 0 && n !== 1) return { ok: false };
    row.push(n);
  }
  if (row.length === 0) return { ok: false };
  return { ok: true, row };
}

export function applyTrimAndRotate(row, removeLeftInput, removeRightInput, startIndexInput) {
  const trimLeft = Math.max(0, parseInt(String(removeLeftInput), 10) || 0);
  const trimRight = Math.max(0, parseInt(String(removeRightInput), 10) || 0);
  let r = row.slice(trimLeft, trimRight > 0 ? -trimRight : undefined);
  const startIndex = parseInt(String(startIndexInput), 10) || 0;
  return rotateRowByStartIndex(r, startIndex);
}

export function serializeRhythmForMain(row) {
  return row.join(", ");
}

export function buildEffectiveRowFromCA({
  rule,
  grid,
  rowIndex,
  removeLeftInput,
  removeRightInput,
  startIndexInput,
}) {
  let row =
    rowIndex < grid.length ? grid[rowIndex] : getRowAt(rule, rowIndex);
  return applyTrimAndRotate(row, removeLeftInput, removeRightInput, startIndexInput);
}
