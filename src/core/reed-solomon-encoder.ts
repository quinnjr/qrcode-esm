import * as Polynomial from './polynomial.js';

export class ReedSolomonEncoder {
  private genPoly: Uint8Array | undefined;
  private degree: number;

  public constructor(degree: number) {
    this.degree = degree;
    if (degree) this.initialize(degree);
  }

  public initialize(degree: number): void {
    this.degree = degree;
    this.genPoly = Polynomial.generateECPolynomial(degree);
  }

  public encode(data: Uint8Array): Uint8Array {
    if (!this.genPoly) throw new Error('Encoder not initialized');

    const paddedData = new Uint8Array(data.length + this.degree);
    paddedData.set(data);

    const remainder = Polynomial.mod(paddedData, this.genPoly);

    const start = this.degree - remainder.length;
    if (start > 0) {
      const buff = new Uint8Array(this.degree);
      buff.set(remainder, start);
      return buff;
    }
    return remainder;
  }
}
