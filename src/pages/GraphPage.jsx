import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMainMidi } from "../context/MainMidiContext.jsx";
import { useGraphSession } from "../context/GraphSessionContext.jsx";
import { useTake2Session } from "../context/Take2SessionContext.jsx";
import {
  buildAdjacencyMap,
  buildAdjacencyMatrix,
} from "../lib/graphDerived.js";
import {
  countFlattenedNotes,
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
import { parseGraphNodeMidiNote } from "../lib/graphScale.js";
import { SCALES } from "../lib/scales.js";
import { TutorialLink } from "../components/TutorialLink.jsx";

const SCALE_PRESET_KEYS = Object.keys(SCALES).sort((a, b) =>
  a.localeCompare(b)
);

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
  const { setSeq1 } = useTake2Session();
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
    startNodeIndex,
    setStartNodeIndex,
    pathLines,
    setPathLines,
    scaleSelection,
    selectScale,
    randomizeNodeMidi,
    resetGraph,
    // randomizeNodeMidiNotes,
  } = useGraphSession();

  const dragFromIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [midiDrafts, setMidiDrafts] = useState({});

  const midiSignature = useMemo(
    () => nodes.map((n) => `${n.id}:${n.midiNote}`).join("|"),
    [nodes]
  );

  useEffect(() => {
    setMidiDrafts({});
  }, [midiSignature]);

  const concatenatedNotes = useMemo(
    () => flattenPathLinesToString(pathLines),
    [pathLines]
  );

  const flattenedNoteCount = useMemo(
    () => countFlattenedNotes(pathLines),
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

  // get either 0 or a positive # and either 0 or the last index of nodes 
  // and then take the minimum of those to make sure not negative and not out of bounds
  const safeStartIndex = Math.min(
    Math.max(0, startNodeIndex),
    Math.max(0, nodes.length - 1)
  );

  const handleSvgPointerDown = useCallback(
    (e, svgPoint) => {
      const { x, y } = svgPoint;
      const hit = findNodeAtPoint(nodes, x, y, CIRCLE_R);

      if (hit) { // found node in nodes
        if (buildMode === "removeNode") {
          removeNodeById(hit.id);
          setEdgeFirstId(null);
          return;
        }
        if (buildMode === "addEdge") {
          // edgeFirstId boolean used to signify if selecting the 1st or 2nd node of a 2 node operation
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

      // node not found to already exist and add node mode is on
      if (buildMode === "addNode") {
        // disallow placement of nodes too close together
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

  // useCallback not necessarily needed for onClick button press
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
    // a path is added when it reaches a dead end or visits a node already in the path (cycle)
    const res = terminatedWalks(adjacencyMap, startId, {
      maxPaths: maxTerminatedPaths,
    });
    idPaths = res.paths;
    truncated = res.truncated; // whether or not the max paths safety was hit and the output was truncated

    // map nodes to user specified midi note values and create comma separated string
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

  const sendToTake2 = useCallback(() => {
    const t = concatenatedNotes.trim();
    setSeq1(t.length ? t : "");
  }, [concatenatedNotes, setSeq1]);

  const handlePathDragStart = useCallback((index, e) => {
    dragFromIndexRef.current = index;
    // signify to browser this is a move operation
    e.dataTransfer.effectAllowed = "move";
    // set the event object's data to the index of the path being dragged
    // to access the index in the onDrop event handler that calls handlePathDrop and gets it with .getData
    e.dataTransfer.setData("text/plain", String(index));
  }, []);

  const handlePathDragOver = useCallback((index, e) => {
    e.preventDefault();
    // signify to browser this is a move operation to allow dropping and display correct cursor
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  // reorder pathLines when user drags/drops different ordering of paths
  const handlePathDrop = useCallback((dropIndex, e) => {
    e.preventDefault();
    setDragOverIndex(null);
    // grab the index of the path that you put in browser event object 
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
        <TutorialLink section="graph" />
      </header>

      <div className="header2-visual">
        <div className="header2-container graph-controls-row">
          <label className="field-label">
            Mode
            {/* drop down menu options NO DRAW, ADD NODE, ADD EDGE, REMOVE NODE, REMOVE EDGE */}
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

          {/* dropdown menu directed/undirected */}
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

          {/* start node dropdown dynamically displays the nodes that have been drawn */}
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
            Paths run from the start node until a <strong>dead end</strong> or the path encounters an already visited node (cycle) <br/> All paths are explored and included in output
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
            <button type="button" className="controls" onClick={sendToTake2}>
              Send notes to Take 2
            </button>
            <label className="graph-notes-meta-label"># notes</label>
            <span
              className="row-meta-value"
              aria-label="Notes in flattened paths"
            >
              {flattenedNoteCount}
            </span>
            {/* message to click next node for adding an edge */}
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
          <div className="graph-scale-preset-row field-row">
            {/* scale selector */}
            <label htmlFor="graph-scale-select">Scale</label>
            <select
              id="graph-scale-select"
              className="scale-select"
              value={scaleSelection}
              onChange={(e) => selectScale(e.target.value)}
            >
              <option value="">Select a scale...</option>
              {SCALE_PRESET_KEYS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {/* randomize notes button */}
            <button
              type="button"
              className="randomize-notes-button"
              onClick={randomizeNodeMidi}
              disabled={nodes.length === 0}
            >
              randomize notes order
            </button>
            <button
              type="button"
              className="graph-clear-button"
              onClick={resetGraph}
            >
              Clear
            </button>
          </div>
          <div className="midi-note-grid">
            {/* diff color per node index in the nodes array for user to map midi notes to */}
            {nodes.map((n, i) => (
              <label key={n.id} className="midi-note-field">
                <span style={{ color: PALETTE[i % PALETTE.length] }}>
                  Node {i}
                </span>
                {/* input boxes for midi notes per node that user adds */}
                <input
                  type="number"
                  min={0}
                  max={127}
                  value={midiDrafts[n.id] ?? String(n.midiNote)}
                  // on change add node id: user midi note value to midiDrafts
                  onChange={(e) =>
                    setMidiDrafts((d) => ({
                      ...d,
                      [n.id]: e.target.value,
                    }))
                  }
                  onBlur={() => {
                    const raw = midiDrafts[n.id] ?? String(n.midiNote);
                    updateNodeMidi(n.id, parseGraphNodeMidiNote(raw));
                    setMidiDrafts((d) => {
                      // remove the midi note draft for the node that the user is leaving
                      const { [n.id]: _, ...rest } = d;
                      return rest;
                    });
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* graph drawing editor space for placing nodes and connecting edges */}
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
            Drag a row to reorder. Flattened MIDI based on your reordering
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
              // ordered list
              <ol 
                id="paths-list"
                className="path-lines-list"
                aria-labelledby="paths-list-label"
              >
                {/* all paths with reorderable drag/drop functionality */}
                {pathLines.map((line, index) => (
                  <li
                    key={index}
                    className={`path-lines-item${
                      dragOverIndex === index ? " path-lines-item-dragover" : ""
                    }`}
                    // draggable signifies to browser to allow user to click and drag the li items
                    draggable 
                    // onDragStart, onDragOver, onDrop, onDragEnd are browser built in event hooks
                    onDragStart={(e) => handlePathDragStart(index, e)}
                    onDragOver={(e) => handlePathDragOver(index, e)}
                    // handlePathDrop reorders pathLines
                    onDrop={(e) => handlePathDrop(index, e)}
                    onDragEnd={handlePathDragEnd}
                    // not visually displaying the li indexes but this takes care of screen reader functionality
                    aria-label={`Path ${index + 1} of ${pathLines.length}, drag to reorder`}
                  >
                    <span className="path-lines-grip" aria-hidden="true">
                      ::
                    </span>
                    {/* code html tag like computer code look */}
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
                  {/* indexes of nodes for header */}
                  {nodes.map((_, j) => (
                    <th key={j}>{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adjacencyMatrix.map((row, i) => (
                  <tr key={i}>
                    {/* row label of node index */}
                    <th scope="row">{i}</th> 
                    {/* fill in all of the cells for the row */}
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
