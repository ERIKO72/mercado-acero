/**
 * Recorta la M+engranaje del logo y genera íconos para Play Store
 * Uso: node crop-icon.js
 */
const { createCanvas, loadImage } = require('canvas');
const fs   = require('fs');
const path = require('path');

async function main() {
  const src = path.join(__dirname, 'images', 'Logo - png.png');
  const img = await loadImage(src);

  // El logo tiene fondo negro, la M+engranaje ocupa ~el 22% izquierdo
  // Coordenadas aproximadas del emblema M (ajustar si es necesario)
  const iw = img.width;
  const ih = img.height;

  // Crop cuadrado centrado en el emblema M+engranaje (izquierda del logo)
  // Solo la M+engranaje: ~38% del ancho total, cuadrado
  const cropX = 0;
  const cropY = 0;
  const cropW = Math.floor(iw * 0.33);
  const cropH = ih;

  function makeIcon(outputSize, outputPath) {
    // Render a 4x para luego escalar (supersampling)
    const scale  = 4;
    const big    = outputSize * scale;
    const canvas = createCanvas(big, big);
    const ctx    = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fondo negro
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, big, big);

    // Padding 6%
    const pad   = big * 0.06;
    const drawS = big - pad * 2;
    ctx.drawImage(img, cropX, cropY, cropW, cropH, pad, pad, drawS, drawS);

    // Escalar a tamaño final con alta calidad
    const out    = createCanvas(outputSize, outputSize);
    const octx   = out.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(canvas, 0, 0, big, big, 0, 0, outputSize, outputSize);

    fs.writeFileSync(outputPath, out.toBuffer('image/png', { compressionLevel: 1 }));
    console.log(`✔ ${outputPath} (${outputSize}x${outputSize})`);
    return;

  }

  makeIcon(1024, path.join(__dirname, 'icon.png'));
  makeIcon(1024, path.join(__dirname, 'adaptive-icon.png'));
  makeIcon(512,  path.join(__dirname, 'icon-playstore.png'));

  console.log('\n✅ Íconos generados con la M+engranaje del logo original');
}

main().catch(e => { console.error(e.message); process.exit(1); });
