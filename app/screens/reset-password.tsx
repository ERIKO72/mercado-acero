import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { API, COLORS } from '../../constants/api';

export default function ResetPasswordScreen() {
  const { token }         = useLocalSearchParams<{ token: string }>();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [listo,     setListo]     = useState(false);

  const handleReset = async () => {
    if (!password || password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (!token) {
      Alert.alert('Error', 'Token inválido. Solicita un nuevo enlace.');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(API.resetPassword, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setListo(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.header}>
        <View style={s.logoCircle}>
          <Text style={s.logoText}>🔐</Text>
        </View>
        <Text style={s.titulo}>Nueva contraseña</Text>
        <Text style={s.subtitulo}>Elige una contraseña segura</Text>
      </View>

      <View style={s.card}>
        {listo ? (
          <View style={s.successBox}>
            <Text style={s.successIcon}>✅</Text>
            <Text style={s.successTitulo}>¡Contraseña actualizada!</Text>
            <Text style={s.successTexto}>Ya puedes iniciar sesión con tu nueva contraseña.</Text>
            <TouchableOpacity style={s.btn} onPress={() => router.replace('/screens/login')}>
              <Text style={s.btnText}>Ir al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.label}>Nueva contraseña</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#AAA"
              secureTextEntry
            />

            <Text style={s.label}>Confirmar contraseña</Text>
            <TextInput
              style={s.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repite la contraseña"
              placeholderTextColor="#AAA"
              secureTextEntry
            />

            <TouchableOpacity style={s.btn} onPress={handleReset} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Restablecer contraseña</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap:          { flex: 1, backgroundColor: COLORS.secondary },
  header:        { alignItems: 'center', paddingTop: 80, paddingBottom: 30, paddingHorizontal: 24 },
  logoCircle:    { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText:      { fontSize: 32 },
  titulo:        { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  subtitulo:     { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  card:          { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 },
  label:         { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8 },
  input:         { backgroundColor: '#F5F5F5', borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1a1a1a', marginBottom: 20 },
  btn:           { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText:       { color: '#fff', fontWeight: '800', fontSize: 15 },
  successBox:    { alignItems: 'center', paddingTop: 20, gap: 16 },
  successIcon:   { fontSize: 52 },
  successTitulo: { fontSize: 20, fontWeight: '900', color: COLORS.secondary },
  successTexto:  { fontSize: 14, color: '#555', textAlign: 'center' },
});
