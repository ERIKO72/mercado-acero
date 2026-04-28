import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, Linking, ScrollView,
} from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { API, COLORS } from '../../constants/api';
import { useLocation } from '../../hooks/useLocation';

const DISTRITOS = [
  'Todos', 'Ate', 'Callao', 'Cercado de Lima', 'Comas',
  'El Agustino', 'Independencia', 'La Victoria', 'Los Olivos',
  'Lurín', 'Puente Piedra', 'Rímac', 'San Juan de Lurigancho',
  'San Martín de Porres', 'Santa Anita', 'Ventanilla',
  'Villa El Salvador', 'Villa María del Triunfo',
];

// ─────────────────────────────────────────────────────────────
//  Tipos de servicio disponibles
// ─────────────────────────────────────────────────────────────
type TipoServicio = 'todos' | 'corte_laser' | 'doblez' | 'soldadura';

const TIPOS: { key: TipoServicio; label: string; icono: string }[] = [
  { key: 'todos',       label: 'Todos',        icono: '⚙️' },
  { key: 'corte_laser', label: 'Corte Láser',  icono: '⚡' },
  { key: 'doblez',      label: 'Doblez',        icono: '📐' },
  { key: 'soldadura',   label: 'Soldadura',     icono: '🔥' },
];

const LABEL_TIPO: Record<string, string> = {
  corte_laser: 'Corte Láser',
  doblez:      'Doblez',
  soldadura:   'Soldadura',
};

