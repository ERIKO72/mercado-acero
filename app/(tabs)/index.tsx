import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
  Image, Linking, Modal, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import TiendaCard from '../../components/TiendaCard';
import MapaTiendas from '../../components/MapaTiendas';
import { useLocation } from '../../hooks/useLocation';
import { useFavoritos } from '../../hooks/useFavoritos';
import { API_BASE, API, COLORS } from '../../constants/api';

const RADIOS = [5, 10, 20, 50];

// ─────────────────────────────────────────────────────────────
//  SLIDES del carrusel — datos estáticos (no re-renderizan el input)
// ─────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    bg:       '#1C2833',
    accent:   COLORS.primary,
    tag:      'LIMA · PERÚ',
    titulo:   'MARKETPLACE\nDEL ACERO',
    subtitulo:'Distribuidores certificados\nen Lima Metropolitana',
    icono:    '🔩',
    cta:      { label: '🔍 Explorar tiendas', ruta: '/(tabs)/explore' },
  },
  {
    id: '2',
    bg:       '#4A2800',
    accent:   '#F1C40F',
    tag:      'TIENDAS PREMIUM',
    titulo:   'PIN DORADO\nEN EL MAPA',
    subtitulo:'Destaca tu tienda y aparece\nprimero en la lista',
    icono:    '★',
    cta:      { label: 'Mejorar mi plan', ruta: '/screens/admin/subscription' },
  },
  {
    id: '3',
    bg:       '#0D3B1C',
    accent:   '#25D366',
    tag:      '100% DIRECTO',
    titulo:   'COTIZA POR\nWHATSAPP',
    subtitulo:'Contacta directo con el\nvendedor sin intermediarios',
    icono:    '💬',
    cta:      { label: '📋 Hacer cotización', ruta: 'cotizar' },
  },
  {
    id: '4',
    bg:       '#1A2A5E',
    accent:   '#3498DB',
    tag:      'GRATIS',
    titulo:   'REGISTRA\nTU TIENDA',
    subtitulo:'Aparece en el mapa de Lima\nhoy mismo, sin costo',
    icono:    '🏪',
    cta:      { label: '+ Registrar tienda', ruta: '/screens/register-store' },
  },
];

// ─────────────────────────────────────────────────────────────
//  Tipos de slide
// ─────────────────────────────────────────────────────────────
type SlidePromo = typeof SLIDES[0] & { tipo: 'promo' };
type SlideAd    = { tipo: 'ad'; id: string; titulo: string; empresa: string; imagen_url: string; enlace_url: string; enlace_tipo: string };
type SlideItem  = SlidePromo | SlideAd;

