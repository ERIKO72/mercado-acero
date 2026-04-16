import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, Alert, ActivityIndicator, TextInput, Modal,
  KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapaDetalle from '../../components/MapaDetalle';
import { useLocation } from '../../hooks/useLocation';
import { API_BASE, API, COLORS } from '../../constants/api';

// Fire-and-forget: registra interacción sin bloquear la UX
function trackear(tienda_id: string, tipo: string) {
  fetch(API.analytics, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tienda_id, tipo }),
  }).catch(() => {});
}

type Tab = 'info' | 'productos' | 'servicios' | 'resenias';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatWhatsApp(telefono: string): string {
  const digits = telefono.replace(/\D/g, '');
  if (digits.startsWith('51') && digits.length >= 11) return digits;
  if (digits.startsWith('0')) return '51' + digits.substring(1);
  return '51' + digits;
}

function Estrellas({ valor, size = 16 }: { valor: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ fontSize: size, color: i <= Math.round(valor) ? '#f39c12' : '#ddd' }}>★</Text>
      ))}
    </View>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { location } = useLocation();
  const [tienda, setTienda]           = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<Tab>('info');
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [routeInfo, setRouteInfo]     = useState<{ distancia: string; duracion: string } | null>(null);
  const [modalResenia, setModalResenia] = useState(false);
  const [navExpanded, setNavExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    trackear(id, 'detalle');
    fetch(`${API_BASE}/api/tiendas/${id}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setTienda(j.data); })
      .catch(() => Alert.alert('Error', 'No se pudo cargar la tienda'))
      .finally(() => setLoading(false));
  }, [id]);

  const calcularRuta = async () => {
    if (!location || !tienda) return;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${location.longitude},${location.latitude};${tienda.longitud},${tienda.latitud}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.length) {
        const r = data.routes[0];
        setRouteCoords(r.geometry.coordinates.map(([lng, lat]: number[]) => ({ latitude: lat, longitude: lng })));
        setRouteInfo({ distancia: `${(r.distance / 1000).toFixed(1)} km`, duracion: `~${Math.round(r.duration / 60)} min` });
      }
    } catch { Alert.alert('Error', 'No se pudo calcular la ruta.'); }
  };

  const abrirWaze = () => {
    if (!tienda) return;
    trackear(tienda.id, 'waze');
    const url = `waze://?ll=${tienda.latitud},${tienda.longitud}&navigate=yes`;
    Linking.canOpenURL(url).then(can =>
      Linking.openURL(can ? url : `https://waze.com/ul?ll=${tienda.latitud},${tienda.longitud}&navigate=yes`)
    );
  };

  const abrirMaps = () => {
    if (!tienda) return;
    trackear(tienda.id, 'ruta');
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${tienda.latitud},${tienda.longitud}&travelmode=driving`);
  };

  const llamar = () => {
    if (!tienda?.telefono) return;
    trackear(tienda.id, 'llamada');
    Linking.openURL(`tel:${tienda.telefono}`);
  };

  const cotizarWhatsApp = () => {
    if (!tienda?.telefono) {
      Alert.alert('Sin telefono', 'Esta tienda no tiene numero registrado');
      return;
    }
    trackear(tienda.id, 'whatsapp');
    const numero  = formatWhatsApp(tienda.telefono);
    const mensaje = encodeURIComponent(
      `Hola! Vi tu tienda *${tienda.nombre}* en Marketplace del Acero.\n\nNecesito cotizacion de: `
    );
    const url = `whatsapp://send?phone=${numero}&text=${mensaje}`;
    const urlWeb = `https://wa.me/${numero}?text=${mensaje}`;
    Linking.canOpenURL(url)
      .then(can => Linking.openURL(can ? url : urlWeb))
      .catch(() => Linking.openURL(urlWeb));
  };

  const recargarTienda = () => {
    if (!id) return;
    fetch(`${API_BASE}/api/tiendas/${id}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setTienda(j.data); });
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!tienda) return <View style={styles.centered}><Text>Tienda no encontrada</Text></View>;

  const totalResenias = tienda.resenias?.length ?? 0;

  return (
    <ScrollView style={styles.container}>
      {/* Barra volver */}
      <View style={styles.backBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{tienda.nombre[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.nombre}>{tienda.nombre}</Text>
            {tienda.destacada && (
              <View style={styles.badgePremium}>
                <Text style={styles.badgePremiumText}>★ Premium</Text>
              </View>
            )}
          </View>
          {tienda.verificada && <Text style={styles.verificada}>✓ Verificada</Text>}
          <Text style={styles.distrito}>{tienda.distrito}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Estrellas valor={tienda.calificacion ?? 0} size={14} />
            <Text style={styles.calificacionTexto}>
              {Number(tienda.calificacion ?? 0).toFixed(1)} ({totalResenias})
            </Text>
          </View>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.primary }]} onPress={llamar}>
          <Text style={styles.btnText}>Llamar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#25D366' }]} onPress={cotizarWhatsApp}>
          <Text style={styles.btnText}>Cotizar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#8E44AD' }]}
          onPress={() => {
            trackear(tienda.id, 'chat');
            router.push({ pathname: '/screens/chat', params: { tienda_id: tienda.id, tienda_nombre: tienda.nombre } });
          }}
        >
          <Text style={styles.btnText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: navExpanded ? COLORS.secondary : '#555' }]}
          onPress={() => setNavExpanded(v => !v)}
        >
          <Text style={styles.btnText}>📍 Llegar</Text>
        </TouchableOpacity>
      </View>

      {/* Panel de navegación — solo visible al expandir */}
      {navExpanded && (
        <View style={styles.navPanel}>
          <TouchableOpacity style={styles.navBtn} onPress={() => { setNavExpanded(false); calcularRuta(); }}>
            <View style={[styles.navIconBox, { backgroundColor: COLORS.secondary }]}>
              <Ionicons name="map-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.navBtnLabel}>Ver ruta en mapa</Text>
              <Text style={styles.navBtnSub}>Dibuja el camino aquí</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => { setNavExpanded(false); abrirWaze(); }}>
            <View style={[styles.navIconBox, { backgroundColor: '#33CCFF' }]}>
              <Text style={styles.navIconLetter}>W</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.navBtnLabel}>Abrir en Waze</Text>
              <Text style={styles.navBtnSub}>Navegación con tráfico</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navBtn, { borderBottomWidth: 0 }]} onPress={() => { setNavExpanded(false); abrirMaps(); }}>
            <View style={[styles.navIconBox, { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E0E0E0' }]}>
              <Ionicons name="location" size={22} color="#EA4335" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.navBtnLabel}>Abrir en Google Maps</Text>
              <Text style={styles.navBtnSub}>Ver en Google Maps</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </TouchableOpacity>
        </View>
      )}

      {/* Mapa */}
      <MapaDetalle tienda={tienda} location={location} routeCoords={routeCoords} />
      {routeInfo && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeInfoText}>{routeInfo.distancia} · {routeInfo.duracion} en auto</Text>
        </View>
      )}

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {(['info', 'productos', 'servicios', 'resenias'] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'info' && 'Info'}
                {t === 'productos' && `Productos (${tienda.productos?.length ?? 0})`}
                {t === 'servicios' && `Servicios (${tienda.servicios?.length ?? 0})`}
                {t === 'resenias' && `Reseñas (${totalResenias})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Contenido del tab */}
      <View style={styles.tabContent}>

        {/* INFO */}
        {tab === 'info' && (
          <View style={{ gap: 8 }}>
            {tienda.descripcion && <Text style={styles.infoText}>{tienda.descripcion}</Text>}
            {tienda.direccion   && <Text style={styles.infoText}>📍 {tienda.direccion}</Text>}
            {tienda.telefono    && <Text style={styles.infoText}>📞 {tienda.telefono}</Text>}
            {tienda.horario     && <Text style={styles.infoText}>🕐 {tienda.horario}</Text>}
            {tienda.ruc         && <Text style={styles.infoText}>🏢 RUC: {tienda.ruc}</Text>}
          </View>
        )}

        {/* PRODUCTOS */}
        {tab === 'productos' && (
          tienda.productos?.length
            ? tienda.productos.map((p: any) => (
              <View key={p.id} style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNombre}>{p.nombre}</Text>
                  <Text style={styles.itemCat}>{p.categoria} · {p.unidad}</Text>
                  {p.stock > 0 && <Text style={styles.itemStock}>Stock: {p.stock}</Text>}
                </View>
                <Text style={styles.itemPrecio}>S/ {Number(p.precio).toFixed(2)}</Text>
              </View>
            ))
            : <Text style={styles.empty}>Sin productos registrados</Text>
        )}

        {/* SERVICIOS */}
        {tab === 'servicios' && (
          tienda.servicios?.length
            ? tienda.servicios.map((s: any) => (
              <View key={s.id} style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNombre}>{s.nombre}</Text>
                  {s.descripcion && <Text style={styles.itemCat}>{s.descripcion}</Text>}
                </View>
                {s.precio_desde && <Text style={styles.itemPrecio}>Desde S/ {s.precio_desde}</Text>}
              </View>
            ))
            : <Text style={styles.empty}>Sin servicios registrados</Text>
        )}

        {/* RESEÑAS */}
        {tab === 'resenias' && (
          <View>
            <TouchableOpacity style={styles.btnDejarResenia} onPress={() => setModalResenia(true)}>
              <Text style={styles.btnDejarReseniaTexto}>+ Dejar una reseña</Text>
            </TouchableOpacity>

            {totalResenias === 0
              ? <Text style={styles.empty}>Sin reseñas aun. Se el primero!</Text>
              : tienda.resenias.map((r: any) => (
                <View key={r.id} style={styles.reseniaCard}>
                  <View style={styles.reseniaHeader}>
                    <Text style={styles.reseniaAutor}>{r.autor}</Text>
                    <Estrellas valor={r.calificacion} size={13} />
                  </View>
                  {r.comentario ? <Text style={styles.reseniaComentario}>{r.comentario}</Text> : null}
                  <Text style={styles.reseniaFecha}>
                    {new Date(r.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              ))
            }
          </View>
        )}
      </View>

      {/* Modal nueva reseña */}
      <ModalResenia
        visible={modalResenia}
        tiendaId={tienda.id}
        tiendaNombre={tienda.nombre}
        onClose={() => setModalResenia(false)}
        onGuardado={() => { setModalResenia(false); recargarTienda(); setTab('resenias'); }}
      />
    </ScrollView>
  );
}

