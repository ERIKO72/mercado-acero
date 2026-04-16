import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API, COLORS } from '../../../constants/api';
import { uploadImage, thumbUrl } from '../../../utils/cloudinary';

export default function EditStoreScreen() {
  const [loading, setSaving2]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [form, setForm] = useState({
    nombre: '', descripcion: '', telefono: '',
    email: '', direccion: '', distrito: '', horario: '', ruc: '',
    logo_url: '',
  });

  useEffect(() => { cargarTienda(); }, []);

  const cargarTienda = async () => {
    setSaving2(true);
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
          logo_url:    t.logo_url    || '',
        });
      } else {
        Alert.alert('Error', data.error || 'No se pudo cargar la tienda');
      }
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setSaving2(false);
    }
  };

  const elegirFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galeria para subir fotos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setSubiendoFoto(true);
    try {
      const url = await uploadImage(uri, 'tiendas');
      setForm(f => ({ ...f, logo_url: url }));
      Alert.alert('Foto subida', 'Guarda los cambios para aplicarla');
    } catch (err: any) {
      if (err.message.includes('TU_CLOUD_NAME')) {
        Alert.alert(
          'Cloudinary no configurado',
          'Agrega tu Cloud Name y Upload Preset en .env.local\n\nVer instrucciones en utils/cloudinary.ts'
        );
      } else {
        Alert.alert('Error', err.message);
      }
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(API.adminTienda, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) Alert.alert('Listo', 'Cambios guardados exitosamente');
      else Alert.alert('Error', data.error || 'No se pudo guardar');
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* FOTO DE LA TIENDA */}
        <Text style={styles.seccion}>Foto de la tienda</Text>
        <View style={styles.fotoRow}>
          {form.logo_url
            ? <Image source={{ uri: thumbUrl(form.logo_url, 120) }} style={styles.logoPreview} />
            : <View style={styles.logoPlaceholder}><Text style={styles.logoPlaceholderTexto}>Sin foto</Text></View>
          }
          <View style={{ flex: 1, gap: 8 }}>
            <TouchableOpacity
              style={[styles.btnFoto, subiendoFoto && { opacity: 0.6 }]}
              onPress={elegirFoto}
              disabled={subiendoFoto}
            >
              {subiendoFoto
                ? <><ActivityIndicator color="#fff" size="small" /><Text style={styles.btnFotoTexto}>  Subiendo...</Text></>
                : <Text style={styles.btnFotoTexto}>{form.logo_url ? 'Cambiar foto' : 'Agregar foto'}</Text>
              }
            </TouchableOpacity>
            {form.logo_url
              ? <TouchableOpacity style={styles.btnQuitarFoto} onPress={() => setForm(f => ({ ...f, logo_url: '' }))}>
                  <Text style={styles.btnQuitarFotoTexto}>Quitar foto</Text>
                </TouchableOpacity>
              : null
            }
          </View>
        </View>

        {/* INFORMACIÓN */}
        <Text style={styles.seccion}>Informacion de la tienda</Text>

        <Text style={styles.label}>Nombre *</Text>
        <TextInput style={styles.input} value={form.nombre}
          onChangeText={v => setForm(f => ({ ...f, nombre: v }))} placeholder="Nombre de la tienda" />

        <Text style={styles.label}>Descripcion</Text>
        <TextInput style={[styles.input, styles.textarea]} value={form.descripcion}
          onChangeText={v => setForm(f => ({ ...f, descripcion: v }))}
          placeholder="Describe tu tienda..." multiline numberOfLines={4} textAlignVertical="top" />

        <Text style={styles.seccion}>Contacto</Text>

        <Text style={styles.label}>Telefono</Text>
        <TextInput style={styles.input} value={form.telefono}
          onChangeText={v => setForm(f => ({ ...f, telefono: v }))}
          placeholder="01-234-5678" keyboardType="phone-pad" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={form.email}
          onChangeText={v => setForm(f => ({ ...f, email: v }))}
          placeholder="tienda@ejemplo.com" keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>RUC</Text>
        <TextInput style={styles.input} value={form.ruc}
          onChangeText={v => setForm(f => ({ ...f, ruc: v }))}
          placeholder="20501234567" keyboardType="numeric" maxLength={11} />

        <Text style={styles.seccion}>Ubicacion y horario</Text>

        <Text style={styles.label}>Direccion</Text>
        <TextInput style={styles.input} value={form.direccion}
          onChangeText={v => setForm(f => ({ ...f, direccion: v }))}
          placeholder="Av. Principal 123" />

        <Text style={styles.label}>Distrito</Text>
        <TextInput style={styles.input} value={form.distrito}
          onChangeText={v => setForm(f => ({ ...f, distrito: v }))}
          placeholder="Miraflores, San Isidro..." />

        <Text style={styles.label}>Horario de atencion</Text>
        <TextInput style={styles.input} value={form.horario}
          onChangeText={v => setForm(f => ({ ...f, horario: v }))}
          placeholder="Lun-Sab 8am-6pm" />

        <TouchableOpacity
          style={[styles.boton, saving && styles.botonOff]}
          onPress={guardar}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.botonTexto}>Guardar Cambios</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered:              { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container:             { flex: 1, backgroundColor: COLORS.bg },
  content:               { padding: 16, paddingBottom: 40 },
  seccion:               { fontSize: 12, fontWeight: '700', color: COLORS.textLight,
                           textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  fotoRow:               { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  logoPreview:           { width: 90, height: 90, borderRadius: 12, backgroundColor: '#eee' },
  logoPlaceholder:       { width: 90, height: 90, borderRadius: 12, backgroundColor: '#eee',
                           justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#ccc' },
  logoPlaceholderTexto:  { fontSize: 12, color: '#aaa' },
  btnFoto:               { backgroundColor: COLORS.secondary, borderRadius: 10, paddingVertical: 10,
                           paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnFotoTexto:          { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnQuitarFoto:         { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14,
                           borderWidth: 1, borderColor: '#e74c3c', alignItems: 'center' },
  btnQuitarFotoTexto:    { color: '#e74c3c', fontSize: 13, fontWeight: '600' },
  label:                 { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 5 },
  input:                 { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
                           padding: 12, fontSize: 15, color: COLORS.text, marginBottom: 14 },
  textarea:              { height: 100 },
  boton:                 { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16,
                           alignItems: 'center', marginTop: 24 },
  botonOff:              { backgroundColor: '#aaa' },
  botonTexto:            { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
