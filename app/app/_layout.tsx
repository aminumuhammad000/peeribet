import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter';

import { Text, TextInput } from 'react-native';

// Globally set default font family for all Text and TextInput components
if ((Text as any).defaultProps == null) {
  (Text as any).defaultProps = {};
}
(Text as any).defaultProps.style = { fontFamily: 'Inter' };

if ((TextInput as any).defaultProps == null) {
  (TextInput as any).defaultProps = {};
}
(TextInput as any).defaultProps.style = { fontFamily: 'Inter' };

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter: Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
    'Inter-Black': Inter_900Black,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0A1124' }, // Immersive dark slate background
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="signin" />
        <Stack.Screen name="signup-step1" />
        <Stack.Screen name="signup-step2" />
        <Stack.Screen name="signup-step3" />
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="match-detail" />
        <Stack.Screen name="enter-amount" />
        <Stack.Screen name="withdraw" />
        <Stack.Screen name="helpdesk" />
        <Stack.Screen name="security" />
        <Stack.Screen name="kyc" />
        <Stack.Screen name="legal" />
      </Stack>
    </SafeAreaProvider>
  );
}
