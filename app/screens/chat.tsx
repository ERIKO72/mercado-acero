import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, COLORS } from '../../constants/api';

type Msg = {
  id: string;
  autor: string;
  texto: string;
  es_dueno: boolean;
  created_at: string;
};

export default function ChatScreen() {
  const { tienda_id, tienda_nombre } =
    useLocalSearchParams<{ tienda_id: string; tienda_nombre: string }>();

  const [mensajes, setMensajes] = useState<Msg[]>([]);
  const [texto, setTexto]       = useState('');
  const [autor, setAutor]       = useState('Visitante');
  const [loading, setLoading]   = useState(true);
  const [enviando, setEnviando] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const lastIdRef = useRef<string | null>(null);

  // Cargar nombre del usuario si está logueado
  useEffect(() => {
    AsyncStorage.getItem('nombre').then(n => { if (n) setAutor(n); });
  }, []);

  const cargarMensajes = useCallback(async (silencioso = false) => {
    if (!tienda_id) return;
    try {
      const res  = await fetch(`${API_BASE}/api/chat/${tienda_id}`);
      const data = await res.json();
      if (data.ok) {
        setMensajes(data.data);
        // Hacer scroll al final solo si hay mensajes nuevos
        const ultimo = data.data[data.data.length - 1];
        if (ultimo && ultimo.id !== lastIdRef.current) {
          lastIdRef.current = ultimo.id;
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: !silencioso }), 80);
        }
      }
    } catch { /* silencioso */ }
    finally { if (!silencioso) setLoading(false); }
  }, [tienda_id]);

  // Carga inicial
  useEffect(() => { cargarMensajes(); }, [cargarMensajes]);

  // Polling cada 3 segundos para mensajes nuevos
  useEffect(() => {
    const t = setInterval(() => cargarMensajes(true), 3000);
    return () => clearInterval(t);
  }, [cargarMensajes]);

  const enviar = async () => {
    const msg = texto.trim();
    if (!msg || enviando) return;
    setTexto('');
    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat/${tienda_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autor, texto: msg, es_dueno: false }),
      });
      const data = await res.json();
      if (data.ok) {
        setMensajes(prev => [...prev, data.data]);
        lastIdRef.current = data.data.id;
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
      }
    } catch { /* silencioso */ }
    finally { setEnviando(false); }
  };

  const renderItem = ({ item }: { item: Msg }) => {
    const esMio = !item.es_dueno;
    return (
      <View style={[styles.bubble, esMio ? styles.bubbleMio : styles.bubbleEllos]}>
        {!esMio && (
          <Text style={styles.bubbleAutorDueno}>{item.autor} (Tienda)</Text>
        )}
        <Text style={[styles.bubbleTexto, esMio && { color: '#fff' }]}>
          {item.texto}
        </Text>
        <Text style={[styles.bubbleTiempo, esMio && { color: 'rgba(255,255,255,0.65)' }]}>
          {new Date(item.created_at).toLocaleTimeString('es-PE', {
            hour: '2-digit', minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{tienda_nombre}</Text>
          <Text style={styles.headerSub}>Chat en vivo · actualiza cada 3 seg</Text>
        </View>
        <View style={styles.online} />
      </View>

      {/* Lista de mensajes */}
      {loading
        ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        )
        : (
          <FlatList
            ref={flatRef}
            data={mensajes}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>
                  Sin mensajes aun.{'\n'}Se el primero en escribir!
                </Text>
              </View>
            }
          />
        )
      }

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#aaa"
            returnKeyType="send"
            onSubmitEditing={enviar}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!texto.trim() || enviando) && styles.sendBtnDisabled]}
            onPress={enviar}
            disabled={!texto.trim() || enviando}
          >
            {enviando
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendIcon}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#EAE6DF' },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:         {
    backgroundColor: COLORS.secondary,
    paddingTop: 50, paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 4,
  },
  backBtn:        { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerTitle:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerSub:      { color: '#95a5a6', fontSize: 10, marginTop: 1 },
  online:         { width: 10, height: 10, borderRadius: 5, backgroundColor: '#27ae60' },

  list:           { padding: 12, paddingBottom: 8 },

  emptyBox:       { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyIcon:      { fontSize: 48 },
  emptyText:      { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22 },

  bubble:         {
    maxWidth: '78%', borderRadius: 18,
    paddingVertical: 8, paddingHorizontal: 13,
    marginVertical: 3,
    elevation: 1,
  },
  bubbleMio:      {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleEllos:    {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  bubbleAutorDueno: {
    fontSize: 10, fontWeight: '700',
    color: COLORS.secondary, marginBottom: 3,
  },
  bubbleTexto:    { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  bubbleTiempo:   { fontSize: 10, color: COLORS.textLight, marginTop: 4, textAlign: 'right' },

  inputRow:       {
    flexDirection: 'row',
    padding: 8, paddingHorizontal: 10,
    backgroundColor: '#F0EDE8',
    borderTopWidth: 1, borderColor: '#ddd',
    alignItems: 'flex-end', gap: 8,
  },
  input:          {
    flex: 1, backgroundColor: '#fff',
    borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14, color: COLORS.text,
    maxHeight: 100,
    elevation: 1,
  },
  sendBtn:        {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 2,
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  sendIcon:       { color: '#fff', fontSize: 18, marginLeft: 2 },
});
