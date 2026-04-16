import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal, ScrollView, Switch, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API, COLORS } from '../../../constants/api';

// ─── Tipos ────────────────────────────────────────────────────
type Tienda = {
  id: string;
  nombre: string;
  distrito: string;
  telefono: string;
  email: string;
  ruc: string;
  descripcion: string;
  direccion: string;
  latitud: string;
  longitud: string;
  horario: string;
  logo_url: string;
  activa: boolean;
  verificada: boolean;
  plan_nombre: string;
  destacada: boolean;
};

type TiendaVence = {
  id: string; nombre: string; distrito: string; telefono: string;
  plan_nombre: string; fecha_fin: string; dias_restantes: number; dias_vencido: number;
};

type Resumen = {
  total_tiendas: number;
  tiendas_activas: number;
  tiendas_premium: number;
  productos_activos: number;
  usuarios_dueno: number;
  visitas_mes: number;
  top_tiendas: { nombre: string; distrito: string; total: number }[];
  por_vencer: TiendaVence[];
  vencidas: TiendaVence[];
};

const PLANES = ['gratis', 'basico', 'premium'];

// ─────────────────────────────────────────────────────────────
//  MODAL DE EDICIÓN
// ─────────────────────────────────────────────────────────────
type EditModalProps = {
  visible: boolean;
  tienda: Tienda | null;
  token: string;
  onClose: () => void;
  onSaved: () => void;
};

