import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, ShieldCheck, TrendingUp, Users, Zap, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { OnboardingIllustration } from '../components/OnboardingIllustration';

const { width } = Dimensions.get('window');

interface Slide {
  id: number;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  icon: any;
  customIllustration?: boolean;
}

const ONBOARDING_SLIDES: Slide[] = [
  {
    id: 1,
    badge: '100% Peer-to-Peer',
    title: 'Trade Sports Outcomes',
    highlight: 'Without Bookmakers',
    description: 'Connect directly with counterparties worldwide. Set your own trade terms, transparent valuations, and zero bookmaker cuts.',
    icon: Users,
    customIllustration: true,
  },
  {
    id: 2,
    badge: 'Institutional Security',
    title: 'Automated Escrow',
    highlight: 'Full Capital Protection',
    description: 'Every stake is locked securely inside an audited escrow contract before kickoff. Verified match results trigger automatic settlements.',
    icon: ShieldCheck,
  },
  {
    id: 3,
    badge: 'Real-Time Execution',
    title: 'Live Club Index Shares',
    highlight: '& Instant Bank Payouts',
    description: 'Buy or sell football share indices on dynamic spreads. Cash out profits straight to your Nigerian bank account or wallet in seconds.',
    icon: TrendingUp,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateToSlide = (newIndex: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentIndex(newIndex);
      slideAnim.setValue(-20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      animateToSlide(currentIndex + 1);
    } else {
      await completeOnboarding('/signup-step1');
    }
  };

  const handleSkip = async () => {
    await completeOnboarding('/welcome');
  };

  const handleSignIn = async () => {
    await completeOnboarding('/signin');
  };

  const completeOnboarding = async (targetRoute: string) => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (e) {
      console.warn('Failed to save onboarding flag:', e);
    }
    router.replace(targetRoute as any);
  };

  const currentSlide = ONBOARDING_SLIDES[currentIndex];
  const IconComponent = currentSlide.icon;

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Top bar with progress indicator & Skip */}
        <View style={styles.topBar}>
          {/* Step dots */}
          <View style={styles.dotsContainer}>
            {ONBOARDING_SLIDES.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => animateToSlide(index)}
                style={[
                  styles.dot,
                  index === currentIndex ? styles.activeDot : styles.inactiveDot,
                ]}
                activeOpacity={0.7}
              />
            ))}
          </View>

          {/* Skip button */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Graphic Container */}
        <View style={styles.graphicSection}>
          {currentSlide.customIllustration ? (
            <OnboardingIllustration />
          ) : (
            <View style={styles.iconVisualCard}>
              <View style={styles.glowBackdrop} />
              <View style={styles.centerIconCircle}>
                <IconComponent size={64} color="#00D285" strokeWidth={2.2} />
              </View>

              {/* Decorative badges around icon */}
              <View style={styles.badgeFeaturePill}>
                <Zap size={14} color="#F59E0B" />
                <Text style={styles.badgeFeatureText}>Instant Settlement Engine</Text>
              </View>
            </View>
          )}
        </View>

        {/* Animated Text Content */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.badgeRow}>
            <CheckCircle2 size={14} color="#00D285" />
            <Text style={styles.badgeLabel}>{currentSlide.badge}</Text>
          </View>

          <Text style={styles.headline}>
            {currentSlide.title}{'\n'}
            <Text style={styles.headlineHighlight}>{currentSlide.highlight}</Text>
          </Text>

          <Text style={styles.descriptionText}>
            {currentSlide.description}
          </Text>
        </Animated.View>

        {/* Footer Action Buttons */}
        <View style={styles.footerSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#00D285', '#00A86B']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>
                {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next Step'}
              </Text>
              <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginQuestion}>Already have an account? </Text>
            <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 28,
    backgroundColor: '#00D285',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
  graphicSection: {
    flex: 1.1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconVisualCard: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowBackdrop: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.3)',
  },
  centerIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#131C32',
    borderWidth: 2,
    borderColor: 'rgba(0, 210, 133, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D285',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  badgeFeaturePill: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(19, 28, 50, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgeFeatureText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    fontFamily: 'Inter',
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.25)',
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00D285',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  headlineHighlight: {
    color: '#00D285',
  },
  descriptionText: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    fontFamily: 'Inter',
  },
  footerSection: {
    width: '100%',
    paddingBottom: 8,
    gap: 14,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#00D285',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginQuestion: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00D285',
    fontFamily: 'Inter',
  },
});
