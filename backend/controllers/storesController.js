const { pool } = require('../config/db');

async function getStores(req, res) {
  try {
    const { rows } = await pool.query('SELECT NOW() AS server_time');
    res.json({
      endpoint: 'stores',
      message: 'Listado de tiendas (placeholder)',
      dbTime: rows[0].server_time,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error consultando tiendas', details: error.message });
  }
}

module.exports = {
  getStores,
};
