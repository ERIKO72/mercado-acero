# 🔩 Marketplace del Acero

Aplicación mobile para comprar acero, comparar precios y encontrar servicios (corte, doblez, láser) en Lima y Perú.

---

## Stack técnico

| Capa       | Tecnología                              |
|------------|-----------------------------------------|
| Frontend   | React Native + Expo Router              |
| Backend    | Node.js + Express                       |
| Base datos | PostgreSQL                              |
| Mapas      | react-native-maps                       |
| GPS        | expo-location                           |
| Rutas      | OSRM (gratuito) + Waze/Google Maps deep link |

---

## Estructura del proyecto

```
marketplace-acero/
│
├── app/
│   ├── _layout.tsx              ← Navegación raíz (Stack)
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← Tab navigator
│   │   ├── index.tsx            ← Pantalla principal: mapa + lista con GPS
│   │   └── explore.tsx          ← Búsqueda por categoría / texto
│   └── screens/
│       ├── detail.tsx           ← Detalle tienda + rutas tipo Waze
│       └── register-store.tsx   ← Alta de nueva tienda
│
├── components/
│   └── TiendaCard.tsx           ← Tarjeta reutilizable de tienda
│
├── hooks/
│   └── useLocation.ts           ← Hook geolocalización real
│
├── constants/
│   └── api.ts                   ← URL del backend + colores
│
├── backend/
│   ├── server.js                ← Servidor Express principal
│   ├── db.js                    ← Pool PostgreSQL
│   ├── schema.sql               ← Tablas + datos de prueba (8 tiendas Lima)
│   ├── .env.example             ← Variables de entorno
│   └── routes/
│       ├── tiendas.js           ← GET /api/tiendas (geo-filtro), POST, GET /:id
│       └── productos.js         ← GET /api/productos
│
├── package.json
└── README.md
```

---

## Paso 1 — Base de datos PostgreSQL

### Instalar PostgreSQL (si no lo tienes)
```bash
# macOS
brew install postgresql && brew services start postgresql

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo service postgresql start

# Windows → descargar desde https://www.postgresql.org/download/windows/
```

### Crear la base de datos y ejecutar el schema
```bash
psql -U postgres -c "CREATE DATABASE marketplace_acero;"
psql -U postgres -d marketplace_acero -f backend/schema.sql
```

Esto crea todas las tablas y carga **8 tiendas de Lima** con productos y servicios de ejemplo.

---

## Paso 2 — Backend

```bash
cd backend
cp .env.example .env
# Edita .env con tu password de PostgreSQL
npm install
npm run dev
```

El servidor corre en **http://localhost:4000**

### Endpoints disponibles

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | /health | Health check |
| GET | /api/tiendas | Tiendas (con filtros: lat, lng, radio, q, servicio, distrito) |
| GET | /api/tiendas/:id | Detalle completo (productos + servicios + reseñas) |
| POST | /api/tiendas | Registrar nueva tienda |
| GET | /api/productos | Productos (con filtros: tienda_id, categoria, q) |

### Ejemplo con geolocalización
```
GET /api/tiendas?lat=-12.0464&lng=-77.0428&radio=15&servicio=corte cnc
```

---

## Paso 3 — Frontend

### ⚠️ Configurar IP del backend

Edita `constants/api.ts` y reemplaza `TU_IP_LOCAL` con la IP de tu máquina:

```bash
# macOS / Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

```typescript
// constants/api.ts
export const API_BASE = 'http://192.168.0.48:4000';  // ← tu IP aquí
```

> ❌ No uses `localhost` — el celular no llega a tu máquina por ese nombre.

### Instalar dependencias y ejecutar

```bash
# En la raíz del proyecto (no en /backend)
npm install
npx expo start
```

Escanea el QR con **Expo Go** (iOS / Android) o presiona `a` para Android emulador.

---

## Paso 4 — Generar APK

```bash
# Instalar EAS CLI si no lo tienes
npm install -g eas-cli

# Login en Expo
eas login

# Build APK (preview = APK instalable, no Play Store)
eas build -p android --profile preview
```

---

## Funcionalidades implementadas

### ✅ Pantalla principal (index.tsx)
- Geolocalización real con `expo-location`
- Mapa con marcadores de tiendas cercanas
- Círculo visual del radio de búsqueda
- Popup al tocar un marcador en el mapa
- Filtro por radio: 5 / 10 / 20 / 50 km
- Filtro por servicio: corte CNC, doblez, soldadura, láser
- Búsqueda por texto
- Toggle mapa / lista
- Pull to refresh

### ✅ Detalle de tienda (detail.tsx)
- Mapa con la tienda marcada
- **Botón "Ruta"**: calcula ruta real con OSRM y la dibuja en el mapa
- **Botón "Waze"**: abre Waze con navegación directa
- **Botón "Maps"**: abre Google Maps con dirección
- **Botón "Llamar"**: llama directamente
- Tabs: Info / Productos / Servicios / Reseñas
- Distancia calculada desde tu ubicación

### ✅ Explorar (explore.tsx)
- Búsqueda libre por texto
- Accesos rápidos por categoría

### ✅ Registro de tienda (register-store.tsx)
- Formulario completo
- Selección visual de distrito
- Mapa con pin arrastrable para ubicar exactamente
- Botón "Usar mi ubicación" con GPS
- Selección múltiple de servicios ofrecidos

### ✅ Backend (Node.js + PostgreSQL)
- Consulta geoespacial con fórmula Haversine
- Filtro por radio, texto, servicio, distrito
- Seed con 8 tiendas reales en Lima
- Estructura lista para escalar (multiempresa, multialmacén)

---

## Próximos pasos (roadmap)

1. **Autenticación** — JWT para tiendas y compradores
2. **Panel admin de tienda** — gestionar productos, precios, stock
3. **Sistema de cotizaciones** — el comprador pide precio, la tienda responde
4. **Push notifications** — alertas de precios, nuevas tiendas cercanas
5. **Facturación electrónica** — integración SUNAT (ver documento técnico ERP)
6. **Pagos** — Yape, Plin, tarjeta via Culqi/Niubiz
7. **Comparador de precios** — mismo producto en varias tiendas

---

## Variables de entorno (backend/.env)

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketplace_acero
DB_USER=postgres
DB_PASSWORD=tu_password
```
