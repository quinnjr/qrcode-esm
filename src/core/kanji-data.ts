import type { Mode, Segment } from '../types.js';
import type { BitBuffer } from './bit-buffer.js';
import { KANJI } from './mode.js';
import * as Utils from './utils.js';

export class KanjiData implements Segment {
  public readonly mode: Mode = KANJI;
  public readonly data: string;

  public constructor(data: string) {
    this.data = data;
  }

  public static getBitsLength(length: number): number {
    return length * 13;
  }

  public getLength(): number {
    return this.data.length;
  }

  public getBitsLength(): number {
    return KanjiData.getBitsLength(this.data.length);
  }

  public write(bitBuffer: BitBuffer): void {
    for (const char of this.data) {
      let value = Utils.toSJIS(char);

      if (value >= 0x81_40 && value <= 0x9F_FC) {
        value -= 0x81_40;
      } else if (value >= 0xE0_40 && value <= 0xEB_BF) {
        value -= 0xC1_40;
      } else {
        throw new Error(
          'Invalid SJIS character: ' + char + '\n' +
          'Make sure your charset is UTF-8');
      }

      value = (((value >>> 8) & 0xFF) * 0xC0) + (value & 0xFF);
      bitBuffer.put(value, 13);
    }
  }
}
