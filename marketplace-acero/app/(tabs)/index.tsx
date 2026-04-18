// app/(tabs)/index.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { router } from 'expo-router';

import TiendaCard    from '../../components/TiendaCard';
import { useLocation } from '../../hooks/useLocation';
import { API_BASE, COLORS } from '../../constants/api';

const RADIOS = [5, 10, 20, 50];
const SERVICIOS_FILTER = ['Todos', 'corte cnc', 'doblez', 'soldadura', 'láser'];

export default function HomeScreen() {
  const { location, loading: locLoading } = useLocation();
  const mapRef = useRef<MapView>(null);

  const [tiendas,    setTiendas]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query,      setQuery]      = useState('');
  const [radio,      setRadio]      = useState(20);
  const [servicio,   setServicio]   = useState('Todos');
  const [mapVisible, setMapVisible] = useState(true);
  const [selected,   setSelected]   = useState<any | null>(null);

  // ─── Cargar tiendas ─────────────────────────────────────────
  const fetchTiendas = useCallback(async (isRefresh = false) => {
    if (!location) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const params = new URLSearchParams({
        lat:   String(location.latitude),
        lng:   String(location.longitude),
        radio: String(radio),
      });
      if (query)                  params.append('q',        query);
      if (servicio !== 'Todos')   params.append('servicio', servicio);

      const res  = await fetch(`${API_BASE}/api/tiendas?${params}`);
      const json = await res.json();
      if (json.ok) setTiendas(json.data);
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor.\nVerifica que el backend está corriendo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location, radio, query, servicio]);

  useEffect(() => { fetchTiendas(); }, [fetchTiendas]);

  // ─── Centrar mapa en mi ubicación ───────────────────────────
  const centerMap = () => {
    if (!location || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: location.latitude, longitude: location.longitude,
      latitudeDelta: 0.08, longitudeDelta: 0.08,
    }, 600);
  };

  // ─── Header con búsqueda ────────────────────────────────────
  const Header = () => (
    <View style={styles.header}>
      {/* Logo */}
      <View style={styles.logoRow}>
        <Text style={styles.logo}>🔩 Marketplace del Acero</Text>
        <TouchableOpacity
          style={styles.btnRegistrar}
          onPress={() => router.push('/screens/register-store')}
        >
          <Text style={styles.btnRegistrarText}>+ Tienda</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Buscar tienda, producto…"
          placeholderTextColor={COLORS.textLight}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => fetchTiendas()}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.btnSearch} onPress={() => fetchTiendas()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Filtro radio */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Radio:</Text>
        {RADIOS.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.chip, radio === r && styles.chipActive]}
            onPress={() => setRadio(r)}
          >
            <Text style={[styles.chipText, radio === r && styles.chipTextActive]}>
              {r} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filtro servicio */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Servicio:</Text>
        <FlatList
          data={SERVICIOS_FILTER}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, servicio === item && styles.chipActive]}
              onPress={() => setServicio(item)}
            >
              <Text style={[styles.chipText, servicio === item && styles.chipTextActive]}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Toggle mapa */}
      <TouchableOpacity style={styles.toggleMap} onPress={() => setMapVisible(v => !v)}>
        <Text style={styles.toggleMapText}>{mapVisible ? '📋 Ver lista' : '🗺 Ver mapa'}</Text>
      </TouchableOpacity>
    </View>
  );

  if (locLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Obteniendo tu ubicación…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* MAPA */}
      {mapVisible && location && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude:      location.latitude,
              longitude:     location.longitude,
              latitudeDelta: 0.12,
              longitudeDelta: 0.12,
            }}
          >
            {/* Mi ubicación */}
            <Marker
              coordinate={location}
              title="Mi ubicación"
              pinColor={COLORS.accent}
            />

            {/* Círculo de radio */}
            <Circle
              center={location}
              radius={radio * 1000}
              strokeColor={`${COLORS.primary}50`}
              fillColor={`${COLORS.primary}10`}
            />

            {/* Marcadores tiendas */}
            {tiendas.map(t => (
              <Marker
                key={t.id}
                coordinate={{ latitude: parseFloat(t.latitud), longitude: parseFloat(t.longitud) }}
                title={t.nombre}
                description={`${t.distancia_km ?? '?'} km · ⭐${t.calificacion}`}
                pinColor={selected?.id === t.id ? COLORS.accent : COLORS.primary}
                onPress={() => setSelected(t)}
              />
            ))}
          </MapView>

          {/* Botón centrar */}
          <TouchableOpacity style={styles.btnCenter} onPress={centerMap}>
            <Text style={{ fontSize: 18 }}>🎯</Text>
          </TouchableOpacity>

          {/* Popup tienda seleccionada */}
          {selected && (
            <TouchableOpacity
              style={styles.popup}
              onPress={() => {
                router.push({ pathname: '/screens/detail', params: { id: selected.id } });
                setSelected(null);
              }}
            >
              <Text style={styles.popupNombre}>{selected.nombre}</Text>
              <Text style={styles.popupInfo}>
                {selected.distancia_km} km · ⭐ {selected.calificacion} · Ver detalle →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* LISTA */}
      <FlatList
        data={tiendas}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            : <Text style={styles.empty}>No se encontraron tiendas en este radio</Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchTiendas(true)}
            colors={[COLORS.primary]} />
        }
        renderItem={({ item }) => (
          <TiendaCard
            tienda={item}
            onPress={() => router.push({ pathname: '/screens/detail', params: { id: item.id } })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: COLORS.textLight, fontSize: 14 },

  header:      { paddingBottom: 12 },
  logoRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logo:        { fontSize: 18, fontWeight: '800', color: COLORS.primary },

  btnRegistrar: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnRegistrarText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 9, fontSize: 14, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  btnSearch: { backgroundColor: COLORS.secondary, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },

  filterRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  filterLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  chip:        { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.border },
  chipActive:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText:    { fontSize: 12, color: COLORS.text },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  toggleMap: { alignSelf: 'flex-start', marginBottom: 4 },
  toggleMapText: { fontSize: 13, color: COLORS.secondary, fontWeight: '600' },

  mapContainer: { height: 260, position: 'relative' },
  map: { flex: 1 },
  btnCenter: {
    position: 'absolute', bottom: 50, right: 12,
    backgroundColor: '#fff', borderRadius: 22, width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4,
    elevation: 4,
  },
  popup: {
    position: 'absolute', bottom: 8, left: 10, right: 10,
    backgroundColor: '#fff', borderRadius: 10, padding: 10,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5,
    elevation: 6,
  },
  popupNombre: { fontWeight: '700', fontSize: 14, color: COLORS.text },
  popupInfo:   { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  list:  { padding: 16 },
  empty: { textAlign: 'center', color: COLORS.textLight, marginTop: 40, fontSize: 14 },
});
