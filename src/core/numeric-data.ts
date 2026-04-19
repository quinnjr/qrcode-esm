import type { Mode, Segment } from '../types.js';
import type { BitBuffer } from './bit-buffer.js';
import { NUMERIC } from './mode.js';

export class NumericData implements Segment {
  public readonly mode: Mode = NUMERIC;
  public readonly data: string;

  public constructor(data: string | number) {
    this.data = data.toString();
  }

  public static getBitsLength(length: number): number {
    return 10 * Math.floor(length / 3) + (length % 3 ? (length % 3) * 3 + 1 : 0);
  }

  public getLength(): number {
    return this.data.length;
  }

  public getBitsLength(): number {
    return NumericData.getBitsLength(this.data.length);
  }

  public write(bitBuffer: BitBuffer): void {
    let i: number;
    let group: string;
    let value: number;

    for (i = 0; i + 3 <= this.data.length; i += 3) {
      group = this.data.slice(i, i + 3);
      value = Number.parseInt(group, 10);
      bitBuffer.put(value, 10);
    }

    const remainingNum = this.data.length - i;
    if (remainingNum > 0) {
      group = this.data.slice(i);
      value = Number.parseInt(group, 10);
      bitBuffer.put(value, remainingNum * 3 + 1);
    }
  }
}
