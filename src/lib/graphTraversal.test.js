import { describe, expect, it } from "vitest";
import { buildAdjacencyMap } from "./graphDerived.js";
import { pathToMidiString, terminatedWalks } from "./graphTraversal.js";

function chainNodes(named) {
  return named.map((id, i) => ({
    id,
    x: i * 50,
    y: 50,
    midiNote: i,
  }));
}

// change array of from, to pairs to array of objects for building adjacency map and testing traversal functions
function chainEdges(pairs) {
  return pairs.map(([fromId, toId]) => ({ fromId, toId }));
}

describe("terminatedWalks", () => {
  it("single isolated node emits one dead-end path", () => {
    const nodes = chainNodes(["a"]);
    const edges = [];
    const adj = buildAdjacencyMap(nodes, edges, false);
    const { paths, truncated } = terminatedWalks(adj, "a", { maxPaths: 100 });
    expect(truncated).toBe(false);
    expect(paths).toEqual([["a"]]);
  });

  it("chain a->b->c emits only full chain to dead end", () => {
    const nodes = chainNodes(["a", "b", "c"]);
    const edges = chainEdges([
      ["a", "b"],
      ["b", "c"],
    ]);
    const adj = buildAdjacencyMap(nodes, edges, false);
    const { paths } = terminatedWalks(adj, "a", { maxPaths: 100 });
    expect(paths).toEqual([["a", "b", "c"]]);
  });

  it("fork emits two dead-end paths, no lone prefixes", () => {
    const nodes = chainNodes(["a", "b", "c"]);
    const edges = chainEdges([
      ["a", "b"],
      ["a", "c"],
    ]);
    const adj = buildAdjacencyMap(nodes, edges, false);
    const { paths } = terminatedWalks(adj, "a", { maxPaths: 100 });
    expect(paths).toHaveLength(2);
    expect(paths).toContainEqual(["a", "b"]);
    expect(paths).toContainEqual(["a", "c"]);
  });

  it("directed triangle emits cycle path including closing vertex", () => {
    const nodes = chainNodes(["a", "b", "c"]);
    const edges = chainEdges([
      ["a", "b"],
      ["b", "c"],
      ["c", "a"],
    ]);
    const adj = buildAdjacencyMap(nodes, edges, false);
    const { paths } = terminatedWalks(adj, "a", { maxPaths: 100 });
    expect(paths.some((p) => p.join(",") === "a,b,c,a")).toBe(true);
  });

  // don't know if you will in the end permit self loops...
  it("self-loop emits path with duplicate terminal id", () => {
    const nodes = chainNodes(["a"]);
    const edges = chainEdges([["a", "a"]]);
    const adj = buildAdjacencyMap(nodes, edges, false);
    const { paths } = terminatedWalks(adj, "a", { maxPaths: 100 });
    expect(paths).toEqual([["a", "a"]]);
  });

  it("early cycle and branch: cycle closure and dead end", () => {
    const nodes = chainNodes(["a", "b", "c"]);
    const edges = chainEdges([
      ["a", "b"],
      ["b", "a"],
      ["b", "c"],
    ]);
    const adj = buildAdjacencyMap(nodes, edges, false);
    const { paths } = terminatedWalks(adj, "a", { maxPaths: 100 });
    expect(paths).toContainEqual(["a", "b", "a"]);
    expect(paths).toContainEqual(["a", "b", "c"]);
    expect(paths).toHaveLength(2);
  });

  it("triangle can emit second cycle edge from last vertex", () => {
    const nodes = chainNodes(["a", "b", "c"]);
    const edges = chainEdges([
      ["a", "b"],
      ["b", "c"],
      ["c", "a"],
      ["c", "b"],
    ]);
    const adj = buildAdjacencyMap(nodes, edges, false);
    const { paths } = terminatedWalks(adj, "a", { maxPaths: 100 });
    expect(paths.some((p) => p.join(",") === "a,b,c,a")).toBe(true);
    expect(paths.some((p) => p.join(",") === "a,b,c,b")).toBe(true);
  });

  it("respects maxPaths truncation flag", () => {
    const nodes = chainNodes(["a", "b", "c"]);
    const edges = chainEdges([
      ["a", "b"],
      ["a", "c"],
    ]);
    const adj = buildAdjacencyMap(nodes, edges, false);
    const { paths, truncated } = terminatedWalks(adj, "a", { maxPaths: 1 });
    expect(paths.length).toBe(1);
    expect(truncated).toBe(true);
  });

  it("undirected single edge yields cycle back to start", () => {
    const nodes = chainNodes(["a", "b"]);
    const edges = chainEdges([["a", "b"]]);
    const adj = buildAdjacencyMap(nodes, edges, true);
    const { paths } = terminatedWalks(adj, "a", { maxPaths: 100 });
    expect(paths).toEqual([["a", "b", "a"]]);
  });
});

describe("pathToMidiString", () => {
  it("maps ids to midi notes", () => {
    const nodes = [
      { id: "x", midiNote: 60 },
      { id: "y", midiNote: 62 },
    ];
    expect(pathToMidiString(["x", "y"], nodes)).toBe("60, 62");
  });

  it("maps cycle path with repeated node index", () => {
    const nodes = [
      { id: "a", midiNote: 0 },
      { id: "b", midiNote: 1 },
      { id: "c", midiNote: 2 },
    ];
    expect(pathToMidiString(["a", "b", "c", "a"], nodes)).toBe("0, 1, 2, 0");
  });
});
