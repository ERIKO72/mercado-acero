import React from 'react';
import { View, StyleSheet } from 'react-native';

type Props = {
  tienda: any;
  location: { latitude: number; longitude: number } | null;
  routeCoords: any[];
};

export default function MapaDetalle({ tienda }: Props) {
  const lat = parseFloat(tienda.latitud);
  const lng = parseFloat(tienda.longitud);
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${
    lng - 0.04}%2C${lat - 0.03}%2C${lng + 0.04}%2C${lat + 0.03
  }&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <View style={styles.container}>
      <iframe src={src} style={{ width: '100%', height: '100%', border: 'none' }} title="Mapa tienda" />
    </View>
  );
}

const styles = StyleSheet.create({ container: { height: 220 } });
