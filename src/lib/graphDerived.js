/**
 * Directed edges only in storage; when undirected, neighbor relation is symmetric.
 * @param {{ id: string }[]} nodes - order defines matrix row/col indices
 * @param {{ fromId: string, toId: string }[]} edges
 * @param {boolean} undirected
 * @returns {Map<string, Set<string>>}
 */
export function buildAdjacencyMap(nodes, edges, undirected) {
  const map = new Map();
  // initialize empty set for each node for the adjacency map
  for (const n of nodes) {
    map.set(n.id, new Set());
  }

  // function to use to add each edge to adjacency map
  const add = (a, b) => {
    if (!map.has(a) || !map.has(b)) return;
    // add b in a's adjacency set
    map.get(a).add(b);
  };

  // for each edge add the to node to the from nodes adjacency set
  for (const e of edges) {
    add(e.fromId, e.toId);
    if (undirected) {
      add(e.toId, e.fromId);
    }
  }

  return map;
}

/**
 * Square 0/1 matrix aligned with `nodes` array order (row i = from nodes[i]).
 * @returns {number[][]}
 */
export function buildAdjacencyMatrix(nodes, edges, undirected) {
  const n = nodes.length;
  const mat = Array.from({ length: n }, () => Array(n).fill(0));
  const indexById = new Map(nodes.map((node, i) => [node.id, i]));

  const mark = (fromId, toId) => {
    const i = indexById.get(fromId);
    const j = indexById.get(toId);
    if (i === undefined || j === undefined) return;
    mat[i][j] = 1;
  };

  // mark index for each edge to build adjacency matrix to display
  for (const e of edges) {
    mark(e.fromId, e.toId);
    if (undirected) {
      mark(e.toId, e.fromId);
    }
  }

  return mat;
}

/** Serializable adjacency list for UI */
export function adjacencyMapToRecord(map) {
  const out = {};
  for (const [id, set] of map) {
    out[id] = [...set].sort();
  }
  return out;
}
