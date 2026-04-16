import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { API, COLORS } from '../../constants/api';

export default function ForgotPasswordScreen() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleEnviar = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Ingresa tu correo electrónico');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(API.forgotPassword, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setEnviado(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <View style={s.logoCircle}>
          <Text style={s.logoText}>🔑</Text>
        </View>
        <Text style={s.titulo}>Recuperar contraseña</Text>
        <Text style={s.subtitulo}>Te enviaremos un enlace a tu correo</Text>
      </View>

      {/* Formulario */}
      <View style={s.card}>
        {enviado ? (
          <View style={s.successBox}>
            <Text style={s.successIcon}>✅</Text>
            <Text style={s.successTitulo}>¡Correo enviado!</Text>
            <Text style={s.successTexto}>
              Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </Text>
            <Text style={s.successNota}>Revisa también tu carpeta de spam.</Text>
            <TouchableOpacity style={s.btnVolver} onPress={() => router.replace('/screens/login')}>
              <Text style={s.btnVolverText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.label}>Correo electrónico</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tucorreo@email.com"
              placeholderTextColor="#AAA"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity style={s.btn} onPress={handleEnviar} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Enviar enlace de recuperación</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={s.linkBtn}>
              <Text style={s.linkText}>¿Recordaste tu contraseña? Iniciar sesión</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap:           { flex: 1, backgroundColor: COLORS.secondary },
  header:         { alignItems: 'center', paddingTop: 60, paddingBottom: 30, paddingHorizontal: 24 },
  backBtn:        { alignSelf: 'flex-start', marginBottom: 20 },
  backText:       { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  logoCircle:     { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText:       { fontSize: 32 },
  titulo:         { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  subtitulo:      { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center' },
  card:           { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 },
  label:          { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8 },
  input:          { backgroundColor: '#F5F5F5', borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1a1a1a', marginBottom: 20 },
  btn:            { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 16 },
  btnText:        { color: '#fff', fontWeight: '800', fontSize: 15 },
  linkBtn:        { alignItems: 'center', padding: 8 },
  linkText:       { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  successBox:     { alignItems: 'center', paddingTop: 20, gap: 12 },
  successIcon:    { fontSize: 52 },
  successTitulo:  { fontSize: 20, fontWeight: '900', color: COLORS.secondary },
  successTexto:   { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22 },
  successNota:    { fontSize: 12, color: '#AAA', textAlign: 'center' },
  btnVolver:      { backgroundColor: COLORS.secondary, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 16, width: '100%' },
  btnVolverText:  { color: '#fff', fontWeight: '800', fontSize: 15 },
});
