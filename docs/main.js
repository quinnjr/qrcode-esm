// ---- Sidebar Toggle (Mobile) ----

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarClose = document.getElementById('sidebar-close');

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.add('open');
});

sidebarClose.addEventListener('click', () => {
  sidebar.classList.remove('open');
});

document.addEventListener('click', (e) => {
  if (
    sidebar.classList.contains('open') &&
    !sidebar.contains(e.target) &&
    e.target !== sidebarToggle
  ) {
    sidebar.classList.remove('open');
  }
});

// Close sidebar on nav click (mobile)
sidebar.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });
});

// ---- Active Nav Tracking ----

const navLinks = document.querySelectorAll('#sidebar a[href^="#"]');
const sections = [];

navLinks.forEach((link) => {
  const id = link.getAttribute('href').slice(1);
  const el = document.getElementById(id);
  if (el) sections.push({ el, link });
});

function updateActiveNav() {
  const scrollY = window.scrollY + 100;

  let current = sections[0];
  for (const section of sections) {
    if (section.el.offsetTop <= scrollY) {
      current = section;
    }
  }

  navLinks.forEach((l) => l.classList.remove('active'));
  if (current) current.link.classList.add('active');
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

// ---- Copy Buttons ----

document.querySelectorAll('.copy-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    let text = btn.dataset.copy;
    if (!text) {
      const block = btn.closest('.code-block');
      if (block) {
        text = block.querySelector('code').textContent;
      }
    }
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      btn.classList.add('copied');
      const original = btn.innerHTML;
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"/></svg>';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = original;
      }, 2000);
    } catch {
      // Clipboard API not available
    }
  });
});

// ---- QR Code Playground ----

// Minimal QR code generator for the playground demo.
// This is a self-contained SVG QR encoder so the docs site has no external dependencies.

