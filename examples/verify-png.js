import * as ours from '../dist/qrcode.node.js';
import upstream from 'qrcode';
import { PNG } from 'pngjs';

const inputs = ['hello', 'https://example.com', '12345', 'HELLO WORLD'];

function decode(buf) {
  const png = PNG.sync.read(Buffer.from(buf));
  return { width: png.width, height: png.height, data: png.data };
}

let failures = 0;
for (const input of inputs) {
  const [o, u] = await Promise.all([
    ours.toBuffer(input, { type: 'png' }),
    upstream.toBuffer(input, { type: 'png' }),
  ]);
  const oDec = decode(o);
  const uDec = decode(u);

  const sameDim = oDec.width === uDec.width && oDec.height === uDec.height;
  const samePixels = sameDim && Buffer.compare(oDec.data, uDec.data) === 0;
  if (!samePixels) failures++;

  console.log(`[${samePixels ? 'OK' : 'FAIL'}] "${input}"  ours=${oDec.width}x${oDec.height} (${o.length}B)  upstream=${uDec.width}x${uDec.height} (${u.length}B)`);
}

console.log(`\n${failures} pixel failures`);
process.exit(failures ? 1 : 0);
