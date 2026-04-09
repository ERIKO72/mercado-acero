import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Text style={{ fontSize: 24 }}>
        🚀 Marketplace del Acero
      </Text>

      <Text style={{ marginTop: 10 }}>
        App funcionando correctamente
      </Text>
    </View>
  );
}