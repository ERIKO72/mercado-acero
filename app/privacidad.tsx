import { ScrollView, View, Text, StyleSheet } from 'react-native';

export default function Privacidad() {
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>

      <View style={s.header}>
        <Text style={s.titulo}>Política de Privacidad</Text>
        <Text style={s.sub}>Marketplace del Acero</Text>
        <Text style={s.fecha}>Última actualización: 17 de abril de 2026</Text>
      </View>

      <Section title="1. Información que recopilamos">
        <P>Recopilamos la siguiente información cuando usas nuestra aplicación:</P>
        <Li>Nombre y correo electrónico al registrar tu tienda.</Li>
        <Li>Número de teléfono de contacto de la tienda (visible públicamente).</Li>
        <Li>Ubicación geográfica (solo si otorgas permiso) para mostrar tiendas cercanas.</Li>
        <Li>Información de productos y catálogo ingresada por el usuario.</Li>
        <Li>Datos de uso anónimos para mejorar la aplicación (visitas, clicks).</Li>
      </Section>

      <Section title="2. Cómo usamos tu información">
        <Li>Mostrar tu tienda y productos a compradores potenciales en Lima y Perú.</Li>
        <Li>Enviarte notificaciones relacionadas con tu cuenta (solo si las activas).</Li>
        <Li>Mejorar el rendimiento y la experiencia de la aplicación.</Li>
        <Li>Cumplir con obligaciones legales aplicables en el Perú.</Li>
      </Section>

      <Section title="3. Compartición de datos">
        <P>No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto:</P>
        <Li>Proveedores de servicios técnicos necesarios para operar la app (Railway, Google Maps).</Li>
        <Li>Cuando sea requerido por ley o autoridad competente.</Li>
      </Section>

      <Section title="4. Almacenamiento y seguridad">
        <P>Tus datos se almacenan en servidores seguros con cifrado. Aplicamos medidas técnicas para proteger tu información contra acceso no autorizado, incluyendo:</P>
        <Li>Contraseñas cifradas con bcrypt.</Li>
        <Li>Comunicaciones protegidas con HTTPS/TLS.</Li>
        <Li>Tokens de sesión con expiración automática.</Li>
        <Li>Autenticación de dos factores para cuentas administrativas.</Li>
      </Section>

      <Section title="5. Tus derechos (Ley 29733 — Perú)">
        <P>De acuerdo con la Ley de Protección de Datos Personales del Perú, tienes derecho a:</P>
        <Li>Acceder a los datos personales que tenemos sobre ti.</Li>
        <Li>Solicitar la corrección de datos inexactos.</Li>
        <Li>Solicitar la eliminación de tu cuenta y datos asociados.</Li>
        <Li>Oponerte al tratamiento de tus datos.</Li>
        <P>Para ejercer estos derechos, escríbenos a: <Text style={s.email}>eimahr06@gmail.com</Text></P>
      </Section>

      <Section title="6. Permisos de la aplicación">
        <P>La app puede solicitar los siguientes permisos en tu dispositivo:</P>
        <Li>Ubicación: para mostrar tiendas cercanas a tu posición.</Li>
        <Li>Cámara / Galería: para subir fotos de productos y tu tienda.</Li>
        <Li>Internet: necesario para el funcionamiento de la app.</Li>
        <P>Puedes revocar estos permisos en cualquier momento desde la configuración de tu dispositivo.</P>
      </Section>

      <Section title="7. Menores de edad">
        <P>Esta aplicación está dirigida a personas mayores de 18 años. No recopilamos intencionalmente datos de menores de edad.</P>
      </Section>

      <Section title="8. Cambios a esta política">
        <P>Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos mediante un aviso en la aplicación. El uso continuado de la app implica la aceptación de la política actualizada.</P>
      </Section>

      <Section title="9. Contacto">
        <P>Si tienes preguntas sobre esta política de privacidad, contáctanos:</P>
        <Li>Email: eimahr06@gmail.com</Li>
        <Li>Empresa: EIMAHR MULTISERVICE EIRL</Li>
        <Li>País: Perú</Li>
      </Section>

      <View style={s.footer}>
        <Text style={s.footerText}>© 2026 Marketplace del Acero · EIMAHR MULTISERVICE EIRL · Lima, Perú</Text>
      </View>

    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={s.p}>{children}</Text>;
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.liRow}>
      <Text style={s.bullet}>•</Text>
      <Text style={s.liText}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#fff' },
  content:      { padding: 20, paddingBottom: 48 },
  header:       { backgroundColor: '#C0392B', borderRadius: 12, padding: 24, marginBottom: 24, alignItems: 'center' },
  titulo:       { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  sub:          { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  fecha:        { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8 },
  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1C2833', marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#C0392B', paddingLeft: 10 },
  p:            { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 8 },
  liRow:        { flexDirection: 'row', marginBottom: 6, paddingLeft: 4 },
  bullet:       { fontSize: 14, color: '#C0392B', marginRight: 8, marginTop: 2 },
  liText:       { fontSize: 14, color: '#444', lineHeight: 22, flex: 1 },
  email:        { color: '#C0392B', fontWeight: '700' },
  footer:       { marginTop: 16, alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  footerText:   { fontSize: 11, color: '#aaa', textAlign: 'center' },
});
