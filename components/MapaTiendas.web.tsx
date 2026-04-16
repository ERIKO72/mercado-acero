import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/api';

type Props = {
  location: { latitude: number; longitude: number };
  tiendas: any[];
  radio: number;
  selected: any;
  onMarkerPress: (t: any) => void;
  mapRef?: any;
};

export default function MapaTiendas({ location, tiendas }: Props) {
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${
    location.longitude - 0.08}%2C${location.latitude - 0.06}%2C${
    location.longitude + 0.08}%2C${location.latitude + 0.06
  }&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`;

  return (
    <View style={styles.container}>
      <iframe src={src} style={{ width: '100%', height: '100%', border: 'none' }} title="Mapa" />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{tiendas.length} tiendas cercanas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  badge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: COLORS.secondary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
