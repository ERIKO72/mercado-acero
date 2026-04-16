import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert,
  TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, COLORS } from '../../../constants/api';

interface Plan {
  plan_nombre: string;
  precio_mensual: number;
  max_productos: number;
  visible_mapa: boolean;
  destacada: boolean;
  tiene_banner: boolean;
  activa: boolean;
  fecha_fin: string | null;
}

const PLANES_INFO = [
  {
    nombre: 'Gratis',
    precio: 'S/ 0 / mes',
    color:  '#7f8c8d',
    beneficios: [
      'Visible en el mapa',
      'Hasta 5 productos',
      'Perfil basico',
    ],
  },
  {
    nombre: 'Basico',
    precio: 'S/ 49 / mes',
    color:  '#2980b9',
    beneficios: [
      'Todo lo de Gratis',
      'Hasta 20 productos',
      'Estadisticas de visitas',
      'Soporte prioritario',
    ],
  },
  {
    nombre: 'Premium',
    precio: 'S/ 99 / mes',
    color:  '#f39c12',
    beneficios: [
      'Todo lo de Basico',
      'Hasta 100 productos',
      'Tienda destacada en mapa (pin dorado)',
      'Badge Premium en listado',
      'Banner publicitario',
      'Posicion preferencial',
    ],
  },
];

export default function SubscriptionScreen() {
  const [plan, setPlan]         = useState<Plan | null>(null);
  const [loading, setLoading]   = useState(true);
  const [modalPlan, setModalPlan] = useState<(typeof PLANES_INFO)[0] | null>(null);

  const cargar = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res   = await fetch(API.adminPlan, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) setPlan(data.data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el plan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const onUpgradeExito = () => {
    setModalPlan(null);
    cargar(); // recargar plan actual
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadText}>Cargando plan...</Text>
      </View>
    );
  }

  const planActual = plan?.plan_nombre?.toLowerCase() || 'gratis';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Plan actual ── */}
      <View style={styles.planActualCard}>
        <Text style={styles.planActualLabel}>Tu plan actual</Text>
        <Text style={styles.planActualNombre}>{plan?.plan_nombre || 'Gratis'}</Text>
        <Text style={styles.planActualPrecio}>
          S/ {Number(plan?.precio_mensual || 0).toFixed(2)} / mes
        </Text>
        {plan?.fecha_fin && (
          <Text style={styles.planActualFecha}>
            Vence: {new Date(plan.fecha_fin).toLocaleDateString('es-PE')}
          </Text>
        )}
      </View>

      {/* ── Beneficios actuales ── */}
      <Text style={styles.seccion}>Beneficios incluidos</Text>
      <View style={styles.beneficiosCard}>
        <Beneficio texto="Visible en el mapa"           activo={plan?.visible_mapa !== false} />
        <Beneficio texto={`Hasta ${plan?.max_productos ?? 5} productos`} activo />
        <Beneficio texto="Pin dorado en el mapa"        activo={plan?.destacada === true} />
        <Beneficio texto="Badge Premium en listado"     activo={plan?.destacada === true} />
        <Beneficio texto="Banner publicitario"          activo={plan?.tiene_banner === true} />
      </View>

      {/* ── Planes disponibles ── */}
      <Text style={styles.seccion}>Planes disponibles</Text>
      {PLANES_INFO.map(p => {
        const esCurrent = planActual === p.nombre.toLowerCase();
        return (
          <View key={p.nombre} style={[styles.planCard, esCurrent && styles.planCardActivo]}>
            <View style={[styles.planBadge, { backgroundColor: p.color }]}>
              <Text style={styles.planBadgeTexto}>{p.nombre}</Text>
            </View>
            <Text style={styles.planPrecio}>{p.precio}</Text>
            {p.beneficios.map(b => (
              <Text key={b} style={styles.planBeneficio}>• {b}</Text>
            ))}
            {esCurrent
              ? (
                <View style={styles.btnPlanActual}>
                  <Text style={styles.btnPlanActualTexto}>Plan Actual</Text>
                </View>
              )
              : (
                <TouchableOpacity
                  style={[styles.btnUpgrade, { backgroundColor: p.color }]}
                  onPress={() => setModalPlan(p)}
                >
                  <Text style={styles.btnUpgradeTexto}>
                    {p.nombre === 'Gratis' ? 'Cambiar a Gratis' : `Contratar ${p.nombre}`}
                  </Text>
                </TouchableOpacity>
              )
            }
          </View>
        );
      })}

      {/* ── Modal de pago ── */}
      {modalPlan && (
        <ModalPago
          plan={modalPlan}
          onClose={() => setModalPlan(null)}
          onExito={onUpgradeExito}
        />
      )}
    </ScrollView>
  );
}

