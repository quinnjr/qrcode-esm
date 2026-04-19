import type { QRData, RendererOptions } from '../types.js';
import * as big from './terminal-big.js';
import * as small from './terminal-small.js';

export function render(qrData: QRData, options?: RendererOptions): string {
  if (options?.small) return small.render(qrData, options);
  return big.render(qrData, options);
}
