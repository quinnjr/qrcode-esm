import type { QRData, RendererOptions } from '../types.js';
import { render as renderTag } from './svg-tag.js';

export { render } from './svg-tag.js';

export function renderFullDocument(qrData: QRData, options?: RendererOptions): string {
  return '<?xml version="1.0" encoding="utf-8"?>' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
    renderTag(qrData, options);
}