// ── Componente Beneficio ──────────────────────────────────────────────────────

function Beneficio({ texto, activo }: { texto: string; activo: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <View style={[{
        width: 20, height: 20, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
      }, { backgroundColor: activo ? COLORS.success : '#ddd' }]}>
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
          {activo ? '✓' : '✗'}
        </Text>
      </View>
      <Text style={{ fontSize: 14, color: activo ? COLORS.text : COLORS.textLight }}>{texto}</Text>
    </View>
  );
}

// ── Modal de Pago ─────────────────────────────────────────────────────────────

type ModalProps = {
  plan: (typeof PLANES_INFO)[0];
  onClose: () => void;
  onExito: () => void;
};

function ModalPago({ plan, onClose, onExito }: ModalProps) {
  const [numero,    setNumero]    = useState('');
  const [vence,     setVence]     = useState('');
  const [cvv,       setCvv]       = useState('');
  const [titular,   setTitular]   = useState('');
  const [procesando, setProcesando] = useState(false);

  // Formatear numero de tarjeta con espacios
  const formatCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  // Formatear vencimiento MM/AA
  const formatExp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  };

  const pagar = async () => {
    const cardDigits = numero.replace(/\s/g, '');
    if (cardDigits.length < 16) return Alert.alert('Error', 'Numero de tarjeta incompleto');
    if (vence.length < 5)       return Alert.alert('Error', 'Fecha de vencimiento invalida');
    if (cvv.length < 3)         return Alert.alert('Error', 'CVV invalido');
    if (!titular.trim())        return Alert.alert('Error', 'Ingresa el nombre del titular');

    setProcesando(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res   = await fetch(`${API.adminPlan}/upgrade`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ plan_nombre: plan.nombre }),
      });
      const data = await res.json();
      if (data.ok) {
        Alert.alert(
          '¡Pago exitoso!',
          `Tu tienda ahora tiene el plan ${plan.nombre}.\n${plan.nombre === 'Premium' ? 'Tu pin dorado ya es visible en el mapa.' : ''}`,
          [{ text: 'Genial', onPress: onExito }]
        );
      } else {
        Alert.alert('Error', data.error || 'No se pudo procesar el pago');
      }
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          {/* Cabecera */}
          <View style={[styles.modalHeader, { backgroundColor: plan.color }]}>
            <Text style={styles.modalHeaderPlan}>Plan {plan.nombre}</Text>
            <Text style={styles.modalHeaderPrecio}>{plan.precio}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSeccion}>Datos de tarjeta</Text>

            <Text style={styles.modalLabel}>Numero de tarjeta</Text>
            <TextInput
              style={styles.modalInput}
              value={numero}
              onChangeText={v => setNumero(formatCard(v))}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor="#bbb"
              keyboardType="numeric"
              maxLength={19}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Vencimiento</Text>
                <TextInput
                  style={styles.modalInput}
                  value={vence}
                  onChangeText={v => setVence(formatExp(v))}
                  placeholder="MM/AA"
                  placeholderTextColor="#bbb"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>CVV</Text>
                <TextInput
                  style={styles.modalInput}
                  value={cvv}
                  onChangeText={v => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  placeholderTextColor="#bbb"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <Text style={styles.modalLabel}>Titular de la tarjeta</Text>
            <TextInput
              style={styles.modalInput}
              value={titular}
              onChangeText={setTitular}
              placeholder="Como aparece en la tarjeta"
              placeholderTextColor="#bbb"
              autoCapitalize="characters"
            />

            <View style={styles.modalResumen}>
              <Text style={styles.modalResumenTexto}>Total a cobrar hoy:</Text>
              <Text style={[styles.modalResumenMonto, { color: plan.color }]}>{plan.precio}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#888', flex: 1 }]}
                onPress={onClose}
                disabled={procesando}
              >
                <Text style={styles.modalBtnTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: plan.color, flex: 1.5 },
                  procesando && { opacity: 0.6 }]}
                onPress={pagar}
                disabled={procesando}
              >
                {procesando
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalBtnTexto}>Pagar {plan.precio}</Text>
                }
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSeguridad}>🔒 Pago seguro — Datos encriptados</Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered:           { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadText:           { color: COLORS.textLight, fontSize: 14 },
  container:          { flex: 1, backgroundColor: COLORS.bg },
  content:            { padding: 16, paddingBottom: 40 },
  seccion:            {
    fontSize: 12, fontWeight: '700', color: COLORS.textLight,
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 20, marginBottom: 10,
  },
  planActualCard:     { backgroundColor: COLORS.secondary, borderRadius: 16, padding: 24, alignItems: 'center' },
  planActualLabel:    { fontSize: 13, color: '#aaa', marginBottom: 6 },
  planActualNombre:   { fontSize: 28, fontWeight: '900', color: '#fff' },
  planActualPrecio:   { fontSize: 16, color: '#ddd', marginTop: 4 },
  planActualFecha:    { fontSize: 12, color: '#aaa', marginTop: 6 },
  beneficiosCard:     { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  planCard:           {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 12, elevation: 2,
    borderWidth: 2, borderColor: 'transparent',
  },
  planCardActivo:     { borderColor: COLORS.primary },
  planBadge:          {
    alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5, marginBottom: 8,
  },
  planBadgeTexto:     { color: '#fff', fontWeight: '700', fontSize: 13 },
  planPrecio:         { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  planBeneficio:      { fontSize: 13, color: COLORS.textLight, marginBottom: 4 },
  btnPlanActual:      {
    marginTop: 12, backgroundColor: '#eee',
    borderRadius: 10, padding: 12, alignItems: 'center',
  },
  btnPlanActualTexto: { color: '#888', fontWeight: '700' },
  btnUpgrade:         { marginTop: 12, borderRadius: 10, padding: 12, alignItems: 'center' },
  btnUpgradeTexto:    { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Modal
  modalOverlay:       {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent:       {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 30,
  },
  modalHeader:        {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, alignItems: 'center', marginBottom: 4,
  },
  modalHeaderPlan:    { fontSize: 20, fontWeight: '900', color: '#fff' },
  modalHeaderPrecio:  { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  modalSeccion:       {
    fontSize: 13, fontWeight: '700', color: COLORS.textLight,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginHorizontal: 20, marginTop: 16, marginBottom: 4,
  },
  modalLabel:         { fontSize: 13, fontWeight: '600', color: COLORS.text, marginHorizontal: 20, marginBottom: 6, marginTop: 10 },
  modalInput:         {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: COLORS.text,
    backgroundColor: '#fafafa', marginHorizontal: 20,
  },
  modalResumen:       {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bg, borderRadius: 12,
    padding: 14, marginHorizontal: 20, marginTop: 16,
  },
  modalResumenTexto:  { fontSize: 14, fontWeight: '600', color: COLORS.text },
  modalResumenMonto:  { fontSize: 20, fontWeight: '900' },
  modalBtn:           { borderRadius: 12, padding: 14, alignItems: 'center', marginHorizontal: 0 },
  modalBtnTexto:      { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalSeguridad:     {
    textAlign: 'center', fontSize: 11, color: COLORS.textLight,
    marginTop: 12, marginHorizontal: 20,
  },
});
