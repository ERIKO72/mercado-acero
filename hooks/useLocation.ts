import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export type Coordenadas = {
  latitude:  number;
  longitude: number;
} | null;

export function useLocation() {
  const [location,  setLocation]  = useState<Coordenadas>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permiso de ubicacion denegado');
          setLocation({ latitude: -12.0464, longitude: -77.0428 });
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude:  loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e: any) {
        setError(e.message);
        setLocation({ latitude: -12.0464, longitude: -77.0428 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, error, loading };
}
