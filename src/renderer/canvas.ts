import type { QRData, RendererOptions } from '../types.js';
import * as Utils from './utils.js';

type CanvasEl = HTMLCanvasElement;

function clearCanvas(ctx: CanvasRenderingContext2D, canvas: CanvasEl, size: number): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.height = size;
  canvas.width = size;
  canvas.style.height = size + 'px';
  canvas.style.width = size + 'px';
}

function getCanvasElement(): CanvasEl {
  try {
    return document.createElement('canvas');
  } catch {
    throw new Error('You need to specify a canvas element');
  }
}

export function render(qrData: QRData, canvas?: CanvasEl | null, options?: RendererOptions): CanvasEl {
  const canvasEl = canvas ?? getCanvasElement();
  const opts = Utils.getOptions(options);
  const size = Utils.getImageWidth(qrData.modules.size, opts);

  const ctx = canvasEl.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context from canvas');

  const image = ctx.createImageData(size, size);
  Utils.qrToImageData(image.data, qrData, opts);
  clearCanvas(ctx, canvasEl, size);
  ctx.putImageData(image, 0, 0);
  return canvasEl;
}

export function renderToDataURL(qrData: QRData, canvas?: CanvasEl | null, options?: RendererOptions): string {
  const opts = options ?? {};
  const canvasEl = render(qrData, canvas, opts);
  const type = opts.type ?? 'image/png';
  const rendererOpts = (opts.rendererOpts ?? {}) as { quality?: number };
  return canvasEl.toDataURL(type, rendererOpts.quality);
}
