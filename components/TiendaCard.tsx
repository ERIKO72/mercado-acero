import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS } from '../constants/api';
import { thumbUrl } from '../utils/cloudinary';

type Props = {
  tienda: any;
  onPress: () => void;
  esFavorito?: boolean;
  onToggleFavorito?: (id: string) => void;
};

export default function TiendaCard({ tienda, onPress, esFavorito = false, onToggleFavorito }: Props) {
  const servicios: string[] = tienda.servicios_nombres?.filter(Boolean) ?? [];
  const esPremium = tienda.destacada === true;

  return (
    <TouchableOpacity
      style={[styles.card, esPremium && styles.cardPremium]}
      onPress={onPress}
      activeOpacity={0.87}
    >
      {/* Banda superior para Premium */}
      {esPremium && (
        <View style={styles.premiumBand}>
          <Text style={styles.premiumBandText}>★ PREMIUM</Text>
        </View>
      )}

      <View style={styles.header}>
        {/* Avatar / Logo */}
        {tienda.logo_url
          ? <Image source={{ uri: thumbUrl(tienda.logo_url, 80) }} style={styles.avatarImg} />
          : (
            <View style={[styles.avatar, esPremium && styles.avatarPremium]}>
              <Text style={styles.avatarText}>{tienda.nombre[0]}</Text>
            </View>
          )
        }

        <View style={{ flex: 1 }}>
          {/* Nombre + badges */}
          <View style={styles.nameRow}>
            <Text style={styles.nombre} numberOfLines={1}>{tienda.nombre}</Text>
            {tienda.verificada && (
              <View style={styles.badgeVerif}>
                <Text style={styles.badgeVerifText}>✓</Text>
              </View>
            )}
          </View>

          <Text style={styles.distrito}>{tienda.distrito}</Text>

          {/* Estrellas */}
          <View style={styles.estrellaRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Text
                key={i}
                style={{ fontSize: 11, color: i <= Math.round(tienda.calificacion ?? 0) ? '#f39c12' : '#e0e0e0' }}
              >★</Text>
            ))}
            <Text style={styles.calif}>{Number(tienda.calificacion ?? 0).toFixed(1)}</Text>
          </View>
        </View>

        {/* Corazon favorito */}
        {onToggleFavorito && (
          <TouchableOpacity
            style={styles.corazon}
            onPress={() => onToggleFavorito(tienda.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 20, color: esFavorito ? '#e74c3c' : '#ddd' }}>
              {esFavorito ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {tienda.descripcion
        ? <Text style={styles.desc} numberOfLines={2}>{tienda.descripcion}</Text>
        : null
      }

      {/* Stats: distancia, horario, telefono */}
      <View style={styles.stats}>
        {tienda.distancia_km != null && (
          <View style={styles.statItem}>
            <Text style={styles.statText}>📍 {tienda.distancia_km} km</Text>
          </View>
        )}
        {tienda.horario && (
          <View style={styles.statItem}>
            <Text style={styles.statText}>🕐 {tienda.horario}</Text>
          </View>
        )}
        {tienda.telefono && (
          <View style={styles.statItem}>
            <Text style={styles.statText}>📞 {tienda.telefono}</Text>
          </View>
        )}
      </View>

      {/* Tags de servicios */}
      {servicios.length > 0 && (
        <View style={styles.tags}>
          {servicios.slice(0, 3).map(s => (
            <View key={s} style={[styles.tag, esPremium && styles.tagPremium]}>
              <Text style={[styles.tagText, esPremium && styles.tagTextPremium]}>{s}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:             {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  cardPremium:      {
    borderColor: '#f1c40f',
    elevation: 5,
    backgroundColor: '#FFFDF0',
  },

  // Banda premium
  premiumBand:      {
    position: 'absolute',
    top: 0, right: 0,
    backgroundColor: '#f1c40f',
    paddingHorizontal: 10, paddingVertical: 3,
    borderBottomLeftRadius: 10,
  },
  premiumBandText:  { fontSize: 9, fontWeight: '900', color: '#7d4f00', letterSpacing: 0.5 },

  // Header de la card
  header:           { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  avatar:           {
    width: 50, height: 50, borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPremium:    { backgroundColor: '#f39c12' },
  avatarImg:        { width: 50, height: 50, borderRadius: 12, backgroundColor: '#eee' },
  avatarText:       { color: '#fff', fontSize: 22, fontWeight: '900' },
  nameRow:          { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  nombre:           { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flexShrink: 1 },
  badgeVerif:       { backgroundColor: COLORS.verified, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeVerifText:   { color: '#fff', fontSize: 9, fontWeight: '900' },
  distrito:         { fontSize: 12, color: '#999', marginTop: 2 },
  estrellaRow:      { flexDirection: 'row', alignItems: 'center', gap: 1, marginTop: 3 },
  calif:            { fontSize: 11, color: '#bbb', marginLeft: 4 },
  corazon:          { padding: 4 },

  // Descripcion
  desc:             { fontSize: 12, color: '#888', marginBottom: 8, lineHeight: 17 },

  // Stats
  stats:            { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  statItem:         { backgroundColor: '#F5F5F5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statText:         { fontSize: 10, color: '#777' },

  // Tags servicios
  tags:             { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag:              { backgroundColor: '#FEF3E2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagPremium:       { backgroundColor: '#FFF8DC' },
  tagText:          { fontSize: 10, color: COLORS.accent, fontWeight: '600' },
  tagTextPremium:   { color: '#c67c00' },
});
