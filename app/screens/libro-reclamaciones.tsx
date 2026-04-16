import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { API_BASE, COLORS } from '../../constants/api';

export default function LibroReclamaciones() {
  const [tipo,        setTipo]        = useState<'reclamo'|'queja'>('reclamo');
  const [nombres,     setNombres]     = useState('');
  const [dni,         setDni]         = useState('');
  const [direccion,   setDireccion]   = useState('');
  const [telefono,    setTelefono]    = useState('');
  const [email,       setEmail]       = useState('');
  const [bienSvc,     setBienSvc]     = useState('');
  const [monto,       setMonto]       = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [pedido,      setPedido]      = useState('');
  const [enviando,    setEnviando]    = useState(false);
  const [enviado,     setEnviado]     = useState<string | null>(null);

  const enviar = async () => {
    if (!nombres.trim() || !dni.trim() || !bienSvc.trim() || !descripcion.trim() || !pedido.trim()) {
      Alert.alert('Campos obligatorios', 'Completa todos los campos marcados con *');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/reclamaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo, nombres, dni, direccion, telefono, email,
          bien_servicio: bienSvc, monto: monto || null,
          descripcion, pedido,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setEnviado(`N° ${json.data.numero} — ${new Date().toLocaleDateString('es-PE')}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo enviar. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <View style={s.successWrap}>
        <Text style={s.successIcon}>✅</Text>
        <Text style={s.successTitle}>Reclamación registrada</Text>
        <Text style={s.successNum}>{enviado}</Text>
        <Text style={s.successSub}>
          Hemos recibido tu {tipo}. Responderemos en un plazo máximo de {tipo === 'reclamo' ? '30' : '15'} días hábiles
          según la Ley 29571 (Código de Protección al Consumidor).
        </Text>
        <TouchableOpacity style={s.btnVolver} onPress={() => router.back()}>
          <Text style={s.btnVolverText}>← Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>📋 Libro de Reclamaciones</Text>
          <Text style={s.headerSub}>Ley 29571 · INDECOPI · Perú</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Aviso legal */}
        <View style={s.aviso}>
          <Text style={s.avisoText}>
            Conforme al artículo 150° del Código de Protección y Defensa del Consumidor (Ley N° 29571),
            este establecimiento cuenta con un Libro de Reclamaciones Virtual a disposición del consumidor.
          </Text>
        </View>

        {/* Tipo */}
        <Text style={s.section}>Tipo de registro *</Text>
        <View style={s.tipoRow}>
          {(['reclamo','queja'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tipoBtn, tipo === t && s.tipoBtnActive]}
              onPress={() => setTipo(t)}
            >
              <Text style={[s.tipoText, tipo === t && s.tipoTextActive]}>
                {t === 'reclamo' ? '⚠️ Reclamo' : '💬 Queja'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.tipoHint}>
          {tipo === 'reclamo'
            ? 'Reclamo: disconformidad con un bien o servicio adquirido.'
            : 'Queja: malestar o descontento por la atención recibida (no implica reembolso).'}
        </Text>

        {/* Datos del consumidor */}
        <Text style={s.section}>Datos del consumidor</Text>

        <Text style={s.label}>Nombres y apellidos *</Text>
        <TextInput style={s.input} value={nombres} onChangeText={setNombres}
          placeholder="Tu nombre completo" placeholderTextColor="#AAA" />

        <Text style={s.label}>DNI / CE *</Text>
        <TextInput style={s.input} value={dni} onChangeText={setDni}
          placeholder="12345678" placeholderTextColor="#AAA" keyboardType="numeric" maxLength={12} />

        <Text style={s.label}>Dirección</Text>
        <TextInput style={s.input} value={direccion} onChangeText={setDireccion}
          placeholder="Tu dirección domiciliaria" placeholderTextColor="#AAA" />

        <Text style={s.label}>Teléfono / Celular</Text>
        <TextInput style={s.input} value={telefono} onChangeText={setTelefono}
          placeholder="999 000 000" placeholderTextColor="#AAA" keyboardType="phone-pad" />

        <Text style={s.label}>Correo electrónico</Text>
        <TextInput style={s.input} value={email} onChangeText={setEmail}
          placeholder="tu@email.com" placeholderTextColor="#AAA" keyboardType="email-address" autoCapitalize="none" />

        {/* Detalle del reclamo */}
        <Text style={s.section}>Detalle del {tipo}</Text>

        <Text style={s.label}>Bien o servicio reclamado *</Text>
        <TextInput style={s.input} value={bienSvc} onChangeText={setBienSvc}
          placeholder="Ej: Tubos de acero 2 pulgadas, pedido #123..." placeholderTextColor="#AAA" />

        <Text style={s.label}>Monto reclamado (S/)</Text>
        <TextInput style={s.input} value={monto} onChangeText={setMonto}
          placeholder="0.00" placeholderTextColor="#AAA" keyboardType="numeric" />

        <Text style={s.label}>Descripción detallada *</Text>
        <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]}
          value={descripcion} onChangeText={setDescripcion} multiline
          placeholder="Describe con detalle lo ocurrido: fecha, lugar, personas involucradas..."
          placeholderTextColor="#AAA" />

        <Text style={s.label}>Pedido del consumidor *</Text>
        <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]}
          value={pedido} onChangeText={setPedido} multiline
          placeholder="¿Qué solución solicitas? Ej: reembolso, cambio, reparación..."
          placeholderTextColor="#AAA" />

        {/* Pie legal */}
        <View style={s.pie}>
          <Text style={s.pieText}>
            La empresa responderá en un plazo máximo de 30 días calendario para reclamos
            y 15 días para quejas. INDECOPI supervisa el cumplimiento.
          </Text>
        </View>

        <TouchableOpacity style={s.btnEnviar} onPress={enviar} disabled={enviando}>
          {enviando
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnEnviarText}>Registrar {tipo}</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header:        { backgroundColor: COLORS.secondary, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:       { padding: 6 },
  backText:      { color: '#fff', fontSize: 22, fontWeight: '300' },
  headerTitle:   { color: '#fff', fontSize: 15, fontWeight: '800' },
  headerSub:     { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 1 },
  scroll:        { backgroundColor: '#F2F2F2' },
  aviso:         { margin: 14, backgroundColor: '#FFF3CD', borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: '#F1C40F' },
  avisoText:     { fontSize: 11, color: '#7D6608', lineHeight: 17 },
  section:       { fontSize: 11, fontWeight: '800', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: 14, marginTop: 18, marginBottom: 10 },
  label:         { fontSize: 13, fontWeight: '600', color: '#555', marginHorizontal: 14, marginBottom: 5 },
  input:         { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: '#1a1a1a', marginHorizontal: 14, marginBottom: 12 },
  tipoRow:       { flexDirection: 'row', gap: 10, marginHorizontal: 14, marginBottom: 8 },
  tipoBtn:       { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', padding: 12, alignItems: 'center' },
  tipoBtnActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  tipoText:      { fontSize: 14, fontWeight: '700', color: '#888' },
  tipoTextActive:{ color: '#fff' },
  tipoHint:      { fontSize: 11, color: '#888', marginHorizontal: 14, marginBottom: 8, fontStyle: 'italic' },
  pie:           { margin: 14, backgroundColor: '#EBF5FB', borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: '#3498DB' },
  pieText:       { fontSize: 11, color: '#1A5276', lineHeight: 17 },
  btnEnviar:     { backgroundColor: COLORS.primary, margin: 14, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnEnviarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  successWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#F2F2F2' },
  successIcon:   { fontSize: 60, marginBottom: 16 },
  successTitle:  { fontSize: 22, fontWeight: '900', color: COLORS.secondary, marginBottom: 8 },
  successNum:    { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 16 },
  successSub:    { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 30 },
  btnVolver:     { backgroundColor: COLORS.secondary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  btnVolverText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
