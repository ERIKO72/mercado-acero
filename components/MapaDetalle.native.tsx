import React from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/api';

type Props = {
  tienda: any;
  location: { latitude: number; longitude: number } | null;
  routeCoords: any[];
};

export default function MapaDetalle({ tienda, location, routeCoords }: Props) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: parseFloat(tienda.latitud),
        longitude: parseFloat(tienda.longitud),
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }}
    >
      <Marker
        coordinate={{ latitude: parseFloat(tienda.latitud), longitude: parseFloat(tienda.longitud) }}
        title={tienda.nombre}
        pinColor={COLORS.primary}
      />
      {location && (
        <Marker coordinate={location} title="Tu ubicacion" pinColor={COLORS.accent} />
      )}
      {routeCoords.length > 0 && (
        <Polyline coordinates={routeCoords} strokeColor={COLORS.primary} strokeWidth={4} />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { height: 220 } });
