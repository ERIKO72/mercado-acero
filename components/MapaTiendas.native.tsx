import React from 'react';
import MapView, { Marker, Circle } from 'react-native-maps';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../constants/api';

type Props = {
  location: { latitude: number; longitude: number };
  tiendas: any[];
  radio: number;
  selected: any;
  onMarkerPress: (t: any) => void;
  mapRef: any;
};

// Marcador para tiendas Premium — circulo dorado con estrella
function MarkerPremium({ isSelected }: { isSelected: boolean }) {
  return (
    <View style={[styles.premiumOuter, isSelected && styles.premiumOuterSelected]}>
      <View style={styles.premiumInner}>
        <Text style={styles.premiumStar}>★</Text>
      </View>
    </View>
  );
}

// Marcador para tiendas normales — pin rojo/naranja
function MarkerNormal({ isSelected }: { isSelected: boolean }) {
  return (
    <View style={[styles.normalMarker, isSelected && styles.normalMarkerSelected]} />
  );
}

export default function MapaTiendas({ location, tiendas, radio, selected, onMarkerPress, mapRef }: Props) {
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }}
    >
      {/* Marcador de ubicacion del usuario */}
      <Marker coordinate={location} title="Mi ubicacion" pinColor={COLORS.accent} />

      {/* Circulo de radio de busqueda */}
      <Circle
        center={location}
        radius={radio * 1000}
        strokeColor={`${COLORS.primary}50`}
        fillColor={`${COLORS.primary}10`}
      />

      {/* Marcadores de tiendas */}
      {tiendas.map(t => (
        <Marker
          key={t.id}
          coordinate={{
            latitude: parseFloat(t.latitud),
            longitude: parseFloat(t.longitud),
          }}
          title={t.nombre}
          description={t.destacada ? '★ Tienda Premium' : t.distrito}
          onPress={() => onMarkerPress(t)}
        >
          {t.destacada
            ? <MarkerPremium isSelected={selected?.id === t.id} />
            : <MarkerNormal isSelected={selected?.id === t.id} />
          }
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },

  // Marcador Premium — anillo dorado con estrella blanca
  premiumOuter: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f39c12',
    borderWidth: 3,
    borderColor: '#e67e22',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  premiumOuterSelected: {
    transform: [{ scale: 1.25 }],
    borderColor: '#fff',
    elevation: 10,
  },
  premiumInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1c40f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumStar: {
    fontSize: 17,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 20,
  },

  // Marcador normal — circulo rojo
  normalMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  normalMarkerSelected: {
    backgroundColor: COLORS.accent,
    transform: [{ scale: 1.3 }],
    elevation: 6,
  },
});
