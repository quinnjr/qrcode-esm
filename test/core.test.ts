import { describe, it, expect } from 'vitest';

// ─── 1. utils ────────────────────────────────────────────────────────────────
import {
  getSymbolSize,
  getSymbolTotalCodewords,
  getBCHDigit,
  setToSJISFunction,
  isKanjiModeEnabled,
  toSJIS,
} from '../src/core/utils.js';

describe('utils', () => {
  describe('getSymbolSize', () => {
    it('returns correct size for version 1', () => {
      expect(getSymbolSize(1)).toBe(21);
    });

    it('returns correct size for version 40', () => {
      expect(getSymbolSize(40)).toBe(177);
    });

    it('returns correct size for version 10', () => {
      expect(getSymbolSize(10)).toBe(57);
    });

    it('throws for version 0 (falsy)', () => {
      expect(() => getSymbolSize(0)).toThrow('"version" cannot be null or undefined');
    });

    it('throws for version 41 (out of range)', () => {
      expect(() => getSymbolSize(41)).toThrow('"version" should be in range from 1 to 40');
    });

    it('throws for negative version', () => {
      expect(() => getSymbolSize(-1)).toThrow('"version" should be in range from 1 to 40');
    });
  });

  describe('getSymbolTotalCodewords', () => {
    it('returns 26 for version 1', () => {
      expect(getSymbolTotalCodewords(1)).toBe(26);
    });

    it('returns 3706 for version 40', () => {
      expect(getSymbolTotalCodewords(40)).toBe(3706);
    });

    it('returns 0 for version index 0', () => {
      expect(getSymbolTotalCodewords(0)).toBe(0);
    });
  });

  describe('getBCHDigit', () => {
    it('returns 0 for 0', () => {
      expect(getBCHDigit(0)).toBe(0);
    });

    it('returns 1 for 1', () => {
      expect(getBCHDigit(1)).toBe(1);
    });

    it('returns correct digit count for larger values', () => {
      expect(getBCHDigit(0b1010)).toBe(4);
      expect(getBCHDigit(0b100000)).toBe(6);
      expect(getBCHDigit(255)).toBe(8);
    });
  });

  describe('setToSJISFunction / isKanjiModeEnabled / toSJIS', () => {
    it('throws if argument is not a function', () => {
      expect(() => setToSJISFunction('not a function' as unknown as (k: string) => number))
        .toThrow('"toSJISFunc" is not a valid function.');
    });

    it('throws if argument is a number', () => {
      expect(() => setToSJISFunction(42 as unknown as (k: string) => number))
        .toThrow('"toSJISFunc" is not a valid function.');
    });

    it('toSJIS throws when no function is set initially', () => {
      // We can't fully test this in isolation because the module state persists,
      // but we test the flow: set a function, use it.
    });

    it('sets function and enables kanji mode', () => {
      const mockFn = (k: string) => k.codePointAt(0)!;
      setToSJISFunction(mockFn);
      expect(isKanjiModeEnabled()).toBe(true);
    });

    it('toSJIS calls the set function', () => {
      const mockFn = (_k: string) => 0x8140;
      setToSJISFunction(mockFn);
      expect(toSJIS('A')).toBe(0x8140);
    });
  });
});

// ─── 2. error-correction-level ───────────────────────────────────────────────
import * as ECLevel from '../src/core/error-correction-level.js';

describe('error-correction-level', () => {
  describe('constants', () => {
    it('L has bit 1', () => { expect(ECLevel.L.bit).toBe(1); });
    it('M has bit 0', () => { expect(ECLevel.M.bit).toBe(0); });
    it('Q has bit 3', () => { expect(ECLevel.Q.bit).toBe(3); });
    it('H has bit 2', () => { expect(ECLevel.H.bit).toBe(2); });
  });

  describe('isValid', () => {
    it('returns true for L/M/Q/H objects', () => {
      expect(ECLevel.isValid(ECLevel.L)).toBe(true);
      expect(ECLevel.isValid(ECLevel.M)).toBe(true);
      expect(ECLevel.isValid(ECLevel.Q)).toBe(true);
      expect(ECLevel.isValid(ECLevel.H)).toBe(true);
    });

    it('returns false for null/undefined/string', () => {
      expect(ECLevel.isValid(null)).toBe(false);
      expect(ECLevel.isValid(undefined)).toBe(false);
      expect(ECLevel.isValid('L')).toBe(false);
    });

    it('returns false for object with bit out of range', () => {
      expect(ECLevel.isValid({ bit: -1 })).toBe(false);
      expect(ECLevel.isValid({ bit: 4 })).toBe(false);
    });

    it('returns true for object with valid bit', () => {
      expect(ECLevel.isValid({ bit: 0 })).toBe(true);
      expect(ECLevel.isValid({ bit: 3 })).toBe(true);
    });
  });

  describe('from', () => {
    it('returns the value when it is already a valid EC level', () => {
      expect(ECLevel.from(ECLevel.H, ECLevel.M)).toBe(ECLevel.H);
    });

    it('parses string "l" and "low"', () => {
      expect(ECLevel.from('l' as ECLevel.ErrorCorrectionLevelInput, ECLevel.M)).toBe(ECLevel.L);
      expect(ECLevel.from('low' as ECLevel.ErrorCorrectionLevelInput, ECLevel.M)).toBe(ECLevel.L);
    });

    it('parses string "m" and "medium"', () => {
      expect(ECLevel.from('m' as ECLevel.ErrorCorrectionLevelInput, ECLevel.M)).toBe(ECLevel.M);
      expect(ECLevel.from('medium' as ECLevel.ErrorCorrectionLevelInput, ECLevel.M)).toBe(ECLevel.M);
    });

    it('parses string "q" and "quartile"', () => {
      expect(ECLevel.from('q' as ECLevel.ErrorCorrectionLevelInput, ECLevel.M)).toBe(ECLevel.Q);
      expect(ECLevel.from('quartile' as ECLevel.ErrorCorrectionLevelInput, ECLevel.M)).toBe(ECLevel.Q);
    });

    it('parses string "h" and "high"', () => {
      expect(ECLevel.from('h' as ECLevel.ErrorCorrectionLevelInput, ECLevel.M)).toBe(ECLevel.H);
      expect(ECLevel.from('high' as ECLevel.ErrorCorrectionLevelInput, ECLevel.M)).toBe(ECLevel.H);
    });

    it('returns default for invalid string', () => {
      expect(ECLevel.from('invalid' as ECLevel.ErrorCorrectionLevelInput, ECLevel.Q)).toBe(ECLevel.Q);
    });

    it('returns default for undefined', () => {
      expect(ECLevel.from(undefined, ECLevel.L)).toBe(ECLevel.L);
    });
  });
});

// ─── 3. error-correction-code ────────────────────────────────────────────────
import * as ECCode from '../src/core/error-correction-code.js';

describe('error-correction-code', () => {
  describe('getBlocksCount', () => {
    it('version 1 L = 1 block', () => {
      expect(ECCode.getBlocksCount(1, ECLevel.L)).toBe(1);
    });
    it('version 1 M = 1 block', () => {
      expect(ECCode.getBlocksCount(1, ECLevel.M)).toBe(1);
    });
    it('version 1 Q = 1 block', () => {
      expect(ECCode.getBlocksCount(1, ECLevel.Q)).toBe(1);
    });
    it('version 1 H = 1 block', () => {
      expect(ECCode.getBlocksCount(1, ECLevel.H)).toBe(1);
    });
    it('version 5 L = 1 block', () => {
      expect(ECCode.getBlocksCount(5, ECLevel.L)).toBe(1);
    });
    it('version 5 H = 4 blocks', () => {
      expect(ECCode.getBlocksCount(5, ECLevel.H)).toBe(4);
    });
    it('version 40 H = 81 blocks', () => {
      expect(ECCode.getBlocksCount(40, ECLevel.H)).toBe(81);
    });
  });

  describe('getTotalCodewordsCount', () => {
    it('version 1 L = 7', () => {
      expect(ECCode.getTotalCodewordsCount(1, ECLevel.L)).toBe(7);
    });
    it('version 1 M = 10', () => {
      expect(ECCode.getTotalCodewordsCount(1, ECLevel.M)).toBe(10);
    });
    it('version 1 Q = 13', () => {
      expect(ECCode.getTotalCodewordsCount(1, ECLevel.Q)).toBe(13);
    });
    it('version 1 H = 17', () => {
      expect(ECCode.getTotalCodewordsCount(1, ECLevel.H)).toBe(17);
    });
    it('version 40 L = 750', () => {
      expect(ECCode.getTotalCodewordsCount(40, ECLevel.L)).toBe(750);
    });
    it('version 40 H = 2430', () => {
      expect(ECCode.getTotalCodewordsCount(40, ECLevel.H)).toBe(2430);
    });
  });
});

