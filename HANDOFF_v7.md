# HANDOFF — MARKETPLACE DEL ACERO v7
**Fecha:** Abril 2026  
**Stack:** React Native (Expo 54) + Node.js/Express + PostgreSQL 17  
**IP local:** `192.168.0.48` | **Puerto backend:** `4000`

---

## 1. ESTADO ACTUAL — QUÉ FUNCIONA

### App móvil (Expo Go)
| Pantalla | Estado | Descripción |
|----------|--------|-------------|
| Inicio | ✅ | Mapa + lista de tiendas, banner carrusel rotativo (4 slides), búsqueda, filtro por radio |
| Explorar | ✅ | Búsqueda por tienda o producto, categorías rápidas, cotizar por WhatsApp |
| Favoritos | ✅ | Tiendas guardadas localmente con AsyncStorage, se refresca al enfocar |
| Detalle tienda | ✅ | Info, Productos, Servicios, Reseñas con estrellas, Chat, Waze, Maps, Ruta OSRM |
| Chat en vivo | ✅ | Mensajes guardados en DB, polling cada 3 seg, UI tipo WhatsApp |
| Login | ✅ | Email + contraseña, mostrar/ocultar, JWT 7 días |
| Registrar tienda | ✅ | Crea tienda + usuario dueño en un solo flujo, auto-login |
| Dashboard admin | ✅ | Panel con menú 2×2, bienvenida, Tip Pro, cerrar sesión |
| Mi Tienda (admin) | ✅ | Editar datos, subir logo a Cloudinary |
| Productos (admin) | ✅ | CRUD completo, subir foto por producto |
| Estadísticas (admin) | ✅ | Conteo de productos activos, gráfico de visitas semanales |
| Mi Plan (admin) | ✅ | Ver plan actual, modal de pago con formulario de tarjeta, upgrade funcional |

### Mapa
- **Tiendas Premium** → pin dorado ★ (más grande)
- **Tiendas normales** → pin rojo pequeño
- Círculo de radio de búsqueda
- Popup al tocar un pin → ir al detalle

### Identidad visual
- Nombre: **MARKETPLACE DEL ACERO**
- Paleta: Rojo acero `#C0392B` · Carbón `#1C2833` · Dorado `#F1C40F`
- Header rojo con logo `MP` en todos los módulos

---

## 2. ARQUITECTURA

```
marketplace-acero/
├── app/
│   ├── _layout.tsx              ← Stack raíz, push notifications
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← Tabs: Inicio / Explorar / Favoritos
│   │   ├── index.tsx            ← Pantalla Inicio (mapa + lista + banner)
│   │   ├── explore.tsx          ← Explorar tiendas y productos
│   │   └── favoritos.tsx        ← Tiendas favoritas
│   └── screens/
│       ├── login.tsx            ← Login con logo MARKETPLACE
│       ├── register-store.tsx   ← Registro tienda + dueño
│       ├── detail.tsx           ← Detalle de tienda
│       ├── chat.tsx             ← Chat en vivo (polling 3s)
│       └── admin/
│           ├── dashboard.tsx    ← Panel admin (menú 2×2)
│           ├── edit-store.tsx   ← Editar tienda + Cloudinary
│           ├── products.tsx     ← CRUD productos
│           ├── stats.tsx        ← Estadísticas
│           └── subscription.tsx ← Planes + modal de pago
├── components/
│   ├── TiendaCard.tsx           ← Card con badge Premium, favorito, avatar
│   ├── MapaTiendas.native.tsx   ← Mapa con pines dorados/rojos
│   ├── MapaTiendas.web.tsx      ← Fallback web (OpenStreetMap iframe)
│   ├── MapaDetalle.native.tsx   ← Mapa en pantalla de detalle
│   └── MapaRegistro.native.tsx  ← Mapa para elegir ubicación al registrar
├── hooks/
│   ├── useLocation.ts           ← GPS del dispositivo
│   ├── useFavoritos.ts          ← AsyncStorage: toggle/esFavorito/recargar
│   ├── useEditStore.ts          ← Fetch y guardado de datos de tienda
│   └── usePushNotifications.ts  ← Token Expo Push (silencioso sin EAS)
├── constants/
│   └── api.ts                   ← API_BASE, API endpoints, COLORS, APP_NAME
└── utils/
    └── cloudinary.ts            ← uploadImage(), thumbUrl()

backend/
├── server.js                    ← Express + http.createServer + Socket.io opcional
├── db.js                        ← Pool PostgreSQL
├── middleware/
│   └── auth.js                  ← Verifica JWT Bearer token
├── routes/
│   ├── auth.js                  ← POST /register, POST /login
│   ├── tiendas.js               ← GET / (con destacada JOIN), GET /:id, POST /
│   ├── productos.js             ← GET ?q= (búsqueda con datos de tienda)
│   ├── admin.js                 ← CRUD protegido + POST /suscripcion/upgrade
│   ├── notificaciones.js        ← POST /registrar, GET /total
│   └── chat.js                  ← GET /:tienda_id, POST /:tienda_id
├── schema.sql                   ← Schema completo + seed 28 tiendas Lima
├── migration-v7.sql             ← Tabla mensajes_chat + 4 tiendas Premium demo
└── seed-usuario.js              ← Crea dueno@test.com / 123456 con hash correcto
```

