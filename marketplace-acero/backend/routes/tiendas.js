// backend/routes/tiendas.js
const router = require('express').Router();
const db     = require('../db');

// ─────────────────────────────────────────────────────────────
//  GET /api/tiendas
//  Query params: lat, lng, radio (km), distrito, servicio, q
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radio = 20, distrito, servicio, q } = req.query;

    let query = `
      SELECT
        t.*,
        ARRAY_AGG(DISTINCT s.nombre) FILTER (WHERE s.nombre IS NOT NULL) AS servicios_nombres,
        COUNT(DISTINCT p.id)::int AS total_productos
    `;

    // Si hay coordenadas, calcular distancia con Haversine (en km)
    if (lat && lng) {
      query += `,
        ROUND(
          (6371 * acos(
            cos(radians($1::float)) * cos(radians(t.latitud::float)) *
            cos(radians(t.longitud::float) - radians($2::float)) +
            sin(radians($1::float)) * sin(radians(t.latitud::float))
          ))::numeric, 1
        ) AS distancia_km
      `;
    } else {
      query += `, NULL AS distancia_km`;
    }

    query += `
      FROM tiendas t
      LEFT JOIN servicios  s ON s.tienda_id = t.id AND s.activo = true
      LEFT JOIN productos  p ON p.tienda_id = t.id AND p.activo = true
      WHERE t.activa = true
    `;

    const params = [];
    let idx = 1;

    if (lat && lng) {
      params.push(parseFloat(lat), parseFloat(lng));
      idx = 3;
      // Filtro por radio usando bounding box aproximado (más rápido)
      query += ` AND (
        6371 * acos(
          cos(radians($1::float)) * cos(radians(t.latitud::float)) *
          cos(radians(t.longitud::float) - radians($2::float)) +
          sin(radians($1::float)) * sin(radians(t.latitud::float))
        )
      ) <= $${idx++}::float`;
      params.push(parseFloat(radio));
    }

    if (distrito) {
      query += ` AND LOWER(t.distrito) ILIKE $${idx++}`;
      params.push(`%${distrito.toLowerCase()}%`);
    }

    if (q) {
      query += ` AND (t.nombre ILIKE $${idx} OR t.descripcion ILIKE $${idx})`;
      params.push(`%${q}%`);
      idx++;
    }

    query += ` GROUP BY t.id`;

    if (servicio) {
      query += ` HAVING ARRAY_AGG(DISTINCT LOWER(s.nombre)) @> ARRAY[$${idx++}::text]`;
      params.push(servicio.toLowerCase());
    }

    if (lat && lng) {
      query += ` ORDER BY distancia_km ASC NULLS LAST`;
    } else {
      query += ` ORDER BY t.calificacion DESC`;
    }

    const { rows } = await db.query(query, params);
    res.json({ ok: true, total: rows.length, data: rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/tiendas/:id  — detalle + productos + servicios
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query;

    let distanciaSQL = `NULL AS distancia_km`;
    const params = [id];

    if (lat && lng) {
      distanciaSQL = `
        ROUND((6371 * acos(
          cos(radians($2::float)) * cos(radians(t.latitud::float)) *
          cos(radians(t.longitud::float) - radians($3::float)) +
          sin(radians($2::float)) * sin(radians(t.latitud::float))
        ))::numeric, 1) AS distancia_km
      `;
      params.push(parseFloat(lat), parseFloat(lng));
    }

    const tiendaQ = await db.query(
      `SELECT t.*, ${distanciaSQL} FROM tiendas t WHERE t.id = $1 AND t.activa = true`,
      params
    );
    if (!tiendaQ.rows.length) return res.status(404).json({ ok: false, error: 'Tienda no encontrada' });

    const productosQ = await db.query(
      `SELECT * FROM productos WHERE tienda_id=$1 AND activo=true ORDER BY categoria, nombre`,
      [id]
    );
    const serviciosQ = await db.query(
      `SELECT * FROM servicios WHERE tienda_id=$1 AND activo=true ORDER BY nombre`,
      [id]
    );
    const reseñasQ = await db.query(
      `SELECT * FROM reseñas WHERE tienda_id=$1 ORDER BY created_at DESC LIMIT 10`,
      [id]
    );

    res.json({
      ok: true,
      data: {
        ...tiendaQ.rows[0],
        productos: productosQ.rows,
        servicios: serviciosQ.rows,
        reseñas:   reseñasQ.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/tiendas  — registrar nueva tienda
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      nombre, descripcion, ruc, telefono, email,
      direccion, distrito, latitud, longitud, horario
    } = req.body;

    if (!nombre || latitud === undefined || longitud === undefined) {
      return res.status(400).json({ ok: false, error: 'nombre, latitud y longitud son requeridos' });
    }

    const result = await db.query(
      `INSERT INTO tiendas (nombre,descripcion,ruc,telefono,email,direccion,distrito,latitud,longitud,horario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [nombre, descripcion, ruc, telefono, email, direccion, distrito, latitud, longitud, horario]
    );

    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
