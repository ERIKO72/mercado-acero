// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/api';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:        false,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth:  1,
          borderTopColor:  COLORS.border,
          paddingBottom:   6,
          height:          60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Explorar', tabBarIcon: ({ color }) => <TabIcon icon="🔍" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20 }}>{icon}</Text>;
}
