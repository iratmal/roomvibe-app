const fs = require('fs');
const path = require('path');

const panoramasDir = path.join(__dirname, '../public/panoramas');
if (!fs.existsSync(panoramasDir)) {
  fs.mkdirSync(panoramasDir, { recursive: true });
}

const viewpoints = [
  { id: 'entrance', color: '#E8E4DC', label: 'Entrance View' },
  { id: 'center', color: '#E5E1D9', label: 'Center View' },
  { id: 'back-left', color: '#E2DED6', label: 'Back Left View' },
  { id: 'back-right', color: '#DFDBCD', label: 'Back Right View' }
];

const width = 4096;
const height = 2048;

viewpoints.forEach(vp => {
  const ppmHeader = `P6\n${width} ${height}\n255\n`;
  const pixels = Buffer.alloc(width * height * 3);
  
  const hex = vp.color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  for (let y = 0; y < height; y++) {
    const verticalGradient = 1 - (y / height) * 0.15;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      pixels[idx] = Math.min(255, Math.floor(r * verticalGradient));
      pixels[idx + 1] = Math.min(255, Math.floor(g * verticalGradient));
      pixels[idx + 2] = Math.min(255, Math.floor(b * verticalGradient));
    }
  }
  
  const floorY = Math.floor(height * 0.65);
  const floorR = Math.floor(r * 0.85);
  const floorG = Math.floor(g * 0.85);
  const floorB = Math.floor(b * 0.85);
  
  for (let y = floorY; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      pixels[idx] = floorR;
      pixels[idx + 1] = floorG;
      pixels[idx + 2] = floorB;
    }
  }
  
  const ceilingY = Math.floor(height * 0.35);
  const ceilingR = Math.min(255, Math.floor(r * 1.05));
  const ceilingG = Math.min(255, Math.floor(g * 1.05));
  const ceilingB = Math.min(255, Math.floor(b * 1.05));
  
  for (let y = 0; y < ceilingY; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      pixels[idx] = ceilingR;
      pixels[idx + 1] = ceilingG;
      pixels[idx + 2] = ceilingB;
    }
  }
  
  const ppmData = Buffer.concat([Buffer.from(ppmHeader), pixels]);
  const ppmPath = path.join(panoramasDir, `hybrid-studio-${vp.id}.ppm`);
  fs.writeFileSync(ppmPath, ppmData);
  console.log(`Created PPM: ${ppmPath}`);
});

console.log('\nNote: PPM files created. Convert to JPG using ImageMagick:');
console.log('for f in public/panoramas/*.ppm; do convert "$f" "${f%.ppm}.jpg"; rm "$f"; done');