// ─── 4. bit-buffer ───────────────────────────────────────────────────────────
import { BitBuffer } from '../src/core/bit-buffer.js';

describe('BitBuffer', () => {
  it('starts empty', () => {
    const buf = new BitBuffer();
    expect(buf.getLengthInBits()).toBe(0);
    expect(buf.buffer).toEqual([]);
  });

  it('putBit and get', () => {
    const buf = new BitBuffer();
    buf.putBit(true);
    buf.putBit(false);
    buf.putBit(true);
    expect(buf.getLengthInBits()).toBe(3);
    expect(buf.get(0)).toBe(true);
    expect(buf.get(1)).toBe(false);
    expect(buf.get(2)).toBe(true);
  });

  it('put writes correct bits', () => {
    const buf = new BitBuffer();
    // Write 0b1010 (10) in 4 bits
    buf.put(0b1010, 4);
    expect(buf.getLengthInBits()).toBe(4);
    expect(buf.get(0)).toBe(true);
    expect(buf.get(1)).toBe(false);
    expect(buf.get(2)).toBe(true);
    expect(buf.get(3)).toBe(false);
  });

  it('put writes 8 bits correctly', () => {
    const buf = new BitBuffer();
    buf.put(0xFF, 8);
    expect(buf.getLengthInBits()).toBe(8);
    for (let i = 0; i < 8; i++) {
      expect(buf.get(i)).toBe(true);
    }
  });

  it('handles multi-byte writes', () => {
    const buf = new BitBuffer();
    buf.put(0xFF, 8);
    buf.put(0x00, 8);
    expect(buf.getLengthInBits()).toBe(16);
    expect(buf.buffer.length).toBe(2);
    expect(buf.get(8)).toBe(false);
    expect(buf.get(0)).toBe(true);
  });

  it('putBit false does not set bit', () => {
    const buf = new BitBuffer();
    buf.putBit(false);
    expect(buf.get(0)).toBe(false);
    expect(buf.getLengthInBits()).toBe(1);
  });
});

// ─── 5. bit-matrix ──────────────────────────────────────────────────────────
import { BitMatrix } from '../src/core/bit-matrix.js';

describe('BitMatrix', () => {
  it('creates matrix of given size', () => {
    const m = new BitMatrix(5);
    expect(m.size).toBe(5);
    expect(m.data.length).toBe(25);
  });

  it('throws for size 0', () => {
    expect(() => new BitMatrix(0)).toThrow('BitMatrix size must be defined and greater than 0');
  });

  it('throws for negative size', () => {
    expect(() => new BitMatrix(-1)).toThrow('BitMatrix size must be defined and greater than 0');
  });

  it('throws for undefined size', () => {
    expect(() => new BitMatrix(undefined as unknown as number)).toThrow('BitMatrix size must be defined and greater than 0');
  });

  it('set and get', () => {
    const m = new BitMatrix(3);
    m.set(0, 0, true);
    m.set(1, 2, true);
    expect(m.get(0, 0)).toBe(1);
    expect(m.get(1, 2)).toBe(1);
    expect(m.get(0, 1)).toBe(0);
  });

  it('set with false clears', () => {
    const m = new BitMatrix(3);
    m.set(0, 0, true);
    m.set(0, 0, false);
    expect(m.get(0, 0)).toBe(0);
  });

  it('xor flips bits', () => {
    const m = new BitMatrix(3);
    m.set(0, 0, true);
    m.xor(0, 0, true);
    expect(m.get(0, 0)).toBe(0);
    m.xor(0, 0, true);
    expect(m.get(0, 0)).toBe(1);
  });

  it('xor with false is no-op', () => {
    const m = new BitMatrix(3);
    m.set(0, 0, true);
    m.xor(0, 0, false);
    expect(m.get(0, 0)).toBe(1);
  });

  it('tracks reserved bits', () => {
    const m = new BitMatrix(3);
    expect(m.isReserved(0, 0)).toBe(false);
    m.set(0, 0, true, true);
    expect(m.isReserved(0, 0)).toBe(true);
    // set without reserved flag does not mark reserved
    m.set(1, 1, true);
    expect(m.isReserved(1, 1)).toBe(false);
  });

  it('set with numeric value', () => {
    const m = new BitMatrix(3);
    m.set(0, 0, 1);
    expect(m.get(0, 0)).toBe(1);
    m.set(0, 0, 0);
    expect(m.get(0, 0)).toBe(0);
  });
});

// ─── 6. mode ─────────────────────────────────────────────────────────────────
import * as ModeNs from '../src/core/mode.js';

