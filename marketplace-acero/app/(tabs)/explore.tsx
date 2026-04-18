// app/(tabs)/explore.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import TiendaCard from '../../components/TiendaCard';
import { API_BASE, COLORS } from '../../constants/api';

const CATEGORIAS = ['tubos', 'perfiles', 'planchas', 'ángulos', 'platinas', 'vigas'];

export default function ExploreScreen() {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  const buscar = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res  = await fetch(`${API_BASE}/api/tiendas?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.ok) setResults(json.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlatList
      data={results}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Explorar</Text>

          {/* Búsqueda */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="Buscar producto o tienda…"
              placeholderTextColor={COLORS.textLight}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => buscar(query)}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.btnBuscar} onPress={() => buscar(query)}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>🔍</Text>
            </TouchableOpacity>
          </View>

          {/* Categorías rápidas */}
          <Text style={styles.sectionLabel}>Categorías</Text>
          <View style={styles.cats}>
            {CATEGORIAS.map(c => (
              <TouchableOpacity key={c} style={styles.catCard} onPress={() => { setQuery(c); buscar(c); }}>
                <Text style={styles.catIcon}>
                  {c === 'tubos' ? '🔧' : c === 'perfiles' ? '📐' : c === 'planchas' ? '🔩' : '⚙️'}
                </Text>
                <Text style={styles.catText}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {searched && (
            <Text style={styles.resultsLabel}>
              {loading ? 'Buscando…' : `${results.length} resultado(s) para "${query}"`}
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        !searched ? null : loading
          ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
          : <Text style={styles.empty}>No se encontraron resultados</Text>
      }
      renderItem={({ item }) => (
        <TiendaCard
          tienda={item}
          onPress={() => router.push({ pathname: '/screens/detail', params: { id: item.id } })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container:    { padding: 16, backgroundColor: COLORS.bg, flexGrow: 1 },
  title:        { fontSize: 22, fontWeight: '800', color: COLORS.secondary, marginBottom: 14, marginTop: 8 },

  searchRow:    { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input:        { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  btnBuscar:    { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textLight, marginBottom: 10 },
  cats:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  catCard:      { backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', width: '30%', elevation: 2 },
  catIcon:      { fontSize: 22, marginBottom: 4 },
  catText:      { fontSize: 12, fontWeight: '600', color: COLORS.text },

  resultsLabel: { fontSize: 13, color: COLORS.textLight, marginBottom: 10 },
  empty:        { textAlign: 'center', color: COLORS.textLight, marginTop: 40 },
});
