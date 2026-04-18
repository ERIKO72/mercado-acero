// app/screens/register-store.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { API_BASE, COLORS } from '../../constants/api';

const DISTRITOS = [
  'Ate', 'Callao', 'Comas', 'La Victoria', 'Los Olivos',
  'Miraflores', 'San Isidro', 'San Martín de Porres',
  'Santiago de Surco', 'Villa El Salvador', 'SJL', 'Otro',
];

const SERVICIOS_OPTS = ['Corte CNC', 'Doblez', 'Soldadura', 'Láser', 'Galvanizado', 'Pintura'];

export default function RegisterStore() {
  const [loading, setSending] = useState(false);
  const [form, setForm] = useState({
    nombre:      '',
    descripcion: '',
    ruc:         '',
    telefono:    '',
    email:       '',
    direccion:   '',
    distrito:    '',
    horario:     'Lun-Sab 8am-6pm',
    latitud:     -12.0464,
    longitud:    -77.0428,
  });
  const [serviciosSelected, setServiciosSelected] = useState<string[]>([]);

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  // Obtener ubicación actual
  const usarMiUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      set('latitud',  loc.coords.latitude);
      set('longitud', loc.coords.longitude);
    } catch {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    }
  };

  const toggleServicio = (s: string) => {
    setServiciosSelected(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const enviar = async () => {
    if (!form.nombre || !form.telefono || !form.direccion) {
      Alert.alert('Campos requeridos', 'Nombre, teléfono y dirección son obligatorios');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/tiendas`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const json = await res.json();
      if (json.ok) {
        Alert.alert('¡Listo!', 'Tu tienda fue registrada. Estará visible tras verificación.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', json.error || 'No se pudo registrar');
      }
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Registrar mi tienda</Text>
          <Text style={styles.subtitle}>Llega a más compradores en Lima</Text>
        </View>

        <View style={styles.form}>
          {/* Info básica */}
          <Section title="Información básica">
            <Field label="Nombre de la tienda *" value={form.nombre}
              onChange={v => set('nombre', v)} placeholder="Ej: Aceros del Norte SAC" />
            <Field label="Descripción" value={form.descripcion}
              onChange={v => set('descripcion', v)} placeholder="¿Qué vendes o haces?" multiline />
            <Field label="RUC" value={form.ruc}
              onChange={v => set('ruc', v)} placeholder="20xxxxxxxxx" keyboardType="numeric" />
          </Section>

          {/* Contacto */}
          <Section title="Contacto">
            <Field label="Teléfono *" value={form.telefono}
              onChange={v => set('telefono', v)} placeholder="01-xxx-xxxx o 9xxxxxxxx" keyboardType="phone-pad" />
            <Field label="Email" value={form.email}
              onChange={v => set('email', v)} placeholder="ventas@mitienda.com" keyboardType="email-address" />
          </Section>

          {/* Ubicación */}
          <Section title="Ubicación">
            <Field label="Dirección *" value={form.direccion}
              onChange={v => set('direccion', v)} placeholder="Av. Industrial 123" />

            {/* Selector distrito */}
            <Text style={styles.fieldLabel}>Distrito *</Text>
            <View style={styles.tags}>
              {DISTRITOS.map(d => (
                <TouchableOpacity key={d}
                  style={[styles.tag, form.distrito === d && styles.tagActive]}
                  onPress={() => set('distrito', d)}
                >
                  <Text style={[styles.tagText, form.distrito === d && styles.tagTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mapa para pin */}
            <Text style={styles.fieldLabel}>Arrastra para ubicar tu tienda</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: form.latitud, longitude: form.longitud,
                latitudeDelta: 0.05, longitudeDelta: 0.05,
              }}
              onPress={(e) => {
                set('latitud',  e.nativeEvent.coordinate.latitude);
                set('longitud', e.nativeEvent.coordinate.longitude);
              }}
            >
              <Marker
                coordinate={{ latitude: form.latitud, longitude: form.longitud }}
                draggable
                onDragEnd={e => {
                  set('latitud',  e.nativeEvent.coordinate.latitude);
                  set('longitud', e.nativeEvent.coordinate.longitude);
                }}
                pinColor={COLORS.primary}
              />
            </MapView>
            <TouchableOpacity style={styles.btnGPS} onPress={usarMiUbicacion}>
              <Text style={styles.btnGPSText}>📍 Usar mi ubicación actual</Text>
            </TouchableOpacity>
          </Section>

          {/* Servicios */}
          <Section title="Servicios que ofreces">
            <View style={styles.tags}>
              {SERVICIOS_OPTS.map(s => (
                <TouchableOpacity key={s}
                  style={[styles.tag, serviciosSelected.includes(s) && styles.tagActive]}
                  onPress={() => toggleServicio(s)}
                >
                  <Text style={[styles.tagText, serviciosSelected.includes(s) && styles.tagTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          {/* Horario */}
          <Section title="Horario de atención">
            <Field label="Horario" value={form.horario}
              onChange={v => set('horario', v)} placeholder="Lun-Sab 8am-6pm" />
          </Section>

          {/* Botón enviar */}
          <TouchableOpacity
            style={[styles.btnEnviar, loading && { opacity: 0.6 }]}
            onPress={enviar}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnEnviarText}>🚀 Registrar tienda</Text>
            }
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Tu tienda aparecerá en el mapa tras ser verificada por nuestro equipo (24-48h).
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Sub-componentes ────────────────────────────────
function Section({ title, children }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, value, onChange, placeholder, multiline, keyboardType }: any) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header:    { backgroundColor: COLORS.secondary, padding: 20, paddingTop: 54 },
  back:      { color: '#ffffff99', fontSize: 14, marginBottom: 8 },
  title:     { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle:  { color: '#ffffff88', fontSize: 13, marginTop: 4 },

  form: { padding: 16 },

  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.secondary, marginBottom: 12, borderBottomWidth: 1, borderColor: COLORS.border, paddingBottom: 6 },

  fieldWrap:  { marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginBottom: 5 },
  fieldInput: { backgroundColor: '#fff', borderRadius: 8, padding: 11, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },

  tags:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag:         { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  tagActive:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tagText:     { fontSize: 12, color: COLORS.text },
  tagTextActive: { color: '#fff', fontWeight: '700' },

  map:    { height: 200, borderRadius: 10, marginBottom: 10 },
  btnGPS: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 4 },
  btnGPSText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  btnEnviar:     { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnEnviarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  disclaimer:    { textAlign: 'center', color: COLORS.textLight, fontSize: 11, marginTop: 12, marginBottom: 30, lineHeight: 16 },
});
