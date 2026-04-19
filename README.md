# qrcode-esm

QR code generator for Node.js and the browser. Pure ESM, written in TypeScript, zero runtime dependencies.

A modernized port of [qrcode](https://github.com/soldair/node-qrcode).

## Install

```sh
npm install @quinnjr/qrcode-esm
```

## Usage

### Node.js

```ts
import { toString, toDataURL, toBuffer, toFile } from '@quinnjr/qrcode-esm';

// Render to UTF-8 string (for terminals)
const str = await toString('https://example.com');
console.log(str);

// Render to PNG data URL
const url = await toDataURL('https://example.com');

// Render to PNG buffer
const buf = await toBuffer('https://example.com');

// Write to file (format inferred from extension: .png, .svg, .txt)
await toFile('qr.png', 'https://example.com');
await toFile('qr.svg', 'https://example.com');
```

### Browser

```ts
import { toString, toCanvas, toDataURL } from '@quinnjr/qrcode-esm';

// Render to SVG string (default in browser)
const svg = await toString('https://example.com');

// Render to canvas
const canvas = await toCanvas('https://example.com');
document.body.appendChild(canvas);

// Render to existing canvas element
const el = document.getElementById('canvas') as HTMLCanvasElement;
await toCanvas(el, 'https://example.com');

// Render to data URL via canvas
const url = await toDataURL('https://example.com');
```

## API

### `create(text, options?)`

Creates QR code data without rendering. Returns a `QRData` object that can be passed to renderers directly.

### `toString(text, options?)`

Returns a `Promise<string>`. Output format depends on the `type` option:

| `type`       | Node default | Browser default |
| ------------ | ------------ | --------------- |
| `'utf8'`     | yes          |                 |
| `'terminal'` |              |                 |
| `'svg'`      |              | yes             |

### `toDataURL(text, options?)`

Returns a `Promise<string>` containing a data URL.

- **Node**: Generates PNG, SVG, or UTF-8 data URLs depending on `type`.
- **Browser**: Renders to a canvas and calls `canvas.toDataURL()`.

### `toBuffer(text, options?)` *(Node only)*

Returns a `Promise<Buffer>` containing PNG, SVG, or UTF-8 data depending on `type`.

### `toFile(path, text, options?)` *(Node only)*

Writes a QR code to a file. Format is inferred from the file extension (`.png`, `.svg`, `.txt`) unless `type` is specified.

### `toCanvas(text, options?)` *(Browser only)*
### `toCanvas(canvas, text, options?)` *(Browser only)*

Renders to an `HTMLCanvasElement`. If no canvas is provided, one is created.

## Options

```ts
interface RendererOptions {
  // QR code options
  version?: number;            // QR version (1-40), auto-detected if omitted
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // default: 'M'
  maskPattern?: number;        // 0-7, auto-selected if omitted

  // Renderer options
  type?: string;               // 'png' | 'svg' | 'utf8' | 'terminal'
  margin?: number;             // quiet zone size in modules, default: 4
  scale?: number;              // scale factor, default: 4
  width?: number;              // output width in pixels (overrides scale)
  small?: boolean;             // use compact terminal rendering
  inverse?: boolean;           // invert colors
  color?: {
    dark?: string;             // default: '#000000ff'
    light?: string;            // default: '#ffffffff'
  };
}
```

### Segments

For mixed-mode encoding, pass an array of segments:

```ts
await toString([
  { data: '1234', mode: 'numeric' },
  { data: 'HELLO', mode: 'alphanumeric' },
]);
```

## License

[MIT](./LICENSE) - Originally created by [Ryan Day](https://github.com/soldair/node-qrcode).
