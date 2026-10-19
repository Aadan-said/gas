const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Beautiful Master GasFlow SVG
const gasFlowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090D16"/>
      <stop offset="50%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>

    <!-- Outer Glow Gradient -->
    <radialGradient id="haloGlow" cx="50%" cy="55%" r="60%">
      <stop offset="0%" stop-color="#0284C7" stop-opacity="0.35"/>
      <stop offset="50%" stop-color="#0D9488" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#090D16" stop-opacity="0"/>
    </radialGradient>

    <!-- Outer Flame / Flow Droplet Gradient -->
    <linearGradient id="primaryFlowGrad" x1="15%" y1="90%" x2="85%" y2="10%">
      <stop offset="0%" stop-color="#1D4ED8"/>
      <stop offset="35%" stop-color="#2563EB"/>
      <stop offset="70%" stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#06B6D4"/>
    </linearGradient>

    <!-- Inner Core Flame Gradient -->
    <linearGradient id="coreFlameGrad" x1="30%" y1="100%" x2="70%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="45%" stop-color="#FBBF24"/>
      <stop offset="80%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#34D399"/>
    </linearGradient>

    <!-- Glass Highlight -->
    <linearGradient id="highlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>

    <!-- Filter for soft inner glow -->
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Squircle Base with premium dark border -->
  <rect x="16" y="16" width="480" height="480" rx="124" fill="url(#bgGrad)"/>
  <rect x="16" y="16" width="480" height="480" rx="124" fill="none" stroke="#1E293B" stroke-width="6"/>
  <rect x="20" y="20" width="472" height="472" rx="120" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-opacity="0.25"/>

  <!-- Radial Atmosphere Glow -->
  <circle cx="256" cy="270" r="180" fill="url(#haloGlow)"/>

  <!-- Dynamic Energy Flow Stream 1 (Left Swoosh) -->
  <path d="M 170 340 C 150 310, 142 270, 160 230 C 168 212, 185 190, 205 170 C 195 195, 185 225, 192 255 C 198 280, 215 305, 230 325 C 205 335, 185 342, 170 340 Z"
        fill="#38BDF8" opacity="0.4" />

  <!-- Master Droplet & Flame Body -->
  <path d="M 256 82
           C 240 138, 202 200, 170 248
           C 136 298, 120 342, 120 384
           C 120 458, 180 500, 256 500
           C 332 500, 392 458, 392 384
           C 392 342, 376 298, 342 248
           C 310 200, 272 138, 256 82 Z"
        transform="translate(0, -32) scale(1, 0.96)"
        transform-origin="256 256"
        fill="url(#primaryFlowGrad)"
        filter="url(#softGlow)"/>

  <!-- Inner Dynamic Flame Vortex Core -->
  <path d="M 256 180
           C 248 216, 224 254, 206 286
           C 188 318, 180 344, 180 368
           C 180 412, 214 444, 256 444
           C 298 444, 332 412, 332 368
           C 332 344, 324 318, 306 286
           C 288 254, 264 216, 256 180 Z"
        transform="translate(0, -30) scale(1, 0.94)"
        transform-origin="256 256"
        fill="url(#coreFlameGrad)"/>

  <!-- High-Precision Flow Pulse (Golden Teardrop Seed) -->
  <path d="M 256 260
           C 252 284, 238 310, 228 330
           C 220 346, 218 360, 218 372
           C 218 394, 235 410, 256 410
           C 277 410, 294 394, 294 372
           C 294 360, 292 346, 284 330
           C 274 310, 260 284, 256 260 Z"
        transform="translate(0, -30)"
        fill="#FFFFFF"
        opacity="0.95"/>

  <!-- Sheen Highlight Curve -->
  <path d="M 256 110
           C 270 156, 302 210, 326 250
           C 345 282, 355 315, 358 348
           C 345 320, 325 285, 305 255
           C 280 218, 255 170, 245 130
           C 248 122, 252 115, 256 110 Z"
        fill="url(#highlightGrad)"
        opacity="0.75"/>
</svg>
`;

// Helper to create ICO binary buffer with embedded PNGs
function createIco(pngBuffers) {
  // pngBuffers: array of { width, height, buffer }
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const dirEntries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // Colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset
    dirEntries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(b => b.buffer)]);
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const appDir = path.join(rootDir, 'app');

  // 1. Write public/icon.svg and app/icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), gasFlowSvg.trim(), 'utf-8');
  fs.writeFileSync(path.join(appDir, 'icon.svg'), gasFlowSvg.trim(), 'utf-8');
  console.log('✓ icon.svg written to public/ & app/');

  // 2. Generate PNG sizes
  const svgBuffer = Buffer.from(gasFlowSvg.trim());

  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const png192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();

  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);
  fs.writeFileSync(path.join(appDir, 'icon.png'), png192);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), png192);
  console.log('✓ icon-192.png, icon-512.png, apple-touch-icon.png written to public/ & app/');

  // 3. Create ICO with 16, 32, 48
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 }
  ]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log('✓ favicon.ico created & replaced in public/ and app/ (both contain GasFlow icon)');
}

main().catch(err => {
  console.error('Failed generating icons:', err);
  process.exit(1);
});
