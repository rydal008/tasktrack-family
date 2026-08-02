// Generates the home-screen icons into public/.
// Run with: node tools/make-icons.mjs
// Hand-rolled PNG writer so the project keeps zero image dependencies.

import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bits per channel
  ihdr[9] = 6; // RGBA

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // no per-line filter
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  let t = lengthSquared === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// A white tick on the app's blue. Kept inside the middle 60% so Android's
// maskable crop cannot clip it.
function drawIcon(size) {
  const background = [0, 113, 227];
  const stroke = [
    [0.27, 0.52],
    [0.43, 0.68],
    [0.73, 0.34]
  ];
  const halfWidth = 0.072;
  const feather = 1.5 / size;

  const rgba = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;

      const distance = Math.min(
        distanceToSegment(nx, ny, stroke[0][0], stroke[0][1], stroke[1][0], stroke[1][1]),
        distanceToSegment(nx, ny, stroke[1][0], stroke[1][1], stroke[2][0], stroke[2][1])
      );

      const coverage = Math.min(1, Math.max(0, (halfWidth - distance) / feather + 0.5));

      const i = (y * size + x) * 4;
      rgba[i] = Math.round(background[0] + (255 - background[0]) * coverage);
      rgba[i + 1] = Math.round(background[1] + (255 - background[1]) * coverage);
      rgba[i + 2] = Math.round(background[2] + (255 - background[2]) * coverage);
      rgba[i + 3] = 255;
    }
  }

  return rgba;
}

mkdirSync(OUT, { recursive: true });

for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  writeFileSync(join(OUT, name), encodePng(size, drawIcon(size)));
  console.log(`wrote public/${name} (${size}x${size})`);
}
