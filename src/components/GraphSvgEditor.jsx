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
  // pythagorean distance formula
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
  edgeFirstId, // for multiple node operations like adding or deleting edges
  circleRadius,
  onSvgPointerDown,
}) {
  const svgRef = useRef(null);

  const clientToSvg = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    // browser method to create a browser point object
    const pt = svg.createSVGPoint(); 
    pt.x = clientX;
    pt.y = clientY;
    // browser method to get the current transformation matrix (CTM) that maps SVG coordinates to screen coordinates
    const ctm = svg.getScreenCTM(); 
    if (!ctm) return { x: clientX, y: clientY };
    // ctm.inverse(): if the browser multiplied the canvas size by 0.5 to fit the window
    // then the inverse matrix multiplies it by 2 to get back to the original SVG coordinate space
    // matrixTransform applies the inverse CTM to the point to convert from screen coordinates back to SVG coordinates
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

  // create edge pairs to map over for drawing edge lines
  // only draw line once for undirected edges (use set to track already seen pairs before adding)
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
      {/* definitions that browser compiles as cached assets to be referenced later */}
      <defs>
        {/* edge arrow */}
        {/* markerEnd markerStart use it when drawing the lines */}
        <marker
          id="graph-arrow-green"
          markerUnits="userSpaceOnUse"
          markerWidth="32"
          markerHeight="32"
          refX="28"
          refY="16"
          orient="auto" // rotates marker to match angle of edge line
        >
          {/* edge line */}
          <path
            d="M 0 4 L 28 16 L 0 28 Z"
            fill="#44aa44"
            stroke="#338833"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </marker>
        {/* arrow edge going in opposite direction */}
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
      {/* draw all nodes */}
      {nodes.map((n, i) => {
        const stroke =
          edgeFirstId === n.id ? "#ffffff" : PALETTE[i % PALETTE.length];
        return (
          // g tag to group circle and text together
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
              // pointerEvents none so that text doesn't block pointer events on circle
              // so that user can click on text and select node
              pointerEvents="none"
            >
              {/* index or node in nodes as text label in circle */}
              {i}
            </text>
          </g>
        );
      })}

      {/* draw all edges as lines between nodes with arrow marker at end */}
      {edgePairs.map((e, idx) => {
        // get a (fromId) and b (toId) from browser event object
        const a = nodeById.get(e.fromId);
        const b = nodeById.get(e.toId);
        if (!a || !b) return null;
        // trim line to circle radius
        const trimmed = trimEdgeToCircles(
          a.x,
          a.y,
          b.x,
          b.y,
          circleRadius
        );
        if (!trimmed) return null;

        return (
          // draw edge line
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

// I don't believe that excludeId is used for anything
export function canPlaceNode(nodes, x, y, minDist, excludeId = null) {
  for (const n of nodes) {
    if (n.id === excludeId) continue;
    if (dist(n.x, n.y, x, y) < minDist) return false;
  }
  return true;
}

export { PALETTE };
