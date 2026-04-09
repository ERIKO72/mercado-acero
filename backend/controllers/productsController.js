const { pool } = require('../config/db');

async function getProducts(req, res) {
  try {
    const { rows } = await pool.query('SELECT NOW() AS server_time');
    res.json({
      endpoint: 'products',
      message: 'Listado de productos (placeholder)',
      dbTime: rows[0].server_time,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error consultando productos', details: error.message });
  }
}

module.exports = {
  getProducts,
};
