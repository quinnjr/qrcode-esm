import * as ours from '../dist/qrcode.node.js';
import upstream from 'qrcode';
import { createHash } from 'node:crypto';

const inputs = [
  'hello',
  'https://example.com/some/path?q=1',
  '12345',
  'HELLO WORLD',
  'The quick brown fox jumps over the lazy dog.',
];

const types = ['utf8', 'terminal', 'svg'];

function hash(s) {
  return createHash('sha256').update(s).digest('hex').slice(0, 12);
}

let failures = 0;
for (const input of inputs) {
  for (const type of types) {
    const o = await ours.toString(input, { type });
    const u = await upstream.toString(input, { type });
    const ok = o === u;
    if (!ok) failures++;
    console.log(`[${ok ? 'OK' : 'FAIL'}] type=${type.padEnd(8)} input="${input.slice(0, 25)}"  ours=${hash(o)} upstream=${hash(u)}`);
  }
}

// PNG buffer comparison
for (const input of inputs) {
  const o = await ours.toBuffer(input, { type: 'png' });
  const u = await upstream.toBuffer(input, { type: 'png' });
  const ok = Buffer.compare(Buffer.from(o), Buffer.from(u)) === 0;
  if (!ok) failures++;
  console.log(`[${ok ? 'OK' : 'FAIL'}] type=png      input="${input.slice(0, 25)}"  ours=${hash(o.toString('binary'))} upstream=${hash(u.toString('binary'))}`);
}

console.log(`\n${failures} failures`);
process.exit(failures ? 1 : 0);