const QR = (() => {
  // Generator polynomial and Galois field tables for Reed-Solomon
  const GF256_EXP = new Uint8Array(512);
  const GF256_LOG = new Uint8Array(256);
  (() => {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      GF256_EXP[i] = x;
      GF256_LOG[x] = i;
      x = x << 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) GF256_EXP[i] = GF256_EXP[i - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF256_EXP[GF256_LOG[a] + GF256_LOG[b]];
  }

  function rsGenPoly(n) {
    let poly = [1];
    for (let i = 0; i < n; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], GF256_EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    const gen = rsGenPoly(ecLen);
    const res = new Array(ecLen).fill(0);
    for (let i = 0; i < data.length; i++) {
      const coef = data[i] ^ res[0];
      res.shift();
      res.push(0);
      for (let j = 0; j < gen.length - 1; j++) {
        res[j] ^= gfMul(gen[j + 1], coef);
      }
    }
    return res;
  }

  // QR constants
  const EC_CODEWORDS = [
    // [L, M, Q, H] per version 1-40
    [7,10,13,17],[10,16,22,28],[15,26,36,44],[20,36,52,64],[26,48,72,88],
    [36,64,96,112],[40,72,108,130],[48,88,132,156],[60,110,160,192],[72,130,192,224],
    [80,150,224,264],[96,176,260,308],[104,198,288,352],[120,216,320,384],[132,240,360,432],
    [144,280,408,480],[168,308,448,532],[180,338,504,588],[196,364,546,650],[224,416,600,700],
    [224,442,644,750],[252,476,690,816],[270,504,750,900],[300,560,810,960],[312,588,870,1050],
    [336,644,952,1110],[360,700,1020,1200],[390,728,1050,1260],[420,784,1140,1350],[450,812,1200,1440],
    [480,868,1290,1530],[510,924,1350,1620],[540,980,1440,1710],[570,1036,1530,1800],[570,1064,1590,1890],
    [600,1120,1680,1980],[630,1204,1770,2100],[660,1260,1860,2220],[720,1316,1950,2310],[750,1372,2040,2430],
  ];

  const DATA_CODEWORDS = [
    [19,16,13,9],[34,28,22,16],[55,44,34,26],[80,64,48,36],[108,86,62,46],
    [136,108,76,60],[156,124,88,66],[194,154,110,86],[232,182,132,100],[274,216,154,122],
    [324,254,180,140],[370,290,206,158],[428,334,244,180],[461,365,261,197],[523,415,295,223],
    [589,453,325,253],[647,507,367,283],[721,563,397,313],[795,627,445,341],[861,669,485,385],
    [932,714,512,406],[1006,782,568,442],[1094,860,614,464],[1174,914,664,514],[1276,1000,718,538],
    [1370,1062,754,596],[1468,1128,808,628],[1531,1193,871,661],[1631,1267,911,701],[1735,1373,985,745],
    [1843,1455,1033,793],[1955,1541,1115,845],[2071,1631,1171,901],[2191,1725,1231,961],[2306,1812,1286,986],
    [2434,1914,1354,1054],[2566,1992,1426,1096],[2702,2102,1502,1142],[2812,2216,1582,1222],[2956,2334,1666,1276],
  ];

  const BLOCKS = [
    [[1],[1],[1],[1]],[[1],[1],[1],[1]],[[1],[1],[2],[2]],[[1],[2],[2],[4]],
    [[1],[2],[4],[4]],[[2],[4],[4],[4]],[[2],[4],[6],[5]],[[2],[4],[6],[6]],
    [[2],[5],[8],[8]],[[4],[5],[8],[8]],[[4],[5],[8],[11]],[[4],[8],[10],[11]],
    [[4],[9],[12],[16]],[[4],[9],[16],[16]],[[6],[10],[12],[18]],[[6],[10],[17],[16]],
    [[6],[11],[16],[19]],[[6],[13],[18],[21]],[[7],[14],[21],[25]],[[8],[16],[20],[25]],
    [[8],[17],[23],[25]],[[9],[17],[23],[34]],[[9],[18],[25],[30]],[[10],[20],[27],[32]],
    [[12],[21],[29],[35]],[[12],[23],[34],[37]],[[12],[25],[34],[40]],[[13],[26],[35],[42]],
    [[14],[28],[38],[45]],[[15],[29],[40],[48]],[[16],[31],[43],[51]],[[17],[33],[45],[54]],
    [[18],[35],[48],[57]],[[19],[37],[51],[60]],[[19],[38],[53],[63]],[[20],[40],[56],[66]],
    [[21],[43],[59],[70]],[[22],[45],[62],[74]],[[24],[47],[65],[77]],[[25],[49],[68],[81]],
  ];

  const ALIGN_POS = [
    [],
    [6,18],[6,22],[6,26],[6,30],[6,34],
    [6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],
    [6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],
    [6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],
    [6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],
    [6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],
    [6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],
    [6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],
    [6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170],
  ];

  const ECL_MAP = { L: 0, M: 1, Q: 2, H: 3 };

  function getVersion(dataLen, ecl) {
    const eclIdx = ECL_MAP[ecl];
    for (let v = 0; v < 40; v++) {
      const capacity = DATA_CODEWORDS[v][eclIdx];
      const overhead = v < 9 ? 2 : (v < 26 ? 3 : 3);
      if (dataLen <= capacity - overhead) return v + 1;
    }
    return 40;
  }

  function encodeData(text, version, ecl) {
    const eclIdx = ECL_MAP[ecl];
    const totalDataCW = DATA_CODEWORDS[version - 1][eclIdx];
    const ccBits = version < 10 ? 8 : 16;

    // Encode as byte mode
    const utf8 = new TextEncoder().encode(text);
    const bits = [];
    function pushBits(val, len) {
      for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
    }

    pushBits(0b0100, 4); // byte mode
    pushBits(utf8.length, ccBits);
    for (const b of utf8) pushBits(b, 8);

    // Terminator
    const totalBits = totalDataCW * 8;
    const termLen = Math.min(4, totalBits - bits.length);
    pushBits(0, termLen);

    // Pad to byte boundary
    while (bits.length % 8 !== 0) bits.push(0);

    // Pad codewords
    const padBytes = [0xec, 0x11];
    let pi = 0;
    while (bits.length < totalBits) {
      pushBits(padBytes[pi % 2], 8);
      pi++;
    }

    // Convert to bytes
    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      data.push(byte);
    }

    return data;
  }

  function interleave(data, version, ecl) {
    const eclIdx = ECL_MAP[ecl];
    const totalEC = EC_CODEWORDS[version - 1][eclIdx];
    const totalData = DATA_CODEWORDS[version - 1][eclIdx];
    const numBlocks = BLOCKS[version - 1][eclIdx].reduce((a, b) => a + b, 0);
    const ecPerBlock = totalEC / numBlocks;

    // Split data into blocks
    const blockSizes = [];
    const baseSize = Math.floor(totalData / numBlocks);
    const extra = totalData % numBlocks;
    for (let i = 0; i < numBlocks; i++) {
      blockSizes.push(baseSize + (i >= numBlocks - extra ? 1 : 0));
    }

    const dataBlocks = [];
    const ecBlocks = [];
    let offset = 0;
    for (let i = 0; i < numBlocks; i++) {
      const block = data.slice(offset, offset + blockSizes[i]);
      dataBlocks.push(block);
      ecBlocks.push(rsEncode(block, ecPerBlock));
      offset += blockSizes[i];
    }

    // Interleave data
    const result = [];
    const maxDataLen = Math.max(...blockSizes);
    for (let i = 0; i < maxDataLen; i++) {
      for (const block of dataBlocks) {
        if (i < block.length) result.push(block[i]);
      }
    }
    for (let i = 0; i < ecPerBlock; i++) {
      for (const block of ecBlocks) {
        if (i < block.length) result.push(block[i]);
      }
    }

    return result;
  }

  function createMatrix(version) {
    const size = 17 + version * 4;
    const matrix = Array.from({ length: size }, () => new Int8Array(size));
    const reserved = Array.from({ length: size }, () => new Uint8Array(size));
    return { matrix, reserved, size };
  }

  function placeFinder(m, r, row, col) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = row + dr, cc = col + dc;
        if (rr < 0 || rr >= m.size || cc < 0 || cc >= m.size) continue;
        r[rr][cc] = 1;
        if (dr === -1 || dr === 7 || dc === -1 || dc === 7) {
          m[rr][cc] = 0;
        } else if (dr === 0 || dr === 6 || dc === 0 || dc === 6) {
          m[rr][cc] = 1;
        } else if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) {
          m[rr][cc] = 1;
        } else {
          m[rr][cc] = 0;
        }
      }
    }
  }

  function placeAlignment(m, r, row, col) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const rr = row + dr, cc = col + dc;
        r[rr][cc] = 1;
        if (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)) {
          m[rr][cc] = 1;
        } else {
          m[rr][cc] = 0;
        }
      }
    }
  }

  function placePatterns(mat, version) {
    const { matrix: m, reserved: r, size } = mat;

    // Finder patterns
    placeFinder(m, r, 0, 0);
    placeFinder(m, r, 0, size - 7);
    placeFinder(m, r, size - 7, 0);

    // Timing
    for (let i = 8; i < size - 8; i++) {
      r[6][i] = 1;
      m[6][i] = i % 2 === 0 ? 1 : 0;
      r[i][6] = 1;
      m[i][6] = i % 2 === 0 ? 1 : 0;
    }

    // Alignment
    if (version >= 2) {
      const pos = ALIGN_POS[version - 1];
      for (const row of pos) {
        for (const col of pos) {
          if (r[row][col]) continue;
          placeAlignment(m, r, row, col);
        }
      }
    }

    // Reserve format info
    for (let i = 0; i < 8; i++) {
      r[8][i] = 1; r[i][8] = 1;
      r[8][size - 1 - i] = 1; r[size - 1 - i][8] = 1;
    }
    r[8][8] = 1;
    r[size - 8][8] = 1; // dark module

    // Version info
    if (version >= 7) {
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
          r[i][size - 11 + j] = 1;
          r[size - 11 + j][i] = 1;
        }
      }
    }
  }

  function placeData(mat, data) {
    const { matrix: m, reserved: r, size } = mat;

    const bits = [];
    for (const byte of data) {
      for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
    }

    let bi = 0;
    let upward = true;
    for (let col = size - 1; col >= 1; col -= 2) {
      if (col === 6) col = 5;
      const rows = upward
        ? Array.from({ length: size }, (_, i) => size - 1 - i)
        : Array.from({ length: size }, (_, i) => i);

      for (const row of rows) {
        for (let c = 0; c < 2; c++) {
          const cc = col - c;
          if (r[row][cc]) continue;
          m[row][cc] = bi < bits.length ? bits[bi++] : 0;
        }
      }
      upward = !upward;
    }
  }

  const MASK_FNS = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (_, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ];

  function applyMask(mat, maskIdx) {
    const { matrix: m, reserved: r, size } = mat;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (r[row][col]) continue;
        if (MASK_FNS[maskIdx](row, col)) {
          m[row][col] ^= 1;
        }
      }
    }
  }

  function penalty(mat) {
    const { matrix: m, size } = mat;
    let score = 0;

    // Rule 1: runs of same color
    for (let row = 0; row < size; row++) {
      let count = 1;
      for (let col = 1; col < size; col++) {
        if (m[row][col] === m[row][col - 1]) {
          count++;
          if (count === 5) score += 3;
          else if (count > 5) score++;
        } else count = 1;
      }
    }
    for (let col = 0; col < size; col++) {
      let count = 1;
      for (let row = 1; row < size; row++) {
        if (m[row][col] === m[row - 1][col]) {
          count++;
          if (count === 5) score += 3;
          else if (count > 5) score++;
        } else count = 1;
      }
    }

    // Rule 2: 2x2 blocks
    for (let row = 0; row < size - 1; row++) {
      for (let col = 0; col < size - 1; col++) {
        const v = m[row][col];
        if (v === m[row][col + 1] && v === m[row + 1][col] && v === m[row + 1][col + 1]) {
          score += 3;
        }
      }
    }

    return score;
  }

  const FORMAT_INFO = [
    0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
    0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
    0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed,
    0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b,
  ];

  function placeFormatInfo(mat, ecl, maskIdx) {
    const { matrix: m, size } = mat;
    const eclBits = [1, 0, 3, 2]; // L, M, Q, H
    const idx = eclBits[ECL_MAP[ecl]] * 8 + maskIdx;
    const info = FORMAT_INFO[idx];

    const bits = [];
    for (let i = 14; i >= 0; i--) bits.push((info >> i) & 1);

    // Place around top-left finder
    const pos1 = [
      [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],
      [7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
    ];
    for (let i = 0; i < 15; i++) {
      m[pos1[i][0]][pos1[i][1]] = bits[i];
    }

    // Place around other finders
    const pos2 = [
      [size-1,8],[size-2,8],[size-3,8],[size-4,8],[size-5,8],[size-6,8],[size-7,8],
      [8,size-8],[8,size-7],[8,size-6],[8,size-5],[8,size-4],[8,size-3],[8,size-2],[8,size-1],
    ];
    for (let i = 0; i < 15; i++) {
      m[pos2[i][0]][pos2[i][1]] = bits[i];
    }

    // Dark module
    m[size - 8][8] = 1;
  }

  const VERSION_INFO = [
    0x07C94, 0x085BC, 0x09A99, 0x0A4D3, 0x0BBF6, 0x0C762, 0x0D847, 0x0E60D,
    0x0F928, 0x10B78, 0x1145D, 0x12A17, 0x13532, 0x149A6, 0x15683, 0x168C9,
    0x177EC, 0x18EC4, 0x191E1, 0x1AFAB, 0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75,
    0x1F250, 0x209D5, 0x216F0, 0x228BA, 0x2379F, 0x24B0B, 0x2542E, 0x26A64,
    0x27541, 0x28C69,
  ];

  function placeVersionInfo(mat, version) {
    if (version < 7) return;
    const { matrix: m, size } = mat;
    const info = VERSION_INFO[version - 7];

    for (let i = 0; i < 18; i++) {
      const bit = (info >> i) & 1;
      const row = Math.floor(i / 3);
      const col = (i % 3) + size - 11;
      m[row][col] = bit;
      m[col][row] = bit;
    }
  }

  function generate(text, ecl = 'M') {
    const utf8 = new TextEncoder().encode(text);
    const version = getVersion(utf8.length, ecl);
    const data = encodeData(text, version, ecl);
    const interleaved = interleave(data, version, ecl);

    const mat = createMatrix(version);
    placePatterns(mat, version);
    placeData(mat, interleaved);

    // Try all masks, pick best
    let bestMask = 0;
    let bestPenalty = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      const trial = createMatrix(version);
      for (let r = 0; r < mat.size; r++) {
        trial.matrix[r].set(mat.matrix[r]);
        trial.reserved[r].set(mat.reserved[r]);
      }
      applyMask(trial, mask);
      placeFormatInfo(trial, ecl, mask);
      placeVersionInfo(trial, version);
      const p = penalty(trial);
      if (p < bestPenalty) {
        bestPenalty = p;
        bestMask = mask;
      }
    }

    applyMask(mat, bestMask);
    placeFormatInfo(mat, ecl, bestMask);
    placeVersionInfo(mat, version);

    return { matrix: mat.matrix, size: mat.size, version };
  }

  function toSVG(text, options = {}) {
    const {
      ecl = 'M',
      margin = 4,
      dark = '#000000',
      light = '#ffffff',
    } = options;

    const { matrix, size } = generate(text, ecl);
    const total = size + margin * 2;

    let paths = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          paths += `M${c + margin},${r + margin}h1v1h-1z`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
      `<rect width="${total}" height="${total}" fill="${light}"/>` +
      `<path d="${paths}" fill="${dark}"/>` +
      `</svg>`;
  }

  return { toSVG };
})();