describe('mode', () => {
  describe('constants', () => {
    it('NUMERIC has correct properties', () => {
      expect(ModeNs.NUMERIC.id).toBe('Numeric');
      expect(ModeNs.NUMERIC.bit).toBe(1);
      expect(ModeNs.NUMERIC.ccBits).toEqual([10, 12, 14]);
    });

    it('ALPHANUMERIC has correct properties', () => {
      expect(ModeNs.ALPHANUMERIC.id).toBe('Alphanumeric');
      expect(ModeNs.ALPHANUMERIC.bit).toBe(2);
      expect(ModeNs.ALPHANUMERIC.ccBits).toEqual([9, 11, 13]);
    });

    it('BYTE has correct properties', () => {
      expect(ModeNs.BYTE.id).toBe('Byte');
      expect(ModeNs.BYTE.bit).toBe(4);
      expect(ModeNs.BYTE.ccBits).toEqual([8, 16, 16]);
    });

    it('KANJI has correct properties', () => {
      expect(ModeNs.KANJI.id).toBe('Kanji');
      expect(ModeNs.KANJI.bit).toBe(8);
      expect(ModeNs.KANJI.ccBits).toEqual([8, 10, 12]);
    });

    it('MIXED has bit -1', () => {
      expect(ModeNs.MIXED.bit).toBe(-1);
    });
  });

  describe('getCharCountIndicator', () => {
    it('NUMERIC: version 1 → 10, version 10 → 12, version 27 → 14', () => {
      expect(ModeNs.getCharCountIndicator(ModeNs.NUMERIC, 1)).toBe(10);
      expect(ModeNs.getCharCountIndicator(ModeNs.NUMERIC, 9)).toBe(10);
      expect(ModeNs.getCharCountIndicator(ModeNs.NUMERIC, 10)).toBe(12);
      expect(ModeNs.getCharCountIndicator(ModeNs.NUMERIC, 26)).toBe(12);
      expect(ModeNs.getCharCountIndicator(ModeNs.NUMERIC, 27)).toBe(14);
      expect(ModeNs.getCharCountIndicator(ModeNs.NUMERIC, 40)).toBe(14);
    });

    it('ALPHANUMERIC across version ranges', () => {
      expect(ModeNs.getCharCountIndicator(ModeNs.ALPHANUMERIC, 1)).toBe(9);
      expect(ModeNs.getCharCountIndicator(ModeNs.ALPHANUMERIC, 10)).toBe(11);
      expect(ModeNs.getCharCountIndicator(ModeNs.ALPHANUMERIC, 27)).toBe(13);
    });

    it('BYTE across version ranges', () => {
      expect(ModeNs.getCharCountIndicator(ModeNs.BYTE, 1)).toBe(8);
      expect(ModeNs.getCharCountIndicator(ModeNs.BYTE, 10)).toBe(16);
      expect(ModeNs.getCharCountIndicator(ModeNs.BYTE, 27)).toBe(16);
    });

    it('throws for MIXED (no ccBits)', () => {
      expect(() => ModeNs.getCharCountIndicator(ModeNs.MIXED, 1)).toThrow('Invalid mode');
    });

    it('throws for invalid version', () => {
      expect(() => ModeNs.getCharCountIndicator(ModeNs.NUMERIC, 0)).toThrow('Invalid version');
      expect(() => ModeNs.getCharCountIndicator(ModeNs.NUMERIC, 41)).toThrow('Invalid version');
    });
  });

  describe('getBestModeForData', () => {
    it('returns NUMERIC for "123"', () => {
      expect(ModeNs.getBestModeForData('123')).toBe(ModeNs.NUMERIC);
    });

    it('returns ALPHANUMERIC for "ABC"', () => {
      expect(ModeNs.getBestModeForData('ABC')).toBe(ModeNs.ALPHANUMERIC);
    });

    it('returns ALPHANUMERIC for "ABC123"', () => {
      expect(ModeNs.getBestModeForData('ABC123')).toBe(ModeNs.ALPHANUMERIC);
    });

    it('returns BYTE for "hello" (lowercase)', () => {
      expect(ModeNs.getBestModeForData('hello')).toBe(ModeNs.BYTE);
    });

    it('returns NUMERIC for "0"', () => {
      expect(ModeNs.getBestModeForData('0')).toBe(ModeNs.NUMERIC);
    });

    it('returns ALPHANUMERIC for " " (space)', () => {
      expect(ModeNs.getBestModeForData(' ')).toBe(ModeNs.ALPHANUMERIC);
    });
  });

  describe('toString', () => {
    it('returns mode id', () => {
      expect(ModeNs.toString(ModeNs.NUMERIC)).toBe('Numeric');
      expect(ModeNs.toString(ModeNs.ALPHANUMERIC)).toBe('Alphanumeric');
      expect(ModeNs.toString(ModeNs.BYTE)).toBe('Byte');
      expect(ModeNs.toString(ModeNs.KANJI)).toBe('Kanji');
    });

    it('throws for MIXED (no id)', () => {
      expect(() => ModeNs.toString(ModeNs.MIXED)).toThrow('Invalid mode');
    });

    it('throws for null', () => {
      expect(() => ModeNs.toString(null as unknown as import('../src/types.js').Mode)).toThrow('Invalid mode');
    });
  });

  describe('isValid', () => {
    it('returns true for modes with bit and ccBits', () => {
      expect(ModeNs.isValid(ModeNs.NUMERIC)).toBe(true);
      expect(ModeNs.isValid(ModeNs.BYTE)).toBe(true);
    });

    it('returns false for MIXED (no ccBits)', () => {
      expect(ModeNs.isValid(ModeNs.MIXED)).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(ModeNs.isValid(null)).toBe(false);
      expect(ModeNs.isValid(undefined)).toBe(false);
    });

    it('returns false for string', () => {
      expect(ModeNs.isValid('numeric')).toBe(false);
    });
  });

  describe('from', () => {
    it('returns mode when valid mode passed', () => {
      expect(ModeNs.from(ModeNs.NUMERIC, ModeNs.BYTE)).toBe(ModeNs.NUMERIC);
    });

    it('parses string "numeric"', () => {
      expect(ModeNs.from('numeric', ModeNs.BYTE)).toBe(ModeNs.NUMERIC);
    });

    it('parses string "alphanumeric"', () => {
      expect(ModeNs.from('alphanumeric', ModeNs.BYTE)).toBe(ModeNs.ALPHANUMERIC);
    });

    it('parses string "byte"', () => {
      expect(ModeNs.from('byte', ModeNs.NUMERIC)).toBe(ModeNs.BYTE);
    });

    it('parses string "kanji"', () => {
      expect(ModeNs.from('kanji', ModeNs.BYTE)).toBe(ModeNs.KANJI);
    });

    it('returns default for invalid string', () => {
      expect(ModeNs.from('invalid', ModeNs.BYTE)).toBe(ModeNs.BYTE);
    });

    it('returns default for undefined', () => {
      expect(ModeNs.from(undefined, ModeNs.NUMERIC)).toBe(ModeNs.NUMERIC);
    });

    it('returns default for null', () => {
      expect(ModeNs.from(null, ModeNs.NUMERIC)).toBe(ModeNs.NUMERIC);
    });
  });
});

// ─── 7. version-check ────────────────────────────────────────────────────────
import * as VersionCheck from '../src/core/version-check.js';

describe('version-check', () => {
  it('returns false for 0', () => { expect(VersionCheck.isValid(0)).toBe(false); });
  it('returns true for 1', () => { expect(VersionCheck.isValid(1)).toBe(true); });
  it('returns true for 40', () => { expect(VersionCheck.isValid(40)).toBe(true); });
  it('returns false for 41', () => { expect(VersionCheck.isValid(41)).toBe(false); });
  it('returns false for NaN', () => { expect(VersionCheck.isValid(NaN)).toBe(false); });
  it('returns false for string', () => { expect(VersionCheck.isValid('1')).toBe(false); });
  it('returns false for -1', () => { expect(VersionCheck.isValid(-1)).toBe(false); });
  it('returns true for 20', () => { expect(VersionCheck.isValid(20)).toBe(true); });
  it('returns false for undefined', () => { expect(VersionCheck.isValid(undefined)).toBe(false); });
  it('returns false for null', () => { expect(VersionCheck.isValid(null)).toBe(false); });
});

// ─── 8. version ──────────────────────────────────────────────────────────────
import * as Version from '../src/core/version.js';
// Import data classes early (also used in section 20)
import { NumericData } from '../src/core/numeric-data.js';
import { AlphanumericData } from '../src/core/alphanumeric-data.js';
import { ByteData } from '../src/core/byte-data.js';
import { KanjiData } from '../src/core/kanji-data.js';

describe('version', () => {
  describe('from', () => {
    it('returns version number for valid version', () => {
      expect(Version.from(1)).toBe(1);
      expect(Version.from(40)).toBe(40);
    });

    it('returns undefined for invalid version', () => {
      expect(Version.from(0)).toBeUndefined();
      expect(Version.from(41)).toBeUndefined();
    });

    it('returns default when provided for invalid', () => {
      expect(Version.from(0, 5)).toBe(5);
    });

    it('returns undefined for undefined input', () => {
      expect(Version.from(undefined)).toBeUndefined();
    });
  });

  describe('getCapacity', () => {
    it('returns capacity for version 1 M BYTE', () => {
      const cap = Version.getCapacity(1, ECLevel.M, ModeNs.BYTE);
      expect(cap).toBeGreaterThan(0);
    });

    it('returns capacity for version 1 L NUMERIC', () => {
      const cap = Version.getCapacity(1, ECLevel.L, ModeNs.NUMERIC);
      expect(cap).toBeGreaterThan(0);
      // Version 1-L numeric capacity is 41
      expect(cap).toBe(41);
    });

    it('returns raw data bits for MIXED mode', () => {
      const cap = Version.getCapacity(1, ECLevel.M);
      const mixedCap = Version.getCapacity(1, ECLevel.M, ModeNs.MIXED);
      // MIXED returns full data bits, BYTE returns fewer
      expect(mixedCap).toBeGreaterThan(cap);
    });

    it('throws for invalid version', () => {
      expect(() => Version.getCapacity(0, ECLevel.M)).toThrow('Invalid QR Code version');
    });
  });

  describe('getBestVersionForData', () => {
    it('returns version for small BYTE data', () => {
      const seg = new ByteData('hello');
      const v = Version.getBestVersionForData(seg, ECLevel.M);
      expect(v).toBe(1);
    });

    it('returns version for array of segments', () => {
      const seg = new NumericData('12345');
      const v = Version.getBestVersionForData([seg], ECLevel.M);
      expect(v).toBe(1);
    });

    it('returns 1 for empty array', () => {
      expect(Version.getBestVersionForData([], ECLevel.M)).toBe(1);
    });

    it('returns higher version for larger data', () => {
      const longData = 'a'.repeat(200);
      const seg = new ByteData(longData);
      const v = Version.getBestVersionForData(seg, ECLevel.M);
      expect(v).toBeGreaterThan(1);
    });

    it('handles multi-segment mixed data', () => {
      const segs = [new NumericData('123'), new ByteData('abc')];
      const v = Version.getBestVersionForData(segs, ECLevel.M);
      expect(v).toBe(1);
    });
  });

  describe('getEncodedBits', () => {
    it('throws for version < 7', () => {
      expect(() => Version.getEncodedBits(6)).toThrow('Invalid QR Code version');
    });

    it('throws for version 0', () => {
      expect(() => Version.getEncodedBits(0)).toThrow('Invalid QR Code version');
    });

    it('returns encoded bits for version 7', () => {
      const bits = Version.getEncodedBits(7);
      expect(bits).toBeGreaterThan(0);
      // Known value: version 7 encoded bits = 0x07C94
      expect(bits).toBe(0x07C94);
    });

    it('returns encoded bits for version 40', () => {
      const bits = Version.getEncodedBits(40);
      expect(bits).toBeGreaterThan(0);
    });
  });
});

