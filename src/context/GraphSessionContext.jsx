import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyScaleToNodes,
  getScaleDegrees,
  midiNoteForNodeIndex,
  randomizeNodeMidiNotes,
} from "../lib/graphScale.js";

/** @typedef {'noDraw'|'addNode'|'addEdge'|'removeNode'|'removeEdge'} GraphBuildMode */

function newNodeId() {
  return `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const GraphSessionContext = createContext(null);

export function GraphSessionProvider({ children }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [undirected, setUndirected] = useState(false);
  /** @type {[GraphBuildMode, function]} */
  const [buildMode, setBuildMode] = useState(
    /** @type {GraphBuildMode} */ ("noDraw")
  );
  /** Pending first node id when adding/removing an edge (two-click). */
  const [edgeFirstId, setEdgeFirstId] = useState(null);

  /** Cap for terminated-walk enumeration (safety). */
  const [maxTerminatedPaths, setMaxTerminatedPaths] = useState(50000);

  const [lastWarning, setLastWarning] = useState("");

  const [startNodeIndex, setStartNodeIndex] = useState(0);
  const [pathLines, setPathLines] = useState([]);
  const [scaleSelection, setScaleSelection] = useState("");

  useEffect(() => {
    if (nodes.length > 0 && startNodeIndex >= nodes.length) {
      setStartNodeIndex(nodes.length - 1);
    }
  }, [nodes.length, startNodeIndex]);

  const addNodeAt = useCallback(
    (x, y) => {
      setNodes((prev) => {
        const scaleDegrees = getScaleDegrees(scaleSelection);
        const midiNote = midiNoteForNodeIndex(prev.length, scaleDegrees);
        return [
          ...prev,
          {
            id: newNodeId(),
            x,
            y,
            midiNote,
          },
        ];
      });
    },
    [scaleSelection]
  );

  const selectScale = useCallback((scaleName) => {
    setScaleSelection(scaleName);
    const degrees = getScaleDegrees(scaleName);
    if (degrees) {
      setNodes((prev) => applyScaleToNodes(prev, degrees));
    }
  }, []);

  const randomizeNodeMidi = useCallback(() => {
    setNodes((prev) => randomizeNodeMidiNotes(prev, scaleSelection));
  }, [scaleSelection]);

  const removeNodeById = useCallback((id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) =>
      prev.filter((e) => e.fromId !== id && e.toId !== id)
    );
    setEdgeFirstId((first) => (first === id ? null : first));
  }, []);

  const addEdgePair = useCallback(
    (fromId, toId) => {
      setEdges((prev) => {
        // check for duplicates and don't add edge if it already exists
        const exists = prev.some(
          (e) =>
            (e.fromId === fromId && e.toId === toId) ||
            (undirected &&
              fromId !== toId &&
              e.fromId === toId &&
              e.toId === fromId)
        );
        if (exists) return prev;
        return [...prev, { fromId, toId }];
      });
    },
    [undirected]
  );

  const removeEdgePair = useCallback(
    (fromId, toId) => {
      setEdges((prev) =>
        prev.filter((e) => {
          const forward = e.fromId === fromId && e.toId === toId;
          const back =
            undirected && e.fromId === toId && e.toId === fromId;
          return !forward && !back;
        })
      );
    },
    [undirected]
  );

  const updateNodeMidi = useCallback((id, midiNote) => {
    setScaleSelection("");
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, midiNote } : n))
    );
  }, []);

  const moveNode = useCallback((id, x, y) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x, y } : n))
    );
  }, []);

  const value = useMemo(
    () => ({
      nodes,
      setNodes,
      edges,
      setEdges,
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
      startNodeIndex,
      setStartNodeIndex,
      pathLines,
      setPathLines,
      addNodeAt,
      removeNodeById,
      addEdgePair,
      removeEdgePair,
      updateNodeMidi,
      moveNode,
      scaleSelection,
      selectScale,
      randomizeNodeMidi,
    }),
    [
      nodes,
      edges,
      undirected,
      buildMode,
      edgeFirstId,
      maxTerminatedPaths,
      lastWarning,
      startNodeIndex,
      pathLines,
      scaleSelection,
      addNodeAt,
      removeNodeById,
      addEdgePair,
      removeEdgePair,
      updateNodeMidi,
      moveNode,
      selectScale,
      randomizeNodeMidi,
    ]
  );

  return (
    <GraphSessionContext.Provider value={value}>
      {children}
    </GraphSessionContext.Provider>
  );
}

export function useGraphSession() {
  const ctx = useContext(GraphSessionContext);
  if (!ctx) {
    throw new Error("useGraphSession must be used within GraphSessionProvider");
  }
  return ctx;
}
