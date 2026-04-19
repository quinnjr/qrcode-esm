import type { ErrorCorrectionLevel, QRData, QRInput, QRCodeOptions, Segment } from '../types.js';
import * as Utils from './utils.js';
import * as ECLevel from './error-correction-level.js';
import { BitBuffer } from './bit-buffer.js';
import { BitMatrix } from './bit-matrix.js';
import * as AlignmentPattern from './alignment-pattern.js';
import * as FinderPattern from './finder-pattern.js';
import * as MaskPattern from './mask-pattern.js';
import * as ECCode from './error-correction-code.js';
import { ReedSolomonEncoder } from './reed-solomon-encoder.js';
import * as Version from './version.js';
import * as FormatInfo from './format-info.js';
import * as Mode from './mode.js';
import * as Segments from './segments.js';

function setupFinderPattern(matrix: BitMatrix, version: number): void {
  const size = matrix.size;
  const pos = FinderPattern.getPositions(version);

  for (const [row, col] of pos) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || size <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || size <= col + c) continue;
        if ((r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          matrix.set(row + r, col + c, true, true);
        } else {
          matrix.set(row + r, col + c, false, true);
        }
      }
    }
  }
}

function setupTimingPattern(matrix: BitMatrix): void {
  const size = matrix.size;
  for (let r = 8; r < size - 8; r++) {
    const value = r % 2 === 0;
    matrix.set(r, 6, value, true);
    matrix.set(6, r, value, true);
  }
}

function setupAlignmentPattern(matrix: BitMatrix, version: number): void {
  const pos = AlignmentPattern.getPositions(version);
  for (const [row, col] of pos) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
          matrix.set(row + r, col + c, true, true);
        } else {
          matrix.set(row + r, col + c, false, true);
        }
      }
    }
  }
}

function setupVersionInfo(matrix: BitMatrix, version: number): void {
  const size = matrix.size;
  const bits = Version.getEncodedBits(version);

  for (let i = 0; i < 18; i++) {
    const row = Math.floor(i / 3);
    const col = (i % 3) + size - 8 - 3;
    const mod = ((bits >> i) & 1) === 1;
    matrix.set(row, col, mod, true);
    matrix.set(col, row, mod, true);
  }
}

function setupFormatInfo(matrix: BitMatrix, ecl: ErrorCorrectionLevel, maskPattern: number): void {
  const size = matrix.size;
  const bits = FormatInfo.getEncodedBits(ecl, maskPattern);

  for (let i = 0; i < 15; i++) {
    const mod = ((bits >> i) & 1) === 1;

    if (i < 6) matrix.set(i, 8, mod, true);
    else if (i < 8) matrix.set(i + 1, 8, mod, true);
    else matrix.set(size - 15 + i, 8, mod, true);

    if (i < 8) matrix.set(8, size - i - 1, mod, true);
    else if (i < 9) matrix.set(8, 15 - i - 1 + 1, mod, true);
    else matrix.set(8, 15 - i - 1, mod, true);
  }

  matrix.set(size - 8, 8, 1, true);
}

function setupData(matrix: BitMatrix, data: Uint8Array): void {
  const size = matrix.size;
  let inc = -1;
  let row = size - 1;
  let bitIndex = 7;
  let byteIndex = 0;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;

    while (true) {
      for (let c = 0; c < 2; c++) {
        if (!matrix.isReserved(row, col - c)) {
          let dark = false;
          if (byteIndex < data.length) {
            dark = (((data[byteIndex]! >>> bitIndex) & 1) === 1);
          }
          matrix.set(row, col - c, dark);
          bitIndex--;
          if (bitIndex === -1) {
            byteIndex++;
            bitIndex = 7;
          }
        }
      }

      row += inc;
      if (row < 0 || size <= row) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }
}

function createData(version: number, ecl: ErrorCorrectionLevel, segments: Segment[]): Uint8Array {
  const buffer = new BitBuffer();

  for (const data of segments) {
    buffer.put(data.mode.bit, 4);
    buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version));
    data.write(buffer);
  }

  const totalCodewords = Utils.getSymbolTotalCodewords(version);
  const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, ecl);
  const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;

  if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
    buffer.put(0, 4);
  }

  while (buffer.getLengthInBits() % 8 !== 0) {
    buffer.putBit(false);
  }

  const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
  for (let i = 0; i < remainingByte; i++) {
    buffer.put(i % 2 ? 0x11 : 0xEC, 8);
  }

  return createCodewords(buffer, version, ecl);
}

