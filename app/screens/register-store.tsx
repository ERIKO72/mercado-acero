import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, API } from '../../constants/api';

const DISTRITOS = [
  'Ate', 'Callao', 'Los Olivos', 'San Martín de Porres', 'La Victoria',
  'Villa El Salvador', 'Comas', 'San Juan de Lurigancho', 'Independencia', 'Lurín',
  'Chorrillos', 'Villa María del Triunfo', 'Santa Anita', 'El Agustino',
  'Rímac', 'Breña', 'Cercado de Lima', 'Puente Piedra', 'Ventanilla',
  'Lince', 'Surquillo', 'San Juan de Miraflores', 'Carabayllo',
  'La Molina', 'Surco', 'Jesús María', 'San Borja', 'San Isidro', 'Miraflores', 'Otro',
];

const WA_ADMIN = '51933019619';

export default function RegisterStore() {
  const [form, setForm] = useState({
    nombre: '', descripcion: '', ruc: '', telefono: '',
    email: '', direccion: '', distrito: '', horario: 'Lun-Sab 8am-6pm',
    contacto: '',
  });
  const [enviado, setEnviado] = useState(false);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const enviarWhatsApp = async () => {
    if (!form.nombre.trim() || !form.telefono.trim() || !form.direccion.trim()) {
      Alert.alert('Campos requeridos', 'Nombre, teléfono y dirección son obligatorios');
      return;
    }

    // Guardar solicitud en backend y disparar push al superadmin
    fetch(API.pushSolicitud, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    }).catch(() => {});

    const msg = [
      '🏪 *SOLICITUD DE REGISTRO — Marketplace del Acero*',
      '',
      `📌 *Tienda:* ${form.nombre}`,
      form.descripcion ? `📝 *Descripción:* ${form.descripcion}` : '',
      form.ruc        ? `🔢 *RUC:* ${form.ruc}` : '',
      `📞 *Teléfono:* ${form.telefono}`,
      form.email      ? `📧 *Email:* ${form.email}` : '',
      `📍 *Dirección:* ${form.direccion}`,
      form.distrito   ? `🗺️ *Distrito:* ${form.distrito}` : '',
      `🕐 *Horario:* ${form.horario}`,
      form.contacto   ? `👤 *Contacto:* ${form.contacto}` : '',
      '',
      '✅ Solicito ser registrado en el Marketplace del Acero.',
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir WhatsApp')
    );
    setEnviado(true);
  };

  if (enviado) {
    return (
      <View style={s.successWrap}>
        <Text style={s.successIcon}>✅</Text>
        <Text style={s.successTitulo}>¡Solicitud enviada!</Text>
        <Text style={s.successTexto}>
          Tu información fue enviada por WhatsApp al administrador.{'\n'}
          Te contactaremos para completar tu registro.
        </Text>
        <TouchableOpacity style={s.btnVolver} onPress={() => router.replace('/')}>
          <Text style={s.btnVolverText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← Volver</Text>
          </TouchableOpacity>
          <Text style={s.title}>Registrar mi tienda</Text>
          <Text style={s.subtitle}>Completa el formulario y te contactaremos</Text>
        </View>

        <View style={s.form}>

          <View style={s.infoBox}>
            <Text style={s.infoText}>
              📲 Al enviar, tus datos llegarán por WhatsApp al administrador quien registrará tu tienda y te dará acceso al panel.
            </Text>
          </View>

          {/* Datos de la tienda */}
          <Text style={s.seccion}>Datos de la tienda</Text>

          <Text style={s.label}>Nombre de la tienda *</Text>
          <TextInput style={s.input} value={form.nombre} onChangeText={v => set('nombre', v)}
            placeholder="Ej: Aceros del Norte" placeholderTextColor={COLORS.textLight} />

          <Text style={s.label}>Descripción</Text>
          <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]}
            value={form.descripcion} onChangeText={v => set('descripcion', v)}
            placeholder="¿Qué vendes o fabricas?" placeholderTextColor={COLORS.textLight} multiline />

          <Text style={s.label}>RUC</Text>
          <TextInput style={s.input} value={form.ruc} onChangeText={v => set('ruc', v)}
            placeholder="20xxxxxxxxx" placeholderTextColor={COLORS.textLight} keyboardType="numeric" />

          <Text style={s.label}>Teléfono de la tienda *</Text>
          <TextInput style={s.input} value={form.telefono} onChangeText={v => set('telefono', v)}
            placeholder="999 999 999" placeholderTextColor={COLORS.textLight} keyboardType="phone-pad" />

          <Text style={s.label}>Email de la tienda</Text>
          <TextInput style={s.input} value={form.email} onChangeText={v => set('email', v)}
            placeholder="tienda@ejemplo.com" placeholderTextColor={COLORS.textLight}
            keyboardType="email-address" autoCapitalize="none" />

          <Text style={s.label}>Dirección *</Text>
          <TextInput style={s.input} value={form.direccion} onChangeText={v => set('direccion', v)}
            placeholder="Av. Industrial 123" placeholderTextColor={COLORS.textLight} />

          <Text style={s.label}>Distrito</Text>
          <View style={s.tags}>
            {DISTRITOS.map(d => (
              <TouchableOpacity key={d} style={[s.tag, form.distrito === d && s.tagActive]}
                onPress={() => set('distrito', d)}>
                <Text style={[s.tagText, form.distrito === d && s.tagTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Horario de atención</Text>
          <TextInput style={s.input} value={form.horario} onChangeText={v => set('horario', v)}
            placeholder="Lun-Sab 8am-6pm" placeholderTextColor={COLORS.textLight} />

          <Text style={s.label}>Nombre de contacto</Text>
          <TextInput style={s.input} value={form.contacto} onChangeText={v => set('contacto', v)}
            placeholder="Tu nombre completo" placeholderTextColor={COLORS.textLight} />

          {/* Botón enviar */}
          <TouchableOpacity style={s.btnEnviar} onPress={enviarWhatsApp}>
            <Text style={s.btnEnviarText}>📲 Enviar solicitud por WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/screens/login')} style={{ alignItems: 'center', marginTop: 16, marginBottom: 40 }}>
            <Text style={{ color: COLORS.secondary, fontSize: 13, textDecorationLine: 'underline' }}>
              Ya tengo cuenta — Iniciar sesión
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  header:         { backgroundColor: COLORS.secondary, padding: 20, paddingTop: 54 },
  back:           { color: '#ffffff99', fontSize: 14, marginBottom: 8 },
  title:          { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle:       { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 },
  form:           { padding: 16 },
  infoBox:        { backgroundColor: '#E8F4FD', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: COLORS.verified },
  infoText:       { fontSize: 13, color: '#1a5276', lineHeight: 20 },
  seccion:        { fontSize: 13, fontWeight: '800', color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, marginTop: 8 },
  label:          { fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginBottom: 5, marginTop: 12 },
  input:          { backgroundColor: '#fff', borderRadius: 8, padding: 11, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  tags:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4, marginTop: 4 },
  tag:            { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  tagActive:      { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tagText:        { fontSize: 12, color: COLORS.text },
  tagTextActive:  { color: '#fff', fontWeight: '700' },
  btnEnviar:      { backgroundColor: '#25D366', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28, marginBottom: 12 },
  btnEnviarText:  { color: '#fff', fontWeight: '800', fontSize: 16 },
  successWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#fff' },
  successIcon:    { fontSize: 64, marginBottom: 16 },
  successTitulo:  { fontSize: 22, fontWeight: '900', color: COLORS.secondary, marginBottom: 12 },
  successTexto:   { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  btnVolver:      { backgroundColor: COLORS.secondary, borderRadius: 12, padding: 16, alignItems: 'center', width: '100%' },
  btnVolverText:  { color: '#fff', fontWeight: '800', fontSize: 15 },
});
