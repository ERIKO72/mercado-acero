import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ItemCarrito = {
  id:        string;   // uuid local
  material:  string;   // 'tubos' | 'planchas' | 'perfiles' | 'varillas'
  nombre:    string;   // descripción del item
  cantidad:  number;   // unidades calculadas
  unidad:    string;   // 'tubos 6m' | 'planchas' | 'barras 6m' | 'varillas 9m'
  categoria: string;   // para buscar en API
};

const STORAGE_KEY = 'carrito_materiales_v1';

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(data => { if (data) setItems(JSON.parse(data)); })
      .catch(() => {});
  }, []);

  const guardar = useCallback(async (nuevos: ItemCarrito[]) => {
    setItems(nuevos);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));
  }, []);

  const agregar = useCallback(async (item: ItemCarrito) => {
    setItems(prev => {
      const nuevos = [...prev, item];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos)).catch(() => {});
      return nuevos;
    });
  }, []);

  const eliminar = useCallback(async (id: string) => {
    setItems(prev => {
      const nuevos = prev.filter(i => i.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos)).catch(() => {});
      return nuevos;
    });
  }, []);

  const limpiar = useCallback(async () => {
    setItems([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { items, agregar, eliminar, limpiar, guardar };
}
