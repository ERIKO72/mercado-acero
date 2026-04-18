// app/screens/detail.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useLocalSearchParams, router } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { API_BASE, COLORS } from '../../constants/api';

export default function DetailScreen() {
  const { id }             = useLocalSearchParams<{ id: string }>();
  const { location }       = useLocation();
  const [tienda, setTienda]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<'info' | 'productos' | 'servicios' | 'reseñas'>('info');
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [routeInfo, setRouteInfo]     = useState<{ distancia: string; duracion: string } | null>(null);

  // ─── Cargar detalle ────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const params = location ? `?lat=${location.latitude}&lng=${location.longitude}` : '';
    fetch(`${API_BASE}/api/tiendas/${id}${params}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setTienda(j.data); })
      .catch(() => Alert.alert('Error', 'No se pudo cargar la tienda'))
      .finally(() => setLoading(false));
  }, [id, location]);

  // ─── Ruta tipo Waze via Google Directions ─────────────────
  const calcularRuta = async () => {
    if (!location || !tienda) return;
    try {
      // Usamos la API pública de OSRM (gratuita, no requiere key)
      const url = `https://router.project-osrm.org/route/v1/driving/` +
        `${location.longitude},${location.latitude};` +
        `${tienda.longitud},${tienda.latitud}` +
        `?overview=full&geometries=geojson`;

      const res  = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(([lng, lat]: number[]) => ({
          latitude: lat, longitude: lng,
        }));
        setRouteCoords(coords);

        const km  = (route.distance / 1000).toFixed(1);
        const min = Math.round(route.duration / 60);
        setRouteInfo({ distancia: `${km} km`, duracion: `~${min} min` });
      }
    } catch {
      Alert.alert('Ruta', 'No se pudo calcular la ruta. Revisa tu conexión.');
    }
  };

  // ─── Abrir en Waze ─────────────────────────────────────────
  const abrirWaze = () => {
    if (!tienda) return;
    const url = `waze://?ll=${tienda.latitud},${tienda.longitud}&navigate=yes`;
    Linking.canOpenURL(url).then(can => {
      if (can) Linking.openURL(url);
      else Linking.openURL(
        `https://waze.com/ul?ll=${tienda.latitud},${tienda.longitud}&navigate=yes`
      );
    });
  };

  // ─── Abrir en Google Maps ──────────────────────────────────
  const abrirGoogleMaps = () => {
    if (!tienda) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${tienda.latitud},${tienda.longitud}&travelmode=driving`;
    Linking.openURL(url);
  };

  const llamar = () => {
    if (!tienda?.telefono) return;
    Linking.openURL(`tel:${tienda.telefono}`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (!tienda) {
    return (
      <View style={styles.centered}>
        <Text>Tienda no encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} stickyHeaderIndices={[0]}>
      {/* Back */}
      <View style={styles.backBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnBack}>
          <Text style={styles.btnBackText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroAvatar}>
          <Text style={styles.heroAvatarText}>{tienda.nombre[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroNombre}>{tienda.nombre}</Text>
          {tienda.verificada && (
            <Text style={styles.verificadaBadge}>✓ Tienda Verificada</Text>
          )}
          <Text style={styles.heroDistrito}>{tienda.distrito} · ⭐ {tienda.calificacion}</Text>
          {tienda.distancia_km && (
            <Text style={styles.heroDist}>📍 {tienda.distancia_km} km de ti</Text>
          )}
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.primary }]} onPress={llamar}>
          <Text style={styles.btnText}>📞 Llamar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#009ADE' }]} onPress={abrirWaze}>
          <Text style={styles.btnText}>🚗 Waze</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.success }]} onPress={abrirGoogleMaps}>
          <Text style={styles.btnText}>🗺 Maps</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.secondary }]} onPress={calcularRuta}>
          <Text style={styles.btnText}>📐 Ruta</Text>
        </TouchableOpacity>
      </View>

      {/* Mapa con ruta */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude:      parseFloat(tienda.latitud),
          longitude:     parseFloat(tienda.longitud),
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
      >
        <Marker
          coordinate={{ latitude: parseFloat(tienda.latitud), longitude: parseFloat(tienda.longitud) }}
          title={tienda.nombre}
          pinColor={COLORS.primary}
        />
        {location && (
          <Marker coordinate={location} title="Tu ubicación" pinColor={COLORS.accent} />
        )}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={COLORS.primary}
            strokeWidth={4}
          />
        )}
      </MapView>

      {routeInfo && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeInfoText}>
            🛣 {routeInfo.distancia}  ·  ⏱ {routeInfo.duracion} en auto
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['info', 'productos', 'servicios', 'reseñas'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido tab */}
      <View style={styles.tabContent}>
        {tab === 'info' && (
          <View style={{ gap: 8 }}>
            <Row icon="📝" label="Descripción" value={tienda.descripcion} />
            <Row icon="📍" label="Dirección"   value={tienda.direccion} />
            <Row icon="🏢" label="RUC"         value={tienda.ruc} />
            <Row icon="📞" label="Teléfono"    value={tienda.telefono} />
            <Row icon="✉️" label="Email"       value={tienda.email} />
            <Row icon="🕐" label="Horario"     value={tienda.horario} />
          </View>
        )}

        {tab === 'productos' && (
          tienda.productos?.length
            ? tienda.productos.map((p: any) => (
              <View key={p.id} style={styles.itemCard}>
                <View>
                  <Text style={styles.itemNombre}>{p.nombre}</Text>
                  <Text style={styles.itemCat}>{p.categoria} · {p.unidad}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemPrecio}>S/ {p.precio}</Text>
                  <Text style={styles.itemStock}>{p.stock} en stock</Text>
                </View>
              </View>
            ))
            : <Text style={styles.empty}>Sin productos registrados</Text>
        )}

        {tab === 'servicios' && (
          tienda.servicios?.length
            ? tienda.servicios.map((s: any) => (
              <View key={s.id} style={styles.itemCard}>
                <View>
                  <Text style={styles.itemNombre}>{s.nombre}</Text>
                  <Text style={styles.itemCat}>{s.descripcion}</Text>
                </View>
                {s.precio_desde && (
                  <Text style={styles.itemPrecio}>Desde S/ {s.precio_desde}</Text>
                )}
              </View>
            ))
            : <Text style={styles.empty}>Sin servicios registrados</Text>
        )}

        {tab === 'reseñas' && (
          tienda.reseñas?.length
            ? tienda.reseñas.map((r: any) => (
              <View key={r.id} style={styles.reseñaCard}>
                <View style={styles.reseñaHeader}>
                  <Text style={styles.reseñaAutor}>{r.autor}</Text>
                  <Text>{'⭐'.repeat(r.calificacion)}</Text>
                </View>
                <Text style={styles.reseñaComentario}>{r.comentario}</Text>
              </View>
            ))
            : <Text style={styles.empty}>Sin reseñas aún</Text>
        )}
      </View>
    </ScrollView>
  );
}

// Mini componente para filas de info
function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.bg },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },

  backBar:    { backgroundColor: COLORS.secondary, paddingTop: 50, paddingBottom: 10, paddingHorizontal: 16 },
  btnBack:    {},
  btnBackText:{ color: '#fff', fontSize: 15, fontWeight: '600' },

  hero:       { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#fff', alignItems: 'center' },
  heroAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  heroAvatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  heroNombre: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  verificadaBadge: { color: COLORS.verified, fontSize: 12, fontWeight: '600', marginTop: 2 },
  heroDistrito:   { color: COLORS.textLight, fontSize: 12, marginTop: 2 },
  heroDist:   { color: COLORS.accent, fontSize: 12, fontWeight: '600', marginTop: 2 },

  actions:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: COLORS.border },
  btn:        { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnText:    { color: '#fff', fontSize: 12, fontWeight: '700' },

  map:        { height: 220, margin: 0 },
  routeInfo:  { backgroundColor: COLORS.secondary, padding: 10, alignItems: 'center' },
  routeInfoText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  tabs:       { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: COLORS.border },
  tabBtn:     { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText:    { fontSize: 12, color: COLORS.textLight },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  tabContent: { padding: 16, gap: 8 },

  infoRow:    { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 6 },
  infoIcon:   { fontSize: 18, marginTop: 1 },
  infoLabel:  { fontSize: 11, color: COLORS.textLight },
  infoValue:  { fontSize: 14, color: COLORS.text, fontWeight: '500' },

  itemCard:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, elevation: 1 },
  itemNombre: { fontWeight: '700', fontSize: 14, color: COLORS.text },
  itemCat:    { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  itemPrecio: { fontWeight: '800', fontSize: 15, color: COLORS.primary },
  itemStock:  { fontSize: 11, color: COLORS.textLight, marginTop: 2 },

  reseñaCard:   { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  reseñaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reseñaAutor:  { fontWeight: '700', color: COLORS.text },
  reseñaComentario: { fontSize: 13, color: COLORS.textLight, lineHeight: 18 },

  empty:      { textAlign: 'center', color: COLORS.textLight, padding: 20, fontSize: 14 },
});