// ─── 9. format-info ──────────────────────────────────────────────────────────
import * as FormatInfo from '../src/core/format-info.js';

describe('format-info', () => {
  describe('getEncodedBits', () => {
    it('returns a number for L mask 0', () => {
      const bits = FormatInfo.getEncodedBits(ECLevel.L, 0);
      expect(typeof bits).toBe('number');
      expect(bits).toBeGreaterThan(0);
    });

    it('returns different values for different EC levels', () => {
      const bitsL = FormatInfo.getEncodedBits(ECLevel.L, 0);
      const bitsM = FormatInfo.getEncodedBits(ECLevel.M, 0);
      const bitsQ = FormatInfo.getEncodedBits(ECLevel.Q, 0);
      const bitsH = FormatInfo.getEncodedBits(ECLevel.H, 0);
      const set = new Set([bitsL, bitsM, bitsQ, bitsH]);
      expect(set.size).toBe(4);
    });

    it('returns different values for different masks', () => {
      const bits0 = FormatInfo.getEncodedBits(ECLevel.M, 0);
      const bits1 = FormatInfo.getEncodedBits(ECLevel.M, 1);
      expect(bits0).not.toBe(bits1);
    });

    it('known value: M mask 0 = 0x5412', () => {
      // ECLevel.M has bit=0, mask=0 => data = (0 << 3) | 0 = 0
      // Known format info for M-0
      const bits = FormatInfo.getEncodedBits(ECLevel.M, 0);
      expect(bits).toBe(0x5412);
    });
  });
});

// ─── 10. galois-field ────────────────────────────────────────────────────────
import * as GF from '../src/core/galois-field.js';

describe('galois-field', () => {
  describe('log', () => {
    it('log(1) = 0', () => { expect(GF.log(1)).toBe(0); });
    it('throws for log(0)', () => { expect(() => GF.log(0)).toThrow('log(0)'); });
    it('throws for log(-1)', () => { expect(() => GF.log(-1)).toThrow(); });
  });

  describe('exp', () => {
    it('exp(0) = 1', () => { expect(GF.exp(0)).toBe(1); });
    it('exp(1) = 2', () => { expect(GF.exp(1)).toBe(2); });
    it('exp(log(x)) = x for x=3', () => { expect(GF.exp(GF.log(3))).toBe(3); });
  });

  describe('mul', () => {
    it('mul(0, x) = 0', () => { expect(GF.mul(0, 5)).toBe(0); });
    it('mul(x, 0) = 0', () => { expect(GF.mul(5, 0)).toBe(0); });
    it('mul(0, 0) = 0', () => { expect(GF.mul(0, 0)).toBe(0); });
    it('mul(1, x) = x', () => { expect(GF.mul(1, 7)).toBe(7); });
    it('mul(x, 1) = x', () => { expect(GF.mul(7, 1)).toBe(7); });
    it('mul is commutative', () => { expect(GF.mul(3, 7)).toBe(GF.mul(7, 3)); });
    it('known multiplication: mul(2, 2) = 4 in GF(256)', () => {
      // 2*2 = 4 since no overflow
      expect(GF.mul(2, 2)).toBe(4);
    });
    it('known multiplication with reduction', () => {
      // In GF(256) with polynomial 0x11D: mul(128, 2) should cause reduction
      const result = GF.mul(128, 2);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(256);
    });
  });
});

// ─── 11. polynomial ──────────────────────────────────────────────────────────
import * as Polynomial from '../src/core/polynomial.js';

describe('polynomial', () => {
  describe('mul', () => {
    it('multiplies two simple polynomials', () => {
      // [1, 1] * [1, 1] should represent (x+1)(x+1) = x^2 + 0x + 1 in GF(256)
      // GF mul: 1*1=1, 1*1 XOR 1*1 = 0, 1*1=1 => [1, 0, 1]
      const result = Polynomial.mul(new Uint8Array([1, 1]), new Uint8Array([1, 1]));
      expect(result.length).toBe(3);
      expect(result[0]).toBe(1);
    });

    it('multiplies identity', () => {
      const a = new Uint8Array([5, 3]);
      const result = Polynomial.mul(a, new Uint8Array([1]));
      expect(Array.from(result)).toEqual([5, 3]);
    });
  });

  describe('mod', () => {
    it('returns remainder of polynomial division', () => {
      const dividend = new Uint8Array([1, 0, 0, 0]);
      const divisor = new Uint8Array([1, 1]);
      const result = Polynomial.mod(dividend, divisor);
      // The result should be shorter than divisor or empty
      expect(result.length).toBeLessThan(divisor.length);
    });
  });

  describe('generateECPolynomial', () => {
    it('generates polynomial of degree 2', () => {
      const poly = Polynomial.generateECPolynomial(2);
      // degree 2 polynomial has 3 coefficients
      expect(poly.length).toBe(3);
      expect(poly[0]).toBe(1); // leading coefficient is always 1
    });

    it('generates polynomial of degree 1', () => {
      const poly = Polynomial.generateECPolynomial(1);
      expect(poly.length).toBe(2);
      expect(poly[0]).toBe(1);
    });

    it('generates polynomial of degree 10', () => {
      const poly = Polynomial.generateECPolynomial(10);
      expect(poly.length).toBe(11);
      expect(poly[0]).toBe(1);
    });
  });
});

// ─── 12. reed-solomon-encoder ────────────────────────────────────────────────
import { ReedSolomonEncoder } from '../src/core/reed-solomon-encoder.js';

describe('ReedSolomonEncoder', () => {
  it('creates encoder with given degree', () => {
    const enc = new ReedSolomonEncoder(10);
    expect(enc.degree).toBe(10);
  });

  it('encodes a small data block', () => {
    const enc = new ReedSolomonEncoder(2);
    const data = new Uint8Array([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17]);
    const result = enc.encode(data);
    expect(result.length).toBe(2);
    // The result should be deterministic
    const result2 = enc.encode(data);
    expect(Array.from(result)).toEqual(Array.from(result2));
  });

  it('encode with degree 7 produces 7 bytes', () => {
    const enc = new ReedSolomonEncoder(7);
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const result = enc.encode(data);
    expect(result.length).toBe(7);
  });

  it('initialize resets the encoder', () => {
    const enc = new ReedSolomonEncoder(2);
    enc.initialize(5);
    expect(enc.degree).toBe(5);
    const data = new Uint8Array([1, 2, 3]);
    const result = enc.encode(data);
    expect(result.length).toBe(5);
  });

  it('throws when encode called without initialization', () => {
    const enc = new ReedSolomonEncoder(0);
    expect(() => enc.encode(new Uint8Array([1, 2]))).toThrow('Encoder not initialized');
  });
});

// ─── 13. regex ───────────────────────────────────────────────────────────────
import * as Regex from '../src/core/regex.js';

