/**
 * Genera icon.png y adaptive-icon.png para Expo / Play Store
 * Requiere: npm install canvas
 * Uso: node generate-icon.js
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const cx = size / 2;
  const cy = size / 2;
  const r  = size / 2;

  // ── Fondo degradado oscuro ──
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#1C2833');
  bg.addColorStop(1, '#0d1117');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // ── Anillo rojo externo ──
  ctx.strokeStyle = '#C0392B';
  ctx.lineWidth = size * 0.045;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();

  // ── Barra horizontal acero (efecto metal) ──
  const barH = size * 0.095;
  const barW = size * 0.55;
  const barY = cy - barH / 2;
  const barX = cx - barW / 2;

  const metal = ctx.createLinearGradient(barX, barY, barX, barY + barH);
  metal.addColorStop(0,   '#E8E8E8');
  metal.addColorStop(0.3, '#ffffff');
  metal.addColorStop(0.7, '#C0C0C0');
  metal.addColorStop(1,   '#888888');
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, barH * 0.3);
  ctx.fill();

  // ── Letra M ──
  const fontSize = size * 0.42;
  ctx.font = `900 ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Sombra
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = size * 0.04;

  // Degradado dorado-rojo en la M
  const mGrad = ctx.createLinearGradient(cx, cy - fontSize / 2, cx, cy + fontSize / 2);
  mGrad.addColorStop(0, '#E74C3C');
  mGrad.addColorStop(0.5, '#C0392B');
  mGrad.addColorStop(1, '#922B21');
  ctx.fillStyle = mGrad;
  ctx.fillText('M', cx, cy + size * 0.03);

  ctx.shadowBlur = 0;

  // ── Texto ACERO abajo ──
  const smallFont = size * 0.09;
  ctx.font = `700 ${smallFont}px Arial`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.letterSpacing = `${size * 0.012}px`;
  ctx.fillText('ACERO', cx, cy + size * 0.33);

  // ── Guardar PNG ──
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✔ Guardado: ${outputPath} (${size}x${size})`);
}

// Instalar canvas si no existe
try {
  drawIcon(1024, path.join(__dirname, 'icon.png'));
  drawIcon(1024, path.join(__dirname, 'adaptive-icon.png'));
  drawIcon(512,  path.join(__dirname, 'icon-playstore.png'));
  console.log('\n✅ Íconos generados correctamente en assets/');
} catch (e) {
  console.error('Error:', e.message);
  console.log('Ejecuta primero: npm install canvas');
}