---

## 3. BASE DE DATOS

### Tablas principales
```sql
tiendas          — id, nombre, descripcion, ruc, telefono, email,
                   direccion, distrito, latitud, longitud, logo_url,
                   horario, calificacion, verificada, activa

usuarios_tienda  — id, tienda_id, email, password_hash, nombre, activo

planes           — id, nombre (gratis/basico/premium), precio_mensual,
                   visible_mapa, destacada, max_productos, tiene_banner

suscripciones    — id, tienda_id, plan_id, fecha_inicio, fecha_fin, activa

productos        — id, tienda_id, nombre, categoria, unidad, precio,
                   stock, imagen_url, activo

servicios        — id, tienda_id, nombre, descripcion, precio_desde

resenias         — id, tienda_id, autor, calificacion (1-5), comentario

mensajes_chat    — id, tienda_id, autor, texto, es_dueno, created_at

push_tokens      — id, token, plataforma, activo
```

### Planes configurados
| Plan | Precio | Productos | Pin mapa | Banner |
|------|--------|-----------|----------|--------|
| gratis | S/ 0 | 5 | Rojo normal | No |
| basico | S/ 49 | 20 | Rojo normal | No |
| premium | S/ 99 | 100 | **Dorado ★** | Sí |

---

## 4. API ENDPOINTS

### Públicos
```
GET  /api/health
GET  /api/tiendas?lat=&lng=&radio=&q=    ← incluye destacada del plan
GET  /api/tiendas/:id                     ← con productos, servicios, reseñas
POST /api/tiendas                         ← registrar nueva tienda
POST /api/tiendas/:id/resenias
GET  /api/productos?q=
GET  /api/chat/:tienda_id
POST /api/chat/:tienda_id
POST /api/auth/register
POST /api/auth/login
POST /api/notificaciones/registrar
GET  /api/notificaciones/total
```

### Admin (requieren `Authorization: Bearer TOKEN`)
```
GET  /api/admin/tienda
PUT  /api/admin/tienda
GET  /api/admin/productos
POST /api/admin/productos
PUT  /api/admin/productos/:id
DEL  /api/admin/productos/:id
GET  /api/admin/estadisticas
GET  /api/admin/suscripcion
POST /api/admin/suscripcion/upgrade       ← { plan_nombre: 'premium' }
```

---

## 5. CONFIGURACIÓN

### Variables de entorno — `backend/.env`
```env
PORT=4000
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/marketplace_acero
JWT_SECRET=marketplace_acero_secret_2026
```

### Cloudinary — `marketplace-acero/.env.local`
```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dxlzphu2i
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=marketplace_acero
```

### IP del servidor — `constants/api.ts`
```ts
export const API_BASE = 'http://192.168.0.48:4000';
// Actualizar si cambia la IP de la máquina
```

---

## 6. CÓMO ARRANCAR

### Primera vez (base de datos)
```bash
# 1. Crear DB
psql -U postgres -c "CREATE DATABASE marketplace_acero;"

# 2. Schema + seed 28 tiendas
psql -U postgres -d marketplace_acero -f backend/schema.sql

# 3. Migración v7 (chat + tiendas premium demo)
psql -U postgres -d marketplace_acero -f backend/migration-v7.sql

# 4. Usuario de prueba con hash correcto
cd backend && node seed-usuario.js
# → dueno@test.com / 123456
```

### Arranque normal (cada vez)
```bash
# Terminal 1 — Backend
cd "D:\APP EDUCATIVAS\marketplace-del-acero\marketplace-acero\backend"
npm start
# Debe mostrar: MARKETPLACE DEL ACERO v7 — Puerto 4000

# Terminal 2 — App
cd "D:\APP EDUCATIVAS\marketplace-del-acero\marketplace-acero"
npx expo start --clear
# Escanear QR con Expo Go
```

### Socket.io (chat en tiempo real puro — opcional)
```bash
cd backend && npm install socket.io
# Sin instalar, el chat funciona igual via polling cada 3 segundos
```

---

## 7. USUARIO DE PRUEBA
```
Email:    dueno@test.com
Password: 123456
Tienda:   Aceros del Sur SAC (Callao)
```

---

## 8. FUNCIONES CLAVE — NOTAS TÉCNICAS

