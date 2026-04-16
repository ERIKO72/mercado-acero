import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, Alert, ActivityIndicator, Modal, ScrollView,
  TextInput, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { API, COLORS } from '../../../constants/api';
import { uploadImage } from '../../../utils/cloudinary';

// ─── Tipos ────────────────────────────────────────────────────
type Banner = {
  id: string;
  titulo: string;
  empresa: string;
  imagen_url: string;
  enlace_url: string;
  enlace_tipo: string;
  activo: boolean;
  orden: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  precio_pagado: string;
  created_at: string;
};

type FormState = {
  titulo: string;
  empresa: string;
  imagen_url: string;
  enlace_url: string;
  enlace_tipo: string;
  activo: boolean;
  orden: string;
  fecha_fin: string;
  precio_pagado: string;
};

const ENLACE_TIPOS = [
  { key: 'web',       label: '🌐 Web' },
  { key: 'whatsapp',  label: '💬 WhatsApp' },
  { key: 'telefono',  label: '📞 Teléfono' },
  { key: 'maps',      label: '📍 Google Maps' },
  { key: 'waze',      label: '🚗 Waze' },
];

const FORM_VACIO: FormState = {
  titulo: '', empresa: '', imagen_url: '', enlace_url: '',
  enlace_tipo: 'web', activo: true, orden: '0',
  fecha_fin: '', precio_pagado: '150',
};

// ─────────────────────────────────────────────────────────────
//  MODAL FORMULARIO — crear / editar banner
// ─────────────────────────────────────────────────────────────
type FormModalProps = {
  visible: boolean;
  banner: Banner | null;  // null = nuevo
  token: string;
  onClose: () => void;
  onSaved: () => void;
};

