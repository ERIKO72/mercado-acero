import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Alert, TouchableOpacity, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, COLORS } from '../../../constants/api';

// ─── Tipos ────────────────────────────────────────────────────
interface Stats {
  visitas_mes:       number;
  whatsapp_mes:      number;
  clics_waze:        number;
  llamadas_mes:      number;
  clics_chat:        number;
  productos_activos: number;
  visitas_semana:    number[];
  pct_visitas:       number;
  pct_whatsapp:      number;
  pct_waze:          number;
  pct_llamadas:      number;
  actividad_reciente: { tipo: string; created_at: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────
const DIAS  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function mesActual() {
  const d = new Date();
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function pctColor(pct: number) {
  if (pct > 0)  return '#27AE60';
  if (pct < 0)  return '#E74C3C';
  return '#999';
}

function pctLabel(pct: number) {
  if (pct === 0) return '— igual al mes anterior';
  return `${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}% vs mes anterior`;
}

function tipoLabel(tipo: string) {
  const m: Record<string, string> = {
    detalle:  '👁 Visita al perfil',
    whatsapp: '💬 Cotización WhatsApp',
    waze:     '🗺 Navegó con Waze',
    llamada:  '📞 Llamada telefónica',
    chat:     '💬 Abrió chat en vivo',
    ruta:     '📍 Calculó ruta',
  };
  return m[tipo] || tipo;
}

function horaRelativa(isoStr: string) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'ahora mismo';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} días`;
}

// ─── KPI Card ─────────────────────────────────────────────────
function KpiCard({
  label, valor, pct, color, emoji,
}: { label: string; valor: number; pct?: number; color: string; emoji: string }) {
  return (
    <View style={[kpi.wrap, { borderTopColor: color }]}>
      <Text style={kpi.emoji}>{emoji}</Text>
      <Text style={[kpi.valor, { color }]}>{valor}</Text>
      <Text style={kpi.label}>{label}</Text>
      {pct !== undefined && (
        <Text style={[kpi.pct, { color: pctColor(pct) }]}>
          {pct > 0 ? '▲' : pct < 0 ? '▼' : '—'} {Math.abs(pct)}%
        </Text>
      )}
    </View>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────
function BarChart({ datos, titulo }: { datos: number[]; titulo: string }) {
  const maxVal = Math.max(...datos, 1);
  const hoy    = new Date().getDay(); // 0=Dom...6=Sab

  return (
    <View style={chart.wrap}>
      <Text style={chart.titulo}>{titulo}</Text>
      <View style={chart.barras}>
        {datos.map((v, i) => (
          <View key={i} style={chart.col}>
            <Text style={chart.valor}>{v > 0 ? v : ''}</Text>
            <View style={chart.barraWrap}>
              <View
                style={[
                  chart.barra,
                  { height: Math.max((v / maxVal) * 100, 3) },
                  i === hoy && chart.barraHoy,
                ]}
              />
            </View>
            <Text style={[chart.dia, i === hoy && chart.diaHoy]}>{DIAS[i]}</Text>
          </View>
        ))}
      </View>
      <Text style={chart.nota}>Visitas al perfil · últimos 7 días</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  STATS SCREEN
// ─────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const [stats,      setStats]      = useState<Stats | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res   = await fetch(API.adminStats, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) setStats(data.data);
      else Alert.alert('Error', data.error || 'No se pudo cargar');
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const onRefresh = () => { setRefreshing(true); cargar(true); };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  const s = stats!;
  const totalInteracciones = (s.visitas_mes ?? 0) + (s.whatsapp_mes ?? 0) +
    (s.clics_waze ?? 0) + (s.llamadas_mes ?? 0) + (s.clics_chat ?? 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* ── Encabezado mes ── */}
      <View style={styles.mesHeader}>
        <Text style={styles.mesTitulo}>Estadísticas</Text>
        <Text style={styles.mesSub}>{mesActual()}</Text>
      </View>

      {/* ── Total interacciones (hero number) ── */}
      <View style={styles.heroCard}>
        <Text style={styles.heroNum}>{totalInteracciones}</Text>
        <Text style={styles.heroLabel}>interacciones este mes</Text>
        <Text style={styles.heroPct}>{pctLabel(s.pct_visitas)}</Text>
      </View>

      {/* ── KPIs 2×3 ── */}
      <Text style={styles.seccion}>Detalle por canal</Text>
      <View style={styles.kpiGrid}>
        <KpiCard label="Visitas perfil"  valor={s.visitas_mes}   pct={s.pct_visitas}  color="#3498DB" emoji="👁" />
        <KpiCard label="WhatsApp"        valor={s.whatsapp_mes}  pct={s.pct_whatsapp} color="#25D366" emoji="💬" />
        <KpiCard label="Waze"            valor={s.clics_waze}    pct={s.pct_waze}     color="#009ADE" emoji="🗺" />
        <KpiCard label="Llamadas"        valor={s.llamadas_mes}  pct={s.pct_llamadas} color={COLORS.primary} emoji="📞" />
        <KpiCard label="Chat en vivo"    valor={s.clics_chat}                         color="#8E44AD" emoji="💬" />
        <KpiCard label="Productos activos" valor={s.productos_activos}                color={COLORS.accent} emoji="📦" />
      </View>

      {/* ── Gráfico de barras semanal ── */}
      <BarChart datos={s.visitas_semana || [0,0,0,0,0,0,0]} titulo="Visitas por día" />

      {/* ── Conversión ── */}
      {totalInteracciones > 0 && (
        <View style={styles.conversionCard}>
          <Text style={styles.convTitulo}>Tasa de conversión estimada</Text>
          <View style={styles.convRow}>
            <View style={styles.convItem}>
              <Text style={styles.convNum}>
                {s.visitas_mes > 0
                  ? `${Math.round(((s.whatsapp_mes + s.llamadas_mes) / s.visitas_mes) * 100)}%`
                  : '—'}
              </Text>
              <Text style={styles.convLabel}>Visita → Contacto</Text>
            </View>
            <View style={styles.convDivider} />
            <View style={styles.convItem}>
              <Text style={styles.convNum}>
                {s.visitas_mes > 0
                  ? `${Math.round((s.clics_waze / s.visitas_mes) * 100)}%`
                  : '—'}
              </Text>
              <Text style={styles.convLabel}>Visita → Navegación</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Actividad reciente ── */}
      {s.actividad_reciente?.length > 0 && (
        <>
          <Text style={styles.seccion}>Actividad reciente</Text>
          <View style={styles.feedWrap}>
            {s.actividad_reciente.slice(0, 15).map((ev, i) => (
              <View key={i} style={styles.feedItem}>
                <Text style={styles.feedTipo}>{tipoLabel(ev.tipo)}</Text>
                <Text style={styles.feedHora}>{horaRelativa(ev.created_at)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── Tip Pro ── */}
      <View style={styles.tipBox}>
        <Text style={styles.tipTitulo}>💡 Tip Pro</Text>
        <Text style={styles.tipTexto}>
          Las tiendas con plan Premium reciben hasta 5× más visitas gracias al pin dorado en el mapa
          y la posición prioritaria en búsquedas.
        </Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
//  ESTILOS
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: COLORS.bg },
  loadText:      { color: COLORS.textLight, fontSize: 14 },
  container:     { flex: 1, backgroundColor: COLORS.bg },
  content:       { padding: 16, paddingBottom: 40 },

  mesHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  mesTitulo:     { fontSize: 20, fontWeight: '900', color: COLORS.secondary },
  mesSub:        { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },

  heroCard:      { backgroundColor: COLORS.secondary, borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 20, elevation: 4 },
  heroNum:       { fontSize: 56, fontWeight: '900', color: '#fff', lineHeight: 64 },
  heroLabel:     { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  heroPct:       { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6 },

  seccion:       { fontSize: 12, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 4 },

  kpiGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },

  conversionCard:{ backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 20, elevation: 2 },
  convTitulo:    { fontSize: 13, fontWeight: '700', color: COLORS.secondary, marginBottom: 14 },
  convRow:       { flexDirection: 'row', alignItems: 'center' },
  convItem:      { flex: 1, alignItems: 'center' },
  convNum:       { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  convLabel:     { fontSize: 11, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },
  convDivider:   { width: 1, height: 40, backgroundColor: COLORS.border },

  feedWrap:      { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 20, elevation: 2 },
  feedItem:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  feedTipo:      { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  feedHora:      { fontSize: 12, color: COLORS.textLight },

  tipBox:        { backgroundColor: '#FFFDE7', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: COLORS.gold },
  tipTitulo:     { fontSize: 13, fontWeight: '800', color: '#856404', marginBottom: 6 },
  tipTexto:      { fontSize: 13, color: '#856404', lineHeight: 20 },
});

const kpi = StyleSheet.create({
  wrap:   { width: '47.5%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderTopWidth: 3, elevation: 2 },
  emoji:  { fontSize: 22, marginBottom: 6 },
  valor:  { fontSize: 28, fontWeight: '900', lineHeight: 34 },
  label:  { fontSize: 11, color: COLORS.textLight, marginTop: 4, textAlign: 'center', fontWeight: '600' },
  pct:    { fontSize: 11, fontWeight: '700', marginTop: 5 },
});

const chart = StyleSheet.create({
  wrap:      { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 20, elevation: 2 },
  titulo:    { fontSize: 14, fontWeight: '800', color: COLORS.secondary, marginBottom: 16 },
  barras:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  col:       { flex: 1, alignItems: 'center' },
  valor:     { fontSize: 10, color: COLORS.textLight, marginBottom: 3, fontWeight: '700' },
  barraWrap: { height: 100, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  barra:     { width: 18, backgroundColor: `${COLORS.primary}55`, borderRadius: 5, minHeight: 3 },
  barraHoy:  { backgroundColor: COLORS.primary },
  dia:       { fontSize: 10, color: COLORS.textLight, marginTop: 6 },
  diaHoy:    { color: COLORS.primary, fontWeight: '800' },
  nota:      { fontSize: 11, color: '#CCC', marginTop: 10, textAlign: 'center' },
});