// ---- Playground Logic ----

const pgText = document.getElementById('pg-text');
const pgEcl = document.getElementById('pg-ecl');
const pgMargin = document.getElementById('pg-margin');
const pgDark = document.getElementById('pg-dark');
const pgLight = document.getElementById('pg-light');
const pgDarkHex = document.getElementById('pg-dark-hex');
const pgLightHex = document.getElementById('pg-light-hex');
const pgResult = document.getElementById('pg-result');

function updatePlayground() {
  const text = pgText.value.trim();
  if (!text) {
    pgResult.innerHTML = '<span style="color: var(--color-text-muted); font-size: 0.9rem;">Enter text to generate a QR code</span>';
    return;
  }

  try {
    const svg = QR.toSVG(text, {
      ecl: pgEcl.value,
      margin: parseInt(pgMargin.value, 10) || 4,
      dark: pgDark.value,
      light: pgLight.value,
    });
    pgResult.innerHTML = svg;
  } catch (e) {
    pgResult.innerHTML = `<span style="color: #ef4444; font-size: 0.85rem;">Error: ${e.message}</span>`;
  }
}

pgDark.addEventListener('input', () => {
  pgDarkHex.textContent = pgDark.value;
  updatePlayground();
});

pgLight.addEventListener('input', () => {
  pgLightHex.textContent = pgLight.value;
  updatePlayground();
});

[pgText, pgEcl, pgMargin].forEach((el) => {
  el.addEventListener('input', updatePlayground);
});

// Initial render
updatePlayground();
