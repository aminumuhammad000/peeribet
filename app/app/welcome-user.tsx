import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Trophy, ArrowRight, UserCheck } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

export default function WelcomeUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const type = params.type || 'signup'; // 'signup' or 'login'
  
  const isSignup = type === 'signup';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Staggered animation sequence for a premium feel
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Auto-redirect to home after 3.5 seconds
    const timer = setTimeout(() => {
      handleContinue();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Animated Success Icon */}
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.iconGlow}>
              {isSignup ? (
                <CheckCircle size={64} color="#00D285" strokeWidth={2.5} />
              ) : (
                <UserCheck size={64} color="#00D285" strokeWidth={2.5} />
              )}
            </View>
          </Animated.View>

          {/* Animated Text Content */}
          <Animated.View 
            style={[
              styles.textContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <View style={styles.badgeContainer}>
              <Trophy size={16} color="#F59E0B" />
              <Text style={styles.badgeText}>
                {isSignup ? 'Welcome to the Future of Trading' : 'Secure Session Initialized'}
              </Text>
            </View>
            
            <Text style={styles.title}>
              {isSignup ? 'Account Created!' : 'Welcome Back!'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignup 
                ? 'Your escrow trading account is ready. You can now trade sport outcomes fairly, securely, and seamlessly.'
                : 'Authentication successful. You are now securely connected to the institutional trading terminal.'}
            </Text>
          </Animated.View>
        </View>

        {/* Animated Footer Action */}
        <Animated.View 
          style={[
            styles.footer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.continueButton} 
            activeOpacity={0.8}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={['#00D285', '#00A86B']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Enter Dashboard</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 210, 133, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.3)',
    shadowColor: '#00D285',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Inter',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  footer: {
    paddingBottom: 20,
  },
  continueButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00D285',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    marginRight: 8,
  },
});