### Banner carrusel rotativo
- 4 slides auto-rotativos cada 3.5 s
- Pausa al arrastrar, retoma al soltar
- Dots indicadores tocables
- Slide 1 muestra stats dinámicos (total tiendas, premium, verificadas)
- Slides 2-4 tienen CTA que navegan a pantallas relevantes

### Teclado no se cierra al escribir
- **Causa del bug:** Definir `const Header = () => (...)` DENTRO del componente padre hace que React destruya y recree el TextInput en cada keystroke
- **Fix aplicado:** `SearchHeader` y `ExploreHeader` están definidos FUERA de sus componentes padres + `keyboardShouldPersistTaps="handled"` + `keyboardDismissMode="none"` en FlatList

### Tab Inicio — scroll al tope
- `useScrollToTop(flatListRef)` de `@react-navigation/native`
- Al tocar el tab Inicio cuando ya estás en él → scroll automático al tope

### Tiendas Premium en mapa
- La query de `GET /api/tiendas` hace LEFT JOIN con `suscripciones` y `planes`
- Retorna `destacada: true/false` en cada tienda
- `MapaTiendas.native.tsx` renderiza un marcador dorado ★ para las premium

### Upgrade de plan
- Frontend: modal con formulario de tarjeta (número, vencimiento, CVV, titular)
- Backend: `POST /api/admin/suscripcion/upgrade` desactiva plan anterior e inserta nuevo con 30 días
- El pin dorado aparece en el mapa inmediatamente tras el upgrade

### Push Notifications
- Se registran solo si hay `projectId` de EAS configurado
- Sin EAS: silencioso, no interrumpe el arranque
- Para activar en producción: configurar EAS y agregar `extra.eas.projectId` en `app.json`

---

## 9. DEPENDENCIAS

### Frontend (package.json)
```
expo ~54.0.33 | expo-router ~6.0.23
react-native 0.81.5 | react 19.1.0
react-native-maps 1.20.1
expo-location ~19.0.8
expo-notifications ~0.32.16
expo-image-picker ~17.0.10
@react-native-async-storage/async-storage 2.2.0
@react-navigation/native ^7.1.8
```

### Backend (package.json)
```
express ^4.22.1 | cors ^2.8.6 | morgan ^1.10.1
pg ^8.20.0 | bcryptjs ^3.0.3 | jsonwebtoken ^9.0.3
dotenv ^16.6.1
socket.io  ← OPCIONAL, instalar con: npm install socket.io
```

---

## 10. PRÓXIMOS PASOS SUGERIDOS

### Inmediato
- [ ] **Super-admin:** Panel para gestionar TODAS las tiendas sin crear un segundo login — solo agregar campo `rol = 'superadmin'` en `usuarios_tienda` y una pantalla `/screens/superadmin/dashboard`
- [ ] **EAS / Build APK:** `eas build --platform android` para generar APK instalable
- [ ] **Dominio / IP fija:** Mover backend a un servidor real (Railway, Render, DigitalOcean) y actualizar `API_BASE`

### Corto plazo
- [ ] **Pasarela de pagos real:** Integrar Culqi (Perú) en el modal de pago — reemplazar simulación por `culqi.createToken()` + `culqi.createCharge()`
- [ ] **Chat con Socket.io:** Instalar `socket.io` (backend) + `socket.io-client` (frontend) para mensajes en tiempo real sin polling
- [ ] **Panel Super-admin:** CRUD de todas las tiendas, asignar planes manualmente, ver estadísticas globales

### Mediano plazo
- [ ] **Notificaciones push reales:** Configurar EAS project, agregar `projectId` a `app.json`, publicar en Expo
- [ ] **Búsqueda por ubicación real:** Activar extensión PostGIS para filtrar por distancia con coordenadas reales (`ST_Distance`)
- [ ] **SEO / Web version:** Expo web ya funciona — configurar dominio y meta tags

---

## 11. ERRORES CONOCIDOS RESUELTOS

| Error | Causa | Fix |
|-------|-------|-----|
| `navigation.emit is not a function` | Expo Router no expone `emit` en tab listeners | Eliminado, `useScrollToTop` lo reemplaza |
| `whiteSpace: 'nowrap'` | Propiedad CSS no válida en React Native | Eliminada |
| Teclado se cierra al escribir | Header definido dentro del componente padre | Headers movidos fuera del componente |
| `No "projectId" found` | `getExpoPushTokenAsync()` sin EAS configurado | Skip silencioso si no hay projectId |
| Login "credenciales incorrectas" | Hash bcrypt hardcodeado incorrecto en schema.sql | `seed-usuario.js` genera el hash en runtime |
| Admin panel no cargaba | Faltaban `middleware/auth.js` y `routes/admin.js` | Creados desde cero |
| Registro solo creaba tienda | Faltaba crear el usuario dueño | Flujo de 2 pasos: tienda → usuario → auto-login |

---

*Generado automáticamente — Marketplace del Acero v7 — Abril 2026*
