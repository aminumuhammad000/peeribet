import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PeeritradeLogo } from '../components/PeeritradeLogo';
import { Colors } from '../constants/Colors';

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

    // Auto routing to welcome/onboarding screen
    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 2400);

    return () => clearTimeout(timer);
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
