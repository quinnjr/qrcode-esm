import type { ErrorCorrectionLevel, Mode, Segment } from '../types.js';
import * as Utils from './utils.js';
import * as ECCode from './error-correction-code.js';
import * as ECLevel from './error-correction-level.js';
import * as ModeNs from './mode.js';
import * as VersionCheck from './version-check.js';

const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | 1;
const G18_BCH = Utils.getBCHDigit(G18);

function getBestVersionForDataLength(mode: Mode, length: number, ecl: ErrorCorrectionLevel): number | undefined {
  for (let v = 1; v <= 40; v++) {
    if (length <= getCapacity(v, ecl, mode)) return v;
  }
  return undefined;
}

function getReservedBitsCount(mode: Mode, version: number): number {
  return ModeNs.getCharCountIndicator(mode, version) + 4;
}

function getTotalBitsFromDataArray(segments: Segment[], version: number): number {
  let totalBits = 0;
  for (const data of segments) {
    totalBits += getReservedBitsCount(data.mode, version) + data.getBitsLength();
  }
  return totalBits;
}

function getBestVersionForMixedData(segments: Segment[], ecl: ErrorCorrectionLevel): number | undefined {
  for (let v = 1; v <= 40; v++) {
    const length = getTotalBitsFromDataArray(segments, v);
    if (length <= getCapacity(v, ecl, ModeNs.MIXED)) return v;
  }
  return undefined;
}

export function from(value: number | string | undefined, defaultValue?: number): number | undefined {
  if (VersionCheck.isValid(value)) return Number.parseInt(String(value), 10);
  return defaultValue;
}

export function getCapacity(version: number, ecl: ErrorCorrectionLevel, mode?: Mode): number {
  if (!VersionCheck.isValid(version)) throw new Error('Invalid QR Code version');

  const m = mode ?? ModeNs.BYTE;

  const totalCodewords = Utils.getSymbolTotalCodewords(version);
  const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, ecl);
  const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;

  if (m === ModeNs.MIXED) return dataTotalCodewordsBits;

  const usableBits = dataTotalCodewordsBits - getReservedBitsCount(m, version);

  switch (m) {
    case ModeNs.NUMERIC: { return Math.floor((usableBits / 10) * 3);
    }
    case ModeNs.ALPHANUMERIC: { return Math.floor((usableBits / 11) * 2);
    }
    case ModeNs.KANJI: { return Math.floor(usableBits / 13); }
    default: { return Math.floor(usableBits / 8); }
  }
}

export function getBestVersionForData(data: Segment | Segment[], errorCorrectionLevel?: ErrorCorrectionLevel): number | undefined {
  const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);

  if (Array.isArray(data)) {
    if (data.length > 1) return getBestVersionForMixedData(data, ecl);
    if (data.length === 0) return 1;
    const seg = data[0]!;
    return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl);
  }
  return getBestVersionForDataLength(data.mode, data.getLength(), ecl);
}

export function getEncodedBits(version: number): number {
  if (!VersionCheck.isValid(version) || version < 7) {
    throw new Error('Invalid QR Code version');
  }

  let d = version << 12;
  while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
    d ^= G18 << (Utils.getBCHDigit(d) - G18_BCH);
  }
  return (version << 12) | d;
}
