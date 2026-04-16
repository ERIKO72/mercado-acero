import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Linking, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { useCarrito, ItemCarrito } from '../../hooks/useCarrito';
import SkeletonCard from '../../components/SkeletonCard';
import { API_BASE, COLORS } from '../../constants/api';

// ── Tipos de material ────────────────────────────────────────
type TipoMaterial = 'tubos' | 'planchas' | 'perfiles' | 'varillas';

type ConfigMaterial = {
  label:     string;
  icono:     string;
  categoria: string;
  campos:    { key: string; label: string; placeholder: string; unidad: string }[];
  calcular:  (vals: Record<string, number>) => { cantidad: number; unidad: string; descripcion: string };
};

const MATERIALES: Record<TipoMaterial, ConfigMaterial> = {
  tubos: {
    label:     'Tubos',
    icono:     '⬛',
    categoria: 'tubos',
    campos: [
      { key: 'longitud', label: 'Longitud total necesaria', placeholder: 'ej: 48', unidad: 'metros' },
      { key: 'desperdicio', label: 'Desperdicio estimado', placeholder: 'ej: 10', unidad: '%' },
    ],
    calcular: ({ longitud, desperdicio = 0 }) => {
      const total    = longitud * (1 + (desperdicio || 0) / 100);
      const cantidad = Math.ceil(total / 6);
      return { cantidad, unidad: 'tubos de 6m', descripcion: `${total.toFixed(1)}m totales → ${cantidad} tubos de 6m` };
    },
  },
  planchas: {
    label:     'Planchas',
    icono:     '🔲',
    categoria: 'planchas',
    campos: [
      { key: 'area', label: 'Área total a cubrir', placeholder: 'ej: 20', unidad: 'm²' },
      { key: 'desperdicio', label: 'Desperdicio estimado', placeholder: 'ej: 15', unidad: '%' },
    ],
    calcular: ({ area, desperdicio = 0 }) => {
      const total    = area * (1 + (desperdicio || 0) / 100);
      const cantidad = Math.ceil(total / (2.4 * 1.2)); // plancha estándar 2.4×1.2m
      return { cantidad, unidad: 'planchas (2.4×1.2m)', descripcion: `${total.toFixed(1)}m² → ${cantidad} planchas estándar` };
    },
  },
  perfiles: {
    label:     'Perfiles / Ángulos',
    icono:     '📐',
    categoria: 'perfiles',
    campos: [
      { key: 'longitud', label: 'Longitud total necesaria', placeholder: 'ej: 30', unidad: 'metros' },
      { key: 'desperdicio', label: 'Desperdicio estimado', placeholder: 'ej: 10', unidad: '%' },
    ],
    calcular: ({ longitud, desperdicio = 0 }) => {
      const total    = longitud * (1 + (desperdicio || 0) / 100);
      const cantidad = Math.ceil(total / 6);
      return { cantidad, unidad: 'barras de 6m', descripcion: `${total.toFixed(1)}m → ${cantidad} barras de 6m` };
    },
  },
  varillas: {
    label:     'Varillas',
    icono:     '➖',
    categoria: 'varillas',
    campos: [
      { key: 'longitud', label: 'Longitud total necesaria', placeholder: 'ej: 90', unidad: 'metros' },
      { key: 'desperdicio', label: 'Desperdicio estimado', placeholder: 'ej: 5', unidad: '%' },
    ],
    calcular: ({ longitud, desperdicio = 0 }) => {
      const total    = longitud * (1 + (desperdicio || 0) / 100);
      const cantidad = Math.ceil(total / 9);
      return { cantidad, unidad: 'varillas de 9m', descripcion: `${total.toFixed(1)}m → ${cantidad} varillas de 9m` };
    },
  },
};

