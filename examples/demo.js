import { toString } from '../dist/qrcode.node.js';

const text = process.argv[2] ?? 'https://example.com';
console.log(await toString(text, { type: 'terminal', small: true }));
