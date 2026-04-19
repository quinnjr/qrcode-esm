import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { create } from '../src/core/qrcode.js';
import { getOptions, getScale, getImageWidth, qrToImageData } from '../src/renderer/utils.js';
import { render as renderSvgTag } from '../src/renderer/svg-tag.js';
import { render as renderSvg, renderFullDocument } from '../src/renderer/svg.js';
import { render as renderUtf8 } from '../src/renderer/utf8.js';
import { render as renderTerminal } from '../src/renderer/terminal.js';
import { render as renderTerminalBig } from '../src/renderer/terminal-big.js';
import { render as renderTerminalSmall } from '../src/renderer/terminal-small.js';
import { encodePNG } from '../src/renderer/png-encoder.js';
import { render as renderPng, renderToDataURL } from '../src/renderer/png-node.js';
import { toString, toDataURL, toBuffer, toFile, create as reExportedCreate } from '../src/index.node.js';

const qrData = create('hello');

// ─── 1. renderer/utils ──────────────────────────────────────────────────────

describe('renderer/utils', () => {
  describe('getOptions', () => {
    it('returns defaults when called with no arguments', () => {
      const opts = getOptions();
      expect(opts.margin).toBe(4);
      expect(opts.scale).toBe(4);
      expect(opts.width).toBeUndefined();
      expect(opts.color.dark.hex).toBe('#000000');
      expect(opts.color.light.hex).toBe('#ffffff');
      expect(opts.color.dark.a).toBe(255);
      expect(opts.color.light.a).toBe(255);
      expect(opts.rendererOpts).toEqual({});
      expect(opts.type).toBeUndefined();
    });

    it('returns defaults when called with undefined', () => {
      const opts = getOptions(undefined);
      expect(opts.margin).toBe(4);
      expect(opts.scale).toBe(4);
    });

    it('accepts custom margin', () => {
      expect(getOptions({ margin: 0 }).margin).toBe(0);
      expect(getOptions({ margin: 10 }).margin).toBe(10);
    });

    it('uses default margin for negative margin', () => {
      expect(getOptions({ margin: -1 }).margin).toBe(4);
    });

    it('accepts custom scale', () => {
      expect(getOptions({ scale: 8 }).scale).toBe(8);
    });

    it('ignores scale when width is set', () => {
      const opts = getOptions({ scale: 8, width: 200 });
      expect(opts.scale).toBe(4);
      expect(opts.width).toBe(200);
    });

    it('ignores width below 21', () => {
      const opts = getOptions({ width: 10 });
      expect(opts.width).toBeUndefined();
    });

    it('accepts width at exactly 21', () => {
      const opts = getOptions({ width: 21 });
      expect(opts.width).toBe(21);
    });

    it('accepts custom dark and light colors', () => {
      const opts = getOptions({ color: { dark: '#ff0000', light: '#00ff00' } });
      expect(opts.color.dark.r).toBe(255);
      expect(opts.color.dark.g).toBe(0);
      expect(opts.color.dark.b).toBe(0);
      expect(opts.color.light.r).toBe(0);
      expect(opts.color.light.g).toBe(255);
      expect(opts.color.light.b).toBe(0);
    });

    it('throws for invalid hex color (5 chars)', () => {
      expect(() => getOptions({ color: { dark: '#12345' } })).toThrow('Invalid hex color');
    });

    it('throws for hex with 1 char', () => {
      expect(() => getOptions({ color: { dark: '#1' } })).toThrow('Invalid hex color');
    });

    it('throws for hex with 2 chars', () => {
      expect(() => getOptions({ color: { dark: '#12' } })).toThrow('Invalid hex color');
    });

    it('throws for hex with 9+ chars', () => {
      expect(() => getOptions({ color: { dark: '#123456789' } })).toThrow('Invalid hex color');
    });

    it('parses 3-char hex correctly', () => {
      const opts = getOptions({ color: { dark: '#f00' } });
      expect(opts.color.dark.r).toBe(255);
      expect(opts.color.dark.g).toBe(0);
      expect(opts.color.dark.b).toBe(0);
      expect(opts.color.dark.a).toBe(255);
      expect(opts.color.dark.hex).toBe('#ff0000');
    });

    it('parses 4-char hex correctly (with alpha)', () => {
      const opts = getOptions({ color: { dark: '#f008' } });
      expect(opts.color.dark.r).toBe(255);
      expect(opts.color.dark.g).toBe(0);
      expect(opts.color.dark.b).toBe(0);
      expect(opts.color.dark.a).toBe(136); // 0x88
      expect(opts.color.dark.hex).toBe('#ff0000');
    });

    it('parses 6-char hex correctly', () => {
      const opts = getOptions({ color: { dark: '#abcdef' } });
      expect(opts.color.dark.r).toBe(0xab);
      expect(opts.color.dark.g).toBe(0xcd);
      expect(opts.color.dark.b).toBe(0xef);
      expect(opts.color.dark.a).toBe(255);
      expect(opts.color.dark.hex).toBe('#abcdef');
    });

    it('parses 8-char hex correctly (with alpha)', () => {
      const opts = getOptions({ color: { dark: '#abcdef80' } });
      expect(opts.color.dark.r).toBe(0xab);
      expect(opts.color.dark.g).toBe(0xcd);
      expect(opts.color.dark.b).toBe(0xef);
      expect(opts.color.dark.a).toBe(0x80);
    });

    it('handles hex without leading #', () => {
      const opts = getOptions({ color: { dark: 'ff0000' } });
      expect(opts.color.dark.r).toBe(255);
      expect(opts.color.dark.g).toBe(0);
      expect(opts.color.dark.b).toBe(0);
    });

    it('passes through type option', () => {
      const opts = getOptions({ type: 'svg' });
      expect(opts.type).toBe('svg');
    });

    it('passes through rendererOpts', () => {
      const opts = getOptions({ rendererOpts: { quality: 0.9 } });
      expect(opts.rendererOpts).toEqual({ quality: 0.9 });
    });
  });

  describe('getScale', () => {
    it('returns scale from options when no width is set', () => {
      const opts = getOptions({ scale: 8 });
      expect(getScale(21, opts)).toBe(8);
    });

    it('computes scale from width when width is sufficient', () => {
      const opts = getOptions({ width: 200 });
      const qrSize = 21;
      const expectedScale = 200 / (qrSize + 4 * 2); // width / (size + margin*2)
      expect(getScale(qrSize, opts)).toBeCloseTo(expectedScale);
    });

    it('falls back to scale when width is too small', () => {
      const opts = getOptions({ width: 21 });
      // width=21, qrSize=21, margin=4, so total = 21 + 8 = 29 > 21
      // width < qrSize + margin*2, so falls back to scale
      expect(getScale(21, opts)).toBe(4);
    });

    it('uses width when width exactly equals total size', () => {
      const opts = getOptions({ width: 29 });
      // qrSize=21, margin=4 => 21+8=29 = width
      expect(getScale(21, opts)).toBe(1);
    });
  });

  describe('getImageWidth', () => {
    it('returns expected pixel width with default options', () => {
      const opts = getOptions();
      const size = qrData.modules.size;
      const expected = Math.floor((size + 4 * 2) * 4);
      expect(getImageWidth(size, opts)).toBe(expected);
    });

    it('returns width based on explicit width option', () => {
      const opts = getOptions({ width: 200 });
      const size = 21;
      const scale = 200 / (21 + 8);
      const expected = Math.floor((21 + 8) * scale);
      expect(getImageWidth(size, opts)).toBe(expected);
    });
  });

  describe('qrToImageData', () => {
    it('fills pixel buffer with RGBA values', () => {
      const opts = getOptions({ margin: 0, scale: 1 });
      const size = qrData.modules.size;
      const imgData = new Uint8Array(size * size * 4);
      qrToImageData(imgData, qrData, opts);

      // Every pixel should have been written (no zeros for alpha if color has 255 alpha)
      // Check a margin pixel at (0,0) — with margin=0 this is actually a module pixel
      // Just verify the buffer is not all zeros
      let hasNonZero = false;
      for (let i = 0; i < imgData.length; i++) {
        if (imgData[i] !== 0) { hasNonZero = true; break; }
      }
      expect(hasNonZero).toBe(true);
    });

    it('margin pixels are light color', () => {
      const opts = getOptions({ margin: 4, scale: 1 });
      const size = qrData.modules.size;
      const totalSize = size + 8; // margin*2
      const imgData = new Uint8Array(totalSize * totalSize * 4);
      qrToImageData(imgData, qrData, opts);

      // Top-left corner pixel (0,0) is in margin — should be light color (white)
      expect(imgData[0]).toBe(255); // r
      expect(imgData[1]).toBe(255); // g
      expect(imgData[2]).toBe(255); // b
      expect(imgData[3]).toBe(255); // a
    });

    it('module pixels use dark/light colors correctly', () => {
      const opts = getOptions({ margin: 0, scale: 1 });
      const size = qrData.modules.size;
      const imgData = new Uint8Array(size * size * 4);
      qrToImageData(imgData, qrData, opts);

      // The first module (top-left) in a QR code (finder pattern) is always dark
      expect(imgData[0]).toBe(0);   // r (dark)
      expect(imgData[1]).toBe(0);   // g
      expect(imgData[2]).toBe(0);   // b
      expect(imgData[3]).toBe(255); // a
    });

    it('respects custom colors', () => {
      const opts = getOptions({ margin: 0, scale: 1, color: { dark: '#ff0000', light: '#00ff00' } });
      const size = qrData.modules.size;
      const imgData = new Uint8Array(size * size * 4);
      qrToImageData(imgData, qrData, opts);

      // First module is dark = red
      expect(imgData[0]).toBe(255); // r
      expect(imgData[1]).toBe(0);   // g
      expect(imgData[2]).toBe(0);   // b
    });

    it('handles scale > 1', () => {
      const opts = getOptions({ margin: 0, scale: 2 });
      const size = qrData.modules.size;
      const totalSize = size * 2;
      const imgData = new Uint8Array(totalSize * totalSize * 4);
      qrToImageData(imgData, qrData, opts);

      // With scale=2, pixel (0,0) and (0,1) and (1,0) and (1,1) should all be the same
      const px00 = [imgData[0], imgData[1], imgData[2], imgData[3]];
      const px01 = [imgData[4], imgData[5], imgData[6], imgData[7]];
      const rowStride = totalSize * 4;
      const px10 = [imgData[rowStride], imgData[rowStride + 1], imgData[rowStride + 2], imgData[rowStride + 3]];
      expect(px00).toEqual(px01);
      expect(px00).toEqual(px10);
    });
  });
});