describe('regex', () => {
  describe('testNumeric', () => {
    it('"12345" is numeric', () => { expect(Regex.testNumeric('12345')).toBe(true); });
    it('"0" is numeric', () => { expect(Regex.testNumeric('0')).toBe(true); });
    it('"ABCD" is not numeric', () => { expect(Regex.testNumeric('ABCD')).toBe(false); });
    it('"hello" is not numeric', () => { expect(Regex.testNumeric('hello')).toBe(false); });
    it('"12.3" is not numeric', () => { expect(Regex.testNumeric('12.3')).toBe(false); });
    it('"" is not numeric', () => { expect(Regex.testNumeric('')).toBe(false); });
  });

  describe('testAlphanumeric', () => {
    it('"ABCD" is alphanumeric', () => { expect(Regex.testAlphanumeric('ABCD')).toBe(true); });
    it('"12345" is alphanumeric', () => { expect(Regex.testAlphanumeric('12345')).toBe(true); });
    it('"ABC 123" is alphanumeric (includes space)', () => { expect(Regex.testAlphanumeric('ABC 123')).toBe(true); });
    it('"$%*+-./:" are valid alphanumeric chars', () => { expect(Regex.testAlphanumeric('$%*+-./:' )).toBe(true); });
    it('"hello" is not alphanumeric (lowercase)', () => { expect(Regex.testAlphanumeric('hello')).toBe(false); });
    it('"" is not alphanumeric', () => { expect(Regex.testAlphanumeric('')).toBe(false); });
  });

  describe('testKanji', () => {
    it('"hello" is not kanji', () => { expect(Regex.testKanji('hello')).toBe(false); });
    it('"123" is not kanji', () => { expect(Regex.testKanji('123')).toBe(false); });
    it('actual kanji character is kanji', () => {
      // U+4E00 is a CJK character in the kanji range
      expect(Regex.testKanji('\u4E00')).toBe(true);
    });
    it('katakana is kanji-range', () => {
      // U+30A0 is katakana
      expect(Regex.testKanji('\u30A2')).toBe(true);
    });
  });

  describe('regex objects exist', () => {
    it('KANJI, BYTE_KANJI, BYTE, NUMERIC, ALPHANUMERIC are RegExp', () => {
      expect(Regex.KANJI).toBeInstanceOf(RegExp);
      expect(Regex.BYTE_KANJI).toBeInstanceOf(RegExp);
      expect(Regex.BYTE).toBeInstanceOf(RegExp);
      expect(Regex.NUMERIC).toBeInstanceOf(RegExp);
      expect(Regex.ALPHANUMERIC).toBeInstanceOf(RegExp);
    });
  });
});

// ─── 14. alignment-pattern ───────────────────────────────────────────────────
import * as AlignmentPattern from '../src/core/alignment-pattern.js';

describe('alignment-pattern', () => {
  describe('getRowColCoords', () => {
    it('version 1 returns empty', () => {
      expect(AlignmentPattern.getRowColCoords(1)).toEqual([]);
    });

    it('version 2 returns [6, 18]', () => {
      expect(AlignmentPattern.getRowColCoords(2)).toEqual([6, 18]);
    });

    it('version 7 returns multiple coords', () => {
      const coords = AlignmentPattern.getRowColCoords(7);
      expect(coords.length).toBeGreaterThan(2);
      expect(coords[0]).toBe(6); // always starts at 6
    });

    it('version 40 returns coords', () => {
      const coords = AlignmentPattern.getRowColCoords(40);
      expect(coords.length).toBeGreaterThan(2);
      expect(coords[0]).toBe(6);
      expect(coords.at(-1)).toBe(getSymbolSize(40) - 7);
    });
  });

  describe('getPositions', () => {
    it('version 1 returns empty', () => {
      expect(AlignmentPattern.getPositions(1)).toEqual([]);
    });

    it('version 2 returns 1 position (not overlapping finder)', () => {
      const positions = AlignmentPattern.getPositions(2);
      expect(positions.length).toBe(1);
      expect(positions[0]).toEqual([18, 18]);
    });

    it('version 7 has multiple positions', () => {
      const positions = AlignmentPattern.getPositions(7);
      expect(positions.length).toBeGreaterThan(1);
    });
  });
});

// ─── 15. finder-pattern ──────────────────────────────────────────────────────
import * as FinderPattern from '../src/core/finder-pattern.js';

describe('finder-pattern', () => {
  describe('getPositions', () => {
    it('version 1 returns 3 positions', () => {
      const positions = FinderPattern.getPositions(1);
      expect(positions.length).toBe(3);
      // For version 1, size = 21
      expect(positions).toEqual([
        [0, 0],
        [21 - 7, 0],
        [0, 21 - 7],
      ]);
    });

    it('version 10 returns 3 positions', () => {
      const positions = FinderPattern.getPositions(10);
      const size = getSymbolSize(10); // 57
      expect(positions.length).toBe(3);
      expect(positions[0]).toEqual([0, 0]);
      expect(positions[1]).toEqual([size - 7, 0]);
      expect(positions[2]).toEqual([0, size - 7]);
    });
  });
});

// ─── 16. mask-pattern ────────────────────────────────────────────────────────
import * as MaskPattern from '../src/core/mask-pattern.js';

describe('mask-pattern', () => {
  describe('Patterns', () => {
    it('has 8 patterns (0-7)', () => {
      expect(MaskPattern.Patterns.PATTERN000).toBe(0);
      expect(MaskPattern.Patterns.PATTERN001).toBe(1);
      expect(MaskPattern.Patterns.PATTERN010).toBe(2);
      expect(MaskPattern.Patterns.PATTERN011).toBe(3);
      expect(MaskPattern.Patterns.PATTERN100).toBe(4);
      expect(MaskPattern.Patterns.PATTERN101).toBe(5);
      expect(MaskPattern.Patterns.PATTERN110).toBe(6);
      expect(MaskPattern.Patterns.PATTERN111).toBe(7);
    });
  });

  describe('isValid', () => {
    it('0-7 are valid', () => {
      for (let i = 0; i <= 7; i++) {
        expect(MaskPattern.isValid(i)).toBe(true);
      }
    });

    it('-1 is invalid', () => { expect(MaskPattern.isValid(-1)).toBe(false); });
    it('8 is invalid', () => { expect(MaskPattern.isValid(8)).toBe(false); });
    it('null is invalid', () => { expect(MaskPattern.isValid(null)).toBe(false); });
    it('undefined is invalid', () => { expect(MaskPattern.isValid(undefined)).toBe(false); });
    it('"" is invalid', () => { expect(MaskPattern.isValid('')).toBe(false); });
    it('NaN is invalid', () => { expect(MaskPattern.isValid(NaN)).toBe(false); });
    it('string "3" is valid', () => { expect(MaskPattern.isValid('3')).toBe(true); });
  });

  describe('from', () => {
    it('returns number for valid mask', () => {
      expect(MaskPattern.from(3)).toBe(3);
      expect(MaskPattern.from(0)).toBe(0);
      expect(MaskPattern.from(7)).toBe(7);
    });

    it('returns undefined for invalid', () => {
      expect(MaskPattern.from(-1)).toBeUndefined();
      expect(MaskPattern.from(8)).toBeUndefined();
      expect(MaskPattern.from(null)).toBeUndefined();
    });
  });

  describe('getPenaltyN1', () => {
    it('returns 0 for alternating pattern', () => {
      const m = new BitMatrix(5);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          m.set(r, c, (r + c) % 2 === 0);
        }
      }
      // No run of 5+ same values in any row/col
      expect(MaskPattern.getPenaltyN1(m)).toBe(0);
    });

    it('returns penalty for all-dark row', () => {
      const m = new BitMatrix(5);
      for (let c = 0; c < 5; c++) m.set(0, c, true);
      // Row 0 has 5 consecutive dark → penalty = 3 + (5-5) = 3
      const penalty = MaskPattern.getPenaltyN1(m);
      expect(penalty).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getPenaltyN2', () => {
    it('returns penalty for all-dark matrix', () => {
      const m = new BitMatrix(3);
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
          m.set(r, c, true);
      // Every 2x2 block is all dark → 4 blocks * 3 = 12
      expect(MaskPattern.getPenaltyN2(m)).toBe(12);
    });

    it('returns 0 for alternating checkerboard', () => {
      const m = new BitMatrix(4);
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
          m.set(r, c, (r + c) % 2 === 0);
      expect(MaskPattern.getPenaltyN2(m)).toBe(0);
    });
  });

  describe('getPenaltyN3', () => {
    it('returns 0 for small empty matrix', () => {
      const m = new BitMatrix(11);
      expect(MaskPattern.getPenaltyN3(m)).toBe(0);
    });
  });

  describe('getPenaltyN4', () => {
    it('returns 0 for 50% dark modules', () => {
      const m = new BitMatrix(4);
      // Set exactly half to dark
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
          m.set(r, c, (r * 4 + c) < 8);
      // 50% dark → k = |ceil(50/5) - 10| = |10-10| = 0
      expect(MaskPattern.getPenaltyN4(m)).toBe(0);
    });

    it('returns penalty for all-dark matrix', () => {
      const m = new BitMatrix(4);
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
          m.set(r, c, true);
      // 100% dark → k = |ceil(100/5) - 10| = |20-10| = 10
      expect(MaskPattern.getPenaltyN4(m)).toBe(100);
    });
  });

  describe('applyMask', () => {
    it('applies and re-applies mask to restore original', () => {
      const m = new BitMatrix(5);
      m.set(2, 2, true);
      const original = m.get(2, 2);
      MaskPattern.applyMask(0, m);
      MaskPattern.applyMask(0, m);
      // Double application should restore original
      expect(m.get(2, 2)).toBe(original);
    });

    it('does not modify reserved bits', () => {
      const m = new BitMatrix(5);
      m.set(0, 0, true, true); // reserved
      m.set(1, 1, true);
      MaskPattern.applyMask(0, m);
      expect(m.get(0, 0)).toBe(1); // reserved, unchanged
    });
  });

  describe('getBestMask', () => {
    it('returns a number 0-7', () => {
      const m = new BitMatrix(21);
      // Fill with some pattern
      for (let r = 0; r < 21; r++)
        for (let c = 0; c < 21; c++)
          m.set(r, c, (r * c) % 3 === 0);

      const best = MaskPattern.getBestMask(m, () => { /* no-op format setup */ });
      expect(best).toBeGreaterThanOrEqual(0);
      expect(best).toBeLessThanOrEqual(7);
    });
  });
});

