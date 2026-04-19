import type { Mode, RawSegment, Segment } from '../types.js';
import * as ModeNs from './mode.js';
import { NumericData } from './numeric-data.js';
import { AlphanumericData } from './alphanumeric-data.js';
import { ByteData } from './byte-data.js';
import { KanjiData } from './kanji-data.js';
import * as Regex from './regex.js';
import * as Utils from './utils.js';
import { findPath, type Graph } from './dijkstra.js';

const textEncoder = new TextEncoder();

function getStringByteLength(str: string): number {
  return textEncoder.encode(str).length;
}

function getSegments(regex: RegExp, mode: Mode, str: string): (RawSegment & { index: number })[] {
  const segments: (RawSegment & { index: number })[] = [];
  let result: RegExpExecArray | null;
  regex.lastIndex = 0;
  while ((result = regex.exec(str)) !== null) {
    segments.push({ data: result[0], index: result.index, mode, length: result[0].length });
  }
  return segments;
}

function getSegmentsFromString(dataStr: string): RawSegment[] {
  const numSegs = getSegments(Regex.NUMERIC, ModeNs.NUMERIC, dataStr);
  const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, ModeNs.ALPHANUMERIC, dataStr);
  let byteSegs: (RawSegment & { index: number })[];
  let kanjiSegs: (RawSegment & { index: number })[];

  if (Utils.isKanjiModeEnabled()) {
    byteSegs = getSegments(Regex.BYTE, ModeNs.BYTE, dataStr);
    kanjiSegs = getSegments(Regex.KANJI, ModeNs.KANJI, dataStr);
  } else {
    byteSegs = getSegments(Regex.BYTE_KANJI, ModeNs.BYTE, dataStr);
    kanjiSegs = [];
  }

  return [...numSegs, ...alphaNumSegs, ...byteSegs, ...kanjiSegs]
    .toSorted((a, b) => a.index - b.index)
    .map((o) => ({ data: o.data, mode: o.mode, length: o.length }));
}

function getSegmentBitsLength(length: number, mode: Mode): number {
  switch (mode) {
    case ModeNs.NUMERIC: { return NumericData.getBitsLength(length);
    }
    case ModeNs.ALPHANUMERIC: { return AlphanumericData.getBitsLength(length);
    }
    case ModeNs.KANJI: { return KanjiData.getBitsLength(length);
    }
    case ModeNs.BYTE: { return ByteData.getBitsLength(length);
    }
    default: { throw new Error('Unknown segment mode');
    }
  }
}

function mergeSegments(segs: RawSegment[]): RawSegment[] {
  const acc: RawSegment[] = [];
  for (const curr of segs) {
    const prev = acc.at(-1);
    if (prev?.mode === curr.mode) {
      prev.data += curr.data;
    } else {
      acc.push({ ...curr });
    }
  }
  return acc;
}

function buildNodes(segs: RawSegment[]): RawSegment[][] {
  const nodes: RawSegment[][] = [];
  for (const seg of segs) {
    switch (seg.mode) {
      case ModeNs.NUMERIC: {
        nodes.push([
          seg,
          { data: seg.data, mode: ModeNs.ALPHANUMERIC, length: seg.length },
          { data: seg.data, mode: ModeNs.BYTE, length: seg.length },
        ]);
        break;
      }
      case ModeNs.ALPHANUMERIC: {
        nodes.push([
          seg,
          { data: seg.data, mode: ModeNs.BYTE, length: seg.length },
        ]);
        break;
      }
      case ModeNs.KANJI: {
        nodes.push([
          seg,
          { data: seg.data, mode: ModeNs.BYTE, length: getStringByteLength(seg.data) },
        ]);
        break;
      }
      case ModeNs.BYTE: {
        nodes.push([
          { data: seg.data, mode: ModeNs.BYTE, length: getStringByteLength(seg.data) },
        ]);
      }
    }
  }
  return nodes;
}

interface GraphTableEntry { node: RawSegment; lastCount: number }

function buildGraph(nodes: RawSegment[][], version: number): { map: Graph; table: Record<string, GraphTableEntry> } {
  const table: Record<string, GraphTableEntry> = {};
  const graph: Graph = { start: {} };
  let prevNodeIds: string[] = ['start'];

  for (const [i, nodeGroup] of nodes.entries()) {
    const currentNodeIds: string[] = [];

    for (const [j, node] of nodeGroup.entries()) {
      const key = `${i}_${j}`;

      currentNodeIds.push(key);
      table[key] = { node, lastCount: 0 };
      graph[key] = {};

      for (const prevNodeId of prevNodeIds) {
        const prevEntry = table[prevNodeId];
        if (prevEntry?.node.mode === node.mode) {
          graph[prevNodeId]![key] =
            getSegmentBitsLength(prevEntry.lastCount + node.length, node.mode) -
            getSegmentBitsLength(prevEntry.lastCount, node.mode);
          prevEntry.lastCount += node.length;
        } else {
          if (prevEntry) prevEntry.lastCount = node.length;
          graph[prevNodeId]![key] =
            getSegmentBitsLength(node.length, node.mode) +
            4 + ModeNs.getCharCountIndicator(node.mode, version);
        }
      }
    }

    prevNodeIds = currentNodeIds;
  }

  for (const id of prevNodeIds) {
    graph[id]!.end = 0;
  }

  return { map: graph, table };
}

function buildSingleSegment(data: string, modesHint: Mode | string | null | undefined): Segment {
  const bestMode = ModeNs.getBestModeForData(data);
  let mode = ModeNs.from(modesHint ?? undefined, bestMode);

  if (mode !== ModeNs.BYTE && mode.bit < bestMode.bit) {
    throw new Error(`"${data}" cannot be encoded with mode ${ModeNs.toString(mode)}.\n Suggested mode is: ${ModeNs.toString(bestMode)}`);
  }

  if (mode === ModeNs.KANJI && !Utils.isKanjiModeEnabled()) {
    mode = ModeNs.BYTE;
  }

  switch (mode) {
    case ModeNs.NUMERIC: { return new NumericData(data);
    }
    case ModeNs.ALPHANUMERIC: { return new AlphanumericData(data);
    }
    case ModeNs.KANJI: { return new KanjiData(data);
    }
    case ModeNs.BYTE: { return new ByteData(data);
    }
    default: { throw new Error('Unsupported mode');
    }
  }
}

export function fromArray(array: (string | { data: string; mode?: Mode | string })[]): Segment[] {
  const acc: Segment[] = [];
  for (const seg of array) {
    if (typeof seg === 'string') {
      acc.push(buildSingleSegment(seg, null));
    } else if (seg.data) {
      acc.push(buildSingleSegment(seg.data, seg.mode ?? null));
    }
  }
  return acc;
}

export function fromString(data: string, version: number): Segment[] {
  const segs = getSegmentsFromString(data);
  const nodes = buildNodes(segs);
  const graph = buildGraph(nodes, version);
  const path = findPath(graph.map, 'start', 'end');

  const optimized: RawSegment[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    optimized.push(graph.table[path[i]!]!.node);
  }

  return fromArray(mergeSegments(optimized));
}

export function rawSplit(data: string): Segment[] {
  return fromArray(getSegmentsFromString(data));
}
