import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../constants/api';

interface TiendaForm {
  nombre: string;
  descripcion: string;
  telefono: string;
  email: string;
  direccion: string;
  distrito: string;
  horario: string;
  ruc: string;
}

export function useEditStore() {
  const [form, setForm] = useState<TiendaForm>({
    nombre: '', descripcion: '', telefono: '',
    email: '', direccion: '', distrito: '', horario: '', ruc: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(API.adminTienda, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        const t = data.data;
        setForm({
          nombre:      t.nombre      || '',
          descripcion: t.descripcion || '',
          telefono:    t.telefono    || '',
          email:       t.email       || '',
          direccion:   t.direccion   || '',
          distrito:    t.distrito    || '',
          horario:     t.horario     || '',
          ruc:         t.ruc         || '',
        });
      } else {
        setError(data.error || 'Error al cargar');
      }
    } catch {
      setError('No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(API.adminTienda, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccessMsg('Cambios guardados exitosamente');
        return true;
      } else {
        setError(data.error || 'Error al guardar');
        return false;
      }
    } catch {
      setError('No se pudo conectar al servidor');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const setField = (field: keyof TiendaForm, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  return { form, setField, loading, saving, error, successMsg, guardar, recargar: cargar };
}
