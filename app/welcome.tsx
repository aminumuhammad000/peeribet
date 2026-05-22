import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingIllustration } from '../components/OnboardingIllustration';
import { CustomButton } from '../components/CustomButton';
import { Colors } from '../constants/Colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Onboarding graphic */}
        <View style={styles.graphicContainer}>
          <OnboardingIllustration />
        </View>

        {/* Copy slogans matching the mockups exactly */}
        <View style={styles.textContainer}>
          <Text style={styles.headline}>
            No bookmaker . Peer-to-Peer . Fair trade
          </Text>
          <Text style={styles.subline}>
            Trade Sport Outcomes Like a Market
          </Text>
          <Text style={styles.accentSubline}>
            Not Betting. Just Trading
          </Text>
        </View>

        {/* Dynamic button controls */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Create Account"
            variant="primary"
            onPress={() => router.push('/signup-step1')}
          />

          {/* Symmetrical lines split by text */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Already have an account?</Text>
            <View style={styles.dividerLine} />
          </View>

          <CustomButton
            title="Log in"
            variant="secondary"
            onPress={() => router.push('/signin')}
          />
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
    paddingBottom: 20,
  },
  graphicContainer: {
    flex: 1.1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  headline: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  subline: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  accentSubline: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B', // Subtle slate border color
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 12,
    fontFamily: 'Inter',
  },
});
