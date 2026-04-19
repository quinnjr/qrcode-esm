import type { ErrorCorrectionLevel } from '../types.js';
import * as Utils from './utils.js';

const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | 1;
const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);
const G15_BCH = Utils.getBCHDigit(G15);

export function getEncodedBits(ecl: ErrorCorrectionLevel, mask: number): number {
  const data = (ecl.bit << 3) | mask;
  let d = data << 10;

  while (Utils.getBCHDigit(d) - G15_BCH >= 0) {
    d ^= G15 << (Utils.getBCHDigit(d) - G15_BCH);
  }

  return ((data << 10) | d) ^ G15_MASK;
}
