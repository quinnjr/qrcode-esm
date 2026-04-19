import type { QRData, QRInput, RendererOptions } from './types.js';
import { create } from './core/qrcode.js';
import * as Utf8Renderer from './renderer/utf8.js';
import * as TerminalRenderer from './renderer/terminal.js';
import * as SvgRenderer from './renderer/svg.js';
import * as CanvasRenderer from './renderer/canvas.js';

export type { QRData, QRInput, RendererOptions, QRCodeOptions, Segment, Mode, ErrorCorrectionLevel } from './types.js';
export { create } from './core/qrcode.js';

type StringType = 'utf8' | 'terminal' | 'svg' | undefined;

function getStringRenderer(type: StringType): (d: QRData, o?: RendererOptions) => string {
  switch (type) {
    case 'utf8': { return Utf8Renderer.render; }
    case 'terminal': { return TerminalRenderer.render; }
    default: { return SvgRenderer.render; }
  }
}

function isCanvas(v: unknown): v is HTMLCanvasElement {
  return !!v && typeof (v as HTMLCanvasElement).getContext === 'function';
}

interface ParsedCanvasArgs {
  canvas: HTMLCanvasElement | undefined;
  text: QRInput;
  opts: RendererOptions | undefined;
}

function parseCanvasArgs(
  canvasOrText: HTMLCanvasElement | QRInput,
  textOrOpts?: QRInput | RendererOptions,
  maybeOpts?: RendererOptions,
): ParsedCanvasArgs {
  if (isCanvas(canvasOrText)) {
    return { canvas: canvasOrText, text: textOrOpts as QRInput, opts: maybeOpts };
  }
  return { canvas: undefined, text: canvasOrText, opts: textOrOpts as RendererOptions | undefined };
}

export function toString(text: QRInput, opts?: RendererOptions): Promise<string> {
  return Promise.resolve().then(() => {
    const data = create(text, opts);
    return getStringRenderer(opts?.type as StringType)(data, opts);
  });
}

export function toCanvas(
  canvasOrText: HTMLCanvasElement | QRInput,
  textOrOpts?: QRInput | RendererOptions,
  maybeOpts?: RendererOptions,
): Promise<HTMLCanvasElement> {
  return Promise.resolve().then(() => {
    const { canvas, text, opts } = parseCanvasArgs(canvasOrText, textOrOpts, maybeOpts);
    const data = create(text, opts);
    return CanvasRenderer.render(data, canvas, opts);
  });
}

export function toDataURL(
  canvasOrText: HTMLCanvasElement | QRInput,
  textOrOpts?: QRInput | RendererOptions,
  maybeOpts?: RendererOptions,
): Promise<string> {
  return Promise.resolve().then(() => {
    const { canvas, text, opts } = parseCanvasArgs(canvasOrText, textOrOpts, maybeOpts);
    const data = create(text, opts);
    return CanvasRenderer.renderToDataURL(data, canvas, opts);
  });
}
