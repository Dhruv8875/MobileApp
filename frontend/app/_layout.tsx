import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/api';
import { ThemeProvider, useAppTheme } from '../src/ThemeProvider';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { Colors } from '../src/theme';

function ThemedStack() {
  const { themeKey, effective } = useAppTheme();
  return (
    <View key={`t-${themeKey}`} style={{ flex: 1, backgroundColor: Colors.bg }}>
      <StatusBar style={effective === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: Colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="listing/[id]" />
        <Stack.Screen name="owner/add-listing" />
        <Stack.Screen name="owner/leads" />
        <Stack.Screen name="owner/payments" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ThemedStack />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
