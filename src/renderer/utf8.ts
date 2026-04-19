import type { QRData, RendererOptions } from '../types.js';
import * as Utils from './utils.js';

const BLOCK_CHAR = { WW: ' ', WB: '▄', BB: '█', BW: '▀' };
const INVERTED_BLOCK_CHAR = { BB: ' ', BW: '▄', WW: '█', WB: '▀' };

interface BlockSet { WW: string; WB: string; BB: string; BW: string }

function getBlockChar(top: number, bottom: number, blocks: BlockSet): string {
  if (top && bottom) return blocks.BB;
  if (top && !bottom) return blocks.BW;
  if (!top && bottom) return blocks.WB;
  return blocks.WW;
}

export function render(qrData: QRData, options?: RendererOptions): string {
  const opts = Utils.getOptions(options);
  let blocks: BlockSet = BLOCK_CHAR;
  if (opts.color.dark.hex === '#ffffff' || opts.color.light.hex === '#000000') {
    blocks = INVERTED_BLOCK_CHAR;
  }

  const size = qrData.modules.size;
  const data = qrData.modules.data;

  let output = '';
  let hMargin = blocks.WW.repeat(size + opts.margin * 2);
  hMargin = (hMargin + '\n').repeat(opts.margin / 2);
  const vMargin = blocks.WW.repeat(opts.margin);

  output += hMargin;
  for (let i = 0; i < size; i += 2) {
    output += vMargin;
    for (let j = 0; j < size; j++) {
      const topModule = data[i * size + j]!;
      const bottomModule = data[(i + 1) * size + j] ?? 0;
      output += getBlockChar(topModule, bottomModule, blocks);
    }
    output += vMargin + '\n';
  }

  output += hMargin.slice(0, -1);
  return output;
}
