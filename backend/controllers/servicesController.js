const { pool } = require('../config/db');

async function getServices(req, res) {
  try {
    const { rows } = await pool.query('SELECT NOW() AS server_time');
    res.json({
      endpoint: 'services',
      message: 'Listado de servicios (placeholder)',
      dbTime: rows[0].server_time,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error consultando servicios', details: error.message });
  }
}

module.exports = {
  getServices,
};
