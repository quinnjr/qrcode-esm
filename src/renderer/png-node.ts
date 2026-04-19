import type { QRData, RendererOptions } from '../types.js';
import * as Utils from './utils.js';
import { encodePNG } from './png-encoder.js';

export function render(qrData: QRData, options?: RendererOptions): Uint8Array {
  const opts = Utils.getOptions(options);
  const size = Utils.getImageWidth(qrData.modules.size, opts);
  const pixels = new Uint8Array(size * size * 4);
  Utils.qrToImageData(pixels, qrData, opts);
  return encodePNG(pixels, size, size);
}

export function renderToDataURL(qrData: QRData, options?: RendererOptions): string {
  return 'data:image/png;base64,' + bytesToBase64(render(qrData, options));
}

function bytesToBase64(bytes: Uint8Array): string {
  const g = globalThis as { Buffer?: { from(b: Uint8Array): { toString(enc: string): string } }; btoa?: (s: string) => string };
  if (g.Buffer) return g.Buffer.from(bytes).toString('base64');
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return g.btoa?.(s) ?? '';
}
