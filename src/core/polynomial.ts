import * as GF from './galois-field.js';

type Bytes = Uint8Array<ArrayBufferLike>;

export function mul(p1: Bytes, p2: Bytes): Bytes {
  const coeff = new Uint8Array(p1.length + p2.length - 1);
  for (const [i, a] of p1.entries()) {
    for (const [j, b] of p2.entries()) {
      coeff[i + j]! ^= GF.mul(a, b);
    }
  }
  return coeff;
}

export function mod(dividend: Bytes, divisor: Bytes): Bytes {
  let result: Bytes = new Uint8Array(dividend);

  while (result.length - divisor.length >= 0) {
    const coeff = result[0]!;
    for (const [i, d] of divisor.entries()) {
      result[i]! ^= GF.mul(d, coeff);
    }

    let offset = 0;
    while (offset < result.length && result[offset] === 0) offset++;
    result = result.slice(offset);
  }

  return result;
}

export function generateECPolynomial(degree: number): Bytes {
  let poly: Bytes = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    poly = mul(poly, new Uint8Array([1, GF.exp(i)]));
  }
  return poly;
}
