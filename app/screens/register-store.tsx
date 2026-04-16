import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapaRegistro from '../../components/MapaRegistro';
import { API, API_BASE, COLORS } from '../../constants/api';

const DISTRITOS = [
  // Zonas industriales / ferreterías
  'Ate', 'Callao', 'Los Olivos', 'San Martín de Porres', 'La Victoria',
  'Villa El Salvador', 'Comas', 'San Juan de Lurigancho', 'Independencia', 'Lurín',
  'Chorrillos', 'Villa María del Triunfo', 'Santa Anita', 'El Agustino',
  'Rímac', 'Breña', 'Cercado de Lima', 'Puente Piedra', 'Ventanilla',
  'Lince', 'Surquillo', 'San Juan de Miraflores', 'Carabayllo',
  // Zonas mixtas
  'La Molina', 'Surco', 'Jesús María',
  // Zonas residenciales (pocas tiendas del rubro)
  'San Borja', 'San Isidro', 'Miraflores',
  'Otro',
];

export default function RegisterStore() {
  const [loading, setLoading]         = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [form, setForm] = useState({
    // Tienda
    nombre: '', descripcion: '', ruc: '', telefono: '', email: '',
    direccion: '', distrito: '', horario: 'Lun-Sab 8am-6pm',
    latitud: -12.0464, longitud: -77.0428,
    // Cuenta del dueño
    dueno_nombre: '', dueno_email: '', dueno_password: '',
  });

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const usarMiUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      set('latitud', loc.coords.latitude);
      set('longitud', loc.coords.longitude);
    } catch { Alert.alert('Error', 'No se pudo obtener la ubicacion'); }
  };

  const enviar = async () => {
    // Validaciones
    if (!form.nombre || !form.telefono || !form.direccion) {
      Alert.alert('Campos requeridos', 'Nombre, telefono y direccion son obligatorios');
      return;
    }
    if (!form.dueno_email || !form.dueno_password || !form.dueno_nombre) {
      Alert.alert('Cuenta requerida', 'Completa los datos de tu cuenta (nombre, email y contrasena)');
      return;
    }
    if (form.dueno_password.length < 6) {
      Alert.alert('Contrasena corta', 'La contrasena debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      // Paso 1: Crear la tienda
      const resTienda = await fetch(`${API_BASE}/api/tiendas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:      form.nombre,
          descripcion: form.descripcion,
          ruc:         form.ruc,
          telefono:    form.telefono,
          email:       form.email,
          direccion:   form.direccion,
          distrito:    form.distrito,
          horario:     form.horario,
          latitud:     form.latitud,
          longitud:    form.longitud,
        }),
      });
      const jsonTienda = await resTienda.json();
      if (!jsonTienda.ok) {
        Alert.alert('Error', jsonTienda.error || 'No se pudo registrar la tienda');
        return;
      }

      const tienda_id = jsonTienda.data.id;

      // Paso 2: Crear cuenta del dueño vinculada a la tienda
      const resCuenta = await fetch(API.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:    form.dueno_nombre,
          email:     form.dueno_email,
          password:  form.dueno_password,
          tienda_id: tienda_id,
        }),
      });
      const jsonCuenta = await resCuenta.json();
      if (!resCuenta.ok) {
        Alert.alert('Tienda creada, pero...', jsonCuenta.error || 'No se pudo crear la cuenta. Intenta registrarte desde login.');
        router.back();
        return;
      }

      // Paso 3: Auto-login — guardar token y usuario
      await AsyncStorage.setItem('token', jsonCuenta.token);
      await AsyncStorage.setItem('usuario', JSON.stringify(jsonCuenta.usuario));

      Alert.alert(
        'Todo listo!',
        'Tu tienda y cuenta fueron creadas. Ahora puedes gestionar tu tienda.',
        [{ text: 'Ir al panel', onPress: () => router.replace('/screens/admin/dashboard') }]
      );
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Registrar mi tienda</Text>
        </View>

        <View style={styles.form}>

          {/* ── DATOS DE LA TIENDA ── */}
          <Text style={styles.seccion}>Datos de la tienda</Text>

          <Text style={styles.label}>Nombre *</Text>
          <TextInput style={styles.input} value={form.nombre}
            onChangeText={v => set('nombre', v)} placeholder="Ej: Aceros del Norte"
            placeholderTextColor={COLORS.textLight} />

          <Text style={styles.label}>Descripcion</Text>
          <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            value={form.descripcion} onChangeText={v => set('descripcion', v)}
            placeholder="Que vendes o haces?" placeholderTextColor={COLORS.textLight} multiline />

          <Text style={styles.label}>RUC</Text>
          <TextInput style={styles.input} value={form.ruc} onChangeText={v => set('ruc', v)}
            placeholder="20xxxxxxxxx" placeholderTextColor={COLORS.textLight} keyboardType="numeric" />

          <Text style={styles.label}>Telefono *</Text>
          <TextInput style={styles.input} value={form.telefono} onChangeText={v => set('telefono', v)}
            placeholder="01-xxx-xxxx" placeholderTextColor={COLORS.textLight} keyboardType="phone-pad" />

          <Text style={styles.label}>Email de la tienda</Text>
          <TextInput style={styles.input} value={form.email} onChangeText={v => set('email', v)}
            placeholder="tienda@ejemplo.com" placeholderTextColor={COLORS.textLight}
            keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Direccion *</Text>
          <TextInput style={styles.input} value={form.direccion} onChangeText={v => set('direccion', v)}
            placeholder="Av. Industrial 123" placeholderTextColor={COLORS.textLight} />

          <Text style={styles.label}>Distrito</Text>
          <View style={styles.tags}>
            {DISTRITOS.map(d => (
              <TouchableOpacity key={d} style={[styles.tag, form.distrito === d && styles.tagActive]}
                onPress={() => set('distrito', d)}>
                <Text style={[styles.tagText, form.distrito === d && styles.tagTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Ubica tu tienda en el mapa</Text>
          <MapaRegistro latitud={form.latitud} longitud={form.longitud}
            onChange={(lat, lng) => { set('latitud', lat); set('longitud', lng); }} />
          <TouchableOpacity style={styles.btnGPS} onPress={usarMiUbicacion}>
            <Text style={styles.btnGPSText}>Usar mi ubicacion actual</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Horario</Text>
          <TextInput style={styles.input} value={form.horario} onChangeText={v => set('horario', v)}
            placeholder="Lun-Sab 8am-6pm" placeholderTextColor={COLORS.textLight} />

          {/* ── CUENTA DEL DUEÑO ── */}
          <Text style={[styles.seccion, { marginTop: 28 }]}>Cuenta del administrador</Text>
          <Text style={styles.seccionSub}>Con estos datos podras ingresar al panel de gestion</Text>

          <Text style={styles.label}>Tu nombre *</Text>
          <TextInput style={styles.input} value={form.dueno_nombre}
            onChangeText={v => set('dueno_nombre', v)} placeholder="Nombre completo"
            placeholderTextColor={COLORS.textLight} />

          <Text style={styles.label}>Email de acceso *</Text>
          <TextInput style={styles.input} value={form.dueno_email}
            onChangeText={v => set('dueno_email', v)} placeholder="correo@ejemplo.com"
            placeholderTextColor={COLORS.textLight} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Contrasena * (min. 6 caracteres)</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, styles.passInput]}
              value={form.dueno_password}
              onChangeText={v => set('dueno_password', v)}
              placeholder="Minimo 6 caracteres"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry={!mostrarPass}
            />
            <TouchableOpacity style={styles.passOjo} onPress={() => setMostrarPass(v => !v)}>
              <Text style={styles.passOjoTexto}>{mostrarPass ? 'Ocultar' : 'Ver'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btnEnviar, loading && { opacity: 0.6 }]}
            onPress={enviar}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnEnviarText}>Registrar tienda y crear cuenta</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/screens/login')}>
            <Text style={styles.linkLogin}>Ya tengo cuenta — Iniciar sesion</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  header:       { backgroundColor: COLORS.secondary, padding: 20, paddingTop: 54 },
  back:         { color: '#ffffff99', fontSize: 14, marginBottom: 8 },
  title:        { color: '#fff', fontSize: 22, fontWeight: '800' },
  form:         { padding: 16 },
  seccion:      { fontSize: 13, fontWeight: '800', color: COLORS.secondary,
                  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, marginTop: 8 },
  seccionSub:   { fontSize: 12, color: COLORS.textLight, marginBottom: 12 },
  label:        { fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginBottom: 5, marginTop: 12 },
  input:        { backgroundColor: '#fff', borderRadius: 8, padding: 11, fontSize: 14,
                  color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  tags:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  tag:          { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
                  borderWidth: 1, borderColor: COLORS.border },
  tagActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tagText:      { fontSize: 12, color: COLORS.text },
  tagTextActive:{ color: '#fff', fontWeight: '700' },
  btnGPS:       { backgroundColor: COLORS.accent, borderRadius: 8, padding: 10,
                  alignItems: 'center', marginTop: 8, marginBottom: 4 },
  btnGPSText:   { color: '#fff', fontWeight: '600', fontSize: 13 },
  passRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passInput:    { flex: 1, marginBottom: 0 },
  passOjo:      { backgroundColor: COLORS.secondary, borderRadius: 8, paddingHorizontal: 12,
                  paddingVertical: 12, marginTop: 0 },
  passOjoTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnEnviar:    { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16,
                  alignItems: 'center', marginTop: 28, marginBottom: 12 },
  btnEnviarText:{ color: '#fff', fontWeight: '800', fontSize: 16 },
  linkLogin:    { textAlign: 'center', color: COLORS.secondary, fontSize: 13,
                  marginBottom: 40, textDecorationLine: 'underline' },
});
