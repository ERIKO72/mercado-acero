import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API, COLORS } from '../../../constants/api';
import { uploadImage, thumbUrl } from '../../../utils/cloudinary';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  unidad: string;
  precio: number;
  stock: number;
  imagen_url: string;
  activo: boolean;
}

const FORM_VACIO = {
  nombre: '', descripcion: '', categoria: '',
  unidad: 'unidad', precio: '', stock: '0', imagen_url: '',
};

export default function ProductsScreen() {
  const [productos, setProductos]   = useState<Producto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalVisible, setModal]    = useState(false);
  const [editando, setEditando]     = useState<Producto | null>(null);
  const [form, setForm]             = useState(FORM_VACIO);
  const [saving, setSaving]         = useState(false);
  const [subiendoFoto, setSubiendo] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(API.adminProductos, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.ok) setProductos(data.data);
    } catch { Alert.alert('Error', 'No se pudo conectar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => { setEditando(null); setForm(FORM_VACIO); setModal(true); };

  const abrirEditar = (p: Producto) => {
    setEditando(p);
    setForm({
      nombre:      p.nombre,
      descripcion: p.descripcion || '',
      categoria:   p.categoria   || '',
      unidad:      p.unidad      || 'unidad',
      precio:      String(p.precio),
      stock:       String(p.stock),
      imagen_url:  p.imagen_url  || '',
    });
    setModal(true);
  };

  const elegirFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galeria'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (result.canceled) return;
    setSubiendo(true);
    try {
      const url = await uploadImage(result.assets[0].uri, 'productos');
      setForm(f => ({ ...f, imagen_url: url }));
    } catch (err: any) {
      if (err.message.includes('TU_CLOUD_NAME')) {
        Alert.alert('Cloudinary no configurado', 'Configura tu Cloud Name en .env.local');
      } else {
        Alert.alert('Error', err.message);
      }
    } finally { setSubiendo(false); }
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    if (!form.precio || isNaN(Number(form.precio))) { Alert.alert('Error', 'Precio invalido'); return; }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const body = {
        nombre:      form.nombre,
        descripcion: form.descripcion,
        categoria:   form.categoria || 'general',
        unidad:      form.unidad,
        precio:      parseFloat(form.precio),
        stock:       parseInt(form.stock) || 0,
        imagen_url:  form.imagen_url || null,
      };
      const url    = editando ? API.adminProducto(editando.id) : API.adminProductos;
      const method = editando ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) { setModal(false); cargar(); }
      else Alert.alert('Error', data.error || 'No se pudo guardar');
    } catch { Alert.alert('Error', 'No se pudo conectar'); }
    finally { setSaving(false); }
  };

  const eliminar = (p: Producto) => {
    Alert.alert('Eliminar', `Eliminar "${p.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(API.adminProducto(p.id), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.ok) cargar();
        else Alert.alert('Error', data.error);
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btnNuevo} onPress={abrirNuevo}>
        <Text style={styles.btnNuevoTexto}>+ Nuevo Producto</Text>
      </TouchableOpacity>

      {loading
        ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={productos}
            keyExtractor={i => i.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<Text style={styles.empty}>Sin productos. Agrega el primero.</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {item.imagen_url
                  ? <Image source={{ uri: thumbUrl(item.imagen_url, 70) }} style={styles.cardImg} />
                  : <View style={styles.cardImgPlaceholder}><Text style={{ fontSize: 22 }}>📦</Text></View>
                }
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNombre}>{item.nombre}</Text>
                  <Text style={styles.cardSub}>{item.categoria} · {item.unidad}</Text>
                  <Text style={styles.cardPrecio}>S/ {Number(item.precio).toFixed(2)} · Stock: {item.stock}</Text>
                </View>
                <View style={styles.cardAcciones}>
                  <TouchableOpacity style={styles.btnEditar} onPress={() => abrirEditar(item)}>
                    <Text style={styles.btnEditarTexto}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnEliminar} onPress={() => eliminar(item)}>
                    <Text style={styles.btnEliminarTexto}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )
      }

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>{editando ? 'Editar Producto' : 'Nuevo Producto'}</Text>

            {/* Foto del producto */}
            <View style={styles.fotoRow}>
              {form.imagen_url
                ? <Image source={{ uri: thumbUrl(form.imagen_url, 80) }} style={styles.fotoPreview} />
                : <View style={styles.fotoPlaceholder}><Text style={{ fontSize: 24 }}>📷</Text></View>
              }
              <TouchableOpacity
                style={[styles.btnFoto, subiendoFoto && { opacity: 0.6 }]}
                onPress={elegirFoto}
                disabled={subiendoFoto}
              >
                {subiendoFoto
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnFotoTexto}>{form.imagen_url ? 'Cambiar foto' : 'Agregar foto'}</Text>
                }
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={form.nombre}
              onChangeText={v => setForm(f => ({ ...f, nombre: v }))} placeholder="Ej: Tubo acero 2 pulgadas" />

            <Text style={styles.label}>Descripcion</Text>
            <TextInput style={[styles.input, { height: 60 }]} value={form.descripcion}
              onChangeText={v => setForm(f => ({ ...f, descripcion: v }))}
              placeholder="Descripcion breve..." multiline textAlignVertical="top" />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Categoria</Text>
                <TextInput style={styles.input} value={form.categoria}
                  onChangeText={v => setForm(f => ({ ...f, categoria: v }))} placeholder="tubos, planchas..." />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Unidad</Text>
                <TextInput style={styles.input} value={form.unidad}
                  onChangeText={v => setForm(f => ({ ...f, unidad: v }))} placeholder="m, kg, m2..." />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Precio (S/) *</Text>
                <TextInput style={styles.input} value={form.precio}
                  onChangeText={v => setForm(f => ({ ...f, precio: v }))}
                  placeholder="0.00" keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Stock</Text>
                <TextInput style={styles.input} value={form.stock}
                  onChangeText={v => setForm(f => ({ ...f, stock: v }))}
                  placeholder="0" keyboardType="number-pad" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={[styles.boton, { flex: 1, backgroundColor: '#888' }]}
                onPress={() => setModal(false)}>
                <Text style={styles.botonTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.boton, { flex: 1 }, saving && { opacity: 0.6 }]}
                onPress={guardar} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.bg },
  btnNuevo:          { backgroundColor: COLORS.primary, margin: 16, borderRadius: 10, padding: 14, alignItems: 'center' },
  btnNuevoTexto:     { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  empty:             { textAlign: 'center', color: COLORS.textLight, marginTop: 40 },
  card:              { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10,
                       flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 2 },
  cardImg:           { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eee' },
  cardImgPlaceholder:{ width: 60, height: 60, borderRadius: 8, backgroundColor: '#f5f5f5',
                       justifyContent: 'center', alignItems: 'center' },
  cardInfo:          { flex: 1 },
  cardNombre:        { fontSize: 14, fontWeight: '700', color: COLORS.text },
  cardSub:           { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  cardPrecio:        { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 3 },
  cardAcciones:      { flexDirection: 'row', gap: 6 },
  btnEditar:         { backgroundColor: COLORS.secondary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  btnEditarTexto:    { color: '#fff', fontSize: 12, fontWeight: '600' },
  btnEliminar:       { backgroundColor: '#e74c3c', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  btnEliminarTexto:  { color: '#fff', fontWeight: 'bold' },
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
                       padding: 20, paddingBottom: 34 },
  modalTitulo:       { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  fotoRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  fotoPreview:       { width: 70, height: 70, borderRadius: 10, backgroundColor: '#eee' },
  fotoPlaceholder:   { width: 70, height: 70, borderRadius: 10, backgroundColor: '#f5f5f5',
                       justifyContent: 'center', alignItems: 'center', borderWidth: 1,
                       borderStyle: 'dashed', borderColor: '#ccc' },
  btnFoto:           { flex: 1, backgroundColor: COLORS.secondary, borderRadius: 10,
                       padding: 11, alignItems: 'center' },
  btnFotoTexto:      { color: '#fff', fontSize: 13, fontWeight: '600' },
  label:             { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  input:             { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10,
                       fontSize: 14, color: COLORS.text, marginBottom: 10, backgroundColor: '#fafafa' },
  boton:             { backgroundColor: COLORS.primary, borderRadius: 10, padding: 13, alignItems: 'center' },
  botonTexto:        { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
