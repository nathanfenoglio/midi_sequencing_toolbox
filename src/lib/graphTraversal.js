/**
 * Traversal over a directed adjacency map (from buildAdjacencyMap).
 *
 * **terminatedWalks**: DFS from `startId`. A walk is emitted only when it ends at a
 * **dead end** (no outgoing edges) or **closes a cycle** (next vertex is already on
 * the current walk)—in the cycle case the closing vertex is appended once (e.g.
 * indices 0,1,2,0). Intermediate prefixes are never emitted alone.
 */

/**
 * @param {Map<string, Set<string>>} adj
 * @param {string} startId
 * @param {{ maxPaths?: number }} [options] — cap total emitted paths (default 50000); Infinity if omitted for tests
 * @returns {{ paths: string[][], truncated: boolean }}
 */
export function terminatedWalks(adj, startId, options = {}) {
  // just a maximum # of paths safety net, not being displayed as a user option to change
  const maxPaths =
    options.maxPaths === undefined
      ? 50000
      : Math.max(1, Number(options.maxPaths) || 50000);

  if (!adj.has(startId)) {
    return { paths: [], truncated: false };
  }

  const paths = [];
  let truncated = false;

  function neighborsSorted(cur) {
    // Return sorted array of neighbors for deterministic traversal order
    // get the adjacency set for the current node and use the spread operator to change it into an array to be sortable
    return [...(adj.get(cur) ?? [])].sort();
  }

  function dfs(pathIds) {
    if (paths.length >= maxPaths) {
      truncated = true;
      return;
    }

    // cur is the last node in the currently under construction pathIds
    const cur = pathIds[pathIds.length - 1];
    // all of cur's adjacent nodes (outs)
    const outs = neighborsSorted(cur);

    // if no adjacent nodes, then dead end so push the path to the paths array
    if (outs.length === 0) {
      paths.push([...pathIds]);
      return;
    }

    // dfs for each of the possible adjacent nodes
    for (const nb of outs) {
      // limiting recursion to max paths in case 
      if (paths.length >= maxPaths) {
        truncated = true;
        return;
      }
      // if cycle found
      if (pathIds.includes(nb)) {
        // push the path including this last node that was seen again
        paths.push([...pathIds, nb]);
      } else {
        // recursive call adding last node at end of pathIds
        dfs([...pathIds, nb]);
      }
    }
  }

  // initiate depth first search with start node
  dfs([startId]);
  return { paths, truncated };
}

/**
 * Map path of ids to MIDI numbers using node list order.
 * @param {string[]} idPath
 * @param {{ id: string, midiNote: number }[]} nodes
 */
export function pathToMidiString(idPath, nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n.midiNote]));
  const nums = idPath.map((id) => byId.get(id) ?? 0);
  return nums.join(", ");
}