// ─────────────────────────────────────────────────────────────
//  Card de punto de servicio
// ─────────────────────────────────────────────────────────────
function ServicioCard({ item }: { item: any }) {
  const tipos: string[] = item.tipos_servicio ?? [];

  const llamar = () => {
    if (!item.telefono) return;
    Linking.openURL(`tel:${item.telefono}`).catch(() => {});
  };

  const whatsapp = () => {
    if (!item.telefono) return;
    const num = item.telefono.replace(/\D/g, '');
    const full = num.startsWith('51') ? num : `51${num}`;
    Linking.openURL(`https://wa.me/${full}`).catch(() => {});
  };

  return (
    <View style={card.wrap}>
      {/* Cabecera */}
      <View style={card.header}>
        <View style={card.icono}>
          <Text style={card.iconoText}>⚙️</Text>
        </View>
        <View style={card.info}>
          <View style={card.nombreRow}>
            <Text style={card.nombre} numberOfLines={1}>{item.nombre}</Text>
            {item.verificado && (
              <View style={card.badge}>
                <Text style={card.badgeText}>✓ Verif.</Text>
              </View>
            )}
          </View>
          <Text style={card.distrito}>📍 {item.distrito ?? '—'}</Text>
          {item.direccion ? (
            <Text style={card.direccion} numberOfLines={1}>{item.direccion}</Text>
          ) : null}
        </View>
      </View>

      {/* Chips de tipos */}
      <View style={card.tipos}>
        {tipos.map(t => (
          <View key={t} style={[card.chip, CHIP_COLOR[t] ?? card.chipDefault]}>
            <Text style={card.chipText}>
              {t === 'corte_laser' ? '⚡ ' : t === 'doblez' ? '📐 ' : t === 'soldadura' ? '🔥 ' : '⚙️ '}
              {LABEL_TIPO[t] ?? t}
            </Text>
          </View>
        ))}
      </View>

      {/* Materiales y precio */}
      {item.materiales ? (
        <Text style={card.materiales}>🔩 {item.materiales}</Text>
      ) : null}

      <View style={card.footer}>
        {item.precio_desde != null ? (
          <View style={card.precio}>
            <Text style={card.precioLabel}>Desde</Text>
            <Text style={card.precioVal}>S/ {Number(item.precio_desde).toFixed(0)}</Text>
          </View>
        ) : <View />}

        <View style={card.btns}>
          {item.telefono ? (
            <TouchableOpacity style={card.btnLlamar} onPress={llamar}>
              <Text style={card.btnLlamarText}>📞 Llamar</Text>
            </TouchableOpacity>
          ) : null}
          {item.telefono ? (
            <TouchableOpacity style={card.btnWA} onPress={whatsapp}>
              <Text style={card.btnWAText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Horario */}
      {item.horario ? (
        <Text style={card.horario}>🕐 {item.horario}</Text>
      ) : null}
    </View>
  );
}

const CHIP_COLOR: Record<string, object> = {
  corte_laser: { backgroundColor: '#1A2A5E' },
  doblez:      { backgroundColor: '#4A2800' },
  soldadura:   { backgroundColor: '#7B1C1C' },
};

// ─────────────────────────────────────────────────────────────
//  PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function ServiciosScreen() {
  const { location } = useLocation();
  const flatListRef  = useRef<FlatList>(null);
  useScrollToTop(flatListRef);

  const [puntos,     setPuntos]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query,      setQuery]      = useState('');
  const [tipo,       setTipo]       = useState<TipoServicio>('todos');
  const [distrito,   setDistrito]   = useState('Todos');

  const fetchPuntos = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tipo !== 'todos')     params.set('tipo', tipo);
      if (query.trim())         params.set('q', query.trim());
      if (distrito !== 'Todos') params.set('distrito', distrito);
      if (location) {
        params.set('lat',   String(location.latitude));
        params.set('lng',   String(location.longitude));
        params.set('radio', '50');
      }
      const url = `${API.puntosServicio}?${params}`;
      const res  = await fetch(url);
      const json = await res.json();
      if (json.ok) setPuntos(json.data);
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tipo, query, distrito, location]);

  useEffect(() => { fetchPuntos(); }, [fetchPuntos]);

  return (
    <View style={s.container}>
      {/* Barra de marca */}
      <View style={s.brandBar}>
        <Text style={s.brandTitle}>SERVICIOS DE PROCESAMIENTO</Text>
        <Text style={s.brandSub}>Corte · Doblez · Soldadura en Lima</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={puntos}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        ListHeaderComponent={
          <View>
            {/* Búsqueda */}
            <View style={s.searchRow}>
              <TextInput
                style={s.input}
                placeholder="Buscar taller, material o distrito..."
                placeholderTextColor="#999"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => fetchPuntos()}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                submitBehavior="submit"
              />
              <TouchableOpacity style={s.btnBuscar} onPress={() => fetchPuntos()}>
                <Text style={s.btnBuscarText}>Buscar</Text>
              </TouchableOpacity>
            </View>

            {/* Chips tipo de servicio */}
            <View style={s.filtros}>
              {TIPOS.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[s.filtroChip, tipo === t.key && s.filtroChipActive]}
                  onPress={() => setTipo(t.key)}
                >
                  <Text style={[s.filtroText, tipo === t.key && s.filtroTextActive]}>
                    {t.icono} {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chips de distrito */}
            <View style={s.distritoWrap}>
              <Text style={s.distritoLabel}>📍 Distrito</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {DISTRITOS.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[s.distChip, distrito === d && s.distChipActive]}
                    onPress={() => setDistrito(d)}
                  >
                    <Text style={[s.distText, distrito === d && s.distTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Contador */}
            <View style={s.resultLabel}>
              <Text style={s.resultText}>
                {loading
                  ? 'Buscando talleres...'
                  : `${puntos.length} talleres encontrados`}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading
            ? <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
            : (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>⚙️</Text>
                <Text style={s.emptyText}>
                  No se encontraron talleres{'\n'}para este filtro
                </Text>
              </View>
            )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPuntos(true)}
            colors={[COLORS.accent]}
          />
        }
        renderItem={({ item }) => <ServicioCard item={item} />}
        ListFooterComponent={<View style={{ height: 20 }} />}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  ESTILOS
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F2F2F2' },
  brandBar:       { backgroundColor: COLORS.secondary, paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16 },
  brandTitle:     { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  brandSub:       { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 },
  searchRow:      { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  input:          { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, fontSize: 14, color: '#1a1a1a', borderWidth: 1.5, borderColor: '#E8E8E8' },
  btnBuscar:      { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  btnBuscarText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  filtros:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  filtroChip:     { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#F0F0F0', borderWidth: 1.5, borderColor: '#E0E0E0' },
  filtroChipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  filtroText:     { fontSize: 12, color: '#666', fontWeight: '600' },
  filtroTextActive: { color: '#fff' },
  resultLabel:    { backgroundColor: '#F9F9F9', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#EBEBEB' },
  resultText:     { fontSize: 12, color: '#999', fontWeight: '600' },
  distritoWrap:   { backgroundColor: '#fff', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#eee' },
  distritoLabel:  { fontSize: 11, fontWeight: '700', color: '#AAA', marginBottom: 6 },
  distChip:       { backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6, borderWidth: 1.5, borderColor: '#E0E0E0' },
  distChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  distText:       { fontSize: 12, color: '#666', fontWeight: '600' },
  distTextActive: { color: '#fff', fontWeight: '700' },
  list:           { padding: 10, paddingTop: 8 },
  empty:          { alignItems: 'center', paddingTop: 50, gap: 12 },
  emptyIcon:      { fontSize: 48 },
  emptyText:      { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },
});

const card = StyleSheet.create({
  wrap:       { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, padding: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  header:     { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  icono:      { width: 46, height: 46, borderRadius: 10, backgroundColor: `${COLORS.secondary}18`, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: `${COLORS.secondary}30` },
  iconoText:  { fontSize: 22 },
  info:       { flex: 1 },
  nombreRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  nombre:     { fontSize: 15, fontWeight: '800', color: '#1a1a1a', flex: 1 },
  badge:      { backgroundColor: COLORS.verified, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:  { color: '#fff', fontSize: 9, fontWeight: '800' },
  distrito:   { fontSize: 12, color: '#666', marginBottom: 1 },
  direccion:  { fontSize: 11, color: '#AAA' },
  tipos:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip:       { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  chipDefault:{ backgroundColor: COLORS.secondary },
  chipText:   { color: '#fff', fontSize: 11, fontWeight: '700' },
  materiales: { fontSize: 12, color: '#666', marginBottom: 8 },
  footer:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  precio:     { gap: 1 },
  precioLabel:{ fontSize: 10, color: '#AAA', fontWeight: '600' },
  precioVal:  { fontSize: 18, fontWeight: '900', color: COLORS.accent },
  btns:       { flexDirection: 'row', gap: 8 },
  btnLlamar:  { backgroundColor: '#F0F4FF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#C5D5FF' },
  btnLlamarText: { fontSize: 12, fontWeight: '700', color: '#1A2A5E' },
  btnWA:      { backgroundColor: '#E8FFF0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#A8DDB5' },
  btnWAText:  { fontSize: 12, fontWeight: '700', color: '#1A7A35' },
  horario:    { marginTop: 8, fontSize: 11, color: '#AAA' },
});
