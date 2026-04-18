import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { API, COLORS } from '../../constants/api';

async function registrarPushToken(usuarioId: number, rol: string) {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await fetch(API.pushRegistrar, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, plataforma: Platform.OS, usuario_id: usuarioId, rol }),
    });
  } catch {}
}

export default function LoginScreen() {
  const [email,       setEmail]   = useState('');
  const [password,    setPassword] = useState('');
  const [loading,     setLoading]  = useState(false);
  const [mostrarPass, setMostrar]  = useState(false);
  // 2FA superadmin
  const [requiere2fa, setRequiere2fa] = useState(false);
  const [otp,         setOtp]         = useState('');
  const [emailOtp,    setEmailOtp]    = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos vacios', 'Ingresa tu email y contrasena');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(API.login, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Acceso denegado', data.error || 'Credenciales incorrectas');
        return;
      }
      // Superadmin requiere código 2FA
      if (data.requiere2fa) {
        setEmailOtp(data.email);
        setRequiere2fa(true);
        return;
      }
      await completarLogin(data);
    } catch {
      Alert.alert('Error de conexion', 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Código inválido', 'Ingresa el código de 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(API.verifyOtp, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: emailOtp, codigo: otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        Alert.alert('Código incorrecto', data.error || 'Intenta de nuevo');
        return;
      }
      await completarLogin(data);
    } catch {
      Alert.alert('Error de conexion', 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  const completarLogin = async (data: any) => {
    await AsyncStorage.setItem('token',   data.token);
    await AsyncStorage.setItem('usuario', JSON.stringify(data.usuario));
    if (data.usuario?.nombre) {
      await AsyncStorage.setItem('nombre', data.usuario.nombre);
    }
    const esSuperadmin = data.usuario?.rol === 'superadmin';
    if (Platform.OS !== 'web') {
      registrarPushToken(data.usuario?.id, data.usuario?.rol);
    }
    const destino = esSuperadmin ? '/screens/superadmin/dashboard' : '/screens/admin/dashboard';
    if (Platform.OS === 'web') {
      window.location.href = destino;
    } else {
      router.replace(destino as any);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Cabecera de marca ── */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.heroMarca}>MARKETPLACE</Text>
          <Text style={styles.heroSub}>Marketplace del Acero</Text>
          <View style={styles.heroLinea} />
          <Text style={styles.heroPanel}>Panel de Tienda</Text>
        </View>

        {/* ── Formulario 2FA ── */}
        {requiere2fa ? (
          <View style={styles.card}>
            <Text style={{ fontSize: 22, textAlign: 'center', marginBottom: 8 }}>🔐</Text>
            <Text style={[styles.label, { fontSize: 16, textAlign: 'center', marginBottom: 4 }]}>Verificación de seguridad</Text>
            <Text style={{ color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
              Se envió un código de 6 dígitos a {'\n'}<Text style={{ fontWeight: '700', color: '#333' }}>{emailOtp}</Text>
            </Text>
            <Text style={styles.label}>Código de acceso</Text>
            <TextInput
              style={[styles.input, { textAlign: 'center', fontSize: 28, letterSpacing: 12, fontWeight: '900' }]}
              placeholder="000000"
              placeholderTextColor="#ccc"
              value={otp}
              onChangeText={t => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.boton, loading && { opacity: 0.6 }]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.botonText}>Verificar código</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={{ alignItems: 'center', marginTop: 16 }}
              onPress={() => { setRequiere2fa(false); setOtp(''); }}
            >
              <Text style={{ color: '#999', fontSize: 13 }}>← Volver al login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ alignItems: 'center', marginTop: 10 }}
              onPress={() => router.push('/screens/forgot-password')}
            >
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>¿Problemas para acceder? Recuperar cuenta</Text>
            </TouchableOpacity>
          </View>
        ) : (

        /* ── Formulario normal ── */
        <View style={styles.card}>

          <Text style={styles.label}>Correo electronico</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@empresa.com"
            placeholderTextColor="#bbb"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Contrasena</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, styles.passInput]}
              placeholder="Tu contrasena"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!mostrarPass}
            />
            <TouchableOpacity
              style={styles.ojoBtn}
              onPress={() => setMostrar(v => !v)}
            >
              <Text style={styles.ojoText}>{mostrarPass ? 'Ocultar' : 'Ver'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.boton, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.botonText}>Ingresar al panel</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={{ alignItems: 'center', marginTop: 12 }}
            onPress={() => router.push('/screens/forgot-password')}
          >
            <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.btnRegistro}
            onPress={() => router.push('/screens/register-store')}
          >
            <Text style={styles.btnRegistroText}>Registrar mi tienda gratis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnVolver}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.btnVolverText}>← Volver al inicio</Text>
          </TouchableOpacity>
        </View>
        )} {/* fin ternario 2FA */}

        {/* ── Footer ── */}
        <Text style={styles.footer}>
          MARKETPLACE — Acero & Metales en Lima
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.secondary },
  scroll:        { flexGrow: 1, alignItems: 'center', paddingBottom: 30 },

  // Hero
  hero:          { alignItems: 'center', paddingTop: 60, paddingBottom: 30, width: '100%' },
  logoCircle:    {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14,
  },
  logoLetter:    { color: '#fff', fontSize: 42, fontWeight: '900' },
  heroMarca:     { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 3 },
  heroSub:       { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 4, letterSpacing: 1 },
  heroLinea:     { width: 40, height: 2, backgroundColor: COLORS.primary, marginVertical: 14 },
  heroPanel:     { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },

  // Card formulario
  card:          {
    backgroundColor: '#fff',
    borderRadius: 20, padding: 24,
    width: '90%', maxWidth: 400,
    elevation: 10,
  },
  label:         { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input:         {
    borderWidth: 1.5, borderColor: '#E8E8E8',
    borderRadius: 12, padding: 13,
    fontSize: 15, color: '#1a1a1a',
    backgroundColor: '#FAFAFA',
    marginBottom: 14,
  },
  passRow:       { flexDirection: 'row', gap: 8, marginBottom: 14 },
  passInput:     { flex: 1, marginBottom: 0 },
  ojoBtn:        {
    backgroundColor: COLORS.secondary,
    borderRadius: 12, paddingHorizontal: 13, paddingVertical: 13,
  },
  ojoText:       { color: '#fff', fontSize: 13, fontWeight: '600' },

  boton:         {
    backgroundColor: COLORS.primary,
    borderRadius: 12, padding: 15,
    alignItems: 'center', marginTop: 4,
  },
  botonText:     { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  divider:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  dividerLine:   { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText:   { color: '#bbb', fontSize: 13 },

  btnRegistro:   {
    borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  btnRegistroText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },

  btnVolver:     { alignItems: 'center', marginTop: 14 },
  btnVolverText: { color: '#999', fontSize: 13 },

  footer:        { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 24, letterSpacing: 0.5 },
});