function FormModal({ visible, banner, token, onClose, onSaved }: FormModalProps) {
  const [form,        setForm]        = useState<FormState>(FORM_VACIO);
  const [saving,      setSaving]      = useState(false);
  const [subiendoImg, setSubiendoImg] = useState(false);

  useEffect(() => {
    if (banner) {
      setForm({
        titulo:        banner.titulo        || '',
        empresa:       banner.empresa       || '',
        imagen_url:    banner.imagen_url    || '',
        enlace_url:    banner.enlace_url    || '',
        enlace_tipo:   banner.enlace_tipo   || 'web',
        activo:        banner.activo !== false,
        orden:         String(banner.orden ?? 0),
        fecha_fin:     banner.fecha_fin     || '',
        precio_pagado: String(banner.precio_pagado ?? '150'),
      });
    } else {
      setForm(FORM_VACIO);
    }
  }, [banner, visible]);

  const set = (k: keyof FormState, v: any) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const elegirImagen = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitas dar acceso a la galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [16, 9],  // relación de aspecto banner
    });
    if (result.canceled || !result.assets[0]) return;
    setSubiendoImg(true);
    try {
      const url = await uploadImage(result.assets[0].uri, 'banners');
      set('imagen_url', url);
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo subir la imagen: ' + err.message);
    } finally {
      setSubiendoImg(false);
    }
  };

  const guardar = async () => {
    if (!form.titulo.trim()) { Alert.alert('Error', 'El título es obligatorio'); return; }
    if (!form.imagen_url)    { Alert.alert('Error', 'Sube una imagen para el banner'); return; }
    setSaving(true);
    try {
      const body = {
        titulo:        form.titulo,
        empresa:       form.empresa,
        imagen_url:    form.imagen_url,
        enlace_url:    form.enlace_url,
        enlace_tipo:   form.enlace_tipo,
        activo:        form.activo,
        orden:         parseInt(form.orden) || 0,
        fecha_fin:     form.fecha_fin || null,
        precio_pagado: parseFloat(form.precio_pagado) || 0,
      };
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const url  = banner ? API.bannerById(banner.id) : API.banners;
      const meth = banner ? 'PUT' : 'POST';
      const res  = await fetch(url, { method: meth, headers, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Error al guardar');
      Alert.alert('Guardado', banner ? 'Banner actualizado' : 'Banner creado correctamente');
      onSaved();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={modal.root}>
        {/* Header */}
        <View style={modal.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={modal.back}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={modal.titulo}>{banner ? 'Editar Banner' : 'Nuevo Banner'}</Text>
          <TouchableOpacity onPress={guardar} disabled={saving || subiendoImg} style={modal.saveBtn}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={modal.saveText}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView style={modal.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Imagen del flyer ── */}
          <Text style={modal.section}>Imagen del flyer</Text>
          <TouchableOpacity style={modal.imgBox} onPress={elegirImagen} disabled={subiendoImg}>
            {subiendoImg ? (
              <View style={modal.imgPlaceholder}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={modal.imgHint}>Subiendo a Cloudinary...</Text>
              </View>
            ) : form.imagen_url ? (
              <Image source={{ uri: form.imagen_url }} style={modal.imgPreview} resizeMode="cover" />
            ) : (
              <View style={modal.imgPlaceholder}>
                <Text style={modal.imgIcono}>🖼</Text>
                <Text style={modal.imgHint}>Toca para subir flyer</Text>
                <Text style={modal.imgSub}>Recomendado: 800×450 px · JPG/PNG</Text>
              </View>
            )}
          </TouchableOpacity>
          {form.imagen_url ? (
            <TouchableOpacity style={modal.btnCambiarImg} onPress={elegirImagen}>
              <Text style={modal.btnCambiarImgText}>↺ Cambiar imagen</Text>
            </TouchableOpacity>
          ) : null}

          {/* ── Datos ── */}
          <Text style={modal.section}>Datos del anuncio</Text>

          <Text style={modal.label}>Título del banner *</Text>
          <TextInput style={modal.input} value={form.titulo} onChangeText={v => set('titulo', v)}
            placeholder="Ej: Oferta especial Julio — 20% dto en tubos" />

          <Text style={modal.label}>Empresa / Anunciante</Text>
          <TextInput style={modal.input} value={form.empresa} onChangeText={v => set('empresa', v)}
            placeholder="Ej: Aceros del Centro SAC" />

          <Text style={modal.label}>Precio pagado (S/)</Text>
          <TextInput style={modal.input} value={form.precio_pagado} onChangeText={v => set('precio_pagado', v)}
            keyboardType="decimal-pad" placeholder="150.00" />

          {/* ── Enlace ── */}
          <Text style={modal.section}>Enlace al tocar</Text>
          <Text style={modal.label}>Tipo de enlace</Text>
          <View style={modal.tipoRow}>
            {ENLACE_TIPOS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[modal.tipoBtn, form.enlace_tipo === t.key && modal.tipoBtnActive]}
                onPress={() => set('enlace_tipo', t.key)}
              >
                <Text style={[modal.tipoText, form.enlace_tipo === t.key && modal.tipoTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={modal.label}>
            {form.enlace_tipo === 'whatsapp' ? 'Número WhatsApp (con código de país)'
              : form.enlace_tipo === 'telefono' ? 'Número de teléfono'
              : form.enlace_tipo === 'maps' || form.enlace_tipo === 'waze'
              ? 'Coordenadas (latitud,longitud)'
              : 'URL (https://...)'}
          </Text>
          {(form.enlace_tipo === 'maps' || form.enlace_tipo === 'waze') && (
            <View style={modal.coordHint}>
              <Text style={modal.coordHintText}>
                💡 Formato: -12.0464,-77.0428{'\n'}
                Obtén las coordenadas desde Google Maps → clic derecho → copiar coordenadas
              </Text>
            </View>
          )}
          <TextInput
            style={modal.input}
            value={form.enlace_url}
            onChangeText={v => set('enlace_url', v)}
            placeholder={
              form.enlace_tipo === 'whatsapp' ? '51999888777'
                : form.enlace_tipo === 'telefono' ? '01-234-5678'
                : form.enlace_tipo === 'maps' || form.enlace_tipo === 'waze'
                ? '-12.0464,-77.0428'
                : 'https://misitioweb.com'
            }
            keyboardType={
              form.enlace_tipo === 'web' ? 'url'
                : form.enlace_tipo === 'maps' || form.enlace_tipo === 'waze'
                ? 'numbers-and-punctuation'
                : 'phone-pad'
            }
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* ── Configuración ── */}
          <Text style={modal.section}>Configuración</Text>

          <Text style={modal.label}>Orden (menor = aparece primero)</Text>
          <TextInput style={modal.input} value={form.orden} onChangeText={v => set('orden', v)}
            keyboardType="number-pad" placeholder="0" />

          <Text style={modal.label}>Fecha de vencimiento (AAAA-MM-DD · vacío = sin vencimiento)</Text>
          <TextInput style={modal.input} value={form.fecha_fin} onChangeText={v => set('fecha_fin', v)}
            placeholder="2026-12-31" />

          <View style={modal.switchRow}>
            <Text style={modal.switchLabel}>Banner activo</Text>
            <Switch
              value={form.activo}
              onValueChange={v => set('activo', v)}
              trackColor={{ true: COLORS.success }}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  CARD de banner en la lista
// ─────────────────────────────────────────────────────────────
function BannerCard({
  item, token, onEdit, onDelete, onToggle,
}: { item: Banner; token: string; onEdit: (b: Banner) => void; onDelete: (b: Banner) => void; onToggle: (b: Banner) => void }) {
  const fechaVence = item.fecha_fin
    ? new Date(item.fecha_fin) < new Date() ? '⚠ Vencido' : `Vence: ${item.fecha_fin}`
    : 'Sin vencimiento';

  return (
    <View style={[card.wrap, !item.activo && card.wrapInactivo]}>
      {/* Imagen preview */}
      <Image source={{ uri: item.imagen_url }} style={card.img} resizeMode="cover" />

      {/* Info */}
      <View style={card.body}>
        <View style={card.topRow}>
          <Text style={card.titulo} numberOfLines={1}>{item.titulo}</Text>
          <View style={[card.estadoBadge, item.activo ? card.estadoActivo : card.estadoInactivo]}>
            <Text style={card.estadoText}>{item.activo ? 'Activo' : 'Inactivo'}</Text>
          </View>
        </View>
        {item.empresa ? <Text style={card.empresa}>{item.empresa}</Text> : null}
        <Text style={card.meta}>
          {item.enlace_tipo === 'whatsapp' ? '💬'
            : item.enlace_tipo === 'telefono' ? '📞'
            : item.enlace_tipo === 'maps' ? '📍 Maps'
            : item.enlace_tipo === 'waze' ? '🚗 Waze'
            : '🌐'} {item.enlace_url || 'sin enlace'}
        </Text>
        <View style={card.bottomRow}>
          <Text style={card.precio}>S/ {Number(item.precio_pagado).toFixed(2)}</Text>
          <Text style={[card.vence, item.fecha_fin && new Date(item.fecha_fin) < new Date() && { color: '#E74C3C' }]}>
            {fechaVence}
          </Text>
        </View>

        {/* Acciones */}
        <View style={card.actions}>
          <TouchableOpacity style={card.btnToggle} onPress={() => onToggle(item)}>
            <Text style={card.btnToggleText}>{item.activo ? '⏸ Pausar' : '▶ Activar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={card.btnEdit} onPress={() => onEdit(item)}>
            <Text style={card.btnEditText}>✏️ Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={card.btnDel} onPress={() => onDelete(item)}>
            <Text style={card.btnDelText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function BannersScreen() {
  const [token,      setToken]      = useState('');
  const [banners,    setBanners]    = useState<Banner[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);

  const cargar = useCallback(async (tk: string) => {
    try {
      const res  = await fetch(API.bannersAdmin, { headers: { Authorization: `Bearer ${tk}` } });
      const json = await res.json();
      if (json.ok) setBanners(json.data);
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('token').then(tk => {
      if (!tk) { router.replace('/screens/login'); return; }
      setToken(tk);
      cargar(tk);
    });
  }, [cargar]);

  const handleEdit = (b: Banner) => { setEditBanner(b); setShowModal(true); };
  const handleNuevo = () => { setEditBanner(null); setShowModal(true); };

  const handleDelete = (b: Banner) => {
    Alert.alert('Eliminar banner', `¿Eliminar "${b.titulo}" permanentemente?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res  = await fetch(API.bannerById(b.id), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (!json.ok) throw new Error(json.error);
            cargar(token);
          } catch (err: any) { Alert.alert('Error', err.message); }
        }
      }
    ]);
  };

  const handleToggle = async (b: Banner) => {
    try {
      const res  = await fetch(API.bannerToggle(b.id), { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.ok) cargar(token);
    } catch { /* silencioso */ }
  };

  const ingresos = banners.reduce((s, b) => s + Number(b.precio_pagado), 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={banners}
        keyExtractor={b => b.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View>
            {/* Resumen ingresos */}
            <View style={styles.resumen}>
              <View style={styles.resumenItem}>
                <Text style={styles.resumenNum}>{banners.length}</Text>
                <Text style={styles.resumenLabel}>Banners total</Text>
              </View>
              <View style={styles.resumenItem}>
                <Text style={[styles.resumenNum, { color: COLORS.success }]}>
                  {banners.filter(b => b.activo).length}
                </Text>
                <Text style={styles.resumenLabel}>Activos</Text>
              </View>
              <View style={styles.resumenItem}>
                <Text style={[styles.resumenNum, { color: COLORS.gold }]}>
                  S/ {ingresos.toFixed(0)}
                </Text>
                <Text style={styles.resumenLabel}>Ingresos</Text>
              </View>
            </View>

            {/* Tarifas referenciales */}
            <View style={styles.tarifaBox}>
              <Text style={styles.tarifaTitulo}>💡 Tarifas sugeridas</Text>
              <Text style={styles.tarifaItem}>• Banner 1 semana  →  S/ 50</Text>
              <Text style={styles.tarifaItem}>• Banner 15 días   →  S/ 80</Text>
              <Text style={styles.tarifaItem}>• Banner 1 mes     →  S/ 150</Text>
              <Text style={styles.tarifaItem}>• Banner trimestre →  S/ 400</Text>
            </View>

            {/* Botón nuevo */}
            <TouchableOpacity style={styles.btnNuevo} onPress={handleNuevo}>
              <Text style={styles.btnNuevoText}>+ Agregar nuevo banner</Text>
            </TouchableOpacity>

            <Text style={styles.seccion}>Banners configurados</Text>
          </View>
        }
        renderItem={({ item }) => (
          <BannerCard
            item={item}
            token={token}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyText}>No hay banners todavía.</Text>
            <Text style={styles.emptySub}>Crea el primer flyer publicitario para monetizar el carrusel.</Text>
          </View>
        }
      />

      <FormModal
        visible={showModal}
        banner={editBanner}
        token={token}
        onClose={() => setShowModal(false)}
        onSaved={() => cargar(token)}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  ESTILOS
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container:     { padding: 14, backgroundColor: '#F2F2F2', flexGrow: 1 },

  resumen:       { flexDirection: 'row', gap: 10, marginBottom: 14 },
  resumenItem:   { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2 },
  resumenNum:    { fontSize: 22, fontWeight: '900', color: COLORS.secondary },
  resumenLabel:  { fontSize: 10, color: '#AAA', fontWeight: '600', marginTop: 3 },

  tarifaBox:     { backgroundColor: '#FFFDE7', borderRadius: 12, padding: 14, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: COLORS.gold },
  tarifaTitulo:  { fontSize: 13, fontWeight: '800', color: '#856404', marginBottom: 8 },
  tarifaItem:    { fontSize: 13, color: '#856404', marginBottom: 3 },

  btnNuevo:      { backgroundColor: COLORS.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 16 },
  btnNuevoText:  { color: '#fff', fontWeight: '800', fontSize: 15 },

  seccion:       { fontSize: 11, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  empty:         { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyIcon:     { fontSize: 44 },
  emptyText:     { fontSize: 16, fontWeight: '700', color: '#555' },
  emptySub:      { fontSize: 13, color: '#AAA', textAlign: 'center', paddingHorizontal: 30 },
});

const card = StyleSheet.create({
  wrap:           { backgroundColor: '#fff', borderRadius: 14, marginBottom: 14, overflow: 'hidden', elevation: 3 },
  wrapInactivo:   { opacity: 0.6 },
  img:            { width: '100%', height: 140, backgroundColor: '#EEE' },
  body:           { padding: 12, gap: 5 },
  topRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titulo:         { fontSize: 14, fontWeight: '700', color: '#1a1a1a', flex: 1, marginRight: 8 },
  empresa:        { fontSize: 12, color: '#888' },
  meta:           { fontSize: 11, color: '#AAA' },
  bottomRow:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  precio:         { fontSize: 14, fontWeight: '800', color: COLORS.success },
  vence:          { fontSize: 11, color: '#AAA' },
  estadoBadge:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  estadoActivo:   { backgroundColor: '#D5F5E3' },
  estadoInactivo: { backgroundColor: '#F9EBEA' },
  estadoText:     { fontSize: 10, fontWeight: '700', color: '#555' },
  actions:        { flexDirection: 'row', gap: 8, marginTop: 8 },
  btnToggle:      { flex: 1, backgroundColor: '#EBF5FB', borderRadius: 8, padding: 8, alignItems: 'center' },
  btnToggleText:  { fontSize: 12, fontWeight: '700', color: COLORS.verified },
  btnEdit:        { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 8, padding: 8, alignItems: 'center' },
  btnEditText:    { fontSize: 12, fontWeight: '700', color: '#555' },
  btnDel:         { backgroundColor: '#FDEDEC', borderRadius: 8, padding: 8, alignItems: 'center', width: 38 },
  btnDelText:     { fontSize: 16 },
});

const modal = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#F2F2F2' },
  header:         { backgroundColor: COLORS.secondary, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back:           { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  titulo:         { color: '#fff', fontSize: 16, fontWeight: '800' },
  saveBtn:        { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveText:       { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll:         { padding: 16 },
  section:        { fontSize: 11, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginTop: 18, marginBottom: 10 },
  label:          { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 5 },
  input:          { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: '#1a1a1a', marginBottom: 12 },
  imgBox:         { width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 8, borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  imgPreview:     { width: '100%', height: '100%' },
  imgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F9F9', gap: 8 },
  imgIcono:       { fontSize: 36 },
  imgHint:        { fontSize: 14, fontWeight: '700', color: '#555' },
  imgSub:         { fontSize: 11, color: '#AAA' },
  btnCambiarImg:  { alignSelf: 'flex-start', marginBottom: 8 },
  btnCambiarImgText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  tipoRow:        { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tipoBtn:        { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', padding: 10, alignItems: 'center' },
  tipoBtnActive:  { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  tipoText:       { fontSize: 11, fontWeight: '600', color: '#888' },
  tipoTextActive: { color: '#fff' },
  switchRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  switchLabel:    { fontSize: 14, color: '#333', fontWeight: '600' },
  coordHint:      { backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#27AE60' },
  coordHintText:  { fontSize: 12, color: '#1B5E20', lineHeight: 18 },
});
