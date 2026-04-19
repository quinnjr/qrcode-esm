import { deflateSync } from 'node:zlib';

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xED_B8_83_20 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xFF_FF_FF_FF;
  for (const element of buf) {
    c = CRC_TABLE[(c ^ element) & 0xFF]! ^ (c >>> 8);
  }
  return (c ^ 0xFF_FF_FF_FF) >>> 0;
}

function writeUInt32BE(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, false);
}

function buildChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  writeUInt32BE(view, 0, data.length);
  chunk[4] = type.charCodeAt(0);
  chunk[5] = type.charCodeAt(1);
  chunk[6] = type.charCodeAt(2);
  chunk[7] = type.charCodeAt(3);
  chunk.set(data, 8);
  const crcInput = chunk.subarray(4, 8 + data.length);
  writeUInt32BE(view, 8 + data.length, crc32(crcInput));
  return chunk;
}

function buildIHDR(width: number, height: number): Uint8Array {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  writeUInt32BE(view, 0, width);
  writeUInt32BE(view, 4, height);
  data[8] = 8;  // bit depth
  data[9] = 6;  // color type RGBA
  data[10] = 0; // compression
  data[11] = 0; // filter
  data[12] = 0; // interlace
  return buildChunk('IHDR', data);
}

function buildIDAT(pixels: Uint8Array, width: number, height: number): Uint8Array {
  const bytesPerRow = width * 4;
  const raw = new Uint8Array(height * (bytesPerRow + 1));
  for (let y = 0; y < height; y++) {
    const dstOffset = y * (bytesPerRow + 1);
    raw[dstOffset] = 0; // filter byte (None)
    raw.set(pixels.subarray(y * bytesPerRow, (y + 1) * bytesPerRow), dstOffset + 1);
  }
  const compressed = deflateSync(raw);
  return buildChunk('IDAT', new Uint8Array(compressed.buffer, compressed.byteOffset, compressed.byteLength));
}

function buildIEND(): Uint8Array {
  return buildChunk('IEND', new Uint8Array(0));
}

export function encodePNG(pixels: Uint8Array, width: number, height: number): Uint8Array {
  const ihdr = buildIHDR(width, height);
  const idat = buildIDAT(pixels, width, height);
  const iend = buildIEND();

  const total = PNG_SIGNATURE.length + ihdr.length + idat.length + iend.length;
  const out = new Uint8Array(total);
  let off = 0;
  out.set(PNG_SIGNATURE, off); off += PNG_SIGNATURE.length;
  out.set(ihdr, off); off += ihdr.length;
  out.set(idat, off); off += idat.length;
  out.set(iend, off);
  return out;
}
