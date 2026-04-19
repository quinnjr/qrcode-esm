export type Graph = Record<string, Record<string, number>>;

interface QueueItem { value: string; cost: number }

class PriorityQueue {
  private queue: QueueItem[] = [];

  public push(value: string, cost: number): void {
    this.queue.push({ value, cost });
    this.queue.sort((a, b) => a.cost - b.cost);
  }

  public pop(): QueueItem | undefined {
    return this.queue.shift();
  }

  public empty(): boolean {
    return this.queue.length === 0;
  }
}

function singleSourceShortestPaths(graph: Graph, s: string, d: string): Record<string, string> {
  const predecessors: Record<string, string> = {};
  const costs: Record<string, number> = { [s]: 0 };
  const open = new PriorityQueue();
  open.push(s, 0);

  while (!open.empty()) {
    const closest = open.pop()!;
    const u = closest.value;
    const costToU = closest.cost;

    const adjacent = graph[u] ?? {};
    for (const v in adjacent) {
      if (!Object.prototype.hasOwnProperty.call(adjacent, v)) continue;
      const edgeCost = adjacent[v]!;
      const newCost = costToU + edgeCost;
      const firstVisit = costs[v] === undefined;
      if (firstVisit || costs[v]! > newCost) {
        costs[v] = newCost;
        open.push(v, newCost);
        predecessors[v] = u;
      }
    }
  }

  if (costs[d] === undefined) {
    throw new TypeError(`Could not find a path from ${s} to ${d}.`);
  }

  return predecessors;
}

function extractShortestPath(predecessors: Record<string, string>, d: string): string[] {
  const nodes: string[] = [];
  let u: string | undefined = d;
  while (u) {
    nodes.push(u);
    u = predecessors[u];
  }
  return nodes.toReversed();
}

export function findPath(graph: Graph, s: string, d: string): string[] {
  return extractShortestPath(singleSourceShortestPaths(graph, s, d), d);
}