// ── Helpers ──────────────────────────────────────────────────
function formatWhatsApp(telefono: string, tiendaNombre: string, material: string, cantidad: number, unidad: string) {
  const digits = telefono.replace(/\D/g, '');
  const numero = digits.startsWith('51') ? digits : '51' + digits;
  const msg    = encodeURIComponent(
    `Hola! Vi tu tienda *${tiendaNombre}* en Marketplace del Acero.\n\nNecesito cotización de:\n` +
    `• *${material}* — ${cantidad} ${unidad}\n\n¿Cuál es su precio y disponibilidad?`
  );
  return `https://wa.me/${numero}?text=${msg}`;
}

// ── Tarjeta de resultado de precio ──────────────────────────
function PrecioCard({ producto, cantidad, unidad }: { producto: any; cantidad: number; unidad: string }) {
  const precioTotal = (Number(producto.precio) * cantidad).toFixed(2);
  const waUrl       = formatWhatsApp(producto.tienda_telefono || '', producto.tienda_nombre, producto.nombre, cantidad, unidad);

  return (
    <View style={s.precioCard}>
      <View style={s.precioHeader}>
        {producto.tienda_logo_url
          ? <Image source={{ uri: producto.tienda_logo_url }} style={s.precioLogo} />
          : (
            <View style={s.precioAvatar}>
              <Text style={s.precioAvatarText}>{producto.tienda_nombre?.[0] ?? '?'}</Text>
            </View>
          )
        }
        <View style={{ flex: 1 }}>
          <Text style={s.precioTienda} numberOfLines={1}>{producto.tienda_nombre}</Text>
          <Text style={s.precioDistrito}>{producto.tienda_distrito}</Text>
          {producto.distancia_km != null && (
            <Text style={s.precioDistancia}>📍 {producto.distancia_km} km</Text>
          )}
        </View>
        <View style={s.precioBox}>
          <Text style={s.precioUnitLabel}>S/ {Number(producto.precio).toFixed(2)}/{producto.unidad || 'und'}</Text>
          <Text style={s.precioTotal}>Total: S/ {precioTotal}</Text>
        </View>
      </View>

      <Text style={s.precioNombreProducto} numberOfLines={1}>
        🔩 {producto.nombre}
        {producto.tienda_verificada ? '  ✓ Verificada' : ''}
      </Text>

      <TouchableOpacity
        style={s.btnCotizar}
        onPress={() => {
          if (!producto.tienda_telefono) {
            Alert.alert('Sin teléfono', 'Esta tienda no tiene número registrado.');
            return;
          }
          Linking.openURL(waUrl).catch(() => {});
        }}
      >
        <Text style={s.btnCotizarText}>💬 Cotizar por WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Pantalla principal ───────────────────────────────────────
export default function CubicadoraScreen() {
  const { location }                          = useLocation();
  const { items, agregar, eliminar, limpiar } = useCarrito();

  const [tipo,      setTipo]      = useState<TipoMaterial>('tubos');
  const [valores,   setValores]   = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<{ cantidad: number; unidad: string; descripcion: string } | null>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando,  setCargando]  = useState(false);
  const [buscado,   setBuscado]   = useState(false);
  const [tab,       setTab]       = useState<'calcular' | 'carrito'>('calcular');

  const config = MATERIALES[tipo];

  // ── Calcular (offline) ────────────────────────────────────
  const calcular = useCallback(() => {
    const nums: Record<string, number> = {};
    for (const campo of config.campos) {
      const v = parseFloat(valores[campo.key] || '0');
      if (campo.key !== 'desperdicio' && (!valores[campo.key] || isNaN(v) || v <= 0)) {
        Alert.alert('Dato requerido', `Ingresa ${campo.label.toLowerCase()}`);
        return;
      }
      nums[campo.key] = isNaN(v) ? 0 : v;
    }
    const res = config.calcular(nums);
    setResultado(res);
    setProductos([]);
    setBuscado(false);
  }, [config, valores]);

  // ── Buscar precios (API) ──────────────────────────────────
  const buscarPrecios = useCallback(async () => {
    if (!resultado) return;
    setCargando(true);
    setBuscado(true);
    try {
      const params = new URLSearchParams({ categoria: config.categoria });
      if (location) {
        params.set('lat', String(location.latitude));
        params.set('lng', String(location.longitude));
        params.set('radio', '50');
      }
      const res  = await fetch(`${API_BASE}/api/productos?${params}`);
      const json = await res.json();
      setProductos(json.ok ? json.data : []);
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setCargando(false);
    }
  }, [resultado, config, location]);

  // ── Agregar al carrito ────────────────────────────────────
  const agregarAlCarrito = useCallback(async () => {
    if (!resultado) return;
    const item: ItemCarrito = {
      id:        Date.now().toString(),
      material:  config.label,
      nombre:    `${config.label} — ${resultado.descripcion}`,
      cantidad:  resultado.cantidad,
      unidad:    resultado.unidad,
      categoria: config.categoria,
    };
    await agregar(item);
    Alert.alert('✅ Agregado', `${resultado.cantidad} ${resultado.unidad} guardados en tu carrito`);
  }, [resultado, config, agregar]);

  // ── Render ────────────────────────────────────────────────
  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>📐 Cubicadora</Text>
          <Text style={s.headerSub}>Calcula materiales y compara precios</Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={() => setTab('carrito')} style={s.carritoBtn}>
            <Text style={s.carritoBtnText}>🛒 {items.length}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['calcular', 'carrito'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, tab === t && s.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'calcular' ? '📐 Calcular' : `🛒 Carrito (${items.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

        {/* ── TAB CALCULAR ── */}
        {tab === 'calcular' && (
          <>
            {/* Selector de material */}
            <Text style={s.seccion}>Tipo de material</Text>
            <View style={s.tiposRow}>
              {(Object.keys(MATERIALES) as TipoMaterial[]).map(k => (
                <TouchableOpacity
                  key={k}
                  style={[s.tipoCard, tipo === k && s.tipoCardActive]}
                  onPress={() => { setTipo(k); setValores({}); setResultado(null); setProductos([]); setBuscado(false); }}
                >
                  <Text style={s.tipoIcono}>{MATERIALES[k].icono}</Text>
                  <Text style={[s.tipoLabel, tipo === k && s.tipoLabelActive]}>{MATERIALES[k].label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Campos de entrada */}
            <Text style={s.seccion}>Datos del proyecto</Text>
            {config.campos.map(campo => (
              <View key={campo.key} style={s.campoWrap}>
                <Text style={s.campoLabel}>{campo.label}</Text>
                <View style={s.campoRow}>
                  <TextInput
                    style={s.campoInput}
                    placeholder={campo.placeholder}
                    placeholderTextColor="#BBB"
                    keyboardType="decimal-pad"
                    value={valores[campo.key] || ''}
                    onChangeText={v => setValores(prev => ({ ...prev, [campo.key]: v }))}
                  />
                  <View style={s.campoUnidad}>
                    <Text style={s.campoUnidadText}>{campo.unidad}</Text>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={s.btnCalcular} onPress={calcular}>
              <Text style={s.btnCalcularText}>⚡ Calcular ahora</Text>
            </TouchableOpacity>

            {/* Resultado del cálculo */}
            {resultado && (
              <View style={s.resultadoCard}>
                <Text style={s.resultadoTitulo}>Resultado del cálculo</Text>
                <Text style={s.resultadoDesc}>{resultado.descripcion}</Text>
                <View style={s.resultadoRow}>
                  <View style={s.resultadoCantidad}>
                    <Text style={s.resultadoNum}>{resultado.cantidad}</Text>
                    <Text style={s.resultadoUnidad}>{resultado.unidad}</Text>
                  </View>
                  <View style={s.resultadoBtns}>
                    <TouchableOpacity style={s.btnAgregar} onPress={agregarAlCarrito}>
                      <Text style={s.btnAgregarText}>+ Carrito</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.btnCotizarPrecios} onPress={buscarPrecios}>
                      <Text style={s.btnCotizarPreciosText}>Ver precios</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Comparativa de precios */}
            {buscado && (
              <>
                <Text style={s.seccion}>
                  Comparativa de precios{location ? ' (50km a tu alrededor)' : ''}
                </Text>
                {cargando
                  ? [1, 2, 3].map(i => <SkeletonCard key={i} />)
                  : productos.length === 0
                    ? (
                      <View style={s.sinResultados}>
                        <Text style={s.sinResultadosText}>
                          No hay tiendas con {config.label.toLowerCase()} disponibles cerca.{'\n'}
                          Intenta ampliar el radio o regístrate para agregar tu tienda.
                        </Text>
                      </View>
                    )
                    : productos.map(p => (
                      <PrecioCard
                        key={p.id}
                        producto={p}
                        cantidad={resultado?.cantidad ?? 1}
                        unidad={resultado?.unidad ?? ''}
                      />
                    ))
                }
              </>
            )}
          </>
        )}

        {/* ── TAB CARRITO ── */}
        {tab === 'carrito' && (
          <>
            {items.length === 0
              ? (
                <View style={s.carritoVacio}>
                  <Text style={s.carritoVacioIcono}>🛒</Text>
                  <Text style={s.carritoVacioText}>Tu carrito está vacío.{'\n'}Calcula materiales y agrégalos aquí.</Text>
                  <TouchableOpacity style={s.btnIrCalcular} onPress={() => setTab('calcular')}>
                    <Text style={s.btnIrCalcularText}>Ir a calcular</Text>
                  </TouchableOpacity>
                </View>
              )
              : (
                <>
                  {items.map(item => (
                    <View key={item.id} style={s.carritoItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.carritoItemMaterial}>{item.material}</Text>
                        <Text style={s.carritoItemNombre} numberOfLines={2}>{item.nombre}</Text>
                        <Text style={s.carritoItemCantidad}>{item.cantidad} {item.unidad}</Text>
                      </View>
                      <TouchableOpacity onPress={() => eliminar(item.id)} style={s.btnEliminar}>
                        <Text style={s.btnEliminarText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={s.btnCotizarTodo}
                    onPress={() => {
                      const resumen = items.map(i => `• ${i.cantidad} ${i.unidad} de ${i.material}`).join('\n');
                      const msg     = encodeURIComponent(
                        `Hola! Necesito cotización de los siguientes materiales (desde Marketplace del Acero):\n\n${resumen}\n\n¿Tienen disponibilidad y precios?`
                      );
                      Linking.openURL(`https://wa.me/?text=${msg}`).catch(() => {});
                    }}
                  >
                    <Text style={s.btnCotizarTodoText}>💬 Cotizar lista completa por WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={s.btnLimpiar} onPress={() => {
                    Alert.alert('Limpiar carrito', '¿Eliminar todos los materiales?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Limpiar', style: 'destructive', onPress: limpiar },
                    ]);
                  }}>
                    <Text style={s.btnLimpiarText}>🗑 Limpiar carrito</Text>
                  </TouchableOpacity>
                </>
              )
            }
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: '#F2F2F2' },
  header:       { backgroundColor: COLORS.primary, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:      { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backText:     { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerTitle:  { color: '#fff', fontSize: 18, fontWeight: '900' },
  headerSub:    { color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 2 },
  carritoBtn:   { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  carritoBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  tabs:         { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E8E8E8' },
  tabBtn:       { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText:      { fontSize: 13, color: '#AAA', fontWeight: '600' },
  tabTextActive:{ color: COLORS.primary, fontWeight: '700' },

  scroll:       { flex: 1 },
  scrollContent:{ padding: 14, paddingBottom: 40 },

  seccion:      { fontSize: 11, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 6 },

  // Selector de tipo
  tiposRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  tipoCard:     { backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', width: '47%', borderWidth: 1.5, borderColor: 'transparent', elevation: 2 },
  tipoCardActive: { borderColor: COLORS.primary, backgroundColor: '#FFF5F5' },
  tipoIcono:    { fontSize: 24, marginBottom: 4 },
  tipoLabel:    { fontSize: 12, fontWeight: '600', color: '#555' },
  tipoLabelActive: { color: COLORS.primary, fontWeight: '800' },

  // Campos
  campoWrap:    { marginBottom: 14 },
  campoLabel:   { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  campoRow:     { flexDirection: 'row', gap: 8 },
  campoInput:   { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 14, paddingVertical: 11, fontSize: 16, color: '#1a1a1a' },
  campoUnidad:  { backgroundColor: COLORS.secondary, borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center' },
  campoUnidadText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  btnCalcular:  { backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4, marginBottom: 18 },
  btnCalcularText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },

  // Resultado
  resultadoCard:{ backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 18, borderLeftWidth: 4, borderLeftColor: COLORS.primary, elevation: 3 },
  resultadoTitulo: { fontSize: 13, fontWeight: '800', color: COLORS.secondary, marginBottom: 6 },
  resultadoDesc: { fontSize: 12, color: '#888', marginBottom: 12 },
  resultadoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultadoCantidad: { alignItems: 'center' },
  resultadoNum: { fontSize: 36, fontWeight: '900', color: COLORS.primary },
  resultadoUnidad: { fontSize: 11, color: '#888', marginTop: 2 },
  resultadoBtns:{ gap: 8 },
  btnAgregar:   { backgroundColor: COLORS.secondary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  btnAgregarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  btnCotizarPrecios: { backgroundColor: '#25D366', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  btnCotizarPreciosText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  // Precios
  sinResultados: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  sinResultadosText: { textAlign: 'center', color: '#888', fontSize: 13, lineHeight: 20 },

  precioCard:   { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  precioHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  precioLogo:   { width: 46, height: 46, borderRadius: 10 },
  precioAvatar: { width: 46, height: 46, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  precioAvatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  precioTienda: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  precioDistrito: { fontSize: 11, color: '#999' },
  precioDistancia: { fontSize: 10, color: COLORS.primary, marginTop: 2 },
  precioBox:    { alignItems: 'flex-end' },
  precioUnitLabel: { fontSize: 11, color: '#888' },
  precioTotal:  { fontSize: 15, fontWeight: '900', color: COLORS.primary },
  precioNombreProducto: { fontSize: 12, color: '#555', marginBottom: 10 },
  btnCotizar:   { backgroundColor: '#25D366', borderRadius: 10, padding: 11, alignItems: 'center' },
  btnCotizarText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Carrito
  carritoVacio: { alignItems: 'center', paddingTop: 60, gap: 12 },
  carritoVacioIcono: { fontSize: 48 },
  carritoVacioText: { textAlign: 'center', color: '#888', fontSize: 14, lineHeight: 22 },
  btnIrCalcular: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnIrCalcularText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  carritoItem:  { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  carritoItemMaterial: { fontSize: 10, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  carritoItemNombre: { fontSize: 13, color: '#333', marginTop: 2, lineHeight: 18 },
  carritoItemCantidad: { fontSize: 14, fontWeight: '900', color: COLORS.secondary, marginTop: 4 },
  btnEliminar:  { padding: 8 },
  btnEliminarText: { fontSize: 18, color: '#CCC' },

  btnCotizarTodo: { backgroundColor: '#25D366', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8, marginBottom: 10 },
  btnCotizarTodoText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  btnLimpiar:   { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 13, alignItems: 'center' },
  btnLimpiarText: { color: '#999', fontWeight: '600', fontSize: 13 },
});
