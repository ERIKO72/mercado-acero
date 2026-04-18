-- ============================================================
--  MARKETPLACE DEL ACERO — Schema PostgreSQL
-- ============================================================

-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
--  TIENDAS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tiendas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(120)  NOT NULL,
  descripcion TEXT,
  ruc         VARCHAR(11),
  telefono    VARCHAR(15),
  email       VARCHAR(120),
  direccion   TEXT,
  distrito    VARCHAR(60),
  latitud     NUMERIC(10, 7) NOT NULL,
  longitud    NUMERIC(10, 7) NOT NULL,
  logo_url    TEXT,
  horario     VARCHAR(80)   DEFAULT 'Lun-Sab 8am-6pm',
  calificacion NUMERIC(2,1) DEFAULT 4.0,
  verificada  BOOLEAN       DEFAULT false,
  activa      BOOLEAN       DEFAULT true,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  SERVICIOS POR TIENDA
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS servicios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id  UUID REFERENCES tiendas(id) ON DELETE CASCADE,
  nombre     VARCHAR(80) NOT NULL,  -- corte, doblez, laser, soldadura, etc.
  descripcion TEXT,
  precio_desde NUMERIC(10,2),
  activo     BOOLEAN DEFAULT true
);

-- ─────────────────────────────────────────
--  PRODUCTOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id   UUID REFERENCES tiendas(id) ON DELETE CASCADE,
  codigo      VARCHAR(40),
  nombre      VARCHAR(120) NOT NULL,
  descripcion TEXT,
  categoria   VARCHAR(60),   -- tubos, perfiles, planchas, angulos, etc.
  unidad      VARCHAR(20)  DEFAULT 'ml',  -- ml, kg, m2, unidad
  precio      NUMERIC(10,2) NOT NULL,
  stock       INTEGER DEFAULT 0,
  imagen_url  TEXT,
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  RESEÑAS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reseñas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id  UUID REFERENCES tiendas(id) ON DELETE CASCADE,
  autor      VARCHAR(80),
  calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  SEED DATA — Lima, Perú
-- ─────────────────────────────────────────
INSERT INTO tiendas (nombre, descripcion, ruc, telefono, direccion, distrito, latitud, longitud, horario, calificacion, verificada)
VALUES
  ('Aceros del Sur SAC',     'Distribuidor mayorista de acero estructural y planchas',     '20501234561', '01-234-5678', 'Av. Argentina 1250, Callao',         'Callao',        -12.0523, -77.1081, 'Lun-Sab 7am-5pm',  4.7, true),
  ('Metálica Lima',          'Perfiles, tubos y servicios de corte con CNC',               '20501234562', '01-234-5679', 'Jr. Industria 430, La Victoria',     'La Victoria',   -12.0664, -77.0093, 'Lun-Vie 8am-6pm',  4.5, true),
  ('Ferromax Perú',          'Acero corrugado, vigas y columnas para construcción',        '20501234563', '01-234-5680', 'Av. Industrial 890, Los Olivos',     'Los Olivos',    -11.9907, -77.0642, 'Lun-Sab 7am-7pm',  4.3, false),
  ('Aceros Express',         'Corte, doblez y láser para industria y taller',              '20501234564', '01-234-5681', 'Calle Los Tornillos 120, Villa El Salvador', 'VES',    -12.2125, -76.9389, 'Lun-Vie 8am-5pm',  4.6, true),
  ('MetalPro Lima',          'Plancha naval, inox y aluminio. Entrega a domicilio',        '20501234565', '01-234-5682', 'Av. Tupac Amaru 3300, Comas',        'Comas',         -11.9418, -77.0469, 'Lun-Sab 8am-6pm',  4.4, false),
  ('Aceros del Norte Lima',  'Especialistas en perfiles estructurales y tubería mecánica', '20501234566', '01-234-5683', 'Av. Universitaria 4500, SMP',        'San Martín',    -11.9995, -77.0803, 'Lun-Vie 7am-5pm',  4.2, false),
  ('Distribuidora Hierro SA','Hierro fundido y forjado, rejas y balcones a medida',        '20501234567', '01-234-5684', 'Jr. Comercio 780, Ate',              'Ate',           -12.0281, -76.9192, 'Lun-Sab 8am-6pm',  4.8, true),
  ('TuboAcero Lima',         'Tubo estructural galvanizado y negro en todas las medidas',  '20501234568', '01-234-5685', 'Av. Separadora Industrial 1100, ATE','Ate',           -12.0456, -76.9105, 'Lun-Vie 7am-6pm',  4.1, false);

INSERT INTO productos (tienda_id, nombre, categoria, unidad, precio, stock)
SELECT t.id, p.nombre, p.categoria, p.unidad, p.precio, p.stock
FROM tiendas t
CROSS JOIN (VALUES
  ('Tubo acero negro 2"',          'tubos',    'm',     45.00,  500),
  ('Perfil H 6"x6"',               'perfiles', 'm',    120.00,  200),
  ('Plancha LAF 1/8"',             'planchas', 'm2',    85.00,  300),
  ('Ángulo 1.5"x3mm',              'angulos',  'm',     25.00, 1000),
  ('Tubo estructural 100x100x3mm', 'tubos',    'm',     95.00,  150),
  ('Platina 1/4"x2"',              'platinas', 'm',     18.00,  800)
) AS p(nombre, categoria, unidad, precio, stock)
WHERE t.nombre = 'Aceros del Sur SAC';

INSERT INTO servicios (tienda_id, nombre, descripcion, precio_desde)
SELECT t.id, s.nombre, s.descripcion, s.precio
FROM tiendas t
CROSS JOIN (VALUES
  ('Corte CNC',    'Corte por plasma o laser con tolerancia ±0.5mm', 15.00),
  ('Doblez',       'Doblado en prensa hidráulica hasta 10mm',        12.00),
  ('Soldadura MIG','Soldadura estructural con certificado',          25.00)
) AS s(nombre, descripcion, precio)
WHERE t.nombre IN ('Metálica Lima','Aceros Express');
