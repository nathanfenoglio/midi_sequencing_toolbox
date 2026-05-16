/**
 * Trim a segment between circle centers so endpoints lie on the circle boundaries.
 * @returns {{ x1: number, y1: number, x2: number, y2: number } | null}
 *   null if centers coincide (e.g. self-loop — no straight segment).
 */
export function trimEdgeToCircles(ax, ay, bx, by, radius) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return null;

  const ux = dx / len;
  const uy = dy / len;
  const inset = 0.5;

  return {
    x1: ax + ux * (radius + inset),
    y1: ay + uy * (radius + inset),
    x2: bx - ux * (radius + inset),
    y2: by - uy * (radius + inset),
  };
}
