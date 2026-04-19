export class BitMatrix {
  public readonly size: number;
  public readonly data: Uint8Array;
  public readonly reservedBit: Uint8Array;

  public constructor(size: number) {
    if (!size || size < 1) {
      throw new Error('BitMatrix size must be defined and greater than 0');
    }
    this.size = size;
    this.data = new Uint8Array(size * size);
    this.reservedBit = new Uint8Array(size * size);
  }

  public set(row: number, col: number, value: boolean | number, reserved?: boolean): void {
    const index = row * this.size + col;
    this.data[index] = value ? 1 : 0;
    if (reserved) this.reservedBit[index] = 1;
  }

  public get(row: number, col: number): number {
    return this.data[row * this.size + col]!;
  }

  public xor(row: number, col: number, value: boolean): void {
    this.data[row * this.size + col]! ^= value ? 1 : 0;
  }

  public isReserved(row: number, col: number): boolean {
    return this.reservedBit[row * this.size + col] === 1;
  }
}
