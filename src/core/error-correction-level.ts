import type { ErrorCorrectionLevel, ErrorCorrectionLevelInput } from '../types.js';

export const L: ErrorCorrectionLevel = { bit: 1 };
export const M: ErrorCorrectionLevel = { bit: 0 };
export const Q: ErrorCorrectionLevel = { bit: 3 };
export const H: ErrorCorrectionLevel = { bit: 2 };

function fromString(s: string): ErrorCorrectionLevel {
  const lc = s.toLowerCase();
  switch (lc) {
    case 'l': case 'low': { return L;
 }
    case 'm': case 'medium': { return M;
 }
    case 'q': case 'quartile': { return Q;
 }
    case 'h': case 'high': { return H;
 }
    default: { throw new Error('Unknown EC Level: ' + s);
    }
  }
}

export function isValid(level: unknown): level is ErrorCorrectionLevel {
  return !!level && (level as ErrorCorrectionLevel).bit !== undefined &&
    (level as ErrorCorrectionLevel).bit >= 0 && (level as ErrorCorrectionLevel).bit < 4;
}

export function from(value: ErrorCorrectionLevelInput | undefined, defaultValue: ErrorCorrectionLevel): ErrorCorrectionLevel {
  if (isValid(value)) return value;
  if (typeof value === 'string') {
    try { return fromString(value); } catch { return defaultValue; }
  }
  return defaultValue;
}
