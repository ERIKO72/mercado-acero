import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22 }}>APP FUNCIONANDO REAL</Text>

      <Pressable onPress={() => router.push('/detail')}>
        <Text style={{ marginTop: 20, color: 'blue' }}>
          Ir a detalle
        </Text>
      </Pressable>
    </View>
  );
}