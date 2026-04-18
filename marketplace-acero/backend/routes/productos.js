// backend/routes/productos.js
const router = require('express').Router();
const db     = require('../db');

// GET /api/productos?tienda_id=&categoria=&q=
router.get('/', async (req, res) => {
  try {
    const { tienda_id, categoria, q } = req.query;
    let query  = `SELECT p.*, t.nombre AS tienda_nombre FROM productos p JOIN tiendas t ON t.id=p.tienda_id WHERE p.activo=true`;
    const params = [];
    let idx = 1;

    if (tienda_id) { query += ` AND p.tienda_id=$${idx++}`;     params.push(tienda_id); }
    if (categoria) { query += ` AND p.categoria ILIKE $${idx++}`; params.push(`%${categoria}%`); }
    if (q)         { query += ` AND p.nombre ILIKE $${idx++}`;    params.push(`%${q}%`); }

    query += ` ORDER BY p.categoria, p.precio`;
    const { rows } = await db.query(query, params);
    res.json({ ok: true, total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/productos/categorias — lista de categorías únicas
router.get('/categorias', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT DISTINCT categoria FROM productos WHERE activo=true AND categoria IS NOT NULL ORDER BY categoria`
    );
    res.json({ ok: true, data: rows.map(r => r.categoria) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
