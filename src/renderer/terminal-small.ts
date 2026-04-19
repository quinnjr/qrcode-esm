import type { QRData, RendererOptions } from '../types.js';

const backgroundWhite = '\u001B[47m';
const backgroundBlack = '\u001B[40m';
const foregroundWhite = '\u001B[37m';
const foregroundBlack = '\u001B[30m';
const reset = '\u001B[0m';
const lineSetupNormal = backgroundWhite + foregroundBlack;
const lineSetupInverse = backgroundBlack + foregroundWhite;

type PaletteKey = '00' | '01' | '02' | '10' | '11' | '12' | '20' | '21' | '22';
type Palette = Record<PaletteKey, string>;

function createPalette(lineSetup: string, fgWhite: string, fgBlack: string): Palette {
  return {
    '00': reset + ' ' + lineSetup,
    '01': reset + fgWhite + '▄' + lineSetup,
    '02': reset + fgBlack + '▄' + lineSetup,
    '10': reset + fgWhite + '▀' + lineSetup,
    '11': ' ',
    '12': '▄',
    '20': reset + fgBlack + '▀' + lineSetup,
    '21': '▀',
    '22': '█',
  };
}

function mkCodePixel(modules: Uint8Array, size: number, x: number, y: number): '0' | '1' | '2' {
  const sizePlus = size + 1;
  if (x >= sizePlus || y >= sizePlus || y < -1 || x < -1) return '0';
  if (x >= size || y >= size || y < 0 || x < 0) return '1';
  const idx = y * size + x;
  return modules[idx] ? '2' : '1';
}

function mkCode(modules: Uint8Array, size: number, x: number, y: number): PaletteKey {
  return (mkCodePixel(modules, size, x, y) + mkCodePixel(modules, size, x, y + 1)) as PaletteKey;
}

export function render(qrData: QRData, options?: RendererOptions): string {
  const size = qrData.modules.size;
  const data = qrData.modules.data;

  const inverse = !!(options?.inverse);
  const lineSetup = inverse ? lineSetupInverse : lineSetupNormal;
  const white = inverse ? foregroundBlack : foregroundWhite;
  const black = inverse ? foregroundWhite : foregroundBlack;

  const palette = createPalette(lineSetup, white, black);
  const newLine = reset + '\n' + lineSetup;

  let output = lineSetup;

  for (let y = -1; y < size + 1; y += 2) {
    for (let x = -1; x < size; x++) {
      output += palette[mkCode(data, size, x, y)];
    }
    output += palette[mkCode(data, size, size, y)] + newLine;
  }

  output += reset;
  return output;
}
