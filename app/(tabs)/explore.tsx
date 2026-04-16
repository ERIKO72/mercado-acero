import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { router } from 'expo-router';
import TiendaCard from '../../components/TiendaCard';
import { useFavoritos } from '../../hooks/useFavoritos';
import { API_BASE, COLORS } from '../../constants/api';

const CATEGORIAS = [
  { nombre: 'Tubos',    icono: '⬛', key: 'tubos' },
  { nombre: 'Perfiles', icono: '📐', key: 'perfiles' },
  { nombre: 'Planchas', icono: '🔲', key: 'planchas' },
  { nombre: 'Angulos',  icono: '📏', key: 'angulos' },
  { nombre: 'Platinas', icono: '➖', key: 'platinas' },
  { nombre: 'Vigas',    icono: '🏗️',  key: 'vigas' },
];

type Modo = 'tiendas' | 'productos';

// ─────────────────────────────────────────────────────────────
//  Renderizado de un producto en resultados
// ─────────────────────────────────────────────────────────────
function ProductoCard({ item, onCotizar }: { item: any; onCotizar: (p: any) => void }) {
  return (
    <View style={styles.prodCard}>
      <View style={styles.prodInfo}>
        <Text style={styles.prodNombre}>{item.nombre}</Text>
        <Text style={styles.prodCategoria}>{item.categoria} · {item.unidad}</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/screens/detail', params: { id: item.tienda_id } })}
        >
          <Text style={styles.prodTienda}>
            {item.tienda_verificada ? '✓ ' : ''}{item.tienda_nombre} · {item.tienda_distrito}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.prodDerecha}>
        <Text style={styles.prodPrecio}>S/ {Number(item.precio).toFixed(2)}</Text>
        <TouchableOpacity style={styles.btnCotizar} onPress={() => onCotizar(item)}>
          <Text style={styles.btnCotizarTexto}>Cotizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  EXPLORE HEADER — definido FUERA del ExploreScreen
//  para que React no destruya el TextInput en cada keystroke
// ─────────────────────────────────────────────────────────────
type HeaderProps = {
  query: string;
  onChangeQuery: (v: string) => void;
  onBuscar: () => void;
  modo: Modo;
  onCambiarModo: (m: Modo) => void;
  onCategoria: (key: string) => void;
  totalResultados: number;
  loading: boolean;
  buscado: boolean;
};

function ExploreHeader({
  query, onChangeQuery, onBuscar,
  modo, onCambiarModo, onCategoria,
  totalResultados, loading, buscado,
}: HeaderProps) {
  return (
    <View style={styles.headerWrap}>
      {/* Título */}
      <View style={styles.tituloBar}>
        <Text style={styles.titulo}>Explorar</Text>
        <Text style={styles.tituloSub}>Busca tiendas o compara precios</Text>
      </View>

      {/* Toggle tiendas / productos */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, modo === 'tiendas' && styles.toggleBtnActive]}
          onPress={() => onCambiarModo('tiendas')}
        >
          <Text style={[styles.toggleTexto, modo === 'tiendas' && styles.toggleTextoActive]}>
            🏪  Tiendas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, modo === 'productos' && styles.toggleBtnActive]}
          onPress={() => onCambiarModo('productos')}
        >
          <Text style={[styles.toggleTexto, modo === 'productos' && styles.toggleTextoActive]}>
            📦  Productos y precios
          </Text>
        </TouchableOpacity>
      </View>

      {/* Buscador — TextInput estable gracias a estar fuera del Screen */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder={
            modo === 'tiendas'
              ? 'Buscar tienda o distrito...'
              : 'Buscar producto (ej: tubo 2")...'
          }
          placeholderTextColor="#999"
          value={query}
          onChangeText={onChangeQuery}
          onSubmitEditing={onBuscar}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          submitBehavior="submit"
        />
        <TouchableOpacity style={styles.btnBuscar} onPress={onBuscar}>
          <Text style={styles.btnBuscarText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Categorías rápidas */}
      <Text style={styles.seccionLabel}>
        {modo === 'tiendas' ? 'Buscar por tipo' : 'Categorías'}
      </Text>
      <View style={styles.cats}>
        {CATEGORIAS.map(c => (
          <TouchableOpacity
            key={c.key}
            style={styles.catCard}
            onPress={() => onCategoria(c.key)}
          >
            <Text style={styles.catIcono}>{c.icono}</Text>
            <Text style={styles.catTexto}>{c.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Label resultados */}
      {buscado && (
        <View style={styles.resultBar}>
          <Text style={styles.resultText}>
            {loading ? 'Buscando...' : `${totalResultados} resultado(s)`}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  EXPLORE SCREEN
// ─────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const { toggle, esFavorito }    = useFavoritos();
  const [query,    setQuery]      = useState('');
  const [modo,     setModo]       = useState<Modo>('tiendas');
  const [tiendas,  setTiendas]    = useState<any[]>([]);
  const [productos,setProductos]  = useState<any[]>([]);
  const [loading,  setLoading]    = useState(false);
  const [buscado,  setBuscado]    = useState(false);

  const buscar = useCallback(async (q: string, m: Modo = modo) => {
    setLoading(true);
    setBuscado(true);
    try {
      if (m === 'tiendas') {
        const url = q.trim()
          ? `${API_BASE}/api/tiendas?q=${encodeURIComponent(q)}`
          : `${API_BASE}/api/tiendas`;
        const res  = await fetch(url);
        const json = await res.json();
        setTiendas(json.ok ? json.data : []);
      } else {
        if (!q.trim()) { setLoading(false); return; }
        const res  = await fetch(`${API_BASE}/api/productos?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setProductos(json.ok ? json.data : []);
      }
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  }, [modo]);

  // Cargar tiendas automáticamente al abrir la pantalla
  useEffect(() => { buscar('', 'tiendas'); }, []);

  const cambiarModo = useCallback((m: Modo) => {
    setModo(m);
    setBuscado(false);
    setTiendas([]);
    setProductos([]);
    if (m === 'tiendas') buscar('', 'tiendas');
  }, [buscar]);

  const handleCategoria = useCallback((key: string) => {
    setQuery(key);
    buscar(key, modo);
  }, [buscar, modo]);

  const handleBuscar = useCallback(() => buscar(query), [buscar, query]);

  const cotizarWhatsApp = useCallback((producto: any) => {
    if (!producto.tienda_telefono) {
      Alert.alert('Sin telefono', 'Esta tienda no tiene numero registrado');
      return;
    }
    const digits = producto.tienda_telefono.replace(/\D/g, '');
    const numero = digits.startsWith('51') ? digits : '51' + (digits.startsWith('0') ? digits.slice(1) : digits);
    const msg    = encodeURIComponent(
      `Hola! Vi tu tienda *${producto.tienda_nombre}* en Marketplace del Acero.\n\nNecesito cotizacion de: *${producto.nombre}*`
    );
    const url = `whatsapp://send?phone=${numero}&text=${msg}`;
    Linking.canOpenURL(url)
      .then(can => Linking.openURL(can ? url : `https://wa.me/${numero}?text=${msg}`))
      .catch(() => Linking.openURL(`https://wa.me/${numero}?text=${msg}`));
  }, []);

  const data           = modo === 'tiendas' ? tiendas : productos;
  const totalResultados = data.length;

  return (
    <FlatList
      data={data}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      ListHeaderComponent={
        <ExploreHeader
          query={query}
          onChangeQuery={setQuery}
          onBuscar={handleBuscar}
          modo={modo}
          onCambiarModo={cambiarModo}
          onCategoria={handleCategoria}
          totalResultados={totalResultados}
          loading={loading}
          buscado={buscado}
        />
      }
      ListEmptyComponent={
        !buscado ? null : loading
          ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
          : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcono}>🔍</Text>
              <Text style={styles.empty}>No se encontraron resultados</Text>
            </View>
          )
      }
      renderItem={
        modo === 'tiendas'
          ? ({ item }) => (
            <TiendaCard
              tienda={item}
              esFavorito={esFavorito(item.id)}
              onToggleFavorito={toggle}
              onPress={() => router.push({ pathname: '/screens/detail', params: { id: item.id } })}
            />
          )
          : ({ item }) => <ProductoCard item={item} onCotizar={cotizarWhatsApp} />
      }
    />
  );
}

// ─────────────────────────────────────────────────────────────
//  ESTILOS
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:         { padding: 12, backgroundColor: '#F2F2F2', flexGrow: 1 },

  // Header
  headerWrap:        { marginBottom: 4 },
  tituloBar:         { backgroundColor: COLORS.primary, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 14, marginHorizontal: -12, marginTop: -12, marginBottom: 14 },
  titulo:            { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  tituloSub:         { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3 },

  // Toggle
  toggleRow:         { flexDirection: 'row', backgroundColor: '#E8E8E8', borderRadius: 12, padding: 4, marginBottom: 14 },
  toggleBtn:         { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  toggleBtnActive:   { backgroundColor: '#fff', elevation: 2 },
  toggleTexto:       { fontSize: 12, color: '#AAA', fontWeight: '600' },
  toggleTextoActive: { color: COLORS.secondary, fontWeight: '700' },

  // Búsqueda
  searchRow:         { flexDirection: 'row', gap: 8, marginBottom: 14 },
  input:             { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, fontSize: 14, color: '#1a1a1a', borderWidth: 1.5, borderColor: '#E0E0E0' },
  btnBuscar:         { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  btnBuscarText:     { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Categorías
  seccionLabel:      { fontSize: 11, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  cats:              { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  catCard:           { backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', width: '30.5%', elevation: 2 },
  catIcono:          { fontSize: 22, marginBottom: 4 },
  catTexto:          { fontSize: 11, fontWeight: '700', color: COLORS.secondary },

  // Resultados label
  resultBar:         { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  resultText:        { fontSize: 12, color: '#888', fontWeight: '600' },

  // Empty
  emptyBox:          { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyIcono:        { fontSize: 36 },
  empty:             { textAlign: 'center', color: '#AAA', fontSize: 13 },

  // Producto card
  prodCard:          { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  prodInfo:          { flex: 1, gap: 3 },
  prodNombre:        { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  prodCategoria:     { fontSize: 11, color: '#AAA' },
  prodTienda:        { fontSize: 12, color: COLORS.verified, fontWeight: '600', marginTop: 2 },
  prodDerecha:       { alignItems: 'flex-end', gap: 8 },
  prodPrecio:        { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  btnCotizar:        { backgroundColor: '#25D366', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnCotizarTexto:   { color: '#fff', fontSize: 12, fontWeight: '700' },
});
