require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');

const usersRoutes = require('./routes/users');
const storesRoutes = require('./routes/stores');
const productsRoutes = require('./routes/products');
const servicesRoutes = require('./routes/services');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de Express
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'marketplace-acero-backend' });
});

// Rutas API
app.use('/api/users', usersRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/services', servicesRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, async () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  await testConnection();
});
