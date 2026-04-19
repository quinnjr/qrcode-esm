import { build } from 'esbuild';
import { rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });

const shared = {
  bundle: true,
  format: 'esm',
  target: 'es2023',
  sourcemap: true,
  logLevel: 'info',
};

await build({
  ...shared,
  entryPoints: ['src/index.node.ts'],
  outfile: 'dist/qrcode.node.js',
  platform: 'node',
  external: ['node:fs/promises', 'node:zlib'],
});

await build({
  ...shared,
  entryPoints: ['src/index.browser.ts'],
  outfile: 'dist/qrcode.browser.js',
  platform: 'browser',
});

console.log('Build complete.');
