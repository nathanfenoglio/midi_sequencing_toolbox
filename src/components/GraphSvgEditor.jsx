import { useCallback, useMemo, useRef } from "react";
import { trimEdgeToCircles } from "../lib/svgEdgeGeometry.js";

/** Matches viewBox — shared coordinate space for layout math */
export const SVG_CANVAS_WIDTH = 1920;
export const SVG_CANVAS_HEIGHT = 1080;

const PALETTE = [
  "#ff5555",
  "#55ff55",
  "#5555ff",
  "#ffff55",
  "#aa55aa",
  "#ffaa55",
];

function dist(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * @param {{
 *   nodes: { id: string, x: number, y: number, midiNote: number }[],
 *   edges: { fromId: string, toId: string }[],
 *   undirected: boolean,
 *   edgeFirstId: string | null,
 *   circleRadius: number,
 *   onSvgPointerDown: (e: React.PointerEvent, svgPoint: { x: number, y: number }) => void,
 * }} props
 */
export function GraphSvgEditor({
  nodes,
  edges,
  undirected,
  edgeFirstId,
  circleRadius,
  onSvgPointerDown,
}) {
  const svgRef = useRef(null);

  const clientToSvg = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }, []);

  const handlePointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      const { x, y } = clientToSvg(e.clientX, e.clientY);
      onSvgPointerDown(e, { x, y });
    },
    [clientToSvg, onSvgPointerDown]
  );

  const edgePairs = useMemo(() => {
    const pairs = [];
    const seen = new Set();
    for (const e of edges) {
      const key = undirected
        ? [e.fromId, e.toId].sort().join(":")
        : `${e.fromId}->${e.toId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push(e);
    }
    return pairs;
  }, [edges, undirected]);

  const nodeById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  return (
    <svg
      ref={svgRef}
      className="graph-svg"
      viewBox={`0 0 ${SVG_CANVAS_WIDTH} ${SVG_CANVAS_HEIGHT}`}
      role="img"
      aria-label="Graph editor canvas"
      onPointerDown={handlePointerDown}
    >
      <defs>
        <marker
          id="graph-arrow-green"
          markerUnits="userSpaceOnUse"
          markerWidth="32"
          markerHeight="32"
          refX="28"
          refY="16"
          orient="auto"
        >
          <path
            d="M 0 4 L 28 16 L 0 28 Z"
            fill="#44aa44"
            stroke="#338833"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </marker>
        <marker
          id="graph-arrow-green-start"
          markerUnits="userSpaceOnUse"
          markerWidth="32"
          markerHeight="32"
          refX="0"
          refY="16"
          orient="auto"
        >
          <path
            d="M 28 4 L 0 16 L 28 28 Z"
            fill="#44aa44"
            stroke="#338833"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </marker>
      </defs>

      <rect
        x={0}
        y={0}
        width={SVG_CANVAS_WIDTH}
        height={SVG_CANVAS_HEIGHT}
        fill="#151515"
        stroke="#333"
      />

      {nodes.map((n, i) => {
        const stroke =
          edgeFirstId === n.id ? "#ffffff" : PALETTE[i % PALETTE.length];
        return (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={circleRadius}
              fill="#222"
              stroke={stroke}
              strokeWidth={2.5}
            />
            <text
              x={n.x}
              y={n.y + 5}
              textAnchor="middle"
              fill="#ccc"
              fontSize={23}
              pointerEvents="none"
            >
              {i}
            </text>
          </g>
        );
      })}

      {edgePairs.map((e, idx) => {
        const a = nodeById.get(e.fromId);
        const b = nodeById.get(e.toId);
        if (!a || !b) return null;
        const trimmed = trimEdgeToCircles(
          a.x,
          a.y,
          b.x,
          b.y,
          circleRadius
        );
        if (!trimmed) return null;

        return (
          <line
            key={`${e.fromId}-${e.toId}-${idx}`}
            x1={trimmed.x1}
            y1={trimmed.y1}
            x2={trimmed.x2}
            y2={trimmed.y2}
            stroke="#44aa44"
            strokeWidth={3}
            strokeLinecap="butt"
            markerEnd="url(#graph-arrow-green)"
            markerStart={
              undirected ? "url(#graph-arrow-green-start)" : undefined
            }
          />
        );
      })}
    </svg>
  );
}

export function findNodeAtPoint(nodes, x, y, radius) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (dist(n.x, n.y, x, y) <= radius) return n;
  }
  return null;
}

export function canPlaceNode(nodes, x, y, minDist, excludeId = null) {
  for (const n of nodes) {
    if (n.id === excludeId) continue;
    if (dist(n.x, n.y, x, y) < minDist) return false;
  }
  return true;
}

export { PALETTE };
