import type { Mode, Segment } from '../types.js';
import type { BitBuffer } from './bit-buffer.js';
import { BYTE } from './mode.js';

export class ByteData implements Segment {
  public readonly mode: Mode = BYTE;
  public readonly data: Uint8Array;

  public constructor(data: string | Uint8Array | ArrayLike<number>) {
    this.data = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  }

  public static getBitsLength(length: number): number {
    return length * 8;
  }

  public getLength(): number {
    return this.data.length;
  }

  public getBitsLength(): number {
    return ByteData.getBitsLength(this.data.length);
  }

  public write(bitBuffer: BitBuffer): void {
    for (let i = 0, l = this.data.length; i < l; i++) {
      bitBuffer.put(this.data[i]!, 8);
    }
  }
}
