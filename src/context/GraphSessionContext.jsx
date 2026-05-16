import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

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

  const addNodeAt = useCallback((x, y) => {
    setNodes((prev) => [
      ...prev,
      {
        id: newNodeId(),
        x,
        y,
        midiNote: prev.length,
      },
    ]);
  }, []);

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
      addNodeAt,
      removeNodeById,
      addEdgePair,
      removeEdgePair,
      updateNodeMidi,
      moveNode,
    }),
    [
      nodes,
      edges,
      undirected,
      buildMode,
      edgeFirstId,
      maxTerminatedPaths,
      lastWarning,
      addNodeAt,
      removeNodeById,
      addEdgePair,
      removeEdgePair,
      updateNodeMidi,
      moveNode,
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
