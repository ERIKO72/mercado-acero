import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, COLORS } from '../../../constants/api';

const MENU = [
  {
    icono: '🏪',
    titulo: 'Mi Tienda',
    desc:   'Editar informacion, fotos y horarios',
    ruta:   '/screens/admin/edit-store',
    color:  '#2980b9',
  },
  {
    icono: '📦',
    titulo: 'Productos',
    desc:   'Agregar, editar y gestionar productos',
    ruta:   '/screens/admin/products',
    color:  '#27ae60',
  },
  {
    icono: '📊',
    titulo: 'Estadisticas',
    desc:   'Visitas, llamadas y rendimiento',
    ruta:   '/screens/admin/stats',
    color:  '#8e44ad',
  },
  {
    icono: '⭐',
    titulo: 'Mi Plan',
    desc:   'Ver suscripcion y upgrade Premium',
    ruta:   '/screens/admin/subscription',
    color:  '#f39c12',
  },
];

export default function DashboardScreen() {
  const [usuario,       setUsuario]       = useState<any>(null);
  const [estadoTienda,  setEstadoTienda]  = useState<string | null>(null);

  useEffect(() => { cargarUsuario(); }, []);

  const cargarUsuario = async () => {
    const data  = await AsyncStorage.getItem('usuario');
    const token = await AsyncStorage.getItem('token');
    if (!data) { router.replace('/screens/login'); return; }
    const u = JSON.parse(data);
    setUsuario(u);
    if (u.tienda_id && token) {
      try {
        const r = await fetch(API.adminTienda, { headers: { Authorization: `Bearer ${token}` } });
        const j = await r.json();
        if (j.ok) setEstadoTienda(j.data?.estado || 'aprobada');
      } catch {}
    }
  };

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar sesion',
      'Estas seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir', style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['token', 'usuario', 'nombre']);
            router.replace('/screens/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Header de marca ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLetter}>M</Text>
            </View>
            <View>
              <Text style={styles.marcaNombre}>MARKETPLACE</Text>
              <Text style={styles.marcaSub}>Panel de administracion</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.btnSalir} onPress={cerrarSesion}>
            <Text style={styles.btnSalirText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Bienvenida */}
        <View style={styles.bienvenidaBox}>
          <View style={styles.avatarUser}>
            <Text style={styles.avatarUserText}>
              {(usuario?.nombre || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.bienvenidaHola}>Hola, {usuario?.nombre || 'Dueno'}</Text>
            <Text style={styles.bienvenidaEmail}>{usuario?.email}</Text>
          </View>
        </View>
      </View>

      {/* ── Banner estado tienda ── */}
      {estadoTienda === 'pendiente' && (
        <View style={styles.bannerPendiente}>
          <Text style={styles.bannerIcono}>⏳</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitulo}>Solicitud en revisión</Text>
            <Text style={styles.bannerTexto}>Tu tienda está siendo revisada por el administrador. Te notificaremos cuando sea aprobada.</Text>
          </View>
        </View>
      )}
      {estadoTienda === 'rechazada' && (
        <View style={[styles.bannerPendiente, { backgroundColor: '#FDEDEC', borderColor: '#E74C3C' }]}>
          <Text style={styles.bannerIcono}>❌</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitulo, { color: '#E74C3C' }]}>Solicitud rechazada</Text>
            <Text style={styles.bannerTexto}>Tu solicitud no fue aprobada. Contacta al administrador para más información.</Text>
          </View>
        </View>
      )}

      {/* ── Seccion menu ── */}
      <Text style={styles.seccionLabel}>Gestion de tu tienda</Text>

      <View style={styles.menuGrid}>
        {MENU.map(item => (
          <TouchableOpacity
            key={item.ruta}
            style={styles.menuCard}
            onPress={() => router.push(item.ruta as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.menuIconBox, { backgroundColor: item.color + '18' }]}>
              <Text style={styles.menuIcono}>{item.icono}</Text>
            </View>
            <Text style={styles.menuTitulo}>{item.titulo}</Text>
            <Text style={styles.menuDesc}>{item.desc}</Text>
            <View style={[styles.menuBar, { backgroundColor: item.color }]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Tip del dia ── */}
      <View style={styles.tipBox}>
        <Text style={styles.tipIcono}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitulo}>Tip Pro</Text>
          <Text style={styles.tipTexto}>
            Sube al plan Premium para aparecer con pin dorado en el mapa y posicionarte primero en la lista.
          </Text>
        </View>
      </View>

      {/* ── Boton cerrar sesion ── */}
      <TouchableOpacity style={styles.btnCerrarAbajo} onPress={cerrarSesion}>
        <Text style={styles.btnCerrarAbajoText}>Cerrar sesion</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F2F2F2' },

  // Header
  header:          { backgroundColor: COLORS.primary, paddingTop: 52, paddingBottom: 20, paddingHorizontal: 16 },
  headerTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  logoRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle:      {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  logoLetter:      { color: '#fff', fontSize: 18, fontWeight: '900' },
  marcaNombre:     { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
  marcaSub:        { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 1 },
  btnSalir:        {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  btnSalirText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  bienvenidaBox:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: 12 },
  avatarUser:      { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarUserText:  { color: '#fff', fontSize: 22, fontWeight: '900' },
  bienvenidaHola:  { color: '#fff', fontSize: 17, fontWeight: '700' },
  bienvenidaEmail: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  // Menu
  seccionLabel:    { fontSize: 11, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  menuGrid:        { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10 },
  menuCard:        {
    width: '47%', backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    elevation: 3, overflow: 'hidden',
    position: 'relative',
  },
  menuIconBox:     { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  menuIcono:       { fontSize: 24 },
  menuTitulo:      { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  menuDesc:        { fontSize: 11, color: '#999', lineHeight: 15 },
  menuBar:         { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },

  // Tip
  tipBox:          { flexDirection: 'row', gap: 10, backgroundColor: '#fff8e6', borderRadius: 14, margin: 16, padding: 14, borderLeftWidth: 4, borderLeftColor: '#f39c12' },
  tipIcono:        { fontSize: 22 },
  tipTitulo:       { fontSize: 13, fontWeight: '700', color: '#e67e22', marginBottom: 3 },
  tipTexto:        { fontSize: 12, color: '#7d6608', lineHeight: 18 },

  // Banner estado tienda
  bannerPendiente: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFF3CD', borderWidth: 1.5, borderColor: '#F0B429', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 12 },
  bannerIcono:     { fontSize: 22 },
  bannerTitulo:    { fontSize: 13, fontWeight: '800', color: '#7D6608', marginBottom: 4 },
  bannerTexto:     { fontSize: 12, color: '#7D6608', lineHeight: 18 },

  // Cerrar sesion footer
  btnCerrarAbajo:  { margin: 16, marginTop: 6, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.primary, alignItems: 'center' },
  btnCerrarAbajoText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});
