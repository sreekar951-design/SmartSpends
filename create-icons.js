const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.join(__dirname, 'frontend', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function makeDollarIcon(size, fileName) {
  const width = size;
  const height = size;

  // 1. Fill base with brand purple (#8b5cf6)
  const b = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    b[i * 4] = 139;     // R
    b[i * 4 + 1] = 92;  // G
    b[i * 4 + 2] = 246; // B
    b[i * 4 + 3] = 255; // Alpha
  }

  // 2. Draw white '$' glyph in the center
  function drawPixel(x, y) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const idx = (y * width + x) * 4;
      b[idx] = 255;
      b[idx + 1] = 255;
      b[idx + 2] = 255;
      b[idx + 3] = 255;
    }
  }

  function drawRect(rx, ry, rw, rh) {
    for (let py = ry; py < ry + rh; py++) {
      for (let px = rx; px < rx + rw; px++) {
        drawPixel(px, py);
      }
    }
  }

  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const stroke = Math.max(3, Math.floor(size * 0.055));
  const r = Math.floor(size * 0.17);

  // Vertical spine line
  drawRect(cx - Math.floor(stroke / 2), cy - r - Math.floor(stroke * 2), stroke, (r + stroke) * 2 + Math.floor(stroke * 2));

  // Top loop of '$'
  drawRect(cx - r, cy - r, r * 2, stroke); // top horizontal
  drawRect(cx - r, cy - r, stroke, r);     // top left vertical
  drawRect(cx - r, cy - Math.floor(stroke / 2), r * 2, stroke); // middle horizontal

  // Bottom loop of '$'
  drawRect(cx + r - stroke, cy, stroke, r); // bottom right vertical
  drawRect(cx - r, cy + r - stroke, r * 2, stroke); // bottom horizontal

  // 3. Compress PNG scanlines
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width * 4)] = 0;
    b.copy(scanlines, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idat = zlib.deflateSync(scanlines);

  // 4. Assemble PNG chunks
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type);
    let c = 0xffffffff;
    const buf = Buffer.concat([t, data]);
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
      }
    }
    c ^= 0xffffffff;
    const crc = Buffer.alloc(4);
    crc.writeInt32BE(c, 0);
    return Buffer.concat([len, t, data, crc]);
  }

  const out = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(path.join(publicDir, fileName), out);
  console.log(`✅ Generated ${fileName} with Dollar Sign!`);
}

makeDollarIcon(192, 'icon-192.png');
makeDollarIcon(512, 'icon-512.png');