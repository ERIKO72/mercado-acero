import { Tabs, router } from 'expo-router';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/api';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[tab.iconWrap, focused && tab.iconWrapActive]}>
      <Text style={{ fontSize: 19 }}>{emoji}</Text>
    </View>
  );
}

const tab = StyleSheet.create({
  iconWrap:       { width: 38, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  iconWrapActive: { backgroundColor: `${COLORS.primary}20` },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: '#AAA',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          paddingBottom: 8,
          paddingTop: 4,
          height: 66,
          elevation: 14,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={focused ? '🏠' : '🏡'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" focused={focused} />
          ),
          tabBarButton: ({ children, style }) => (
            <TouchableOpacity
              style={style}
              onPress={() => router.push('/screens/login' as any)}
            >
              {children}
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={focused ? '♥' : '♡'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: 'Servicios',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚡" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cotizar"
        options={{
          title: 'Cotizar',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" focused={focused} />
          ),
          tabBarButton: ({ children, style }) => (
            <TouchableOpacity
              style={style}
              onPress={() => router.push('/screens/cotizacion' as any)}
            >
              {children}
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}
