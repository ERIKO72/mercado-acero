// app/_layout.tsx
import { Stack } from 'expo-router';
import { COLORS } from '../constants/api';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)"           options={{ headerShown: false }} />
      <Stack.Screen name="screens/detail"   options={{ headerShown: false }} />
      <Stack.Screen
        name="screens/register-store"
        options={{
          headerShown:       true,
          headerTitle:       'Registrar tienda',
          headerStyle:       { backgroundColor: COLORS.secondary },
          headerTintColor:   '#fff',
          headerTitleStyle:  { fontWeight: '700' },
          presentation:      'modal',
        }}
      />
    </Stack>
  );
}
