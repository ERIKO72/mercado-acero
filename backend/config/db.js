const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Conectado a PostgreSQL');
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
  }
}

module.exports = {
  pool,
  testConnection,
};