// ── Modal Reseña ─────────────────────────────────────────────────────────────

function ModalResenia({ visible, tiendaId, tiendaNombre, onClose, onGuardado }: any) {
  const [estrellas, setEstrellas] = useState(5);
  const [autor, setAutor]         = useState('');
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando]   = useState(false);

  const enviar = async () => {
    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/tiendas/${tiendaId}/resenias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autor: autor || 'Anonimo', calificacion: estrellas, comentario }),
      });
      const data = await res.json();
      if (data.ok) {
        setAutor(''); setComentario(''); setEstrellas(5);
        onGuardado();
      } else {
        Alert.alert('Error', data.error || 'No se pudo guardar');
      }
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitulo}>Reseña para {tiendaNombre}</Text>

          <Text style={styles.modalLabel}>Calificacion</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <TouchableOpacity key={i} onPress={() => setEstrellas(i)}>
                <Text style={{ fontSize: 36, color: i <= estrellas ? '#f39c12' : '#ddd' }}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalLabel}>Tu nombre (opcional)</Text>
          <TextInput style={styles.modalInput} value={autor} onChangeText={setAutor}
            placeholder="Ej: Juan P." placeholderTextColor="#aaa" />

          <Text style={styles.modalLabel}>Comentario (opcional)</Text>
          <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
            value={comentario} onChangeText={setComentario}
            placeholder="Describe tu experiencia..." placeholderTextColor="#aaa"
            multiline />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#888', flex: 1 }]} onPress={onClose}>
              <Text style={styles.modalBtnTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: COLORS.primary, flex: 1 }, enviando && { opacity: 0.6 }]}
              onPress={enviar} disabled={enviando}
            >
              {enviando
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.modalBtnTexto}>Publicar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: COLORS.bg },
  centered:            { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBar:             { backgroundColor: COLORS.secondary, paddingTop: 50, paddingBottom: 10, paddingHorizontal: 16 },
  backText:            { color: '#fff', fontSize: 15, fontWeight: '600' },
  hero:                { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#fff', alignItems: 'center' },
  avatar:              { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:          { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  nombre:              { fontSize: 17, fontWeight: '800', color: COLORS.text },
  verificada:          { color: COLORS.verified, fontSize: 12, fontWeight: '600', marginTop: 2 },
  badgePremium:        { backgroundColor: '#f1c40f', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  badgePremiumText:    { color: '#7d4f00', fontSize: 11, fontWeight: '800' },
  distrito:            { color: COLORS.textLight, fontSize: 12, marginTop: 2 },
  calificacionTexto:   { fontSize: 12, color: COLORS.textLight },
  actions:             { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: COLORS.border, flexWrap: 'wrap' },
  btn:                 { flex: 1, minWidth: 56, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  btnText:             { color: '#fff', fontSize: 11, fontWeight: '700' },
  routeInfo:           { backgroundColor: COLORS.secondary, padding: 10, alignItems: 'center' },
  routeInfoText:       { color: '#fff', fontWeight: '600', fontSize: 13 },
  navPanel:            { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: COLORS.border },
  navBtn:              { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: COLORS.border },
  navIconBox:          { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  navIconLetter:       { color: '#fff', fontSize: 20, fontWeight: '900' },
  navBtnLabel:         { fontSize: 14, fontWeight: '700', color: COLORS.text },
  navBtnSub:           { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  tabsScroll:          { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: COLORS.border },
  tabs:                { flexDirection: 'row' },
  tabBtn:              { paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
  tabBtnActive:        { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText:             { fontSize: 12, color: COLORS.textLight },
  tabTextActive:       { color: COLORS.primary, fontWeight: '700' },
  tabContent:          { padding: 16, gap: 8 },
  infoText:            { fontSize: 14, color: COLORS.text, paddingVertical: 6, borderBottomWidth: 1, borderColor: COLORS.border },
  itemCard:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, elevation: 1 },
  itemNombre:          { fontWeight: '700', fontSize: 14, color: COLORS.text },
  itemCat:             { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  itemStock:           { fontSize: 11, color: COLORS.success, marginTop: 2 },
  itemPrecio:          { fontWeight: '800', fontSize: 15, color: COLORS.primary },
  empty:               { textAlign: 'center', color: COLORS.textLight, padding: 20, fontSize: 14 },
  btnDejarResenia:     { backgroundColor: COLORS.primary, borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 16 },
  btnDejarReseniaTexto:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  reseniaCard:         { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1 },
  reseniaHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reseniaAutor:        { fontWeight: '700', fontSize: 14, color: COLORS.text },
  reseniaComentario:   { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  reseniaFecha:        { fontSize: 11, color: COLORS.textLight, marginTop: 6 },
  modalOverlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalTitulo:         { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  modalLabel:          { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  modalInput:          { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 11, fontSize: 14, color: COLORS.text, marginBottom: 14, backgroundColor: '#fafafa' },
  modalBtn:            { borderRadius: 10, padding: 13, alignItems: 'center' },
  modalBtnTexto:       { color: '#fff', fontWeight: '700', fontSize: 15 },
});
