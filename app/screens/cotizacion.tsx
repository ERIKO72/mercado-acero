import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, COLORS } from '../../constants/api';

// ── Tipos ──────────────────────────────────────────────────
type Material = { id: number; nombre: string; categoria: string; unidad: string };
type ItemLista = { material: string; categoria: string; cantidad: string; unidad: string; descripcion: string };
type CotizacionGuardada = { id: number; created_at: string; items: ItemLista[] };

const CATEGORIAS = ['tubos', 'planchas', 'perfiles', 'varillas', 'otros'];

// ── Colores de categoría ───────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  tubos:    '#2980B9',
  planchas: '#27AE60',
  perfiles: '#8E44AD',
  varillas: '#E67E22',
  otros:    '#7F8C8D',
};

export default function CotizacionScreen() {
  const [telefono, setTelefono]         = useState('');
  const [nombre,   setNombre]           = useState('');
  const [items,    setItems]            = useState<ItemLista[]>([]);
  const [busqueda, setBusqueda]         = useState('');
  const [sugs,     setSugs]             = useState<Material[]>([]);
  const [cargandoSugs, setCargandoSugs] = useState(false);
  const [enviando, setEnviando]         = useState(false);
  const [historial, setHistorial]       = useState<CotizacionGuardada[]>([]);
  const [verHistorial, setVerHistorial] = useState(false);
  const [cargandoHist, setCargandoHist] = useState(false);
  // Item en edición
  const [editIdx,   setEditIdx]   = useState<number | null>(null);
  const [catActual, setCatActual] = useState('tubos');
  const [uniActual, setUniActual] = useState('tubos 6m');
  const busqTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Cargar teléfono guardado ───────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('coti_telefono').then(t => { if (t) setTelefono(t); });
    AsyncStorage.getItem('coti_nombre').then(n => { if (n) setNombre(n); });
  }, []);

  // ── Autocomplete ───────────────────────────────────────────
  useEffect(() => {
    if (!busqueda.trim()) { setSugs([]); return; }
    if (busqTimer.current) clearTimeout(busqTimer.current);
    busqTimer.current = setTimeout(async () => {
      setCargandoSugs(true);
      try {
        const url = `${API.cotizacionCatalogo}?q=${encodeURIComponent(busqueda)}&categoria=${catActual}`;
        const res = await fetch(url);
        const data = await res.json();
        setSugs(data.ok ? data.data : []);
      } catch { setSugs([]); }
      finally { setCargandoSugs(false); }
    }, 300);
  }, [busqueda, catActual]);

  // ── Agregar material desde sugerencia ─────────────────────
  const agregarDesde = useCallback((m: Material) => {
    setBusqueda('');
    setSugs([]);
    const nuevo: ItemLista = {
      material: m.nombre, categoria: m.categoria,
      cantidad: '1', unidad: m.unidad, descripcion: '',
    };
    setItems(prev => [...prev, nuevo]);
    setEditIdx(items.length); // abre editor del nuevo item
  }, [items.length]);

  // ── Agregar material manual ────────────────────────────────
  const agregarManual = () => {
    if (!busqueda.trim()) return;
    const nuevo: ItemLista = {
      material: busqueda.trim(), categoria: catActual,
      cantidad: '1', unidad: uniActual, descripcion: '',
    };
    setItems(prev => [...prev, nuevo]);
    setEditIdx(items.length);
    setBusqueda('');
    setSugs([]);
  };

  // ── Eliminar item ──────────────────────────────────────────
  const eliminar = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    if (editIdx === idx) setEditIdx(null);
  };

  // ── Actualizar campo de item ───────────────────────────────
  const actualizarItem = (idx: number, campo: keyof ItemLista, valor: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [campo]: valor } : it));
  };

  // ── Enviar cotización ──────────────────────────────────────
  const enviar = async () => {
    const tel = telefono.trim();
    if (!tel) { Alert.alert('Teléfono requerido', 'Ingresa tu número de WhatsApp'); return; }
    if (items.length === 0) { Alert.alert('Lista vacía', 'Agrega al menos un material'); return; }

    setEnviando(true);
    try {
      await AsyncStorage.setItem('coti_telefono', tel);
      await AsyncStorage.setItem('coti_nombre', nombre.trim());

      const res = await fetch(API.cotizacionNueva, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          telefono: tel,
          nombre:   nombre.trim() || 'Cliente',
          items:    items.map(it => ({
            ...it, cantidad: parseFloat(it.cantidad) || 1,
          })),
        }),
      });
      const data = await res.json();

      if (!data.ok) { Alert.alert('Error', data.error || 'No se pudo guardar'); return; }

      // Generar mensaje de WhatsApp con la lista
      const lineas = items.map(it =>
        `• ${it.material} — ${it.cantidad} ${it.unidad}${it.descripcion ? ` (${it.descripcion})` : ''}`
      ).join('\n');
      const msg = `Hola, soy ${nombre.trim() || 'un cliente'}. Quisiera cotizar los siguientes materiales:\n\n${lineas}\n\nMi número: ${tel}`;
      const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;

      Alert.alert(
        '¡Cotización guardada!',
        'Tu lista fue registrada. ¿Quieres enviarla por WhatsApp a las tiendas?',
        [
          { text: 'Solo guardar', style: 'cancel' },
          { text: 'Enviar por WhatsApp', onPress: () => Linking.openURL(waUrl) },
        ]
      );
      setItems([]);
      setEditIdx(null);
    } catch {
      Alert.alert('Error de conexión', 'No se pudo guardar la cotización');
    } finally {
      setEnviando(false);
    }
  };

  // ── Historial ──────────────────────────────────────────────
  const cargarHistorial = async () => {
    const tel = telefono.trim();
    if (!tel) { Alert.alert('Teléfono requerido', 'Ingresa tu número primero'); return; }
    setCargandoHist(true);
    setVerHistorial(true);
    try {
      const res  = await fetch(API.cotizacionHistorial(tel));
      const data = await res.json();
      setHistorial(data.ok ? data.data : []);
    } catch { setHistorial([]); }
    finally { setCargandoHist(false); }
  };

  const restaurarCotizacion = (c: CotizacionGuardada) => {
    setItems(c.items.map(it => ({
      ...it, cantidad: String(it.cantidad),
    })));
    setVerHistorial(false);
    setEditIdx(null);
    Alert.alert('Lista restaurada', 'Puedes editarla y volver a cotizar.');
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Historial modal */}
      {verHistorial && (
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={s.modalTitulo}>Mis cotizaciones anteriores</Text>
              <TouchableOpacity onPress={() => setVerHistorial(false)}>
                <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            {cargandoHist
              ? <ActivityIndicator color={COLORS.primary} />
              : historial.length === 0
                ? <Text style={{ color: '#888', textAlign: 'center' }}>Sin cotizaciones previas</Text>
                : <FlatList
                    data={historial}
                    keyExtractor={c => String(c.id)}
                    renderItem={({ item: c }) => (
                      <TouchableOpacity style={s.histCard} onPress={() => restaurarCotizacion(c)}>
                        <Text style={s.histFecha}>{new Date(c.created_at).toLocaleDateString('es-PE')}</Text>
                        <Text style={s.histItems}>{(c.items || []).length} materiales</Text>
                        <Text style={s.histRestaurar}>Restaurar →</Text>
                      </TouchableOpacity>
                    )}
                  />
            }
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitulo}>Cotizador de Materiales</Text>
          <Text style={s.headerSub}>Crea tu lista y cotiza con las tiendas</Text>
        </View>

        {/* Datos del cliente */}
        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>TUS DATOS</Text>
          <TextInput
            style={s.input}
            placeholder="Tu nombre (opcional)"
            placeholderTextColor="#bbb"
            value={nombre}
            onChangeText={setNombre}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="WhatsApp: 51999..."
              placeholderTextColor="#bbb"
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={s.btnHistorial} onPress={cargarHistorial}>
              <Text style={s.btnHistorialTxt}>Historial</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buscador de materiales */}
        <View style={[s.seccion, { borderTopWidth: 1, borderTopColor: '#f0f0f0' }]}>
          <Text style={s.seccionTitulo}>AGREGAR MATERIAL</Text>

          {/* Categorías */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {CATEGORIAS.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[s.catChip, catActual === cat && { backgroundColor: CAT_COLOR[cat] }]}
                onPress={() => { setCatActual(cat); setBusqueda(''); setSugs([]); }}
              >
                <Text style={[s.catChipTxt, catActual === cat && { color: '#fff' }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Búsqueda */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder={`Buscar en ${catActual}...`}
              placeholderTextColor="#bbb"
              value={busqueda}
              onChangeText={setBusqueda}
            />
            <TouchableOpacity style={s.btnAgregar} onPress={agregarManual}>
              <Text style={s.btnAgregarTxt}>+ Agregar</Text>
            </TouchableOpacity>
          </View>

          {/* Sugerencias */}
          {cargandoSugs && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 6 }} />}
          {sugs.length > 0 && (
            <View style={s.sugsBox}>
              {sugs.map(m => (
                <TouchableOpacity key={m.id} style={s.sugItem} onPress={() => agregarDesde(m)}>
                  <View style={[s.sugDot, { backgroundColor: CAT_COLOR[m.categoria] || '#aaa' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.sugNombre}>{m.nombre}</Text>
                    <Text style={s.sugUnidad}>{m.unidad}</Text>
                  </View>
                  <Text style={s.sugAgregar}>+</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Lista de items */}
        {items.length > 0 && (
          <View style={[s.seccion, { borderTopWidth: 1, borderTopColor: '#f0f0f0', marginBottom: 12 }]}>
            <Text style={s.seccionTitulo}>MI LISTA ({items.length})</Text>
            {items.map((it, idx) => (
              <View key={idx} style={s.itemCard}>
                <TouchableOpacity
                  style={s.itemHeader}
                  onPress={() => setEditIdx(editIdx === idx ? null : idx)}
                >
                  <View style={[s.itemDot, { backgroundColor: CAT_COLOR[it.categoria] || '#aaa' }]} />
                  <Text style={s.itemNombre} numberOfLines={1}>{it.material}</Text>
                  <Text style={s.itemCant}>{it.cantidad} {it.unidad}</Text>
                  <TouchableOpacity onPress={() => eliminar(idx)} style={{ paddingLeft: 8 }}>
                    <Text style={{ color: '#e74c3c', fontWeight: '700', fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                {editIdx === idx && (
                  <View style={s.itemEditor}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.editorLabel}>Cantidad</Text>
                        <TextInput
                          style={s.editorInput}
                          value={it.cantidad}
                          onChangeText={v => actualizarItem(idx, 'cantidad', v)}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.editorLabel}>Unidad</Text>
                        <TextInput
                          style={s.editorInput}
                          value={it.unidad}
                          onChangeText={v => actualizarItem(idx, 'unidad', v)}
                        />
                      </View>
                    </View>
                    <Text style={s.editorLabel}>Descripción adicional (opcional)</Text>
                    <TextInput
                      style={s.editorInput}
                      value={it.descripcion}
                      onChangeText={v => actualizarItem(idx, 'descripcion', v)}
                      placeholder="Ej: galvanizado, acabado pulido..."
                      placeholderTextColor="#bbb"
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Botón enviar */}
        {items.length > 0 && (
          <TouchableOpacity
            style={[s.btnEnviar, enviando && { opacity: 0.6 }]}
            onPress={enviar}
            disabled={enviando}
          >
            {enviando
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnEnviarTxt}>Guardar y cotizar por WhatsApp</Text>
            }
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: COLORS.bg },
  scroll:          { paddingBottom: 20 },

  header:          { backgroundColor: COLORS.secondary, padding: 10, paddingTop: 14, paddingBottom: 10, alignItems: 'center' },
  headerTitulo:    { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  headerSub:       { color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 2 },

  seccion:         { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 0, marginBottom: 0, borderRadius: 0, padding: 16, elevation: 2 },
  seccionTitulo:   { fontSize: 11, fontWeight: '800', color: '#aaa', letterSpacing: 1.5, marginBottom: 12 },

  input:           {
    borderWidth: 1.5, borderColor: '#E8E8E8',
    borderRadius: 10, padding: 12,
    fontSize: 14, color: '#1a1a1a', backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },

  btnHistorial:    { backgroundColor: COLORS.secondary, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center', marginBottom: 10 },
  btnHistorialTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  catChip:         { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  catChipTxt:      { fontSize: 13, fontWeight: '600', color: '#555' },

  btnAgregar:      { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center', marginBottom: 10 },
  btnAgregarTxt:   { color: '#fff', fontWeight: '800', fontSize: 14 },

  sugsBox:         { borderWidth: 1, borderColor: '#eee', borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  sugItem:         { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 10 },
  sugDot:          { width: 10, height: 10, borderRadius: 5 },
  sugNombre:       { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  sugUnidad:       { fontSize: 12, color: '#888' },
  sugAgregar:      { color: COLORS.primary, fontSize: 22, fontWeight: '900', paddingLeft: 8 },

  itemCard:        { borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  itemHeader:      { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, backgroundColor: '#fafafa' },
  itemDot:         { width: 10, height: 10, borderRadius: 5 },
  itemNombre:      { flex: 1, fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  itemCant:        { fontSize: 13, color: '#888' },

  itemEditor:      { padding: 12, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  editorLabel:     { fontSize: 12, fontWeight: '600', color: '#aaa', marginBottom: 4, marginTop: 8 },
  editorInput:     { borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 8, padding: 10, fontSize: 14, color: '#1a1a1a', backgroundColor: '#FAFAFA' },

  btnEnviar:       { backgroundColor: COLORS.primary, margin: 12, borderRadius: 14, padding: 16, alignItems: 'center' },
  btnEnviarTxt:    { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  // Modal historial
  modalOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, justifyContent: 'center', padding: 20 },
  modal:           { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitulo:     { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  histCard:        { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  histFecha:       { fontSize: 14, fontWeight: '700', color: '#333', flex: 1 },
  histItems:       { fontSize: 13, color: '#888', marginRight: 12 },
  histRestaurar:   { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
});
