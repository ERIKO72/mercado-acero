import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'favoritos_tiendas';

export function useFavoritos() {
  const [ids, setIds] = useState<string[]>([]);

  const cargar = useCallback(async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) setIds(JSON.parse(data));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggle = async (id: string) => {
    const nuevos = ids.includes(id)
      ? ids.filter(f => f !== id)
      : [...ids, id];
    setIds(nuevos);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));
  };

  const esFavorito = (id: string) => ids.includes(id);

  return { ids, toggle, esFavorito, recargar: cargar };
}