function EditModal({ visible, tienda, token, onClose, onSaved }: EditModalProps) {
  const [nombre,     setNombre]     = useState('');
  const [descripcion,setDescripcion]= useState('');
  const [telefono,   setTelefono]   = useState('');
  const [email,      setEmail]      = useState('');
  const [direccion,  setDireccion]  = useState('');
  const [distrito,   setDistrito]   = useState('');
  const [horario,    setHorario]    = useState('');
  const [activa,      setActiva]     = useState(true);
  const [verificada,  setVerificada] = useState(false);
  const [planSel,     setPlanSel]    = useState('gratis');
  const [vencimiento, setVencimiento]= useState('');
  const [notas,       setNotas]      = useState('');
  const [saving,      setSaving]     = useState(false);

  useEffect(() => {
    if (tienda) {
      setNombre(tienda.nombre || '');
      setDescripcion(tienda.descripcion || '');
      setTelefono(tienda.telefono || '');
      setEmail(tienda.email || '');
      setDireccion(tienda.direccion || '');
      setDistrito(tienda.distrito || '');
      setHorario(tienda.horario || '');
      setActiva(tienda.activa !== false);
      setVerificada(tienda.verificada === true);
      setPlanSel(tienda.plan_nombre || 'gratis');
      setVencimiento((tienda as any).fecha_fin ? (tienda as any).fecha_fin.toString().slice(0,10) : '');
      setNotas((tienda as any).notas_admin || '');
    }
  }, [tienda]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      // Actualizar datos de tienda
      const res = await fetch(API.saTienda(tienda!.id), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ nombre, descripcion, telefono, email, direccion, distrito, horario, activa, verificada, notas_admin: notas }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Error al guardar');

      // Actualizar plan si cambió
      if (planSel !== tienda!.plan_nombre) {
        const rp = await fetch(API.saTiendaPlan(tienda!.id), {
          method: 'POST',
          headers,
          body: JSON.stringify({ plan_nombre: planSel, fecha_fin: vencimiento || undefined }),
        });
        const jp = await rp.json();
        if (!jp.ok) throw new Error(jp.error || 'Error al actualizar plan');
      }

      Alert.alert('Guardado', 'Tienda actualizada correctamente');
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
          <TouchableOpacity onPress={onClose} style={modal.backBtn}>
            <Text style={modal.backText}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={modal.headerTitle}>Editar Tienda</Text>
          <TouchableOpacity onPress={handleSave} style={modal.saveBtn} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={modal.saveText}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView style={modal.scroll} keyboardShouldPersistTaps="handled">
          <Text style={modal.section}>Datos básicos</Text>

          <Text style={modal.label}>Nombre *</Text>
          <TextInput style={modal.input} value={nombre} onChangeText={setNombre} />

          <Text style={modal.label}>Descripción</Text>
          <TextInput style={[modal.input, { height: 80 }]} value={descripcion} onChangeText={setDescripcion} multiline />

          <Text style={modal.label}>Teléfono</Text>
          <TextInput style={modal.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />

          <Text style={modal.label}>Email</Text>
          <TextInput style={modal.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={modal.label}>Dirección</Text>
          <TextInput style={modal.input} value={direccion} onChangeText={setDireccion} />

          <Text style={modal.label}>Distrito</Text>
          <TextInput style={modal.input} value={distrito} onChangeText={setDistrito} />

          <Text style={modal.label}>Horario</Text>
          <TextInput style={modal.input} value={horario} onChangeText={setHorario} />

          <Text style={modal.section}>Estado</Text>
          <View style={modal.switchRow}>
            <Text style={modal.switchLabel}>Activa</Text>
            <Switch value={activa} onValueChange={setActiva} trackColor={{ true: COLORS.success }} />
          </View>
          <View style={modal.switchRow}>
            <Text style={modal.switchLabel}>Verificada</Text>
            <Switch value={verificada} onValueChange={setVerificada} trackColor={{ true: COLORS.verified }} />
          </View>

          <Text style={modal.section}>Plan de suscripción</Text>
          <View style={modal.planRow}>
            {PLANES.map(p => (
              <TouchableOpacity
                key={p}
                style={[modal.planBtn, planSel === p && modal.planBtnActive]}
                onPress={() => setPlanSel(p)}
              >
                <Text style={[modal.planText, planSel === p && modal.planTextActive]}>
                  {p === 'premium' ? '★ ' : ''}{p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={modal.label}>📅 Vencimiento del plan (AAAA-MM-DD)</Text>
          <TextInput
            style={modal.input}
            value={vencimiento}
            onChangeText={setVencimiento}
            placeholder="Ej: 2026-05-12"
            placeholderTextColor="#AAA"
            keyboardType="numeric"
          />
          {vencimiento ? (
            <Text style={modal.hint}>
              Vence: {new Date(vencimiento + 'T12:00:00').toLocaleDateString('es-PE', { day:'2-digit', month:'long', year:'numeric' })}
            </Text>
          ) : null}

          <Text style={modal.section}>Notas internas</Text>
          <TextInput
            style={[modal.input, { height: 90, textAlignVertical: 'top' }]}
            value={notas}
            onChangeText={setNotas}
            placeholder="Ej: Pagó S/80 el 10/04 - Yape. Contacto: Juan 999..."
            placeholderTextColor="#AAA"
            multiline
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  MODAL NUEVA TIENDA
// ─────────────────────────────────────────────────────────────
type NuevaModalProps = { visible: boolean; token: string; onClose: () => void; onSaved: () => void };

function NuevaModal({ visible, token, onClose, onSaved }: NuevaModalProps) {
  const [nombre,   setNombre]   = useState('');
  const [distrito, setDistrito] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email,    setEmail]    = useState('');
  const [saving,   setSaving]   = useState(false);

  const handleCreate = async () => {
    if (!nombre.trim() || !distrito.trim()) {
      Alert.alert('Error', 'Nombre y distrito son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(API.saTiendas, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre, distrito, telefono, email }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      Alert.alert('Creada', `Tienda "${nombre}" creada correctamente`);
      setNombre(''); setDistrito(''); setTelefono(''); setEmail('');
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
        <View style={modal.header}>
          <TouchableOpacity onPress={onClose} style={modal.backBtn}>
            <Text style={modal.backText}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={modal.headerTitle}>Nueva Tienda</Text>
          <TouchableOpacity onPress={handleCreate} style={modal.saveBtn} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={modal.saveText}>Crear</Text>
            }
          </TouchableOpacity>
        </View>
        <ScrollView style={modal.scroll} keyboardShouldPersistTaps="handled">
          <Text style={modal.section}>Datos de la tienda</Text>

          <Text style={modal.label}>Nombre *</Text>
          <TextInput style={modal.input} value={nombre} onChangeText={setNombre} />

          <Text style={modal.label}>Distrito *</Text>
          <TextInput style={modal.input} value={distrito} onChangeText={setDistrito} />

          <Text style={modal.label}>Teléfono</Text>
          <TextInput style={modal.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />

          <Text style={modal.label}>Email</Text>
          <TextInput style={modal.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  MODAL PROSPECCIÓN GOOGLE PLACES
// ─────────────────────────────────────────────────────────────
const DISTRITOS_PROSP = [
  'Ate','Callao','Los Olivos','San Martín de Porres','La Victoria',
  'Villa El Salvador','Comas','San Juan de Lurigancho','Independencia',
  'Lurín','Chorrillos','Villa María del Triunfo','Santa Anita',
  'El Agustino','Rímac','Breña','Cercado de Lima','Puente Piedra',
  'Ventanilla','Lince','Surquillo','San Juan de Miraflores','Carabayllo',
  'La Molina','Surco',
];

type Prospecto = {
  place_id: string; nombre: string; direccion: string; telefono: string;
  web: string; calificacion: number | null; lat: number; lng: number;
  horario: string; distrito: string;
};

function ProspeccionModal({ visible, token, onRegistrar, onClose }: {
  visible: boolean; token: string;
  onRegistrar: (p: Prospecto) => Promise<void>;
  onClose: () => void;
}) {
  const [distrito,     setDistrito]     = useState('Ate');
  const [termino,      setTermino]      = useState('distribuidores acero ferretería');
  const [resultados,   setResultados]   = useState<Prospecto[]>([]);
  const [buscando,     setBuscando]     = useState(false);
  const [buscado,      setBuscado]      = useState(false);
  const [registrando,  setRegistrando]  = useState<string | null>(null); // place_id guardando
  const [guardadas,    setGuardadas]    = useState<Set<string>>(new Set()); // place_ids ya guardados
  const [descartadas,  setDescartadas]  = useState<Set<string>>(new Set()); // place_ids descartados
  const [guardandoTodo, setGuardandoTodo] = useState(false);

  // Restablecer estado al buscar nuevo lote
  const buscar = async () => {
    setBuscando(true);
    setBuscado(false);
    setGuardadas(new Set());
    setDescartadas(new Set());
    setResultados([]);
    try {
      const url = `${API.prospeccion}?distrito=${encodeURIComponent(distrito)}&q=${encodeURIComponent(termino)}`;
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setResultados(json.data);
      setBuscado(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo conectar con Google Places');
    } finally {
      setBuscando(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={pros.root}>
        <View style={pros.header}>
          <TouchableOpacity onPress={onClose} style={pros.backBtn}>
            <Text style={pros.backText}>← Cerrar</Text>
          </TouchableOpacity>
          <Text style={pros.headerTitle}>🔍 Prospectar Tiendas</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={pros.filtros}>
          {/* Selector de distrito */}
          <Text style={pros.label}>Distrito</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={pros.distScroll}>
            {DISTRITOS_PROSP.map(d => (
              <TouchableOpacity
                key={d}
                style={[pros.distBtn, distrito === d && pros.distBtnActive]}
                onPress={() => setDistrito(d)}
              >
                <Text style={[pros.distText, distrito === d && pros.distTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Término de búsqueda */}
          <Text style={[pros.label, { marginTop: 10 }]}>Qué buscar</Text>
          <View style={pros.searchRow}>
            <TextInput
              style={pros.searchInput}
              value={termino}
              onChangeText={setTermino}
              placeholder="distribuidores acero ferretería..."
              placeholderTextColor="#AAA"
              autoCapitalize="none"
            />
            <TouchableOpacity style={pros.btnBuscar} onPress={buscar} disabled={buscando}>
              {buscando
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={pros.btnBuscarText}>Buscar</Text>
              }
            </TouchableOpacity>
          </View>
          <Text style={pros.hint}>
            Buscará: "{termino} {distrito} Lima Peru" en Google Maps
          </Text>
        </View>

        {/* Resultados */}
        {buscando && (
          <View style={pros.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={pros.loadingText}>Consultando Google Places...</Text>
          </View>
        )}

        {!buscando && buscado && resultados.length === 0 && (
          <View style={pros.empty}>
            <Text style={pros.emptyText}>No se encontraron resultados en {distrito}</Text>
            <Text style={pros.emptySub}>Prueba con otro término o distrito</Text>
          </View>
        )}

        {!buscando && resultados.length > 0 && (() => {
          // Solo las que no han sido descartadas
          const visibles = resultados.filter(r => !descartadas.has(r.place_id));
          const pendientes = visibles.filter(r => !guardadas.has(r.place_id));

          const guardarUna = async (item: Prospecto) => {
            if (guardadas.has(item.place_id)) return;
            setRegistrando(item.place_id);
            try {
              await onRegistrar(item);
              setGuardadas(prev => new Set(prev).add(item.place_id));
            } catch (err: any) {
              const msg = err.message || 'Error al registrar';
              if (Platform.OS === 'web') (window as any).alert('Error: ' + msg);
              else Alert.alert('Error', msg);
            } finally {
              setRegistrando(null);
            }
          };

          const guardarTodas = async () => {
            setGuardandoTodo(true);
            for (const item of pendientes) {
              if (!guardadas.has(item.place_id)) {
                try {
                  await onRegistrar(item);
                  setGuardadas(prev => new Set(prev).add(item.place_id));
                } catch { /* continuar con la siguiente */ }
              }
            }
            setGuardandoTodo(false);
          };

          return (
            <FlatList
              data={visibles}
              keyExtractor={i => i.place_id}
              contentContainerStyle={{ padding: 12 }}
              ListHeaderComponent={
                <View style={{ marginBottom: 10 }}>
                  <Text style={pros.totalText}>
                    {visibles.length} resultados en {distrito}
                    {guardadas.size > 0 ? `  ·  ✅ ${guardadas.size} guardadas` : ''}
                  </Text>
                  {pendientes.length > 1 && (
                    <TouchableOpacity
                      style={pros.btnGuardarTodas}
                      onPress={guardarTodas}
                      disabled={guardandoTodo || registrando !== null}
                    >
                      {guardandoTodo
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={pros.btnGuardarTodasText}>
                            ⬇ Guardar todas ({pendientes.length})
                          </Text>
                      }
                    </TouchableOpacity>
                  )}
                </View>
              }
              renderItem={({ item }) => {
                const yaGuardada  = guardadas.has(item.place_id);
                const estaGuardando = registrando === item.place_id;
                return (
                  <View style={[pros.card, yaGuardada && pros.cardGuardada]}>
                    {/* Botón descartar */}
                    <TouchableOpacity
                      style={pros.btnDescartar}
                      onPress={() => setDescartadas(prev => new Set(prev).add(item.place_id))}
                    >
                      <Text style={pros.btnDescartarText}>✕</Text>
                    </TouchableOpacity>

                    <View style={pros.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={pros.cardNombre} numberOfLines={1}>{item.nombre}</Text>
                        <Text style={pros.cardDir} numberOfLines={2}>{item.direccion}</Text>
                      </View>
                      {item.calificacion ? (
                        <View style={pros.rating}>
                          <Text style={pros.ratingText}>★ {item.calificacion}</Text>
                        </View>
                      ) : null}
                    </View>
                    {item.telefono ? <Text style={pros.cardTel}>📞 {item.telefono}</Text> : null}
                    {item.web ? <Text style={pros.cardWeb} numberOfLines={1}>🌐 {item.web}</Text> : null}

                    {yaGuardada ? (
                      <View style={pros.badgeGuardada}>
                        <Text style={pros.badgeGuardadaText}>✅ Guardada en marketplace</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[pros.btnRegistrar, estaGuardando && { opacity: 0.6 }]}
                        disabled={registrando !== null || guardandoTodo}
                        onPress={() => guardarUna(item)}
                      >
                        {estaGuardando
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={pros.btnRegistrarText}>+ Guardar en Marketplace</Text>
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
          );
        })()}
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  MODAL RECLAMACIONES
// ─────────────────────────────────────────────────────────────
type Reclamacion = {
  id: string; numero: number; fecha: string; tipo: string;
  nombres: string; dni: string; telefono: string; email: string;
  bien_servicio: string; monto: string; descripcion: string;
  pedido: string; estado: string; respuesta: string;
};

const ESTADO_COLOR: Record<string, string> = {
  pendiente:  '#E67E22',
  en_proceso: '#3498DB',
  resuelto:   '#27AE60',
  cerrado:    '#AAA',
};

function ReclamacionesModal({ visible, token, onClose }: { visible: boolean; token: string; onClose: () => void }) {
  const [lista,     setLista]     = useState<Reclamacion[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [selected,  setSelected]  = useState<Reclamacion | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [estado,    setEstado]    = useState('resuelto');
  const [saving,    setSaving]    = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(API.saReclamaciones, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.ok) setLista(json.data);
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (visible) cargar(); }, [visible, cargar]);

  const responder = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(API.saReclamacion(selected.id), {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ estado, respuesta }),
      });
      Alert.alert('Guardado', 'Respuesta registrada correctamente');
      setSelected(null);
      cargar();
    } catch { Alert.alert('Error', 'No se pudo guardar'); }
    finally { setSaving(false); }
  };

  const estadoLabel = (e: string) => ({
    pendiente: '⏳ Pendiente', en_proceso: '🔄 En proceso',
    resuelto: '✅ Resuelto',  cerrado: '🔒 Cerrado',
  }[e] ?? e);

  if (selected) {
    return (
      <Modal visible animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={rec.root}>
          <View style={rec.header}>
            <TouchableOpacity onPress={() => setSelected(null)} style={rec.backBtn}>
              <Text style={rec.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={rec.headerTitle}>Reclamo N° {selected.numero}</Text>
            <TouchableOpacity style={rec.saveBtn} onPress={responder} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={rec.saveText}>Guardar</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={rec.scroll} keyboardShouldPersistTaps="handled">
            <View style={rec.filaInfo}>
              <Text style={rec.infoLabel}>Tipo</Text>
              <Text style={[rec.tipoBadge, { backgroundColor: selected.tipo === 'reclamo' ? '#E74C3C' : '#E67E22' }]}>
                {selected.tipo.toUpperCase()}
              </Text>
            </View>
            <View style={rec.filaInfo}>
              <Text style={rec.infoLabel}>Fecha</Text>
              <Text style={rec.infoVal}>{new Date(selected.fecha).toLocaleDateString('es-PE')}</Text>
            </View>
            <View style={rec.filaInfo}>
              <Text style={rec.infoLabel}>Consumidor</Text>
              <Text style={rec.infoVal}>{selected.nombres}</Text>
            </View>
            <View style={rec.filaInfo}>
              <Text style={rec.infoLabel}>DNI</Text>
              <Text style={rec.infoVal}>{selected.dni}</Text>
            </View>
            {selected.telefono ? <View style={rec.filaInfo}>
              <Text style={rec.infoLabel}>Teléfono</Text>
              <Text style={rec.infoVal}>{selected.telefono}</Text>
            </View> : null}
            {selected.email ? <View style={rec.filaInfo}>
              <Text style={rec.infoLabel}>Email</Text>
              <Text style={rec.infoVal}>{selected.email}</Text>
            </View> : null}
            <View style={rec.filaInfo}>
              <Text style={rec.infoLabel}>Bien/Servicio</Text>
              <Text style={rec.infoVal}>{selected.bien_servicio}</Text>
            </View>
            {selected.monto ? <View style={rec.filaInfo}>
              <Text style={rec.infoLabel}>Monto</Text>
              <Text style={rec.infoVal}>S/ {selected.monto}</Text>
            </View> : null}

            <Text style={rec.section}>Descripción</Text>
            <View style={rec.textBox}><Text style={rec.textBoxText}>{selected.descripcion}</Text></View>

            <Text style={rec.section}>Pedido del consumidor</Text>
            <View style={rec.textBox}><Text style={rec.textBoxText}>{selected.pedido}</Text></View>

            <Text style={rec.section}>Respuesta</Text>
            <View style={rec.estadoRow}>
              {['pendiente','en_proceso','resuelto','cerrado'].map(e => (
                <TouchableOpacity
                  key={e}
                  style={[rec.estadoBtn, estado === e && { backgroundColor: ESTADO_COLOR[e] }]}
                  onPress={() => setEstado(e)}
                >
                  <Text style={[rec.estadoBtnText, estado === e && { color: '#fff' }]}>
                    {estadoLabel(e)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[rec.input, { height: 100, textAlignVertical: 'top' }]}
              value={respuesta}
              onChangeText={setRespuesta}
              placeholder="Escribe la respuesta al consumidor..."
              placeholderTextColor="#AAA"
              multiline
            />
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={rec.root}>
        <View style={rec.header}>
          <TouchableOpacity onPress={onClose} style={rec.backBtn}>
            <Text style={rec.backText}>← Cerrar</Text>
          </TouchableOpacity>
          <Text style={rec.headerTitle}>📋 Reclamaciones</Text>
          <TouchableOpacity onPress={cargar} style={rec.saveBtn}>
            <Text style={rec.saveText}>↻</Text>
          </TouchableOpacity>
        </View>

        {loading
          ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          : lista.length === 0
            ? <View style={rec.empty}><Text style={rec.emptyText}>No hay reclamaciones registradas</Text></View>
            : <FlatList
                data={lista}
                keyExtractor={i => i.id}
                contentContainerStyle={{ padding: 12 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={rec.card} onPress={() => { setSelected(item); setRespuesta(item.respuesta || ''); setEstado(item.estado || 'pendiente'); }}>
                    <View style={rec.cardTop}>
                      <View style={[rec.tipoBadge, { backgroundColor: item.tipo === 'reclamo' ? '#E74C3C' : '#E67E22' }]}>
                        <Text style={rec.tipoBadgeText}>{item.tipo.toUpperCase()}</Text>
                      </View>
                      <Text style={rec.cardNum}>N° {item.numero}</Text>
                      <View style={[rec.estadoPill, { backgroundColor: ESTADO_COLOR[item.estado] + '25', borderColor: ESTADO_COLOR[item.estado] }]}>
                        <Text style={[rec.estadoPillText, { color: ESTADO_COLOR[item.estado] }]}>{estadoLabel(item.estado)}</Text>
                      </View>
                    </View>
                    <Text style={rec.cardNombre}>{item.nombres} · DNI {item.dni}</Text>
                    <Text style={rec.cardBien} numberOfLines={1}>{item.bien_servicio}</Text>
                    <Text style={rec.cardDesc} numberOfLines={2}>{item.descripcion}</Text>
                    <Text style={rec.cardFecha}>{new Date(item.fecha).toLocaleDateString('es-PE')}</Text>
                  </TouchableOpacity>
                )}
              />
        }
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  TARJETA DE TIENDA
// ─────────────────────────────────────────────────────────────
function TiendaRow({
  item, token, onEdit, onDelete, onRefresh,
}: { item: Tienda; token: string; onEdit: (t: Tienda) => void; onDelete: (t: Tienda) => void; onRefresh: () => void }) {
  const isPremium = item.plan_nombre === 'premium';

  const handleVerificar = () => {
    if (item.verificada) {
      Alert.alert('Quitar verificación', `¿Quitar el badge ✓ de "${item.nombre}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar', style: 'destructive',
          onPress: async () => {
            await fetch(API.saTienda(item.id), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ verificada: false }),
            });
            onRefresh();
          }
        }
      ]);
      return;
    }
    Alert.alert(
      '✓ Verificar tienda',
      `¿Verificar "${item.nombre}"?\n\nConfirma que el establecimiento pagó S/80 por el badge verificado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '✓ Confirmar verificación',
          onPress: async () => {
            try {
              const res = await fetch(API.saTienda(item.id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ verificada: true }),
              });
              const json = await res.json();
              if (!json.ok) throw new Error(json.error);
              Alert.alert('Verificada', `✓ ${item.nombre} ahora tiene badge verificado`);
              onRefresh();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[card.wrap, isPremium && card.wrapPremium, !item.activa && card.wrapInactiva]}>
      <View style={card.left}>
        <View style={[card.avatar, isPremium && card.avatarPremium]}>
          <Text style={[card.avatarText, isPremium && card.avatarTextPremium]}>
            {isPremium ? '★' : item.nombre.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={card.body}>
        <Text style={card.nombre} numberOfLines={1}>{item.nombre}</Text>
        <Text style={card.sub}>{item.distrito}</Text>
        <View style={card.pills}>
          <View style={[card.pill, isPremium ? card.pillPremium : card.pillGratis]}>
            <Text style={[card.pillText, isPremium && card.pillTextPremium]}>
              {item.plan_nombre || 'gratis'}
            </Text>
          </View>
          {item.verificada && (
            <View style={[card.pill, { backgroundColor: '#EBF5FB' }]}>
              <Text style={[card.pillText, { color: COLORS.verified }]}>✓ verificada</Text>
            </View>
          )}
          {!item.activa && (
            <View style={[card.pill, { backgroundColor: '#FDEDEC' }]}>
              <Text style={[card.pillText, { color: '#E74C3C' }]}>inactiva</Text>
            </View>
          )}
        </View>
      </View>
      <View style={card.actions}>
        {/* Botón verificar rápido */}
        <TouchableOpacity
          style={[card.btnVerif, item.verificada && card.btnVerifActivo]}
          onPress={handleVerificar}
        >
          <Text style={[card.btnVerifText, item.verificada && { color: COLORS.verified }]}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={card.btnEdit} onPress={() => onEdit(item)}>
          <Text style={card.btnEditText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={card.btnDel} onPress={() => onDelete(item)}>
          <Text style={card.btnDelText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  HEADER SUPERADMIN
// ─────────────────────────────────────────────────────────────
type FiltroType = 'todas' | 'sin_verificar' | 'verificadas';

type TiendaPendiente = {
  id: string; nombre: string; distrito: string; telefono: string;
  email: string; descripcion: string; created_at: string;
};

type HeaderSAProps = {
  resumen: Resumen | null;
  query: string;
  onChangeQuery: (v: string) => void;
  onBuscar: () => void;
  onNueva: () => void;
  onReclamaciones: () => void;
  onProspectar: () => void;
  filtro: FiltroType;
  onFiltro: (f: FiltroType) => void;
  pendientes: TiendaPendiente[];
  token: string;
  onRefresh: () => void;
};

function HeaderSA({ resumen, query, onChangeQuery, onBuscar, onNueva, onReclamaciones, onProspectar, filtro, onFiltro, pendientes, token, onRefresh }: HeaderSAProps) {

  const aprobar = (p: TiendaPendiente) => {
    Alert.alert('✅ Aprobar tienda', `¿Aprobar "${p.nombre}"?\nAparecerá en el marketplace.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aprobar', onPress: async () => {
        try {
          const r = await fetch(API.saAprobar(p.id), { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
          const j = await r.json();
          if (!j.ok) throw new Error(j.error);
          Alert.alert('Aprobada', `"${p.nombre}" ya aparece en el marketplace`);
          onRefresh();
        } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const rechazar = (p: TiendaPendiente) => {
    Alert.alert('❌ Rechazar tienda', `¿Rechazar "${p.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rechazar', style: 'destructive', onPress: async () => {
        try {
          const r = await fetch(API.saRechazar(p.id), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ motivo: 'No cumple los requisitos' }),
          });
          const j = await r.json();
          if (!j.ok) throw new Error(j.error);
          Alert.alert('Rechazada', `"${p.nombre}" fue rechazada`);
          onRefresh();
        } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };
  return (
    <View>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <View style={styles.logoCircle}><Text style={styles.logoText}>SA</Text></View>
          <View>
            <Text style={styles.topTitle}>SUPER ADMIN</Text>
            <Text style={styles.topSub}>Marketplace del Acero</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      {resumen && (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{resumen.total_tiendas}</Text>
              <Text style={styles.statLabel}>Tiendas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: COLORS.gold }]}>{resumen.tiendas_premium}</Text>
              <Text style={styles.statLabel}>Premium</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: COLORS.success }]}>{resumen.tiendas_activas}</Text>
              <Text style={styles.statLabel}>Activas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#8E44AD' }]}>{resumen.visitas_mes ?? 0}</Text>
              <Text style={styles.statLabel}>Visitas/mes</Text>
            </View>
          </View>

          {/* Top tiendas */}
          {resumen.top_tiendas?.length > 0 && (
            <View style={styles.topWrap}>
              <Text style={styles.topTitulo}>🔥 Top tiendas este mes</Text>
              {resumen.top_tiendas.map((t, i) => (
                <View key={i} style={styles.topFila}>
                  <Text style={styles.topPos}>#{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topNombre} numberOfLines={1}>{t.nombre}</Text>
                    <Text style={styles.topDistrito}>{t.distrito}</Text>
                  </View>
                  <Text style={styles.topVisitas}>{t.total} visitas</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Buscador + botón nueva */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o distrito..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={onChangeQuery}
          onSubmitEditing={onBuscar}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          submitBehavior="submit"
        />
        <TouchableOpacity style={styles.btnBuscar} onPress={onBuscar}>
          <Text style={styles.btnBuscarText}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnNueva} onPress={onNueva}>
          <Text style={styles.btnNuevaText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Acceso rápido a módulos */}
      <View style={styles.modulosRow}>
        <TouchableOpacity
          style={styles.moduloBtn}
          onPress={() => router.push('/screens/superadmin/banners')}
        >
          <Text style={styles.moduloIcono}>📢</Text>
          <Text style={styles.moduloLabel}>Banners{'\n'}Publicidad</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.moduloBtn, { borderColor: '#E74C3C' }]}
          onPress={onReclamaciones}
        >
          <Text style={styles.moduloIcono}>📋</Text>
          <Text style={styles.moduloLabel}>Libro de{'\n'}Reclamos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.moduloBtn, { borderColor: '#27AE60' }]}
          onPress={onProspectar}
        >
          <Text style={styles.moduloIcono}>🔍</Text>
          <Text style={styles.moduloLabel}>Prospectar{'\n'}Tiendas</Text>
        </TouchableOpacity>
      </View>

      {/* Alertas de vencimiento */}
      {resumen && (resumen.vencidas?.length > 0 || resumen.por_vencer?.length > 0) && (
        <View style={styles.alertasWrap}>
          {resumen.vencidas?.length > 0 && (
            <>
              <View style={styles.alertaHeader}>
                <Text style={styles.alertaHeaderText}>🔴 Planes VENCIDOS ({resumen.vencidas.length})</Text>
              </View>
              {resumen.vencidas.map(t => (
                <View key={t.id} style={[styles.alertaFila, styles.alertaFilaRoja]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertaNombre} numberOfLines={1}>{t.nombre}</Text>
                    <Text style={styles.alertaSub}>{t.distrito} · {t.plan_nombre}</Text>
                  </View>
                  <View style={styles.alertaBadgeRojo}>
                    <Text style={styles.alertaBadgeText}>Vencido hace {t.dias_vencido}d</Text>
                  </View>
                </View>
              ))}
            </>
          )}
          {resumen.por_vencer?.length > 0 && (
            <>
              <View style={[styles.alertaHeader, { backgroundColor: '#FEF9E7' }]}>
                <Text style={[styles.alertaHeaderText, { color: '#B7950B' }]}>⚠️ Vencen pronto ({resumen.por_vencer.length})</Text>
              </View>
              {resumen.por_vencer.map(t => (
                <View key={t.id} style={[styles.alertaFila, styles.alertaFilaAmarilla]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertaNombre} numberOfLines={1}>{t.nombre}</Text>
                    <Text style={styles.alertaSub}>{t.distrito} · {t.plan_nombre}</Text>
                  </View>
                  <View style={styles.alertaBadgeAmarillo}>
                    <Text style={[styles.alertaBadgeText, { color: '#7D6608' }]}>
                      {t.dias_restantes === 0 ? 'Hoy' : `${t.dias_restantes}d`}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {/* ── Tiendas pendientes de aprobación ── */}
      {pendientes.length > 0 && (
        <View style={styles.pendientesWrap}>
          <View style={styles.pendientesHeader}>
            <Text style={styles.pendientesHeaderText}>🔔 Solicitudes pendientes ({pendientes.length})</Text>
          </View>
          {pendientes.map(p => (
            <View key={p.id} style={styles.pendienteFila}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendienteNombre} numberOfLines={1}>{p.nombre}</Text>
                <Text style={styles.pendienteSub}>{p.distrito} · {p.telefono}</Text>
              </View>
              <TouchableOpacity style={styles.btnAprobar} onPress={() => aprobar(p)}>
                <Text style={styles.btnAprobarText}>✓ Aprobar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnRechazar} onPress={() => rechazar(p)}>
                <Text style={styles.btnRechazarText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Tabs filtro */}
      <View style={styles.tabsRow}>
        {(['todas', 'sin_verificar', 'verificadas'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, filtro === tab && styles.tabBtnActive]}
            onPress={() => onFiltro(tab)}
          >
            <Text style={[styles.tabText, filtro === tab && styles.tabTextActive]}>
              {tab === 'todas' ? 'Todas'
                : tab === 'sin_verificar' ? '⏳ Sin verificar'
                : '✓ Verificadas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.seccionLabel}>
        {filtro === 'sin_verificar' ? 'Sin verificar — contactar para cobrar S/80'
          : filtro === 'verificadas' ? 'Tiendas verificadas activas'
          : 'Todas las tiendas'}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  PANEL DE CONTROL DEL TRIAL
// ─────────────────────────────────────────────────────────────
function TrialConfigPanel({ token }: { token: string }) {
  const [trialActivo,  setTrialActivo]  = useState(true);
  const [trialHasta,   setTrialHasta]   = useState('');
  const [whatsapp,     setWhatsapp]     = useState('');
  const [mensaje,      setMensaje]      = useState('');
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [showConfig,   setShowConfig]   = useState(false);

  useEffect(() => {
    fetch(API.appConfig)
      .then(r => r.json())
      .then(j => {
        if (j.ok) {
          setTrialActivo(j.data.trial_activo === 'true');
          setTrialHasta(j.data.trial_until || '');
          setWhatsapp(j.data.contacto_whatsapp || '');
          setMensaje(j.data.trial_mensaje || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const guardar = async () => {
    setSaving(true);
    try {
      const res = await fetch(API.appConfig, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          trial_activo:      trialActivo ? 'true' : 'false',
          trial_until:       trialHasta,
          contacto_whatsapp: whatsapp,
          trial_mensaje:     mensaje,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      if (Platform.OS === 'web') (window as any).alert('✅ Configuración guardada');
      else Alert.alert('✅ Guardado', 'Configuración actualizada');
    } catch (err: any) {
      if (Platform.OS === 'web') (window as any).alert('Error: ' + err.message);
      else Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Días restantes
  const diasRestantes = (() => {
    if (!trialHasta) return null;
    const diff = Math.ceil((new Date(trialHasta + 'T23:59:59').getTime() - Date.now()) / 86400000);
    return diff;
  })();

  return (
    <View style={cfg.wrap}>
      {/* Header colapsable */}
      <TouchableOpacity style={cfg.header} onPress={() => setShowConfig(s => !s)}>
        <View style={cfg.headerLeft}>
          <Text style={cfg.headerIcon}>⚙️</Text>
          <View>
            <Text style={cfg.headerTitle}>Control de Demo / Trial</Text>
            {!loading && (
              <Text style={cfg.headerSub}>
                {trialActivo
                  ? diasRestantes !== null
                    ? diasRestantes > 0
                      ? `🟢 Activo · ${diasRestantes}d restantes`
                      : '🔴 VENCIDO'
                    : '🟢 Sin fecha límite'
                  : '⚪ Trial desactivado'}
              </Text>
            )}
          </View>
        </View>
        <Text style={cfg.headerChevron}>{showConfig ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showConfig && !loading && (
        <View style={cfg.body}>
          {/* Toggle trial */}
          <View style={cfg.row}>
            <Text style={cfg.label}>Trial activo</Text>
            <Switch
              value={trialActivo}
              onValueChange={setTrialActivo}
              trackColor={{ true: '#E74C3C', false: '#AAA' }}
            />
          </View>
          <Text style={cfg.hint}>
            {trialActivo ? 'App se bloquea al vencer la fecha' : 'App disponible sin restricciones'}
          </Text>

          {/* Fecha vencimiento */}
          <Text style={cfg.label}>Fecha de vencimiento (AAAA-MM-DD)</Text>
          <TextInput
            style={cfg.input}
            value={trialHasta}
            onChangeText={setTrialHasta}
            placeholder="Ej: 2026-04-26"
            placeholderTextColor="#AAA"
            keyboardType="numeric"
          />
          {trialHasta ? (
            <Text style={[cfg.hint, { color: diasRestantes !== null && diasRestantes <= 0 ? '#E74C3C' : '#27AE60' }]}>
              {diasRestantes !== null && diasRestantes > 0
                ? `✅ Quedan ${diasRestantes} días`
                : diasRestantes === 0
                ? '⚠️ Vence hoy'
                : `🔴 Venció hace ${Math.abs(diasRestantes ?? 0)} días`}
            </Text>
          ) : null}

          {/* WhatsApp */}
          <Text style={cfg.label}>WhatsApp de contacto (sin + ni espacios)</Text>
          <TextInput
            style={cfg.input}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="51987654321"
            placeholderTextColor="#AAA"
            keyboardType="phone-pad"
          />

          {/* Mensaje */}
          <Text style={cfg.label}>Mensaje al cliente cuando vence</Text>
          <TextInput
            style={[cfg.input, { height: 70, textAlignVertical: 'top' }]}
            value={mensaje}
            onChangeText={setMensaje}
            multiline
            placeholder="El período de prueba ha concluido..."
            placeholderTextColor="#AAA"
          />

          <TouchableOpacity style={cfg.btnGuardar} onPress={guardar} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={cfg.btnGuardarText}>💾 Guardar configuración</Text>
            }
          </TouchableOpacity>

          <Text style={cfg.nota}>
            Los cambios se aplican en el próximo reload de la app del cliente.
          </Text>
        </View>
      )}

    </View>
  );
}

const cfg = StyleSheet.create({
  wrap:         { marginTop: 8, marginBottom: 24 },
  header:       { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2, marginBottom: 2 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon:   { fontSize: 24 },
  headerTitle:  { fontSize: 14, fontWeight: '800', color: COLORS.secondary },
  headerSub:    { fontSize: 11, color: '#888', marginTop: 2 },
  headerChevron:{ fontSize: 14, color: '#AAA' },
  body:         { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2, gap: 4 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label:        { fontSize: 12, fontWeight: '700', color: '#555', marginTop: 10, marginBottom: 4 },
  hint:         { fontSize: 11, color: '#888', marginBottom: 6 },
  input:        { backgroundColor: '#F5F5F5', borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1a1a1a', marginBottom: 4 },
  btnGuardar:   { backgroundColor: COLORS.secondary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 14 },
  btnGuardarText:{ color: '#fff', fontWeight: '800', fontSize: 14 },
  nota:         { fontSize: 11, color: '#AAA', textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
});

// ─────────────────────────────────────────────────────────────
//  SUPERADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [token,       setToken]       = useState('');
  const [tiendas,     setTiendas]     = useState<Tienda[]>([]);
  const [resumen,     setResumen]     = useState<Resumen | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [query,       setQuery]       = useState('');
  const [filtro,      setFiltro]      = useState<FiltroType>('todas');
  const [editTienda,  setEditTienda]  = useState<Tienda | null>(null);
  const [showEdit,    setShowEdit]    = useState(false);
  const [showNueva,   setShowNueva]   = useState(false);
  const [showReclam,  setShowReclam]  = useState(false);
  const [showProsp,   setShowProsp]   = useState(false);
  const [pendientes,  setPendientes]  = useState<TiendaPendiente[]>([]);

  const tiendasFiltradas = tiendas.filter(t => {
    if (filtro === 'sin_verificar') return !t.verificada;
    if (filtro === 'verificadas')   return t.verificada;
    return true;
  });

  const cargar = useCallback(async (tk: string, q = '') => {
    try {
      const url = q.trim() ? `${API.saTiendas}?q=${encodeURIComponent(q)}` : API.saTiendas;
      const [rTiendas, rResumen] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${tk}` } }),
        fetch(API.saResumen, { headers: { Authorization: `Bearer ${tk}` } }),
      ]);
      // Si el servidor rechaza el token, redirigir al login
      if (rTiendas.status === 401 || rTiendas.status === 403) {
        await AsyncStorage.removeItem('token');
        router.replace('/screens/login');
        return;
      }
      const rPend = await fetch(API.saPendientes, { headers: { Authorization: `Bearer ${tk}` } });
      const [jT, jR, jP] = await Promise.all([rTiendas.json(), rResumen.json(), rPend.json()]);
      if (jT.ok) setTiendas(jT.data);
      else Alert.alert('Error', jT.error || 'No se pudieron cargar las tiendas');
      if (jR.ok) setResumen(jR.data);
      if (jP.ok) setPendientes(jP.data);
    } catch (err: any) {
      Alert.alert('Error de conexión', 'Verifica que el servidor esté activo y actualiza la URL del túnel en api.ts');
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

  const handleBuscar = useCallback(() => cargar(token, query), [token, query, cargar]);

  const handleEdit = useCallback((t: Tienda) => {
    setEditTienda(t);
    setShowEdit(true);
  }, []);

  const handleDelete = useCallback((t: Tienda) => {
    Alert.alert(
      'Desactivar tienda',
      `¿Desactivar "${t.nombre}"? La tienda no aparecerá en el mapa ni en búsquedas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(API.saTienda(t.id), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              const json = await res.json();
              if (!json.ok) throw new Error(json.error);
              cargar(token, query);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  }, [token, query, cargar]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'usuario', 'nombre']);
    // setTimeout garantiza que la navegación ocurre después del ciclo actual
    // router.replace funciona tanto en web como en móvil con Expo Router
    setTimeout(() => router.replace('/screens/login'), 50);
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando panel...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F2' }}>
      <FlatList
        data={tiendasFiltradas}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        ListHeaderComponent={
          <HeaderSA
            resumen={resumen}
            query={query}
            onChangeQuery={setQuery}
            onBuscar={handleBuscar}
            onNueva={() => setShowNueva(true)}
            onReclamaciones={() => setShowReclam(true)}
            onProspectar={() => setShowProsp(true)}
            filtro={filtro}
            onFiltro={setFiltro}
            pendientes={pendientes}
            token={token}
            onRefresh={() => cargar(token, query)}
          />
        }
        renderItem={({ item }) => (
          <TiendaRow
            item={item}
            token={token}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={() => cargar(token, query)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏭</Text>
            <Text style={styles.emptyText}>No se encontraron tiendas</Text>
          </View>
        }
        ListFooterComponent={
          <TrialConfigPanel token={token} />
        }
      />

      <EditModal
        visible={showEdit}
        tienda={editTienda}
        token={token}
        onClose={() => setShowEdit(false)}
        onSaved={() => cargar(token, query)}
      />

      <NuevaModal
        visible={showNueva}
        token={token}
        onClose={() => setShowNueva(false)}
        onSaved={() => cargar(token)}
      />

      <ReclamacionesModal
        visible={showReclam}
        token={token}
        onClose={() => setShowReclam(false)}
      />

      {/* Logout FUERA del FlatList para evitar problemas de eventos en web */}
      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Text style={styles.btnLogoutText}>↩ Cerrar sesión</Text>
      </TouchableOpacity>

      <ProspeccionModal
        visible={showProsp}
        token={token}
        onClose={() => setShowProsp(false)}
        onRegistrar={async (p) => {
          let res: Response;
          try {
            res = await fetch(API.saTiendas, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                nombre:    p.nombre,
                distrito:  p.distrito,
                telefono:  (p.telefono || '').replace(/[\s+]/g, '').replace('51', ''),
                direccion: p.direccion,
                latitud:   p.lat,
                longitud:  p.lng,
                horario:   p.horario || 'Lun-Sab 8am-6pm',
              }),
            });
          } catch {
            throw new Error('Sin conexión con el servidor. Verifica que el túnel Cloudflare esté activo y actualiza API_BASE en constants/api.ts');
          }
          // Error HTTP (401, 403, 500...)
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              throw new Error('Sesión expirada — vuelve a iniciar sesión');
            }
            throw new Error(`Error del servidor (${res.status})`);
          }
          const json = await res.json();
          if (!json.ok) throw new Error(json.error || 'Error al registrar la tienda');
          // Éxito
          // No cerramos el modal — el modal marca la tienda como guardada
          // Recargamos la lista de tiendas en background
          cargar(token);
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  ESTILOS
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { padding: 12, backgroundColor: '#F2F2F2', flexGrow: 1 },
  loadingWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F2', gap: 12 },
  loadingText:  { color: '#888', fontSize: 14 },

  // Top bar
  topBar:       { backgroundColor: COLORS.secondary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 14, marginHorizontal: -12, marginTop: -12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle:   { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  logoText:     { color: '#fff', fontSize: 16, fontWeight: '900' },
  topTitle:     { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  topSub:       { color: 'rgba(255,255,255,0.5)', fontSize: 10 },

  // Stats
  statsRow:     { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statBox:      { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  statNum:      { fontSize: 22, fontWeight: '900', color: COLORS.secondary },
  statLabel:    { fontSize: 10, color: '#AAA', fontWeight: '600', marginTop: 2 },

  // Search
  searchRow:    { flexDirection: 'row', gap: 8, marginBottom: 14 },
  searchInput:  { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, fontSize: 14, color: '#1a1a1a', borderWidth: 1.5, borderColor: '#E0E0E0' },
  btnBuscar:    { backgroundColor: COLORS.secondary, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  btnBuscarText:{ fontSize: 16 },
  btnNueva:     { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  btnNuevaText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  modulosRow:   { flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
  moduloBtn:    { flex: 1, minWidth: 90, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', elevation: 2, gap: 6 },
  moduloIcono:  { fontSize: 28 },
  moduloLabel:  { fontSize: 11, fontWeight: '700', color: COLORS.secondary, textAlign: 'center' },
  topWrap:      { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, elevation: 2 },
  topTitulo:    { fontSize: 13, fontWeight: '800', color: COLORS.secondary, marginBottom: 10 },
  topFila:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  topPos:       { fontSize: 16, fontWeight: '900', color: COLORS.primary, width: 28 },
  topNombre:    { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  topDistrito:  { fontSize: 11, color: '#AAA' },
  topVisitas:   { fontSize: 13, fontWeight: '800', color: '#8E44AD' },
  tabsRow:      { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn:       { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 9, alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E0E0' },
  tabBtnActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  tabText:      { fontSize: 11, fontWeight: '700', color: '#888' },
  tabTextActive:{ color: '#fff' },
  seccionLabel:       { fontSize: 11, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  alertasWrap:        { marginHorizontal: 12, marginBottom: 8, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#EBEBEB' },
  alertaHeader:       { backgroundColor: '#FDEDEC', paddingHorizontal: 12, paddingVertical: 8 },
  alertaHeaderText:   { fontSize: 12, fontWeight: '800', color: '#C0392B' },
  alertaFila:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  alertaFilaRoja:     { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#FADBD8' },
  alertaFilaAmarilla: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#FDEBD0' },
  alertaNombre:       { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  alertaSub:          { fontSize: 11, color: '#888', marginTop: 1 },
  alertaBadgeRojo:    { backgroundColor: '#FADBD8', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  alertaBadgeAmarillo:{ backgroundColor: '#FEF9E7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  alertaBadgeText:    { fontSize: 11, fontWeight: '800', color: '#C0392B' },

  // Pendientes
  pendientesWrap:       { backgroundColor: '#FFF3CD', borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#F0B429' },
  pendientesHeader:     { backgroundColor: '#F0B429', padding: 10 },
  pendientesHeaderText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  pendienteFila:        { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#F0B42930', gap: 8 },
  pendienteNombre:      { fontSize: 13, fontWeight: '700', color: '#1C2833' },
  pendienteSub:         { fontSize: 11, color: '#666', marginTop: 2 },
  btnAprobar:           { backgroundColor: '#27AE60', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  btnAprobarText:       { color: '#fff', fontWeight: '800', fontSize: 12 },
  btnRechazar:          { backgroundColor: '#E74C3C', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  btnRechazarText:      { color: '#fff', fontWeight: '800', fontSize: 12 },

  // Empty
  emptyBox:     { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyIcon:    { fontSize: 40 },
  emptyText:    { color: '#AAA', fontSize: 14 },

  // Logout — fijo fuera del FlatList
  btnLogout:    { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FDEDEC', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FADBD8' },
  btnLogoutText:{ color: '#E74C3C', fontWeight: '700', fontSize: 14 },
});

const card = StyleSheet.create({
  wrap:           { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2, gap: 10 },
  wrapPremium:    { borderWidth: 1.5, borderColor: COLORS.gold, backgroundColor: '#FFFDE7' },
  wrapInactiva:   { opacity: 0.55 },
  left:           { },
  avatar:         { width: 44, height: 44, borderRadius: 10, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  avatarPremium:  { backgroundColor: COLORS.gold },
  avatarText:     { color: '#fff', fontSize: 18, fontWeight: '900' },
  avatarTextPremium: { color: COLORS.secondary },
  body:           { flex: 1, gap: 3 },
  nombre:         { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  sub:            { fontSize: 12, color: '#888' },
  pills:          { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  pill:           { backgroundColor: '#F2F2F2', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  pillPremium:    { backgroundColor: '#FFF9C4' },
  pillGratis:     { backgroundColor: '#F2F2F2' },
  pillText:       { fontSize: 10, fontWeight: '600', color: '#888' },
  pillTextPremium:{ color: '#B7950B' },
  actions:        { gap: 8 },
  btnVerif:       { backgroundColor: '#F2F2F2', borderRadius: 8, padding: 8, borderWidth: 1.5, borderColor: '#E0E0E0' },
  btnVerifActivo: { backgroundColor: '#EBF5FB', borderColor: COLORS.verified },
  btnVerifText:   { fontSize: 16, color: '#AAA', fontWeight: '900' },
  btnEdit:        { backgroundColor: '#EBF5FB', borderRadius: 8, padding: 8 },
  btnEditText:    { fontSize: 16 },
  btnDel:         { backgroundColor: '#FDEDEC', borderRadius: 8, padding: 8 },
  btnDelText:     { fontSize: 16 },
});

const modal = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#F2F2F2' },
  header:         { backgroundColor: COLORS.secondary, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:        { padding: 4 },
  backText:       { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerTitle:    { color: '#fff', fontSize: 16, fontWeight: '800' },
  saveBtn:        { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveText:       { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll:         { padding: 16 },
  section:        { fontSize: 11, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  label:          { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 5 },
  input:          { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: '#1a1a1a', marginBottom: 12 },
  switchRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  switchLabel:    { fontSize: 14, color: '#333', fontWeight: '600' },
  planRow:        { flexDirection: 'row', gap: 8 },
  planBtn:        { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', padding: 12, alignItems: 'center' },
  planBtnActive:  { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  planText:       { fontSize: 13, fontWeight: '700', color: '#888' },
  planTextActive: { color: '#fff' },
  hint:           { fontSize: 12, color: '#27AE60', fontWeight: '600', marginTop: -8, marginBottom: 12 },
});

const pros = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#F2F2F2' },
  header:         { backgroundColor: COLORS.secondary, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:        { padding: 4 },
  backText:       { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerTitle:    { color: '#fff', fontSize: 16, fontWeight: '800' },
  filtros:        { backgroundColor: '#fff', padding: 14, borderBottomWidth: 1, borderColor: '#EBEBEB' },
  label:          { fontSize: 11, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  distScroll:     { marginBottom: 4 },
  distBtn:        { backgroundColor: '#F2F2F2', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6, borderWidth: 1, borderColor: '#E0E0E0' },
  distBtnActive:  { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  distText:       { fontSize: 12, color: '#666', fontWeight: '600' },
  distTextActive: { color: '#fff' },
  searchRow:      { flexDirection: 'row', gap: 8, marginBottom: 6 },
  searchInput:    { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1a1a1a', borderWidth: 1.5, borderColor: '#E8E8E8' },
  btnBuscar:      { backgroundColor: '#27AE60', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  btnBuscarText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  hint:           { fontSize: 10, color: '#AAA', fontStyle: 'italic' },
  loadingWrap:    { alignItems: 'center', marginTop: 50, gap: 12 },
  loadingText:    { color: '#888', fontSize: 13 },
  empty:          { alignItems: 'center', marginTop: 50, gap: 8 },
  emptyText:      { color: '#555', fontSize: 14, fontWeight: '600' },
  emptySub:       { color: '#AAA', fontSize: 12 },
  totalText:      { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 6 },
  card:           { backgroundColor: '#fff', borderRadius: 12, padding: 14, paddingTop: 18, marginBottom: 10, borderWidth: 1, borderColor: '#EBEBEB', position: 'relative' },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardNombre:     { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  cardDir:        { fontSize: 11, color: '#888', marginTop: 2, lineHeight: 16 },
  cardTel:        { fontSize: 12, color: '#27AE60', fontWeight: '700', marginBottom: 3 },
  cardWeb:        { fontSize: 11, color: '#3498DB', marginBottom: 8 },
  rating:         { backgroundColor: '#FFF9C4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  ratingText:     { fontSize: 12, fontWeight: '800', color: '#B7950B' },
  btnGuardarTodas:     { backgroundColor: COLORS.primary, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 },
  btnGuardarTodasText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  btnRegistrar:        { backgroundColor: COLORS.secondary, borderRadius: 10, padding: 10, alignItems: 'center' },
  btnRegistrarText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnDescartar:        { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  btnDescartarText:    { fontSize: 11, color: '#888', fontWeight: '900' },
  cardGuardada:        { opacity: 0.7, borderWidth: 1.5, borderColor: '#27AE60' },
  badgeGuardada:       { backgroundColor: '#EAFAF1', borderRadius: 8, padding: 8, alignItems: 'center', marginTop: 6 },
  badgeGuardadaText:   { color: '#27AE60', fontWeight: '700', fontSize: 12 },
});

const rec = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#F2F2F2' },
  header:         { backgroundColor: COLORS.secondary, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:        { padding: 4 },
  backText:       { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerTitle:    { color: '#fff', fontSize: 16, fontWeight: '800' },
  saveBtn:        { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveText:       { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll:         { padding: 16 },
  empty:          { alignItems: 'center', marginTop: 60 },
  emptyText:      { color: '#AAA', fontSize: 14 },
  card:           { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EBEBEB' },
  cardTop:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardNum:        { fontSize: 12, fontWeight: '700', color: '#888', flex: 1 },
  cardNombre:     { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  cardBien:       { fontSize: 12, color: '#666', marginBottom: 4 },
  cardDesc:       { fontSize: 11, color: '#999', lineHeight: 16 },
  cardFecha:      { fontSize: 10, color: '#BBB', marginTop: 6 },
  tipoBadge:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tipoBadgeText:  { color: '#fff', fontSize: 9, fontWeight: '900' },
  estadoPill:     { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  estadoPillText: { fontSize: 10, fontWeight: '700' },
  section:        { fontSize: 11, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  filaInfo:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#F0F0F0' },
  infoLabel:      { fontSize: 12, color: '#999', fontWeight: '600' },
  infoVal:        { fontSize: 13, color: '#1a1a1a', fontWeight: '600', flex: 1, textAlign: 'right' },
  textBox:        { backgroundColor: '#F8F8F8', borderRadius: 10, padding: 12, marginBottom: 8 },
  textBoxText:    { fontSize: 13, color: '#333', lineHeight: 20 },
  estadoRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  estadoBtn:      { borderRadius: 8, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#fff' },
  estadoBtnText:  { fontSize: 11, fontWeight: '700', color: '#888' },
  input:          { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: '#1a1a1a', marginBottom: 12 },
});
