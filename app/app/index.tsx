import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PeeritradeLogo } from '../components/PeeritradeLogo';
import { Colors } from '../constants/Colors';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/apiService';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Auto routing check
    const checkStatus = async () => {
      try {
        const [isAuthenticated, hasSeenOnboarding] = await Promise.all([
          authService.isAuthenticated(),
          AsyncStorage.getItem('hasSeenOnboarding'),
        ]);
        
        setTimeout(() => {
          if (isAuthenticated) {
            router.replace('/(tabs)/home');
          } else if (!hasSeenOnboarding) {
            // First time user visit: show onboarding process
            router.replace('/onboarding');
          } else {
            router.replace('/welcome');
          }
        }, 1800);
      } catch {
        setTimeout(() => {
          router.replace('/onboarding');
        }, 1800);
      }
    };

    checkStatus();
  }, []);

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.container}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <PeeritradeLogo size="large" />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