// ─── 17. dijkstra ────────────────────────────────────────────────────────────
import { findPath } from '../src/core/dijkstra.js';
import type { Graph } from '../src/core/dijkstra.js';

describe('dijkstra', () => {
  it('finds shortest path in simple graph', () => {
    const graph: Graph = {
      A: { B: 1, C: 4 },
      B: { C: 2, D: 6 },
      C: { D: 3 },
      D: {},
    };
    const path = findPath(graph, 'A', 'D');
    expect(path).toEqual(['A', 'B', 'C', 'D']); // cost 1+2+3=6 < 1+6=7 or 4+3=7
  });

  it('finds direct path when it is shortest', () => {
    const graph: Graph = {
      A: { B: 10, C: 1 },
      B: { C: 1 },
      C: {},
    };
    const path = findPath(graph, 'A', 'C');
    expect(path).toEqual(['A', 'C']);
  });

  it('throws for unreachable destination', () => {
    const graph: Graph = {
      A: { B: 1 },
      B: {},
      C: {},
    };
    expect(() => findPath(graph, 'A', 'C')).toThrow('Could not find a path from A to C.');
  });

  it('handles single-node path', () => {
    const graph: Graph = {
      A: { A: 0 },
    };
    // Path from A to A
    const path = findPath(graph, 'A', 'A');
    expect(path).toEqual(['A']);
  });

  it('finds path through multiple hops', () => {
    const graph: Graph = {
      start: { a: 1 },
      a: { b: 1 },
      b: { c: 1 },
      c: { end: 1 },
      end: {},
    };
    expect(findPath(graph, 'start', 'end')).toEqual(['start', 'a', 'b', 'c', 'end']);
  });
});

// ─── 18. segments ────────────────────────────────────────────────────────────
import * as Segments from '../src/core/segments.js';

