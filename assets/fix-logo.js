const { createCanvas, loadImage } = require('canvas');
const fs   = require('fs');
const path = require('path');

async function main() {
  const src = path.join(__dirname, 'images', 'logo-nuevo.jpeg');
  const img = await loadImage(src);
  const w = img.width, h = img.height;

  // ── Quitar estrella (esquina inferior derecha ~4% del tamaño) ──
  const canvas = createCanvas(w, h);
  const ctx    = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // Pintar sobre la estrella con el color de fondo (~#6b1030 granate)
  // Copiar parche del fondo desde arriba de la estrella
  const sx = Math.floor(w * 0.88);
  const sy = Math.floor(h * 0.88);
  const sw = Math.floor(w * 0.12);
  const sh = Math.floor(h * 0.12);
  // Tomar textura de fondo desde la misma x pero más arriba
  const srcY = Math.floor(h * 0.76);
  const patch = ctx.getImageData(sx, srcY, sw, sh);
  ctx.putImageData(patch, sx, sy);

  // ── Generar íconos ──
  function makeIcon(size, outPath) {
    const c   = createCanvas(size, size);
    const cx  = c.getContext('2d');
    cx.imageSmoothingEnabled = true;
    cx.drawImage(canvas, 0, 0, w, h, 0, 0, size, size);
    fs.writeFileSync(outPath, c.toBuffer('image/png', { compressionLevel: 1 }));
    console.log(`✔ ${outPath}`);
  }

  makeIcon(1024, path.join(__dirname, 'icon.png'));
  makeIcon(1024, path.join(__dirname, 'adaptive-icon.png'));
  makeIcon(512,  path.join(__dirname, 'icon-playstore.png'));
  console.log('\n✅ Listo');
}

main().catch(e => { console.error(e.message); process.exit(1); });
