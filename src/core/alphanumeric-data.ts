import type { Mode, Segment } from '../types.js';
import type { BitBuffer } from './bit-buffer.js';
import { ALPHANUMERIC } from './mode.js';

const ALPHA_NUM_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

const ALPHA_NUM_LOOKUP: Record<string, number> = {};
for (let i = 0; i < ALPHA_NUM_CHARS.length; i++) {
  ALPHA_NUM_LOOKUP[ALPHA_NUM_CHARS[i]!] = i;
}

export class AlphanumericData implements Segment {
  public readonly mode: Mode = ALPHANUMERIC;
  public readonly data: string;

  public constructor(data: string) {
    this.data = data;
  }

  public static getBitsLength(length: number): number {
    return 11 * Math.floor(length / 2) + 6 * (length % 2);
  }

  public getLength(): number {
    return this.data.length;
  }

  public getBitsLength(): number {
    return AlphanumericData.getBitsLength(this.data.length);
  }

  public write(bitBuffer: BitBuffer): void {
    let i: number;
    for (i = 0; i + 2 <= this.data.length; i += 2) {
      let value = ALPHA_NUM_LOOKUP[this.data[i]!]! * 45;
      value += ALPHA_NUM_LOOKUP[this.data[i + 1]!]!;
      bitBuffer.put(value, 11);
    }
    if (this.data.length % 2) {
      bitBuffer.put(ALPHA_NUM_LOOKUP[this.data[i]!]!, 6);
    }
  }
}
