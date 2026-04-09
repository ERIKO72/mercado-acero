const { pool } = require('../config/db');

async function getUsers(req, res) {
  try {
    const { rows } = await pool.query('SELECT NOW() AS server_time');
    res.json({
      endpoint: 'users',
      message: 'Listado de usuarios (placeholder)',
      dbTime: rows[0].server_time,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error consultando usuarios', details: error.message });
  }
}

module.exports = {
  getUsers,
};
