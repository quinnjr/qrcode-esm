import type { QRData, RendererOptions } from '../types.js';

export function render(qrData: QRData, _options?: RendererOptions): string {
  const size = qrData.modules.size;
  const data = qrData.modules.data;

  const black = '\u001B[40m  \u001B[0m';
  const white = '\u001B[47m  \u001B[0m';

  let output = '';
  const hMargin = white.repeat(size + 2);
  const vMargin = white;

  output += hMargin + '\n';
  for (let i = 0; i < size; i++) {
    output += white;
    for (let j = 0; j < size; j++) {
      output += data[i * size + j] ? black : white;
    }
    output += vMargin + '\n';
  }
  output += hMargin + '\n';
  return output;
}
