export const API_BASE = 'https://marketplace-acero-backend-production.up.railway.app';

// Endpoints públicos
export const API = {
  tiendas:        `${API_BASE}/api/tiendas`,
  tienda:         (id: string) => `${API_BASE}/api/tiendas/${id}`,
  productos:      `${API_BASE}/api/productos`,
  productosTienda:(id: string) => `${API_BASE}/api/productos/tienda/${id}`,
  login:          `${API_BASE}/api/auth/login`,
  register:       `${API_BASE}/api/auth/register`,
  logout:         `${API_BASE}/api/auth/logout`,
  forgotPassword: `${API_BASE}/api/auth/forgot-password`,
  resetPassword:  `${API_BASE}/api/auth/reset-password`,
  verifyOtp:      `${API_BASE}/api/auth/verify-otp`,
  health:         `${API_BASE}/api/health`,
  // Endpoints admin (requieren JWT)
  adminTienda:    `${API_BASE}/api/admin/tienda`,
  adminProductos: `${API_BASE}/api/admin/productos`,
  adminProducto:  (id: string) => `${API_BASE}/api/admin/productos/${id}`,
  adminStats:     `${API_BASE}/api/admin/estadisticas`,
  adminPlan:      `${API_BASE}/api/admin/suscripcion`,
  adminUpgrade:   `${API_BASE}/api/admin/suscripcion/upgrade`,
  // Chat
  chat:           (tienda_id: string) => `${API_BASE}/api/chat/${tienda_id}`,
  // Analytics (público — fire and forget)
  analytics:      `${API_BASE}/api/analytics/visita`,
  // Banners publicitarios
  banners:        `${API_BASE}/api/banners`,
  bannersAdmin:   `${API_BASE}/api/banners/admin`,
  bannerById:     (id: string) => `${API_BASE}/api/banners/${id}`,
  bannerToggle:   (id: string) => `${API_BASE}/api/banners/${id}/toggle`,
  // Superadmin (requieren JWT + rol superadmin)
  saResumen:      `${API_BASE}/api/superadmin/resumen`,
  saTiendas:      `${API_BASE}/api/superadmin/tiendas`,
  saTienda:       (id: string) => `${API_BASE}/api/superadmin/tiendas/${id}`,
  saTiendaPlan:   (id: string) => `${API_BASE}/api/superadmin/tiendas/${id}/plan`,
  saUsuarios:         `${API_BASE}/api/superadmin/usuarios`,
  saPendientes:       `${API_BASE}/api/superadmin/pendientes`,
  saAprobar:          (id: string) => `${API_BASE}/api/superadmin/tiendas/${id}/aprobar`,
  saRechazar:         (id: string) => `${API_BASE}/api/superadmin/tiendas/${id}/rechazar`,
  saReclamaciones:    `${API_BASE}/api/superadmin/reclamaciones`,
  saReclamacion:      (id: string) => `${API_BASE}/api/superadmin/reclamaciones/${id}`,
  prospeccion:        `${API_BASE}/api/prospeccion`,
  appConfig:          `${API_BASE}/api/config`,
  // Cotizaciones
  cotizacionCatalogo: `${API_BASE}/api/cotizaciones/catalogo`,
  cotizacionNueva:    `${API_BASE}/api/cotizaciones`,
  cotizacionHistorial:(tel: string) => `${API_BASE}/api/cotizaciones/historial/${tel}`,
};

// ── Demo / Trial ──────────────────────────────────────────
// Pon null para desactivar el bloqueo (producción definitiva)
// Cambia la fecha para extender el período de prueba
export const TRIAL_UNTIL: string | null = '2026-04-19'; // 7 días desde 2026-04-12

// ── Identidad Markel Play ──────────────────────────────────
export const APP_NAME    = 'MARKETPLACE DEL ACERO';
export const APP_TAGLINE = 'Marketplace del Acero · Lima';

export const COLORS = {
  primary:   '#C0392B',   // Rojo acero — color principal
  secondary: '#1C2833',   // Carbon oscuro — headers / fondos
  accent:    '#E67E22',   // Naranja industrial — acentos
  gold:      '#F1C40F',   // Dorado — tiendas premium
  bg:        '#F2F2F2',   // Gris claro — fondos de pantalla
  card:      '#FFFFFF',
  text:      '#1A1A1A',
  textLight: '#888888',
  border:    '#ECECEC',
  success:   '#27AE60',
  verified:  '#2980B9',
};
