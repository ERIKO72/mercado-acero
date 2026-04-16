import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function MapNative() {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1 }}
      initialRegion={{
        latitude: -12.0464,
        longitude: -77.0428,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker
        coordinate={{
          latitude: -12.0464,
          longitude: -77.0428,
        }}
        title="Distribuidor de acero"
      />
    </MapView>
  );
}