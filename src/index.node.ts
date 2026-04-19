import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { QRData, QRInput, RendererOptions } from './types.js';
import { create } from './core/qrcode.js';
import * as Utf8Renderer from './renderer/utf8.js';
import * as TerminalRenderer from './renderer/terminal.js';
import * as SvgRenderer from './renderer/svg.js';
import * as PngRenderer from './renderer/png-node.js';

export type { QRData, QRInput, RendererOptions, QRCodeOptions, Segment, Mode, ErrorCorrectionLevel } from './types.js';
export { create } from './core/qrcode.js';

type StringType = 'utf8' | 'terminal' | 'svg' | undefined;
type ImageType = 'png' | 'image/png' | 'svg' | 'utf8' | undefined;

function getStringRenderer(type: StringType): (d: QRData, o?: RendererOptions) => string {
  switch (type) {
    case 'svg': { return SvgRenderer.render; }
    case 'terminal': { return TerminalRenderer.render; }
    default: { return Utf8Renderer.render; }
  }
}

function renderToString(text: QRInput, opts?: RendererOptions): string {
  const data = create(text, opts);
  return getStringRenderer(opts?.type as StringType)(data, opts);
}

function renderToDataURL(text: QRInput, opts?: RendererOptions): string {
  const data = create(text, opts);
  const type = opts?.type as ImageType;
  if (type === 'svg') {
    return 'data:image/svg+xml;base64,' +
      Buffer.from(SvgRenderer.render(data, opts)).toString('base64');
  }
  if (type === 'utf8') {
    return 'data:text/plain;base64,' +
      Buffer.from(Utf8Renderer.render(data, opts)).toString('base64');
  }
  return PngRenderer.renderToDataURL(data, opts);
}

function renderToBuffer(text: QRInput, opts?: RendererOptions): Buffer {
  const data = create(text, opts);
  const type = opts?.type as ImageType;
  if (type === 'svg') return Buffer.from(SvgRenderer.render(data, opts));
  if (type === 'utf8') return Buffer.from(Utf8Renderer.render(data, opts));
  return Buffer.from(PngRenderer.render(data, opts));
}

export function toString(text: QRInput, opts?: RendererOptions): Promise<string> {
  return Promise.resolve().then(() => renderToString(text, opts));
}

export function toDataURL(text: QRInput, opts?: RendererOptions): Promise<string> {
  return Promise.resolve().then(() => renderToDataURL(text, opts));
}

export function toBuffer(text: QRInput, opts?: RendererOptions): Promise<Buffer> {
  return Promise.resolve().then(() => renderToBuffer(text, opts));
}

export async function toFile(filePath: string, text: QRInput, opts?: RendererOptions): Promise<void> {
  if (typeof filePath !== 'string' || !(typeof text === 'string' || Array.isArray(text))) {
    throw new TypeError('Invalid argument');
  }
  const type = (opts?.type ?? path.extname(filePath).slice(1).toLowerCase()) as ImageType;
  const data = create(text, opts);
  if (type === 'svg') {
    await writeFile(filePath, SvgRenderer.renderFullDocument(data, opts));
  } else if (type === 'utf8') {
    await writeFile(filePath, Utf8Renderer.render(data, opts));
  } else {
    await writeFile(filePath, PngRenderer.render(data, opts));
  }
}
