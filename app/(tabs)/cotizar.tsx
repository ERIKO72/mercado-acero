// Este archivo es necesario para que Expo Router reconozca la pestaña.
// La navegación real se redirige a /screens/cotizacion desde el tabBarButton.
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function CotizarTab() {
  useEffect(() => { router.replace('/screens/cotizacion'); }, []);
  return null;
}
