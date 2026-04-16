import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../constants/api';

type Props = {
  latitud:  number;
  longitud: number;
  onChange: (lat: number, lng: number) => void;
};

export default function MapaRegistro({ latitud, longitud, onChange }: Props) {
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${
    longitud - 0.04}%2C${latitud - 0.03}%2C${longitud + 0.04}%2C${latitud + 0.03
  }&layer=mapnik&marker=${latitud}%2C${longitud}`;

  return (
    <View>
      <View style={styles.map}>
        <iframe src={src} style={{ width: '100%', height: '100%', border: 'none' }} title="Ubicacion" />
      </View>
      <Text style={styles.hint}>Ingresa las coordenadas manualmente</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Latitud</Text>
          <TextInput style={styles.input} value={String(latitud)}
            onChangeText={v => onChange(parseFloat(v) || latitud, longitud)}
            keyboardType="numeric" placeholder="-12.0464" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Longitud</Text>
          <TextInput style={styles.input} value={String(longitud)}
            onChangeText={v => onChange(latitud, parseFloat(v) || longitud)}
            keyboardType="numeric" placeholder="-77.0428" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map:   { height: 180, borderRadius: 10, marginBottom: 8, overflow: 'hidden' },
  hint:  { fontSize: 11, color: COLORS.textLight, marginBottom: 8 },
  row:   { flexDirection: 'row', gap: 10, marginBottom: 10 },
  label: { fontSize: 11, color: COLORS.textLight, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 9, fontSize: 13, borderWidth: 1, borderColor: '#ddd' },
});
