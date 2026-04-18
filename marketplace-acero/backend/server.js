// backend/server.js
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');

const tiendas   = require('./routes/tiendas');
const productos = require('./routes/productos');

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Middlewares ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/tiendas',   tiendas);
app.use('/api/productos', productos);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date() }));

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔩 Marketplace del Acero — Backend`);
  console.log(`   Puerto : http://localhost:${PORT}`);
  console.log(`   Health : http://localhost:${PORT}/health`);
  console.log(`   Tiendas: http://localhost:${PORT}/api/tiendas\n`);
});
