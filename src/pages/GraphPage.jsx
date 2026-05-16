import { useCallback, useMemo, useRef, useState } from "react";
import { useMainMidi } from "../context/MainMidiContext.jsx";
import { useGraphSession } from "../context/GraphSessionContext.jsx";
import {
  buildAdjacencyMap,
  buildAdjacencyMatrix,
} from "../lib/graphDerived.js";
import {
  flattenPathLinesToString,
  reorderPathLines,
} from "../lib/flattenPathLines.js";
import {
  pathToMidiString,
  terminatedWalks,
} from "../lib/graphTraversal.js";
import {
  GraphSvgEditor,
  findNodeAtPoint,
  canPlaceNode,
  PALETTE,
} from "../components/GraphSvgEditor.jsx";

// const CIRCLE_R = 28;
const CIRCLE_R = 40;
const MIN_NODE_DIST = CIRCLE_R * 4;

const BUILD_LABELS = [
  "NO DRAW",
  "ADD NODE",
  "ADD EDGE",
  "REMOVE NODE",
  "REMOVE EDGE",
];

export function GraphPage() {
  const { setMainNotes } = useMainMidi();
  const {
    nodes,
    edges,
    undirected,
    setUndirected,
    buildMode,
    setBuildMode,
    edgeFirstId,
    setEdgeFirstId,
    maxTerminatedPaths,
    setMaxTerminatedPaths,
    lastWarning,
    setLastWarning,
    addNodeAt,
    removeNodeById,
    addEdgePair,
    removeEdgePair,
    updateNodeMidi,
  } = useGraphSession();

  const [startNodeIndex, setStartNodeIndex] = useState(0);
  const [pathLines, setPathLines] = useState([]);
  const dragFromIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const concatenatedNotes = useMemo(
    () => flattenPathLinesToString(pathLines),
    [pathLines]
  );

  const adjacencyMap = useMemo(
    () => buildAdjacencyMap(nodes, edges, undirected),
    [nodes, edges, undirected]
  );

  const adjacencyMatrix = useMemo(
    () => buildAdjacencyMatrix(nodes, edges, undirected),
    [nodes, edges, undirected]
  );

  const safeStartIndex = Math.min(
    Math.max(0, startNodeIndex),
    Math.max(0, nodes.length - 1)
  );

  const handleSvgPointerDown = useCallback(
    (e, svgPoint) => {
      const { x, y } = svgPoint;
      const hit = findNodeAtPoint(nodes, x, y, CIRCLE_R);

      if (hit) {
        if (buildMode === "removeNode") {
          removeNodeById(hit.id);
          setEdgeFirstId(null);
          return;
        }
        if (buildMode === "addEdge") {
          if (!edgeFirstId) {
            setEdgeFirstId(hit.id);
          } else {
            addEdgePair(edgeFirstId, hit.id);
            setEdgeFirstId(null);
          }
          return;
        }
        if (buildMode === "removeEdge") {
          if (!edgeFirstId) {
            setEdgeFirstId(hit.id);
          } else {
            removeEdgePair(edgeFirstId, hit.id);
            setEdgeFirstId(null);
          }
          return;
        }
        return;
      }

      if (buildMode === "addNode") {
        if (canPlaceNode(nodes, x, y, MIN_NODE_DIST)) {
          addNodeAt(x, y);
        }
      }
    },
    [
      nodes,
      buildMode,
      edgeFirstId,
      addNodeAt,
      removeNodeById,
      addEdgePair,
      removeEdgePair,
      setEdgeFirstId,
    ]
  );

  const generateSequence = useCallback(() => {
    setLastWarning("");
    if (nodes.length === 0) {
      setPathLines([]);
      setLastWarning("Add at least one node.");
      return;
    }
    const startId = nodes[safeStartIndex]?.id;
    if (!startId) {
      setLastWarning("Invalid start node.");
      return;
    }

    let idPaths;
    let truncated = false;

    // dfs to get all possible paths from start node through graph
    // a path is added when it reaches a dead end or visits a node already in the path
    const res = terminatedWalks(adjacencyMap, startId, {
      maxPaths: maxTerminatedPaths,
    });
    idPaths = res.paths;
    truncated = res.truncated;

    const lines = idPaths.map((p) => pathToMidiString(p, nodes));
    setPathLines(lines);

    if (truncated) {
      setLastWarning(
        `Enumeration stopped after ${maxTerminatedPaths} paths (raise max paths if needed).`
      );
    }
  }, [
    nodes,
    safeStartIndex,
    adjacencyMap,
    maxTerminatedPaths,
    setLastWarning,
  ]);

  const sendToMain = useCallback(() => {
    const t = concatenatedNotes.trim();
    setMainNotes(t.length ? t : "");
  }, [concatenatedNotes, setMainNotes]);

  const handlePathDragStart = useCallback((index, e) => {
    dragFromIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }, []);

  const handlePathDragOver = useCallback((index, e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handlePathDrop = useCallback((dropIndex, e) => {
    e.preventDefault();
    setDragOverIndex(null);
    const raw = e.dataTransfer.getData("text/plain");
    let from = parseInt(raw, 10);
    if (Number.isNaN(from)) {
      from = dragFromIndexRef.current ?? -1;
    }
    dragFromIndexRef.current = null;
    if (from < 0 || from === dropIndex) return;
    setPathLines((prev) => reorderPathLines(prev, from, dropIndex));
  }, []);

  const handlePathDragEnd = useCallback(() => {
    dragFromIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  return (
    <div className="app graph-page">
      <header className="header">
        <h1>Graph Traversal Sequencer</h1>
      </header>

      <div className="header2-visual">
        <div className="header2-container graph-controls-row">
          <label className="field-label">
            Mode
            <select
              value={buildMode}
              onChange={(e) => {
                setBuildMode(e.target.value);
                setEdgeFirstId(null);
              }}
              className="graph-select"
            >
              <option value="noDraw">{BUILD_LABELS[0]}</option>
              <option value="addNode">{BUILD_LABELS[1]}</option>
              <option value="addEdge">{BUILD_LABELS[2]}</option>
              <option value="removeNode">{BUILD_LABELS[3]}</option>
              <option value="removeEdge">{BUILD_LABELS[4]}</option>
            </select>
          </label>

          <label className="field-label">
            Graph
            <select
              value={undirected ? "u" : "d"}
              onChange={(e) => setUndirected(e.target.value === "u")}
              className="graph-select"
            >
              <option value="d">Directed</option>
              <option value="u">Undirected</option>
            </select>
          </label>

          <label className="field-label">
            Start node index
            <select
              value={
                nodes.length === 0
                  ? ""
                  : String(Math.min(startNodeIndex, nodes.length - 1))
              }
              onChange={(e) => setStartNodeIndex(Number(e.target.value))}
              disabled={nodes.length === 0}
              className="graph-select"
            >
              {nodes.map((_, i) => (
                <option key={i} value={String(i)}>
                  {i}
                </option>
              ))}
            </select>
          </label>

          {/* <label className="field-label narrow">
            Max paths (safety cap)
            <input
              type="number"
              min={1}
              max={1000000}
              value={maxTerminatedPaths}
              onChange={(e) =>
                setMaxTerminatedPaths(Number(e.target.value) || 50000)
              }
              className="graph-num-input wide-cap"
              title="Stops enumeration after this many terminated walks (dead end or cycle closure)."
            />
          </label> */}

          <p className="traversal-hint" role="note">
            Paths run from the start node until a <strong>dead end</strong> or a step to an
            already-visited node on that walk (the repeated node is included once, e.g.
            0, 1, 2, 0).
          </p>

          <div className="graph-action-buttons">
            <button
              type="button"
              className="controls primary-send"
              onClick={generateSequence}
            >
              Generate sequence
            </button>
            <button type="button" className="controls" onClick={sendToMain}>
              Send notes to main
            </button>
            {edgeFirstId ? (
              <p className="edge-hint edge-hint-inline">
                Edge step: click second node (same node twice for a self-loop).
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="header2-visual">
        <div className="header2-container">
          <h2 className="section-title">MIDI note per node</h2>
          <div className="midi-note-grid">
            {nodes.map((n, i) => (
              <label key={n.id} className="midi-note-field">
                <span style={{ color: PALETTE[i % PALETTE.length] }}>
                  Node {i}
                </span>
                <input
                  type="number"
                  min={0}
                  max={127}
                  value={n.midiNote}
                  onChange={(e) =>
                    updateNodeMidi(n.id, Number(e.target.value) || 0)
                  }
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="graph-svg-wrap">
        <GraphSvgEditor
          nodes={nodes}
          edges={edges}
          undirected={undirected}
          edgeFirstId={edgeFirstId}
          circleRadius={CIRCLE_R}
          onSvgPointerDown={handleSvgPointerDown}
        />
      </div>

      <div className="header2-visual">
        <div className="header2-container">
          <h2 className="section-title">Output</h2>
          {lastWarning ? (
            <p className="warn-text" role="status">
              {lastWarning}
            </p>
          ) : null}
          <p className="stat-text">Paths: {pathLines.length}</p>
          <label className="output-label" id="paths-list-label">
            Paths (comma-separated MIDI per path)
          </label>
          <p className="path-lines-hint">
            Drag a row to reorder. Flattened MIDI below updates automatically.
          </p>
          <div
            className="path-lines-scroll"
            role="presentation"
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setDragOverIndex(null);
              }
            }}
          >
            {pathLines.length === 0 ? (
              <p className="path-lines-empty">
                Generate to fill.
              </p>
            ) : (
              <ol
                id="paths-list"
                className="path-lines-list"
                aria-labelledby="paths-list-label"
              >
                {pathLines.map((line, index) => (
                  <li
                    key={index}
                    className={`path-lines-item${
                      dragOverIndex === index ? " path-lines-item-dragover" : ""
                    }`}
                    draggable
                    onDragStart={(e) => handlePathDragStart(index, e)}
                    onDragOver={(e) => handlePathDragOver(index, e)}
                    onDrop={(e) => handlePathDrop(index, e)}
                    onDragEnd={handlePathDragEnd}
                    aria-label={`Path ${index + 1} of ${pathLines.length}, drag to reorder`}
                  >
                    <span className="path-lines-grip" aria-hidden="true">
                      ::
                    </span>
                    <code className="path-lines-code">{line}</code>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <label className="output-label" htmlFor="concat-area">
            All paths flattened (comma-separated MIDI)
          </label>
          <textarea
            id="concat-area"
            readOnly
            rows={6}
            value={concatenatedNotes}
            className="output-textarea mono"
          />
        </div>
      </div>

      {/* adjacency matrix */}
      <div className="header2-visual">
        <div className="header2-container">
          <h3 className="subsection-title matrix-title">
            Adjacency matrix (rows/cols = node index order)
          </h3>
          <div className="matrix-wrap">
            <table className="adj-matrix-table">
              <thead>
                <tr>
                  <th />
                  {nodes.map((_, j) => (
                    <th key={j}>{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adjacencyMatrix.map((row, i) => (
                  <tr key={i}>
                    <th scope="row">{i}</th>
                    {row.map((v, j) => (
                      <td key={j}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