// ─────────────────────────────────────────────────────────────
//  MODAL COTIZACIÓN
// ─────────────────────────────────────────────────────────────
function ModalCotizacion({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [nombre,    setNombre]    = useState('');
  const [empresa,   setEmpresa]   = useState('');
  const [telefono,  setTelefono]  = useState('');
  const [producto,  setProducto]  = useState('');
  const [cantidad,  setCantidad]  = useState('');
  const [detalle,   setDetalle]   = useState('');

  const enviarWA = () => {
    if (!nombre.trim() || !producto.trim()) {
      Alert.alert('Completa los campos', 'Nombre y producto son obligatorios');
      return;
    }
    const msg = encodeURIComponent(
      `Hola! Solicito cotización desde *Marketplace del Acero*:\n\n` +
      `👤 Nombre: ${nombre}\n` +
      `🏢 Empresa: ${empresa || 'No especificada'}\n` +
      `📞 Teléfono: ${telefono || 'No especificado'}\n` +
      `🔩 Producto: ${producto}\n` +
      `📦 Cantidad: ${cantidad || 'A consultar'}\n` +
      `📝 Detalle: ${detalle || 'Sin detalle adicional'}`
    );
    const waUrl = `https://wa.me/51999000000?text=${msg}`;
    Linking.openURL(waUrl).catch(() => {});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={cot.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={cot.sheet}>
          <View style={cot.handle} />
          <Text style={cot.titulo}>📋 Solicitar Cotización</Text>
          <Text style={cot.sub}>Completa el formulario y te contactamos</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={cot.label}>Nombre *</Text>
            <TextInput style={cot.input} value={nombre} onChangeText={setNombre}
              placeholder="Tu nombre completo" placeholderTextColor="#AAA" />

            <Text style={cot.label}>Empresa</Text>
            <TextInput style={cot.input} value={empresa} onChangeText={setEmpresa}
              placeholder="Nombre de tu empresa" placeholderTextColor="#AAA" />

            <Text style={cot.label}>Teléfono</Text>
            <TextInput style={cot.input} value={telefono} onChangeText={setTelefono}
              placeholder="999 000 000" placeholderTextColor="#AAA" keyboardType="phone-pad" />

            <Text style={cot.label}>Producto / Material *</Text>
            <TextInput style={cot.input} value={producto} onChangeText={setProducto}
              placeholder="Ej: Tubos de acero 2 pulgadas, planchas LAF..." placeholderTextColor="#AAA" />

            <Text style={cot.label}>Cantidad estimada</Text>
            <TextInput style={cot.input} value={cantidad} onChangeText={setCantidad}
              placeholder="Ej: 50 unidades, 2 toneladas..." placeholderTextColor="#AAA" />

            <Text style={cot.label}>Detalles adicionales</Text>
            <TextInput style={[cot.input, { height: 80, textAlignVertical: 'top' }]}
              value={detalle} onChangeText={setDetalle}
              placeholder="Especificaciones técnicas, plazo de entrega, etc."
              placeholderTextColor="#AAA" multiline />

            <TouchableOpacity style={cot.btnWA} onPress={enviarWA}>
              <Text style={cot.btnWAText}>💬 Enviar por WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={cot.btnCancelar} onPress={onClose}>
              <Text style={cot.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function abrirEnlace(url: string, tipo: string) {
  if (!url) return;
  let destino = url;
  if (tipo === 'telefono' && !url.startsWith('tel:')) {
    destino = `tel:${url}`;
  } else if (tipo === 'maps') {
    destino = `https://www.google.com/maps/dir/?api=1&destination=${url}&travelmode=driving`;
  } else if (tipo === 'waze') {
    const wazeApp = `waze://?ll=${url}&navigate=yes`;
    const wazeWeb = `https://waze.com/ul?ll=${url}&navigate=yes`;
    Linking.canOpenURL(wazeApp)
      .then(can => Linking.openURL(can ? wazeApp : wazeWeb))
      .catch(() => Linking.openURL(wazeWeb));
    return;
  }
  Linking.canOpenURL(destino)
    .then(can => Linking.openURL(can ? destino : url))
    .catch(() => {});
}

// ─────────────────────────────────────────────────────────────
//  CARRUSEL — auto-rotación 3.5 s + banners dinámicos desde API
// ─────────────────────────────────────────────────────────────
function BannerCarrusel({ total, premium, verificadas, onCotizar }: {
  total: number; premium: number; verificadas: number; onCotizar: () => void;
}) {
  const [activo,     setActivo]     = useState(0);
  const [bannersPub, setBannersPub] = useState<SlideAd[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(API.banners)
      .then(r => r.json())
      .then(j => {
        if (j.ok && j.data.length > 0)
          setBannersPub(j.data.map((b: any) => ({ ...b, id: String(b.id), tipo: 'ad' as const })));
      })
      .catch(() => {});
  }, []);

  const slides = useMemo<SlideItem[]>(() => {
    const promos: SlidePromo[] = SLIDES.map(s => ({ ...s, tipo: 'promo' as const }));
    if (!bannersPub.length) return promos;
    const result: SlideItem[] = [];
    const maxLen = Math.max(promos.length, bannersPub.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < promos.length)     result.push(promos[i]);
      if (i < bannersPub.length) result.push(bannersPub[i]);
    }
    return result;
  }, [bannersPub]);

  const irA = useCallback((idx: number) => setActivo(idx), []);

  useEffect(() => {
    timer.current = setInterval(() =>
      setActivo(prev => (prev + 1) % slides.length), 3500);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [slides.length]);

  const slide = slides[activo];

  const renderPromo = (item: SlidePromo) => (
    <View style={[car.slide, { backgroundColor: item.bg }]}>
      <View style={[car.topBar, { backgroundColor: item.accent }]} />
      <View style={car.content}>
        <View style={car.left}>
          <View style={[car.tagPill, { backgroundColor: item.accent + '30', borderColor: item.accent + '60' }]}>
            <Text style={[car.tagText, { color: item.accent }]}>{item.tag}</Text>
          </View>
          <Text style={car.titulo}>{item.titulo}</Text>
          <Text style={car.subtitulo}>{item.subtitulo}</Text>
          {item.cta && (
            <TouchableOpacity
              style={[car.ctaBtn, { backgroundColor: item.accent }]}
              onPress={() => {
                if (item.cta!.ruta === 'cotizar') onCotizar();
                else if (item.cta!.ruta) router.push(item.cta!.ruta as any);
              }}
            >
              <Text style={car.ctaText}>{item.cta.label}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={[car.iconBox, { borderColor: item.accent + '40', backgroundColor: item.accent + '15' }]}>
          <Text style={car.iconText}>{item.icono}</Text>
        </View>
      </View>
      {item.id === '1' && (
        <View style={car.statsRow}>
          {[
            { n: String(total),       label: 'Tiendas',     color: '#fff' },
            { n: String(premium),     label: 'Premium',     color: '#F1C40F' },
            { n: String(verificadas), label: 'Verificadas', color: '#27AE60' },
            { n: '100%',              label: 'Gratis',      color: '#3498DB' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <View style={car.statItem}>
                <Text style={[car.statNum, { color: s.color }]}>{s.n}</Text>
                <Text style={car.statLabel}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={car.statDiv} />}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );

  const renderAd = (item: SlideAd) => (
    <TouchableOpacity
      activeOpacity={0.92}
      style={[car.slide, { height: 140 }]}
      onPress={() => abrirEnlace(item.enlace_url, item.enlace_tipo)}
    >
      <Image source={{ uri: item.imagen_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <View style={car.adOverlay}>
        <View style={car.adLeft}>
          <View style={car.adBadge}><Text style={car.adBadgeText}>PUBLICIDAD</Text></View>
          <Text style={car.adTitulo} numberOfLines={1}>{item.titulo}</Text>
          {item.empresa ? <Text style={car.adEmpresa} numberOfLines={1}>{item.empresa}</Text> : null}
        </View>
        <View style={car.adCta}>
          <Text style={car.adCtaText}>
            {item.enlace_tipo === 'whatsapp' ? '💬 WhatsApp'
              : item.enlace_tipo === 'telefono' ? '📞 Llamar'
              : item.enlace_tipo === 'maps' ? '📍 Ver en Maps'
              : item.enlace_tipo === 'waze' ? '🚗 Abrir Waze'
              : '🔗 Ver más'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      {/* Un solo slide visible — compatible web y móvil */}
      {slide && (slide.tipo === 'ad' ? renderAd(slide as SlideAd) : renderPromo(slide as SlidePromo))}

      {/* Dots */}
      <View style={car.dots}>
        {slides.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => irA(i)}>
            <View style={[car.dot, activo === i && car.dotActivo]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  SEARCH HEADER — definido FUERA del HomeScreen
//  (evita que React destruya el TextInput en cada keystroke)
// ─────────────────────────────────────────────────────────────
type SearchHeaderProps = {
  query: string;
  onChangeQuery: (v: string) => void;
  onSearch: () => void;
  radio: number;
  onRadio: (v: number) => void;
  mapVisible: boolean;
  onToggleMap: () => void;
  onCotizar: () => void;
  tiendas: any[];
};

function SearchHeader({
  query, onChangeQuery, onSearch,
  radio, onRadio,
  mapVisible, onToggleMap,
  tiendas, onCotizar,
}: SearchHeaderProps) {
  return (
    <View>
      {/* Banner carrusel dinámico */}
      <BannerCarrusel
        total={tiendas.length}
        premium={tiendas.filter(t => t.destacada).length}
        verificadas={tiendas.filter(t => t.verificada).length}
        onCotizar={onCotizar}
      />

      {/* Barra de búsqueda */}
      <View style={srch.bar}>
        <View style={srch.inputRow}>
          <TextInput
            style={srch.input}
            placeholder="Buscar tienda, producto o distrito..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={onChangeQuery}
            onSubmitEditing={onSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            submitBehavior="submit"
          />
          <TouchableOpacity style={srch.btnBuscar} onPress={onSearch}>
            <Text style={srch.btnBuscarText}>Buscar</Text>
          </TouchableOpacity>
        </View>

        {/* Chips de radio */}
        <View style={srch.filterRow}>
          <Text style={srch.filterLabel}>Radio:</Text>
          {RADIOS.map(r => (
            <TouchableOpacity
              key={r}
              style={[srch.chip, radio === r && srch.chipActive]}
              onPress={() => onRadio(r)}
            >
              <Text style={[srch.chipText, radio === r && srch.chipTextActive]}>
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Toggle mapa */}
        <TouchableOpacity style={srch.toggleBtn} onPress={onToggleMap}>
          <Text style={srch.toggleText}>
            {mapVisible ? '▼  Ocultar mapa' : '▲  Mostrar mapa'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Label resultados */}
      <View style={srch.resultLabel}>
        <Text style={srch.resultText}>
          {tiendas.length > 0
            ? `${tiendas.length} tiendas encontradas`
            : 'Cargando tiendas...'}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  HOME SCREEN
// ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { location } = useLocation();
  const { toggle, esFavorito }            = useFavoritos();
  const flatListRef                       = useRef<FlatList>(null);
  const mapRef                            = useRef<any>(null);
  const [showCotizar, setShowCotizar]     = useState(false);

  // Triple-tap oculto en logo → Superadmin
  const tapCount  = useRef(0);
  const tapTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLogoTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 800);
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      router.push('/screens/superadmin/dashboard' as any);
    }
  };

  const [tiendas,    setTiendas]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query,      setQuery]      = useState('');
  const [radio,      setRadio]      = useState(20);
  const [mapVisible, setMapVisible] = useState(true);
  const [selected,   setSelected]   = useState<any | null>(null);

  // ← Hace scroll al tope cuando el usuario toca el tab "Inicio"
  useScrollToTop(flatListRef);

  const fetchTiendas = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const params = new URLSearchParams({ radio: String(radio) });
      if (location) {
        params.set('lat', String(location.latitude));
        params.set('lng', String(location.longitude));
      }
      if (query.trim()) params.append('q', query.trim());
      const res  = await fetch(`${API_BASE}/api/tiendas?${params}`);
      const json = await res.json();
      if (json.ok) setTiendas(json.data);
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location, radio, query]);

  // Cargar al inicio y cuando cambie la ubicación
  useEffect(() => { fetchTiendas(); }, [fetchTiendas]);

  const handleToggleMap = useCallback(() => setMapVisible(v => !v), []);

  // No bloqueamos la UI mientras obtiene GPS — las tiendas cargan igual

  return (
    <View style={styles.container}>

      {/* ── Barra de marca — siempre estable fuera del FlatList ── */}
      <View style={styles.brandBar}>
        <TouchableOpacity style={styles.brandLeft} onPress={handleLogoTap} activeOpacity={0.8}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={styles.brandBtns}>
          <TouchableOpacity
            style={styles.btnNav}
            onPress={() => router.push('/screens/register-store')}
          >
            <Text style={styles.btnNavText}>+ Tienda</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnCubicadora}
            onPress={() => router.push('/screens/cubicadora' as any)}
          >
            <Text style={styles.btnCubicadoraText}>📐 Cubicadora</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Mapa — fuera del FlatList ── */}
      {mapVisible && location && (
        <View style={styles.mapContainer}>
          <MapaTiendas
            mapRef={mapRef}
            location={location}
            tiendas={tiendas}
            radio={radio}
            selected={selected}
            onMarkerPress={setSelected}
          />
          {selected && (
            <TouchableOpacity
              style={styles.popup}
              onPress={() => {
                router.push({ pathname: '/screens/detail', params: { id: selected.id } });
                setSelected(null);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {selected.destacada && (
                  <View style={styles.popupStar}>
                    <Text style={{ color: '#fff', fontSize: 12 }}>★</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.popupNombre}>{selected.nombre}</Text>
                  <Text style={styles.popupInfo}>{selected.distrito} · Toca para ver</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Lista principal — ref conectado a useScrollToTop ── */}
      <FlatList
        ref={flatListRef}
        data={tiendas}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        ListHeaderComponent={
          <SearchHeader
            query={query}
            onChangeQuery={setQuery}
            onSearch={fetchTiendas}
            radio={radio}
            onRadio={setRadio}
            mapVisible={mapVisible}
            onToggleMap={handleToggleMap}
            tiendas={tiendas}
            onCotizar={() => setShowCotizar(true)}
          />
        }
        ListEmptyComponent={
          loading
            ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 30 }} />
            : (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔩</Text>
                <Text style={styles.emptyText}>
                  No se encontraron tiendas en este radio
                </Text>
              </View>
            )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTiendas(true)}
            colors={[COLORS.primary]}
          />
        }
        renderItem={({ item }) => (
          <TiendaCard
            tienda={item}
            esFavorito={esFavorito(item.id)}
            onToggleFavorito={toggle}
            onPress={() =>
              router.push({ pathname: '/screens/detail', params: { id: item.id } })
            }
          />
        )}
        ListFooterComponent={
          <View>
            <TouchableOpacity
              style={styles.cubicadoraBtn}
              onPress={() => router.push('/screens/cubicadora' as any)}
            >
              <Text style={styles.cubicadoraBtnText}>📐 Cubicadora de Materiales</Text>
              <Text style={styles.cubicadoraBtnSub}>Calcula cantidades y compara precios</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.libroBtn}
              onPress={() => router.push('/screens/libro-reclamaciones' as any)}
            >
              <Text style={styles.libroBtnText}>📋 Libro de Reclamaciones</Text>
              <Text style={styles.libroBtnSub}>Ley 29571 · INDECOPI · Perú</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ModalCotizacion
        visible={showCotizar}
        onClose={() => setShowCotizar(false)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  ESTILOS
// ─────────────────────────────────────────────────────────────

// Carrusel
const car = StyleSheet.create({
  slide:      { width: '100%', overflow: 'hidden', minHeight: 140 },
  topBar:     { height: 3 },
  content:    { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center' },
  left:       { flex: 1 },
  tagPill:    { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, marginBottom: 8 },
  tagText:    { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  titulo:     { color: '#fff', fontSize: 21, fontWeight: '900', letterSpacing: 0.5, lineHeight: 26, marginBottom: 6 },
  subtitulo:  { color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 17, marginBottom: 10 },
  ctaBtn:     { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  ctaText:    { color: '#fff', fontSize: 12, fontWeight: '800' },
  iconBox:    { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  iconText:   { fontSize: 34 },
  statsRow:   { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 9, paddingHorizontal: 8 },
  statItem:   { flex: 1, alignItems: 'center' },
  statNum:    { fontSize: 15, fontWeight: '900' },
  statLabel:  { fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDiv:    { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },
  dots:       { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: '#1C2833' },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActivo:  { width: 20, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  // Slides publicitarios (imagen)
  adImage:    { width: '100%', height: 140 },
  adOverlay:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.62)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  adLeft:     { flex: 1, gap: 3 },
  adBadge:    { alignSelf: 'flex-start', backgroundColor: COLORS.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  adBadgeText:{ color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  adTitulo:   { color: '#fff', fontSize: 13, fontWeight: '800' },
  adEmpresa:  { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  adCta:      { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  adCtaText:  { color: '#fff', fontSize: 11, fontWeight: '700' },
});

// Search header
const srch = StyleSheet.create({
  bar:            { backgroundColor: '#fff', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#eee' },
  inputRow:       { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input:          { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10, fontSize: 14, color: '#1a1a1a', borderWidth: 1.5, borderColor: '#E8E8E8' },
  btnBuscar:      { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  btnBuscarText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  filterRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  filterLabel:    { fontSize: 11, color: '#999', fontWeight: '600' },
  chip:           { backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5, borderWidth: 1, borderColor: '#E0E0E0' },
  chipActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText:       { fontSize: 11, color: '#777' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  toggleBtn:      { alignSelf: 'flex-start' },
  toggleText:     { fontSize: 12, color: '#f39c12', fontWeight: '700' },
  resultLabel:    { backgroundColor: '#F9F9F9', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#EBEBEB' },
  resultText:     { fontSize: 12, color: '#999', fontWeight: '600' },
});

// Pantalla principal
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F2F2F2' },
  centered:         { flex: 1, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  loadingLogo:      { width: 80, height: 80, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  loadingLogoText:  { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  loadingMarca:     { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1.5, marginTop: 14 },
  loadingMsg:       { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 10 },
  brandBar:         { backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 12, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandLeft:        { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  brandIcon:        { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  brandIconText:    { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  brandName:        { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  brandSub:         { color: 'rgba(255,255,255,0.6)', fontSize: 9, marginTop: 1 },
  brandLogo:        { width: 220, height: 100 },
  brandBtns:        { flexDirection: 'column', gap: 4, alignItems: 'flex-end' },
  btnNav:           { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  btnCubicadora:    { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 4 },
  btnCubicadoraText:{ color: '#fff', fontSize: 11, fontWeight: '700' },
  btnNavAdmin:      { backgroundColor: 'rgba(0,0,0,0.25)' },
  btnNavText:       { color: '#fff', fontSize: 11, fontWeight: '700' },
  mapContainer:     { height: 230 },
  popup:            { position: 'absolute', bottom: 8, left: 10, right: 10, backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 8, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  popupNombre:      { fontWeight: '700', fontSize: 14, color: '#1a1a1a' },
  popupInfo:        { fontSize: 11, color: '#999', marginTop: 2 },
  popupStar:        { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f1c40f', alignItems: 'center', justifyContent: 'center' },
  list:             { padding: 10, paddingTop: 8 },
  empty:            { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyIcon:        { fontSize: 40 },
  emptyText:        { fontSize: 13, color: '#999', textAlign: 'center' },
  saBtn:            { margin: 12, backgroundColor: COLORS.secondary, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saBtnText:        { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  cubicadoraBtn:     { margin: 12, marginBottom: 6, backgroundColor: COLORS.secondary, borderRadius: 12, padding: 14, alignItems: 'center' },
  cubicadoraBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  cubicadoraBtnSub:  { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 3 },
  libroBtn:         { margin: 12, marginTop: 4, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E0E0' },
  libroBtnText:     { color: COLORS.secondary, fontWeight: '700', fontSize: 13 },
  libroBtnSub:      { color: '#AAA', fontSize: 10, marginTop: 3 },
});

// Modal cotización
const cot = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  handle:       { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  titulo:       { fontSize: 18, fontWeight: '900', color: COLORS.secondary, marginBottom: 4 },
  sub:          { fontSize: 13, color: '#888', marginBottom: 16 },
  label:        { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 5 },
  input:        { backgroundColor: '#F8F8F8', borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: '#1a1a1a', marginBottom: 12 },
  btnWA:        { backgroundColor: '#25D366', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 10 },
  btnWAText:    { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnCancelar:  { backgroundColor: '#F2F2F2', borderRadius: 12, padding: 13, alignItems: 'center' },
  btnCancelarText: { color: '#888', fontWeight: '600', fontSize: 14 },
});
