import { Stack } from 'expo-router';
import { COLORS, API } from '../constants/api';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';

// ── Config remota del servidor ─────────────────────────────
type AppConfig = {
  trial_activo:      string; // 'true' | 'false'
  trial_until:       string; // 'AAAA-MM-DD'
  contacto_whatsapp: string; // '51XXXXXXXXX'
  trial_mensaje:     string;
};

async function fetchConfig(): Promise<AppConfig | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s máximo
    const res  = await fetch(API.appConfig, { cache: 'no-store', signal: controller.signal });
    clearTimeout(timeout);
    const json = await res.json();
    if (json.ok) return json.data as AppConfig;
    return null;
  } catch {
    return null; // Si falla o timeout → app abre normal
  }
}

function isExpired(cfg: AppConfig): boolean {
  if (cfg.trial_activo !== 'true') return false;
  if (!cfg.trial_until) return false;
  return new Date() > new Date(cfg.trial_until + 'T23:59:59');
}

// ── Pantalla demo vencida ──────────────────────────────────
function TrialExpiredScreen({ cfg }: { cfg: AppConfig }) {
  const [taps, setTaps] = useState(0);

  const handleLogoTap = () => {
    const next = taps + 1;
    setTaps(next);
    if (next >= 5) {
      setTaps(0);
      if (typeof window !== 'undefined') window.location.href = '/screens/login';
    }
  };

  const waNum  = cfg.contacto_whatsapp || '51999999999';
  const waLink = `https://wa.me/${waNum}?text=Hola%2C+quiero+contratar+el+Marketplace+del+Acero`;

  return (
    <View style={tr.wrap}>
      <TouchableOpacity onPress={handleLogoTap} activeOpacity={1}>
        <View style={tr.logo}><Text style={tr.logoText}>MP</Text></View>
      </TouchableOpacity>
      <Text style={tr.titulo}>DEMO FINALIZADA</Text>
      <Text style={tr.sub}>{cfg.trial_mensaje || 'El período de prueba ha concluido.'}</Text>
      <View style={tr.card}>
        <Text style={tr.cardTitulo}>¿Te gustó el marketplace?</Text>
        <Text style={tr.cardBody}>
          Contrata el plan completo y activa tu plataforma con todas las tiendas,
          productos y funciones admin.
        </Text>
        <TouchableOpacity style={tr.btnContacto} onPress={() => Linking.openURL(waLink)}>
          <Text style={tr.btnContactoText}>📲 Contactar por WhatsApp</Text>
        </TouchableOpacity>
      </View>
      <Text style={tr.footer}>Marketplace del Acero · Lima, Perú</Text>
    </View>
  );
}

const tr = StyleSheet.create({
  wrap:            { flex: 1, backgroundColor: '#1C2833', alignItems: 'center', justifyContent: 'center', padding: 28 },
  logo:            { width: 80, height: 80, borderRadius: 40, backgroundColor: '#C0392B', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logoText:        { color: '#fff', fontSize: 28, fontWeight: '900' },
  titulo:          { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  sub:             { color: 'rgba(255,255,255,0.55)', fontSize: 14, textAlign: 'center', marginBottom: 32 },
  card:            { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, gap: 12 },
  cardTitulo:      { fontSize: 16, fontWeight: '800', color: '#1C2833' },
  cardBody:        { fontSize: 14, color: '#555', lineHeight: 22 },
  btnContacto:     { backgroundColor: '#25D366', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  btnContactoText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  footer:          { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 32 },
});

// ── Root Layout ────────────────────────────────────────────
export default function RootLayout() {
  usePushNotifications();
  const [cfg,     setCfg]     = useState<AppConfig | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetchConfig().then(data => {
      setCfg(data);
      setChecked(true);
    });
  }, []);

  // Cargando config del servidor
  if (!checked) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C2833', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C0392B" size="large" />
      </View>
    );
  }

  // Si la config se cargó y el trial venció → pantalla de bloqueo
  if (cfg && isExpired(cfg)) {
    return <TrialExpiredScreen cfg={cfg} />;
  }

  // App normal
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="screens/detail" options={{ headerShown: false }} />
      <Stack.Screen name="screens/login" options={{ headerShown: false }} />
      <Stack.Screen name="screens/admin/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="screens/admin/edit-store" options={{
        headerShown: true,
        headerTitle: 'Mi Tienda',
        headerStyle: { backgroundColor: COLORS.secondary },
        headerTintColor: '#fff',
      }} />
      <Stack.Screen name="screens/admin/products" options={{
        headerShown: true,
        headerTitle: 'Mis Productos',
        headerStyle: { backgroundColor: COLORS.secondary },
        headerTintColor: '#fff',
      }} />
      <Stack.Screen name="screens/admin/stats" options={{
        headerShown: true,
        headerTitle: 'Estadisticas',
        headerStyle: { backgroundColor: COLORS.secondary },
        headerTintColor: '#fff',
      }} />
      <Stack.Screen name="screens/admin/subscription" options={{
        headerShown: true,
        headerTitle: 'Mi Plan',
        headerStyle: { backgroundColor: COLORS.secondary },
        headerTintColor: '#fff',
      }} />
      <Stack.Screen name="screens/register-store" options={{
        headerShown: true,
        headerTitle: 'Registrar tienda',
        headerStyle: { backgroundColor: COLORS.secondary },
        headerTintColor: '#fff',
        presentation: 'modal',
      }} />
      <Stack.Screen name="screens/chat" options={{ headerShown: false }} />
      <Stack.Screen name="screens/superadmin/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="screens/superadmin/banners" options={{
        headerShown: true,
        headerTitle: 'Banners Publicitarios',
        headerStyle: { backgroundColor: COLORS.secondary },
        headerTintColor: '#fff',
      }} />
      <Stack.Screen name="screens/libro-reclamaciones" options={{ headerShown: false }} />
      <Stack.Screen name="screens/cubicadora"         options={{ headerShown: false }} />
      <Stack.Screen name="screens/forgot-password"    options={{ headerShown: false }} />
      <Stack.Screen name="screens/reset-password"     options={{ headerShown: false }} />
      <Stack.Screen name="screens/cotizacion"         options={{
        headerShown: true,
        headerTitle: 'Cotizador',
        headerStyle: { backgroundColor: COLORS.secondary },
        headerTintColor: '#fff',
      }} />
    </Stack>
  );
}