function createCodewords(bitBuffer: BitBuffer, version: number, ecl: ErrorCorrectionLevel): Uint8Array {
  const totalCodewords = Utils.getSymbolTotalCodewords(version);
  const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, ecl);
  const dataTotalCodewords = totalCodewords - ecTotalCodewords;
  const ecTotalBlocks = ECCode.getBlocksCount(version, ecl);

  const blocksInGroup2 = totalCodewords % ecTotalBlocks;
  const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
  const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
  const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
  const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
  const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;

  const rs = new ReedSolomonEncoder(ecCount);

  let offset = 0;
  const dcData: Uint8Array[] = Array.from({ length: ecTotalBlocks });
  const ecData: Uint8Array[] = Array.from({ length: ecTotalBlocks });
  let maxDataSize = 0;
  const buffer = new Uint8Array(bitBuffer.buffer);

  for (let b = 0; b < ecTotalBlocks; b++) {
    const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
    dcData[b] = buffer.slice(offset, offset + dataSize);
    ecData[b] = rs.encode(dcData[b]!);
    offset += dataSize;
    maxDataSize = Math.max(maxDataSize, dataSize);
  }

  const data = new Uint8Array(totalCodewords);
  let index = 0;

  for (let i = 0; i < maxDataSize; i++) {
    for (let r = 0; r < ecTotalBlocks; r++) {
      if (i < dcData[r]!.length) {
        data[index++] = dcData[r]![i]!;
      }
    }
  }

  for (let i = 0; i < ecCount; i++) {
    for (let r = 0; r < ecTotalBlocks; r++) {
      data[index++] = ecData[r]![i]!;
    }
  }

  return data;
}

function createSymbol(data: QRInput, version: number | undefined, ecl: ErrorCorrectionLevel, maskPattern: number | undefined): QRData {
  let segments: Segment[];

  if (Array.isArray(data)) {
    segments = Segments.fromArray(data);
  } else if (typeof data === 'string') {
    let estimatedVersion = version;
    if (!estimatedVersion) {
      const rawSegments = Segments.rawSplit(data);
      estimatedVersion = Version.getBestVersionForData(rawSegments, ecl);
    }
    segments = Segments.fromString(data, estimatedVersion ?? 40);
  } else {
    throw new TypeError('Invalid data');
  }

  const bestVersion = Version.getBestVersionForData(segments, ecl);
  if (!bestVersion) {
    throw new Error('The amount of data is too big to be stored in a QR Code');
  }

  if (!version) {
    version = bestVersion;
  } else if (version < bestVersion) {
    throw new Error(
      '\nThe chosen QR Code version cannot contain this amount of data.\n' +
      'Minimum version required to store current data is: ' + bestVersion + '.\n',
    );
  }

  const dataBits = createData(version, ecl, segments);

  const moduleCount = Utils.getSymbolSize(version);
  const modules = new BitMatrix(moduleCount);

  setupFinderPattern(modules, version);
  setupTimingPattern(modules);
  setupAlignmentPattern(modules, version);

  setupFormatInfo(modules, ecl, 0);

  if (version >= 7) setupVersionInfo(modules, version);

  setupData(modules, dataBits);

  const mask: number = maskPattern === undefined || Number.isNaN(maskPattern)
    ? MaskPattern.getBestMask(modules, (p) => { setupFormatInfo(modules, ecl, p); })
    : maskPattern;

  MaskPattern.applyMask(mask, modules);
  setupFormatInfo(modules, ecl, mask);

  return {
    modules,
    version,
    errorCorrectionLevel: ecl,
    maskPattern: mask,
    segments,
  };
}

export function create(data: QRInput, options?: QRCodeOptions): QRData {
  if (data === undefined || data === '') {
    throw new Error('No input text');
  }

  let ecl: ErrorCorrectionLevel = ECLevel.M;
  let version: number | undefined;
  let mask: number | undefined;

  if (options !== undefined) {
    ecl = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
    version = Version.from(options.version);
    mask = MaskPattern.from(options.maskPattern);

    if (options.toSJISFunc) {
      Utils.setToSJISFunction(options.toSJISFunc);
    }
  }

  return createSymbol(data, version, ecl, mask);
}