// ─── 2. renderer/svg-tag ────────────────────────────────────────────────────

describe('renderer/svg-tag', () => {
  it('returns a string starting with <svg', () => {
    const svg = renderSvgTag(qrData);
    expect(svg.startsWith('<svg')).toBe(true);
  });

  it('contains xmlns attribute', () => {
    const svg = renderSvgTag(qrData);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('contains viewBox attribute', () => {
    const svg = renderSvgTag(qrData);
    expect(svg).toContain('viewBox=');
  });

  it('contains path elements', () => {
    const svg = renderSvgTag(qrData);
    expect(svg).toContain('<path');
  });

  it('contains crispEdges for shape-rendering', () => {
    const svg = renderSvgTag(qrData);
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  it('ends with </svg> and newline', () => {
    const svg = renderSvgTag(qrData);
    expect(svg.trimEnd()).toMatch(/<\/svg>$/);
  });

  it('respects width option', () => {
    const svg = renderSvgTag(qrData, { width: 300 });
    expect(svg).toContain('width="300"');
    expect(svg).toContain('height="300"');
  });

  it('does not include width/height when width is not set', () => {
    const svg = renderSvgTag(qrData);
    expect(svg).not.toContain('width="');
    expect(svg).not.toContain('height="');
  });

  it('respects custom dark color', () => {
    const svg = renderSvgTag(qrData, { color: { dark: '#ff0000' } });
    expect(svg).toContain('stroke="#ff0000"');
  });

  it('respects custom light color', () => {
    const svg = renderSvgTag(qrData, { color: { light: '#00ff00' } });
    expect(svg).toContain('fill="#00ff00"');
  });

  it('omits background path when light color alpha is 0', () => {
    const svg = renderSvgTag(qrData, { color: { light: '#ffffff00' } });
    // Should not have a fill path for background
    expect(svg).not.toContain('fill="#ffffff"');
    // Still has the dark stroke path
    expect(svg).toContain('stroke="#000000"');
  });

  it('includes fill-opacity for semi-transparent light color', () => {
    const svg = renderSvgTag(qrData, { color: { light: '#ffffff80' } });
    expect(svg).toContain('fill-opacity=');
  });

  it('includes stroke-opacity for semi-transparent dark color', () => {
    const svg = renderSvgTag(qrData, { color: { dark: '#00000080' } });
    expect(svg).toContain('stroke-opacity=');
  });

  it('viewBox dimensions match size + margins', () => {
    const size = qrData.modules.size;
    const margin = 4; // default
    const total = size + margin * 2;
    const svg = renderSvgTag(qrData);
    expect(svg).toContain(`viewBox="0 0 ${total} ${total}"`);
  });
});

// ─── 3. renderer/svg ────────────────────────────────────────────────────────

describe('renderer/svg', () => {
  it('render returns same output as svg-tag render', () => {
    expect(renderSvg(qrData)).toBe(renderSvgTag(qrData));
  });

  it('render with options returns same output as svg-tag render', () => {
    const opts = { width: 200, color: { dark: '#ff0000' } };
    expect(renderSvg(qrData, opts)).toBe(renderSvgTag(qrData, opts));
  });

  it('renderFullDocument includes XML declaration', () => {
    const doc = renderFullDocument(qrData);
    expect(doc).toContain('<?xml version="1.0" encoding="utf-8"?>');
  });

  it('renderFullDocument includes DOCTYPE', () => {
    const doc = renderFullDocument(qrData);
    expect(doc).toContain('<!DOCTYPE svg PUBLIC');
    expect(doc).toContain('DTD SVG 1.1');
  });

  it('renderFullDocument contains the SVG tag', () => {
    const doc = renderFullDocument(qrData);
    expect(doc).toContain('<svg');
    expect(doc).toContain('</svg>');
  });

  it('renderFullDocument passes options through', () => {
    const doc = renderFullDocument(qrData, { width: 250 });
    expect(doc).toContain('width="250"');
  });
});

// ─── 4. renderer/utf8 ──────────────────────────────────────────────────────

describe('renderer/utf8', () => {
  it('returns a non-empty string', () => {
    const result = renderUtf8(qrData);
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains block characters', () => {
    const result = renderUtf8(qrData);
    // Should contain at least one of the block chars
    const hasBlock = result.includes('▄') || result.includes('▀') || result.includes('█');
    expect(hasBlock).toBe(true);
  });

  it('contains newlines', () => {
    const result = renderUtf8(qrData);
    expect(result).toContain('\n');
  });

  it('uses inverted block chars when dark is white', () => {
    const normal = renderUtf8(qrData);
    const inverted = renderUtf8(qrData, { color: { dark: '#ffffff' } });
    // Inverted uses different char mapping so output should differ
    expect(inverted).not.toBe(normal);
  });

  it('uses inverted block chars when light is black', () => {
    const normal = renderUtf8(qrData);
    const inverted = renderUtf8(qrData, { color: { light: '#000000' } });
    expect(inverted).not.toBe(normal);
  });

  it('respects margin option', () => {
    const small = renderUtf8(qrData, { margin: 0 });
    const large = renderUtf8(qrData, { margin: 8 });
    // Larger margin → longer output
    expect(large.length).toBeGreaterThan(small.length);
  });

  it('handles odd-sized modules', () => {
    // Just ensure it does not crash for various inputs
    const data = create('a');
    const result = renderUtf8(data);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── 5. renderer/terminal ───────────────────────────────────────────────────

describe('renderer/terminal', () => {
  it('with small:true uses small renderer', () => {
    const result = renderTerminal(qrData, { small: true });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Small renderer produces ANSI escape codes
    expect(result).toContain('\u001B[');
  });

  it('with small:false uses big renderer', () => {
    const result = renderTerminal(qrData, { small: false });
    expect(typeof result).toBe('string');
    // Big renderer uses \u001B[40m and \u001B[47m
    expect(result).toContain('\u001B[40m');
    expect(result).toContain('\u001B[47m');
  });

  it('without options uses big renderer', () => {
    const result = renderTerminal(qrData);
    expect(result).toContain('\u001B[40m');
    expect(result).toContain('\u001B[47m');
  });

  it('returns strings with ANSI escape codes', () => {
    const big = renderTerminal(qrData);
    const small = renderTerminal(qrData, { small: true });
    expect(big).toContain('\u001B[');
    expect(small).toContain('\u001B[');
  });
});

// ─── 6. renderer/terminal-big ───────────────────────────────────────────────

describe('renderer/terminal-big', () => {
  it('returns a string with ANSI black background', () => {
    const result = renderTerminalBig(qrData);
    expect(result).toContain('\u001B[40m');
  });

  it('returns a string with ANSI white background', () => {
    const result = renderTerminalBig(qrData);
    expect(result).toContain('\u001B[47m');
  });

  it('contains ANSI reset codes', () => {
    const result = renderTerminalBig(qrData);
    expect(result).toContain('\u001B[0m');
  });

  it('contains newlines for row separation', () => {
    const result = renderTerminalBig(qrData);
    expect(result).toContain('\n');
  });

  it('returns non-empty string', () => {
    const result = renderTerminalBig(qrData);
    expect(result.length).toBeGreaterThan(0);
  });

  it('ignores options parameter', () => {
    // terminal-big ignores options (parameter is _options)
    const a = renderTerminalBig(qrData);
    const b = renderTerminalBig(qrData, { margin: 10 });
    expect(a).toBe(b);
  });
});

// ─── 7. renderer/terminal-small ─────────────────────────────────────────────

describe('renderer/terminal-small', () => {
  it('returns a string with ANSI escape codes', () => {
    const result = renderTerminalSmall(qrData);
    expect(result).toContain('\u001B[');
  });

  it('contains ANSI reset codes', () => {
    const result = renderTerminalSmall(qrData);
    expect(result).toContain('\u001B[0m');
  });

  it('returns non-empty string', () => {
    const result = renderTerminalSmall(qrData);
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains block characters', () => {
    const result = renderTerminalSmall(qrData);
    const hasBlock = result.includes('▄') || result.includes('▀') || result.includes('█');
    expect(hasBlock).toBe(true);
  });

  it('produces different output with inverse option', () => {
    const normal = renderTerminalSmall(qrData);
    const inverted = renderTerminalSmall(qrData, { inverse: true });
    expect(inverted).not.toBe(normal);
  });

  it('uses white foreground setup with inverse', () => {
    const inverted = renderTerminalSmall(qrData, { inverse: true });
    // Inverse uses backgroundBlack + foregroundWhite
    expect(inverted).toContain('\u001B[40m');
    expect(inverted).toContain('\u001B[37m');
  });

  it('uses black foreground setup without inverse', () => {
    const normal = renderTerminalSmall(qrData);
    expect(normal).toContain('\u001B[47m');
    expect(normal).toContain('\u001B[30m');
  });

  it('contains newlines', () => {
    const result = renderTerminalSmall(qrData);
    expect(result).toContain('\n');
  });
});

// ─── 8. renderer/png-encoder ────────────────────────────────────────────────

describe('renderer/png-encoder', () => {
  function makePixels(width: number, height: number): Uint8Array {
    const pixels = new Uint8Array(width * height * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 255;     // r
      pixels[i + 1] = 0;   // g
      pixels[i + 2] = 0;   // b
      pixels[i + 3] = 255; // a
    }
    return pixels;
  }

  it('produces output starting with PNG signature bytes', () => {
    const pixels = makePixels(4, 4);
    const png = encodePNG(pixels, 4, 4);
    expect(png[0]).toBe(0x89);
    expect(png[1]).toBe(0x50); // P
    expect(png[2]).toBe(0x4E); // N
    expect(png[3]).toBe(0x47); // G
  });

  it('contains the full 8-byte PNG signature', () => {
    const pixels = makePixels(2, 2);
    const png = encodePNG(pixels, 2, 2);
    const sig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    for (let i = 0; i < sig.length; i++) {
      expect(png[i]).toBe(sig[i]);
    }
  });

  it('returns a Uint8Array', () => {
    const pixels = makePixels(1, 1);
    const png = encodePNG(pixels, 1, 1);
    expect(png).toBeInstanceOf(Uint8Array);
  });

  it('produces output larger than just the signature', () => {
    const pixels = makePixels(8, 8);
    const png = encodePNG(pixels, 8, 8);
    // Must contain signature (8) + IHDR chunk + IDAT chunk + IEND chunk
    expect(png.length).toBeGreaterThan(8 + 25 + 12);
  });

  it('contains IHDR chunk', () => {
    const pixels = makePixels(4, 4);
    const png = encodePNG(pixels, 4, 4);
    // IHDR starts after the 8-byte signature, at position 8+4 = 12 (after length field)
    const ihdr = String.fromCharCode(png[12]!, png[13]!, png[14]!, png[15]!);
    expect(ihdr).toBe('IHDR');
  });

  it('contains IEND chunk', () => {
    const pixels = makePixels(2, 2);
    const png = encodePNG(pixels, 2, 2);
    // IEND is the last chunk, 12 bytes: length(4) + IEND(4) + CRC(4)
    const iend = String.fromCharCode(
      png[png.length - 8]!, png[png.length - 7]!,
      png[png.length - 6]!, png[png.length - 5]!,
    );
    expect(iend).toBe('IEND');
  });

  it('different pixel data produces different output', () => {
    const red = makePixels(4, 4);
    const blue = new Uint8Array(4 * 4 * 4);
    for (let i = 0; i < blue.length; i += 4) {
      blue[i] = 0; blue[i + 1] = 0; blue[i + 2] = 255; blue[i + 3] = 255;
    }
    const pngRed = encodePNG(red, 4, 4);
    const pngBlue = encodePNG(blue, 4, 4);
    // The compressed data should differ
    expect(Buffer.from(pngRed).equals(Buffer.from(pngBlue))).toBe(false);
  });

  it('handles 1x1 pixel image', () => {
    const pixels = new Uint8Array([128, 64, 32, 255]);
    const png = encodePNG(pixels, 1, 1);
    expect(png[0]).toBe(0x89);
    expect(png.length).toBeGreaterThan(8);
  });
});

// ─── 9. renderer/png-node ───────────────────────────────────────────────────

describe('renderer/png-node', () => {
  describe('render', () => {
    it('returns a Uint8Array', () => {
      const result = renderPng(qrData);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('starts with PNG signature', () => {
      const result = renderPng(qrData);
      expect(result[0]).toBe(0x89);
      expect(result[1]).toBe(0x50);
      expect(result[2]).toBe(0x4E);
      expect(result[3]).toBe(0x47);
    });

    it('produces valid PNG with custom options', () => {
      const result = renderPng(qrData, { scale: 2, margin: 1 });
      expect(result[0]).toBe(0x89);
      expect(result.length).toBeGreaterThan(8);
    });

    it('produces different sized output for different scales', () => {
      const small = renderPng(qrData, { scale: 1, margin: 0 });
      const large = renderPng(qrData, { scale: 4, margin: 0 });
      expect(large.length).toBeGreaterThan(small.length);
    });
  });

  describe('renderToDataURL', () => {
    it('returns a string starting with data:image/png;base64,', () => {
      const result = renderToDataURL(qrData);
      expect(result.startsWith('data:image/png;base64,')).toBe(true);
    });

    it('contains valid base64 after the prefix', () => {
      const result = renderToDataURL(qrData);
      const base64 = result.slice('data:image/png;base64,'.length);
      expect(base64.length).toBeGreaterThan(0);
      // Valid base64 should only contain these chars
      expect(base64).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('base64 decodes to PNG data', () => {
      const result = renderToDataURL(qrData);
      const base64 = result.slice('data:image/png;base64,'.length);
      const buf = Buffer.from(base64, 'base64');
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50);
      expect(buf[2]).toBe(0x4E);
      expect(buf[3]).toBe(0x47);
    });

    it('accepts renderer options', () => {
      const result = renderToDataURL(qrData, { scale: 1, margin: 0 });
      expect(result.startsWith('data:image/png;base64,')).toBe(true);
    });
  });
});

// ─── 10. index.node (public API) ────────────────────────────────────────────

describe('index.node', () => {
  const tempFiles: string[] = [];

  afterEach(() => {
    for (const f of tempFiles) {
      try { if (existsSync(f)) unlinkSync(f); } catch { /* ignore */ }
    }
    tempFiles.length = 0;
  });

  describe('toString', () => {
    it('with type=utf8 returns a string', async () => {
      const result = await toString('hello', { type: 'utf8' });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('with default type returns utf8 string', async () => {
      const result = await toString('hello');
      expect(typeof result).toBe('string');
      // UTF8 renderer output contains block chars
      const hasBlock = result.includes('▄') || result.includes('▀') || result.includes('█');
      expect(hasBlock).toBe(true);
    });

    it('with type=svg returns SVG string', async () => {
      const result = await toString('hello', { type: 'svg' });
      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
    });

    it('with type=terminal returns ANSI string', async () => {
      const result = await toString('hello', { type: 'terminal' });
      expect(result).toContain('\u001B[');
    });

    it('rejects with error for empty string', async () => {
      await expect(toString('')).rejects.toThrow();
    });

    it('accepts array input', async () => {
      const result = await toString([{ data: 'hello', mode: 'byte' }]);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('toDataURL', () => {
    it('returns a data: URL for PNG by default', async () => {
      const result = await toDataURL('hello');
      expect(result.startsWith('data:image/png;base64,')).toBe(true);
    });

    it('with type=svg returns base64 SVG data URL', async () => {
      const result = await toDataURL('hello', { type: 'svg' });
      expect(result.startsWith('data:image/svg+xml;base64,')).toBe(true);
      // Decode to verify it's valid SVG
      const base64 = result.slice('data:image/svg+xml;base64,'.length);
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      expect(decoded).toContain('<svg');
    });

    it('with type=utf8 returns text data URL', async () => {
      const result = await toDataURL('hello', { type: 'utf8' });
      expect(result.startsWith('data:text/plain;base64,')).toBe(true);
    });

    it('rejects for empty input', async () => {
      await expect(toDataURL('')).rejects.toThrow();
    });
  });

  describe('toBuffer', () => {
    it('returns a Buffer with PNG data by default', async () => {
      const result = await toBuffer('hello');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result[0]).toBe(0x89);
      expect(result[1]).toBe(0x50);
      expect(result[2]).toBe(0x4E);
      expect(result[3]).toBe(0x47);
    });

    it('with type=svg returns SVG in a Buffer', async () => {
      const result = await toBuffer('hello', { type: 'svg' });
      expect(Buffer.isBuffer(result)).toBe(true);
      const str = result.toString('utf-8');
      expect(str).toContain('<svg');
    });

    it('with type=utf8 returns utf8 text in a Buffer', async () => {
      const result = await toBuffer('hello', { type: 'utf8' });
      expect(Buffer.isBuffer(result)).toBe(true);
      const str = result.toString('utf-8');
      const hasBlock = str.includes('▄') || str.includes('▀') || str.includes('█');
      expect(hasBlock).toBe(true);
    });

    it('rejects for empty input', async () => {
      await expect(toBuffer('')).rejects.toThrow();
    });
  });

  describe('toFile', () => {
    it('writes a PNG file', async () => {
      const filePath = join(tmpdir(), `qr-test-${Date.now()}.png`);
      tempFiles.push(filePath);
      await toFile(filePath, 'hello');
      expect(existsSync(filePath)).toBe(true);
    });

    it('writes an SVG file when type is svg', async () => {
      const filePath = join(tmpdir(), `qr-test-${Date.now()}.txt`);
      tempFiles.push(filePath);
      await toFile(filePath, 'hello', { type: 'svg' });
      expect(existsSync(filePath)).toBe(true);
    });

    it('writes a UTF8 file when type is utf8', async () => {
      const filePath = join(tmpdir(), `qr-test-${Date.now()}.txt`);
      tempFiles.push(filePath);
      await toFile(filePath, 'hello', { type: 'utf8' });
      expect(existsSync(filePath)).toBe(true);
    });

    it('auto-detects svg type from .svg extension', async () => {
      const filePath = join(tmpdir(), `qr-test-${Date.now()}.svg`);
      tempFiles.push(filePath);
      await toFile(filePath, 'hello');
      expect(existsSync(filePath)).toBe(true);
    });

    it('throws TypeError for invalid arguments (no path)', async () => {
      // @ts-expect-error testing invalid args
      await expect(toFile(123, 'hello')).rejects.toThrow(TypeError);
    });

    it('throws TypeError for invalid text argument', async () => {
      const filePath = join(tmpdir(), `qr-test-${Date.now()}.png`);
      tempFiles.push(filePath);
      // @ts-expect-error testing invalid args
      await expect(toFile(filePath, 123)).rejects.toThrow(TypeError);
    });

    it('throws TypeError when text is undefined', async () => {
      const filePath = join(tmpdir(), `qr-test-${Date.now()}.png`);
      tempFiles.push(filePath);
      // @ts-expect-error testing invalid args
      await expect(toFile(filePath)).rejects.toThrow(TypeError);
    });

    it('accepts array input', async () => {
      const filePath = join(tmpdir(), `qr-test-${Date.now()}.png`);
      tempFiles.push(filePath);
      await toFile(filePath, [{ data: 'hello', mode: 'byte' }]);
      expect(existsSync(filePath)).toBe(true);
    });
  });

  describe('create re-export', () => {
    it('create is re-exported and functional', () => {
      const data = reExportedCreate('test');
      expect(data).toBeDefined();
      expect(data.modules).toBeDefined();
      expect(data.modules.size).toBeGreaterThan(0);
      expect(data.version).toBeGreaterThanOrEqual(1);
    });
  });
});