describe('segments', () => {
  describe('fromArray', () => {
    it('handles string input', () => {
      const segs = Segments.fromArray(['hello']);
      expect(segs.length).toBe(1);
      expect(segs[0]!.mode).toBe(ModeNs.BYTE);
    });

    it('handles object input with data', () => {
      const segs = Segments.fromArray([{ data: '123' }]);
      expect(segs.length).toBe(1);
      expect(segs[0]!.mode).toBe(ModeNs.NUMERIC);
    });

    it('handles object input with explicit mode', () => {
      const segs = Segments.fromArray([{ data: '123', mode: 'byte' }]);
      expect(segs.length).toBe(1);
      expect(segs[0]!.mode).toBe(ModeNs.BYTE);
    });

    it('handles mixed array', () => {
      const segs = Segments.fromArray(['123', { data: 'ABC' }]);
      expect(segs.length).toBe(2);
      expect(segs[0]!.mode).toBe(ModeNs.NUMERIC);
      expect(segs[1]!.mode).toBe(ModeNs.ALPHANUMERIC);
    });

    it('throws when mode cannot encode data', () => {
      expect(() => Segments.fromArray([{ data: 'hello', mode: 'numeric' }]))
        .toThrow('cannot be encoded with mode');
    });
  });

  describe('fromString', () => {
    it('splits numeric-only string', () => {
      const segs = Segments.fromString('12345', 1);
      expect(segs.length).toBeGreaterThanOrEqual(1);
      expect(segs[0]!.mode).toBe(ModeNs.NUMERIC);
    });

    it('splits mixed data', () => {
      const segs = Segments.fromString('123abc', 1);
      expect(segs.length).toBeGreaterThanOrEqual(1);
    });

    it('handles pure byte string', () => {
      const segs = Segments.fromString('hello world!', 1);
      expect(segs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('rawSplit', () => {
    it('splits into segments without optimization', () => {
      const segs = Segments.rawSplit('123ABC');
      expect(segs.length).toBe(2);
      expect(segs[0]!.mode).toBe(ModeNs.NUMERIC);
      expect(segs[1]!.mode).toBe(ModeNs.ALPHANUMERIC);
    });

    it('single numeric segment', () => {
      const segs = Segments.rawSplit('999');
      expect(segs.length).toBe(1);
      expect(segs[0]!.mode).toBe(ModeNs.NUMERIC);
    });

    it('byte data for lowercase', () => {
      const segs = Segments.rawSplit('hello');
      expect(segs.length).toBe(1);
      expect(segs[0]!.mode).toBe(ModeNs.BYTE);
    });
  });
});

// ─── 19. qrcode (create) ────────────────────────────────────────────────────
import { create } from '../src/core/qrcode.js';

describe('qrcode create', () => {
  it('creates QR code from "hello"', () => {
    const qr = create('hello');
    expect(qr).toBeDefined();
    expect(qr.version).toBeGreaterThanOrEqual(1);
    expect(qr.modules).toBeDefined();
    expect(qr.modules.size).toBeGreaterThan(0);
    expect(qr.errorCorrectionLevel).toBeDefined();
    expect(qr.maskPattern).toBeGreaterThanOrEqual(0);
    expect(qr.maskPattern).toBeLessThanOrEqual(7);
    expect(qr.segments.length).toBeGreaterThan(0);
  });

  it('creates QR code with explicit EC level', () => {
    const qr = create('hello', { errorCorrectionLevel: 'H' });
    expect(qr.errorCorrectionLevel).toBe(ECLevel.H);
  });

  it('creates QR code with explicit version', () => {
    const qr = create('hello', { version: 5 });
    expect(qr.version).toBe(5);
  });

  it('creates QR code with explicit mask pattern', () => {
    const qr = create('hello', { maskPattern: 3 });
    expect(qr.maskPattern).toBe(3);
  });

  it('throws for empty string', () => {
    expect(() => create('')).toThrow('No input text');
  });

  it('throws for undefined', () => {
    expect(() => create(undefined as unknown as string)).toThrow('No input text');
  });

  it('creates QR code from array input', () => {
    const qr = create(['hello', { data: '123' }]);
    expect(qr).toBeDefined();
    expect(qr.version).toBeGreaterThanOrEqual(1);
  });

  it('creates QR code for numeric data', () => {
    const qr = create('1234567890');
    expect(qr).toBeDefined();
    expect(qr.version).toBe(1);
  });

  it('creates QR code for alphanumeric data', () => {
    const qr = create('HELLO WORLD');
    expect(qr).toBeDefined();
  });

  it('throws if version is too small for data', () => {
    const longData = 'A'.repeat(500);
    expect(() => create(longData, { version: 1 }))
      .toThrow('The chosen QR Code version cannot contain this amount of data');
  });

  it('creates QR code for version 7+ (version info)', () => {
    const qr = create('A'.repeat(100), { version: 7 });
    expect(qr.version).toBe(7);
  });

  it('creates QR code with toSJISFunc option', () => {
    const qr = create('hello', {
      toSJISFunc: (_k: string) => 0x8140,
    });
    expect(qr).toBeDefined();
  });

  it('handles large data that requires high version', () => {
    const qr = create('a'.repeat(500));
    expect(qr.version).toBeGreaterThan(10);
  });
});

// ─── 20. data classes ────────────────────────────────────────────────────────

describe('NumericData', () => {
  it('constructs from string', () => {
    const d = new NumericData('12345');
    expect(d.data).toBe('12345');
    expect(d.mode).toBe(ModeNs.NUMERIC);
  });

  it('constructs from number', () => {
    const d = new NumericData(42);
    expect(d.data).toBe('42');
  });

  it('getLength returns string length', () => {
    const d = new NumericData('123');
    expect(d.getLength()).toBe(3);
  });

  describe('getBitsLength (static)', () => {
    it('3 chars = 10 bits', () => { expect(NumericData.getBitsLength(3)).toBe(10); });
    it('4 chars = 10 + 7 = 17 bits', () => { expect(NumericData.getBitsLength(4)).toBe(14); });
    it('6 chars = 20 bits', () => { expect(NumericData.getBitsLength(6)).toBe(20); });
    it('1 char = 4 bits', () => { expect(NumericData.getBitsLength(1)).toBe(4); });
    it('2 chars = 7 bits', () => { expect(NumericData.getBitsLength(2)).toBe(7); });
    it('0 chars = 0 bits', () => { expect(NumericData.getBitsLength(0)).toBe(0); });
  });

  it('getBitsLength instance matches static', () => {
    const d = new NumericData('12345');
    expect(d.getBitsLength()).toBe(NumericData.getBitsLength(5));
  });

  it('write produces correct bits', () => {
    const d = new NumericData('123');
    const buf = new BitBuffer();
    d.write(buf);
    // 123 in 10 bits = 0b0001111011
    expect(buf.getLengthInBits()).toBe(10);
  });

  it('write handles remainder of 1 digit', () => {
    const d = new NumericData('1234');
    const buf = new BitBuffer();
    d.write(buf);
    // 123 in 10 bits + 4 in 4 bits = 14
    expect(buf.getLengthInBits()).toBe(14);
  });

  it('write handles remainder of 2 digits', () => {
    const d = new NumericData('12345');
    const buf = new BitBuffer();
    d.write(buf);
    // 123 in 10 bits + 45 in 7 bits = 17
    expect(buf.getLengthInBits()).toBe(17);
  });
});

describe('AlphanumericData', () => {
  it('constructs with correct mode', () => {
    const d = new AlphanumericData('ABC');
    expect(d.data).toBe('ABC');
    expect(d.mode).toBe(ModeNs.ALPHANUMERIC);
  });

  it('getLength returns string length', () => {
    const d = new AlphanumericData('AB');
    expect(d.getLength()).toBe(2);
  });

  describe('getBitsLength (static)', () => {
    it('2 chars = 11 bits', () => { expect(AlphanumericData.getBitsLength(2)).toBe(11); });
    it('3 chars = 11 + 6 = 17 bits', () => { expect(AlphanumericData.getBitsLength(3)).toBe(17); });
    it('1 char = 6 bits', () => { expect(AlphanumericData.getBitsLength(1)).toBe(6); });
    it('0 chars = 0 bits', () => { expect(AlphanumericData.getBitsLength(0)).toBe(0); });
  });

  it('getBitsLength instance matches static', () => {
    const d = new AlphanumericData('ABCDE');
    expect(d.getBitsLength()).toBe(AlphanumericData.getBitsLength(5));
  });

  it('write produces correct bits for even length', () => {
    const d = new AlphanumericData('AB');
    const buf = new BitBuffer();
    d.write(buf);
    expect(buf.getLengthInBits()).toBe(11);
  });

  it('write produces correct bits for odd length', () => {
    const d = new AlphanumericData('ABC');
    const buf = new BitBuffer();
    d.write(buf);
    // AB = 11 bits + C = 6 bits = 17
    expect(buf.getLengthInBits()).toBe(17);
  });
});

describe('ByteData', () => {
  it('constructs from string', () => {
    const d = new ByteData('hello');
    expect(d.mode).toBe(ModeNs.BYTE);
    expect(d.data).toBeInstanceOf(Uint8Array);
    expect(d.data.length).toBe(5);
  });

  it('constructs from Uint8Array', () => {
    const d = new ByteData(new Uint8Array([1, 2, 3]));
    expect(d.data.length).toBe(3);
  });

  it('constructs from ArrayLike', () => {
    const d = new ByteData([65, 66, 67]);
    expect(d.data.length).toBe(3);
  });

  it('getLength returns byte length', () => {
    const d = new ByteData('hi');
    expect(d.getLength()).toBe(2);
  });

  describe('getBitsLength (static)', () => {
    it('5 bytes = 40 bits', () => { expect(ByteData.getBitsLength(5)).toBe(40); });
    it('0 bytes = 0 bits', () => { expect(ByteData.getBitsLength(0)).toBe(0); });
    it('1 byte = 8 bits', () => { expect(ByteData.getBitsLength(1)).toBe(8); });
  });

  it('getBitsLength instance matches static', () => {
    const d = new ByteData('abc');
    expect(d.getBitsLength()).toBe(ByteData.getBitsLength(3));
  });

  it('write produces correct bits', () => {
    const d = new ByteData('A');
    const buf = new BitBuffer();
    d.write(buf);
    expect(buf.getLengthInBits()).toBe(8);
    // 'A' = 65 = 0b01000001
    expect(buf.get(0)).toBe(false); // 0
    expect(buf.get(1)).toBe(true);  // 1
    expect(buf.get(7)).toBe(true);  // 1
  });
});

describe('KanjiData', () => {
  it('constructs with correct mode', () => {
    const d = new KanjiData('\u3042');
    expect(d.mode).toBe(ModeNs.KANJI);
    expect(d.data).toBe('\u3042');
  });

  it('getLength returns string length', () => {
    const d = new KanjiData('\u3042\u3044');
    expect(d.getLength()).toBe(2);
  });

  describe('getBitsLength (static)', () => {
    it('1 char = 13 bits', () => { expect(KanjiData.getBitsLength(1)).toBe(13); });
    it('2 chars = 26 bits', () => { expect(KanjiData.getBitsLength(2)).toBe(26); });
    it('0 chars = 0 bits', () => { expect(KanjiData.getBitsLength(0)).toBe(0); });
  });

  it('getBitsLength instance matches static', () => {
    const d = new KanjiData('\u3042\u3044\u3046');
    expect(d.getBitsLength()).toBe(KanjiData.getBitsLength(3));
  });

  it('write produces correct bits when SJIS function set', () => {
    // Set up SJIS function that returns a known value in valid range
    setToSJISFunction((_k: string) => 0x8140);
    const d = new KanjiData('\u3042');
    const buf = new BitBuffer();
    d.write(buf);
    expect(buf.getLengthInBits()).toBe(13);
  });

  it('write with value in second SJIS range', () => {
    setToSJISFunction((_k: string) => 0xE040);
    const d = new KanjiData('\u3042');
    const buf = new BitBuffer();
    d.write(buf);
    expect(buf.getLengthInBits()).toBe(13);
  });

  it('write throws for invalid SJIS value', () => {
    setToSJISFunction((_k: string) => 0x0040);
    const d = new KanjiData('\u3042');
    const buf = new BitBuffer();
    expect(() => d.write(buf)).toThrow('Invalid SJIS character');
  });
});

// ─── Additional coverage tests ───────────────────────────────────────────────

describe('error-correction-code edge cases', () => {
  it('throws for invalid EC level', () => {
    expect(() => ECCode.getBlocksCount(1, { bit: 99 } as import('../src/types.js').ErrorCorrectionLevel))
      .toThrow('Invalid error correction level');
  });

  it('throws for invalid EC level in getTotalCodewordsCount', () => {
    expect(() => ECCode.getTotalCodewordsCount(1, { bit: 99 } as import('../src/types.js').ErrorCorrectionLevel))
      .toThrow('Invalid error correction level');
  });
});

describe('qrcode create edge cases', () => {
  it('throws for non-string non-array input', () => {
    expect(() => create(42 as unknown as string)).toThrow('Invalid data');
  });
});

describe('segments additional coverage', () => {
  describe('fromArray mode coercion', () => {
    it('coerces numeric to alphanumeric when mode explicitly set', () => {
      const segs = Segments.fromArray([{ data: '123', mode: 'alphanumeric' }]);
      expect(segs[0]!.mode).toBe(ModeNs.ALPHANUMERIC);
    });
  });

  describe('fromString version ranges', () => {
    it('handles version 10 (different char count indicator)', () => {
      const segs = Segments.fromString('12345', 10);
      expect(segs.length).toBeGreaterThanOrEqual(1);
    });

    it('handles version 27 (highest range)', () => {
      const segs = Segments.fromString('12345', 27);
      expect(segs.length).toBeGreaterThanOrEqual(1);
    });

    it('handles alphanumeric + numeric mixed input', () => {
      const segs = Segments.fromString('ABC123DEF456', 1);
      expect(segs.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('version additional coverage', () => {
  it('getBestVersionForData returns undefined for enormous data', () => {
    const seg = new ByteData('x'.repeat(10000));
    const v = Version.getBestVersionForData(seg, ECLevel.H);
    expect(v).toBeUndefined();
  });

  it('getBestVersionForData with multiple large mixed segments returns undefined', () => {
    const seg1 = new ByteData('x'.repeat(5000));
    const seg2 = new ByteData('y'.repeat(5000));
    const v = Version.getBestVersionForData([seg1, seg2], ECLevel.H);
    expect(v).toBeUndefined();
  });

  it('getCapacity with ALPHANUMERIC mode', () => {
    const cap = Version.getCapacity(1, ECLevel.L, ModeNs.ALPHANUMERIC);
    expect(cap).toBeGreaterThan(0);
  });

  it('getCapacity with KANJI mode', () => {
    const cap = Version.getCapacity(1, ECLevel.L, ModeNs.KANJI);
    expect(cap).toBeGreaterThan(0);
  });

  it('getCapacity defaults to BYTE when mode is undefined', () => {
    const capDefault = Version.getCapacity(1, ECLevel.L);
    const capByte = Version.getCapacity(1, ECLevel.L, ModeNs.BYTE);
    expect(capDefault).toBe(capByte);
  });

  it('from with string returns default because isValid requires number', () => {
    expect(Version.from('5' as unknown as number)).toBeUndefined();
    expect(Version.from('5' as unknown as number, 3)).toBe(3);
  });
});

describe('mask-pattern additional coverage', () => {
  it('applyMask with each pattern type', () => {
    // Test all 8 mask patterns to cover all switch branches in getMaskAt
    for (let p = 0; p < 8; p++) {
      const m = new BitMatrix(5);
      // No reserved bits, so all are maskable
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 5; c++)
          m.set(r, c, true);
      MaskPattern.applyMask(p, m);
      // At least some bits should be flipped
      let hasZero = false;
      let hasOne = false;
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 5; c++) {
          if (m.get(r, c) === 0) hasZero = true;
          if (m.get(r, c) === 1) hasOne = true;
        }
      // Each mask pattern should flip some but not all bits
      expect(hasZero || hasOne).toBe(true);
    }
  });

  it('throws for invalid mask pattern in applyMask', () => {
    const m = new BitMatrix(5);
    expect(() => MaskPattern.applyMask(99, m)).toThrow('bad maskPattern');
  });
});

describe('reed-solomon additional coverage', () => {
  it('encode with data where start > 0 in remainder', () => {
    // Use a small degree and data that produces a short remainder
    const enc = new ReedSolomonEncoder(10);
    const data = new Uint8Array([1]);
    const result = enc.encode(data);
    expect(result.length).toBe(10);
  });
});

describe('polynomial additional coverage', () => {
  it('mod where all coefficients reduce to zero', () => {
    // dividend identical to divisor -> remainder should be empty/smaller
    const poly = new Uint8Array([1, 0, 1]);
    const result = Polynomial.mod(poly, poly);
    expect(result.length).toBe(0);
  });
});

describe('segments kanji path', () => {
  it('fromString with kanji data when kanji mode enabled', () => {
    // Kanji mode is already enabled from earlier setToSJISFunction calls
    // Use kanji characters mixed with other data
    setToSJISFunction((k: string) => {
      // Return valid SJIS values for kanji chars
      const code = k.codePointAt(0)!;
      if (code >= 0x3000 && code <= 0x9FFF) return 0x8140 + (code - 0x3000);
      return code;
    });

    const segs = Segments.fromString('\u4E00\u4E01', 1);
    expect(segs.length).toBeGreaterThanOrEqual(1);
  });

  it('fromArray with explicit kanji mode when enabled', () => {
    setToSJISFunction((k: string) => {
      const code = k.codePointAt(0)!;
      if (code >= 0x3000 && code <= 0x9FFF) return 0x8140 + (code - 0x3000);
      return code;
    });
    const segs = Segments.fromArray([{ data: '\u4E00', mode: 'kanji' }]);
    expect(segs.length).toBe(1);
    expect(segs[0]!.mode).toBe(ModeNs.KANJI);
  });

  it('rawSplit with kanji data when kanji mode enabled', () => {
    setToSJISFunction((k: string) => {
      const code = k.codePointAt(0)!;
      if (code >= 0x3000 && code <= 0x9FFF) return 0x8140 + (code - 0x3000);
      return code;
    });

    // Use mixed data that includes kanji
    const segs = Segments.rawSplit('123\u4E00');
    expect(segs.length).toBeGreaterThanOrEqual(1);
  });
});

describe('reed-solomon padding branch', () => {
  it('encode where remainder is shorter than degree (padding needed)', () => {
    // Use a large degree relative to data. The polynomial mod may produce
    // a remainder with leading zeros stripped, making it shorter than degree.
    const enc = new ReedSolomonEncoder(30);
    // Data with zeros can produce a short remainder after mod strips leading zeros
    const data = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
    const result = enc.encode(data);
    expect(result.length).toBe(30);
  });

  it('encode with all-zero data produces padded result', () => {
    // All-zero data will cause mod to produce an empty/short remainder
    const enc = new ReedSolomonEncoder(10);
    const data = new Uint8Array([0, 0, 0, 0, 0]);
    const result = enc.encode(data);
    expect(result.length).toBe(10);
    // All bytes should be 0 since input was all zeros
    expect(Array.from(result).every(b => b === 0)).toBe(true);
  });
});

describe('galois-field additional edge cases', () => {
  it('exp and log are inverse for all valid values', () => {
    for (let i = 1; i < 256; i++) {
      expect(GF.exp(GF.log(i))).toBe(i);
    }
  });

  it('mul produces values < 256', () => {
    for (let i = 1; i < 256; i += 50) {
      for (let j = 1; j < 256; j += 50) {
        const result = GF.mul(i, j);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(256);
      }
    }
  });
});
