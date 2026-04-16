import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import TiendaCard from '../../components/TiendaCard';
import { useFavoritos } from '../../hooks/useFavoritos';
import { API_BASE, COLORS } from '../../constants/api';

export default function FavoritosScreen() {
  const { ids, toggle, esFavorito, recargar } = useFavoritos();
  const [tiendas, setTiendas]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);

  // Recargar favoritos cada vez que el tab recibe foco
  useFocusEffect(useCallback(() => { recargar(); }, [recargar]));

  useEffect(() => {
    if (ids.length === 0) { setTiendas([]); return; }
    cargarTiendas();
  }, [ids]);

  const cargarTiendas = async () => {
    setLoading(true);
    try {
      // Carga cada tienda favorita en paralelo
      const resultados = await Promise.all(
        ids.map(id =>
          fetch(`${API_BASE}/api/tiendas/${id}`)
            .then(r => r.json())
            .then(j => j.ok ? j.data : null)
            .catch(() => null)
        )
      );
      setTiendas(resultados.filter(Boolean));
    } catch {
      Alert.alert('Error', 'No se pudo cargar tus favoritos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={tiendas}
      keyExtractor={i => i.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.titulo}>Mis Favoritos</Text>
          <Text style={styles.subtitulo}>
            {ids.length === 0
              ? 'Aun no tienes favoritos'
              : `${ids.length} tienda${ids.length > 1 ? 's' : ''} guardada${ids.length > 1 ? 's' : ''}`
            }
          </Text>
        </View>
      }
      ListEmptyComponent={
        !loading ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioIcono}>♡</Text>
            <Text style={styles.vacioTexto}>Todavia no tienes favoritos</Text>
            <Text style={styles.vacioSub}>Toca el corazon en cualquier tienda para guardarla aqui</Text>
            <TouchableOpacity
              style={styles.btnExplorar}
              onPress={() => router.push('/')}
            >
              <Text style={styles.btnExplorarTexto}>Ver tiendas</Text>
            </TouchableOpacity>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <TiendaCard
          tienda={item}
          esFavorito={esFavorito(item.id)}
          onToggleFavorito={toggle}
          onPress={() => router.push({ pathname: '/screens/detail', params: { id: item.id } })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container:        { padding: 16, backgroundColor: COLORS.bg, flexGrow: 1 },
  header:           { marginBottom: 16 },
  titulo:           { fontSize: 22, fontWeight: '800', color: COLORS.secondary },
  subtitulo:        { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  vacio:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  vacioIcono:       { fontSize: 64, color: '#eee', marginBottom: 16 },
  vacioTexto:       { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  vacioSub:         { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginBottom: 24, paddingHorizontal: 30 },
  btnExplorar:      { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  btnExplorarTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
