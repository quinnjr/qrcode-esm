import type { BitBuffer } from './core/bit-buffer.js';
import type { BitMatrix } from './core/bit-matrix.js';

export interface Mode {
  id?: 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji';
  bit: number;
  ccBits?: readonly [number, number, number];
}

export interface ErrorCorrectionLevel {
  bit: number;
}

export type ErrorCorrectionLevelInput =
  | ErrorCorrectionLevel
  | 'L' | 'M' | 'Q' | 'H'
  | 'low' | 'medium' | 'quartile' | 'high'
  | 'l' | 'm' | 'q' | 'h';

export interface Segment {
  mode: Mode;
  data: string | Uint8Array;
  getLength(): number;
  getBitsLength(): number;
  write(bitBuffer: BitBuffer): void;
}

export interface RawSegment {
  data: string;
  mode: Mode;
  length: number;
}

export interface QRData {
  modules: BitMatrix;
  version: number;
  errorCorrectionLevel: ErrorCorrectionLevel;
  maskPattern: number;
  segments: Segment[];
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
  hex: string;
}

export interface ColorOptions {
  dark?: string;
  light?: string;
}

export interface QRCodeOptions {
  version?: number;
  errorCorrectionLevel?: ErrorCorrectionLevelInput;
  maskPattern?: number;
  toSJISFunc?: (kanji: string) => number;
}

export interface RendererOptions extends QRCodeOptions {
  margin?: number;
  scale?: number;
  width?: number;
  color?: ColorOptions;
  type?: string;
  rendererOpts?: Record<string, unknown>;
  small?: boolean;
  inverse?: boolean;
}

export interface ResolvedRendererOptions {
  width: number | undefined;
  scale: number;
  margin: number;
  color: { dark: RGBA; light: RGBA };
  type: string | undefined;
  rendererOpts: Record<string, unknown>;
}

export type QRInput = string | (string | { data: string; mode?: Mode | string })[];
