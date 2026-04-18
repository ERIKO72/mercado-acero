// components/TiendaCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/api';

type Props = {
  tienda: any;
  onPress: () => void;
};

export default function TiendaCard({ tienda, onPress }: Props) {
  const servicios: string[] = tienda.servicios_nombres?.filter(Boolean) ?? [];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{tienda.nombre[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.nombre} numberOfLines={1}>{tienda.nombre}</Text>
            {tienda.verificada && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✓ Verificada</Text>
              </View>
            )}
          </View>
          <Text style={styles.distrito}>{tienda.distrito}</Text>
        </View>
      </View>

      {/* Descripción */}
      <Text style={styles.desc} numberOfLines={2}>{tienda.descripcion}</Text>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.stat}>⭐ {tienda.calificacion}</Text>
        {tienda.distancia_km != null && (
          <Text style={styles.stat}>📍 {tienda.distancia_km} km</Text>
        )}
        <Text style={styles.stat}>📦 {tienda.total_productos ?? 0} productos</Text>
        <Text style={styles.stat}>🕐 {tienda.horario}</Text>
      </View>

      {/* Servicios tags */}
      {servicios.length > 0 && (
        <View style={styles.tags}>
          {servicios.slice(0, 4).map((s) => (
            <View key={s} style={styles.tag}>
              <Text style={styles.tagText}>{s}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  nombre:   { fontSize: 15, fontWeight: '700', color: COLORS.text, flexShrink: 1 },
  distrito: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  badge: {
    backgroundColor: COLORS.verified,
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  desc:  { fontSize: 13, color: COLORS.textLight, marginBottom: 10, lineHeight: 18 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  stat:  { fontSize: 12, color: COLORS.textLight },
  tags:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:   { backgroundColor: '#FEF3E2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: COLORS.accent, fontWeight: '600' },
});
