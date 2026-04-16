import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/api';

type Props = {
  latitud:  number;
  longitud: number;
  onChange: (lat: number, lng: number) => void;
};

export default function MapaRegistro({ latitud, longitud, onChange }: Props) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{ latitude: latitud, longitude: longitud, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      onPress={(e) => onChange(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
    >
      <Marker
        coordinate={{ latitude: latitud, longitude: longitud }}
        draggable
        onDragEnd={e => onChange(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
        pinColor={COLORS.primary}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { height: 200, borderRadius: 10, marginBottom: 10 } });
