import type { Mode } from '../types.js';
import * as VersionCheck from './version-check.js';
import * as Regex from './regex.js';

export const NUMERIC: Mode = {
  id: 'Numeric',
  bit: 1,
  ccBits: [10, 12, 14],
};

export const ALPHANUMERIC: Mode = {
  id: 'Alphanumeric',
  bit: 2,
  ccBits: [9, 11, 13],
};

export const BYTE: Mode = {
  id: 'Byte',
  bit: 4,
  ccBits: [8, 16, 16],
};

export const KANJI: Mode = {
  id: 'Kanji',
  bit: 8,
  ccBits: [8, 10, 12],
};

export const MIXED: Mode = { bit: -1 };

export function getCharCountIndicator(mode: Mode, version: number): number {
  if (!mode.ccBits) throw new Error('Invalid mode: ' + JSON.stringify(mode));
  if (!VersionCheck.isValid(version)) throw new Error('Invalid version: ' + String(version));

  if (version >= 1 && version < 10) return mode.ccBits[0];
  if (version < 27) return mode.ccBits[1];
  return mode.ccBits[2];
}

export function getBestModeForData(dataStr: string): Mode {
  if (Regex.testNumeric(dataStr)) return NUMERIC;
  if (Regex.testAlphanumeric(dataStr)) return ALPHANUMERIC;
  if (Regex.testKanji(dataStr)) return KANJI;
  return BYTE;
}

export function toString(mode: Mode): string {
  if (mode?.id) return mode.id;
  throw new Error('Invalid mode');
}

export function isValid(mode: unknown): mode is Mode {
  const m = mode as Mode | null | undefined;
  return !!m && !!m.bit && !!m.ccBits;
}

function fromString(s: string): Mode {
  const lc = s.toLowerCase();
  switch (lc) {
    case 'numeric': { return NUMERIC; }
    case 'alphanumeric': { return ALPHANUMERIC; }
    case 'kanji': { return KANJI; }
    case 'byte': { return BYTE; }
    default: { throw new Error('Unknown mode: ' + s); }
  }
}

export function from(value: Mode | string | undefined | null, defaultValue: Mode): Mode {
  if (isValid(value)) return value;
  if (typeof value === 'string') {
    try { return fromString(value); } catch { return defaultValue; }
  }
  return defaultValue;
}
