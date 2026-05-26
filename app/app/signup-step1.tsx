import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { Colors } from '../constants/Colors';

export default function SignUpStep1Screen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');

  const handleNext = () => {
    let isValid = true;
    setFirstNameError('');
    setLastNameError('');

    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    }

    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    }

    if (isValid) {
      router.push({
        pathname: '/signup-step2',
        params: { firstName, lastName },
      });
    }
  };

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Round Back button matching mockups */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <ArrowLeft size={22} color="#0A1124" />
            </TouchableOpacity>

            {/* Header branding titles */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Fill your information below or register with your social account
              </Text>
            </View>

            {/* User Input Forms */}
            <View style={styles.formContainer}>
              <CustomInput
                label="First Name :"
                placeholder="Ex. Hafeez"
                value={firstName}
                onChangeText={setFirstName}
                error={firstNameError}
              />

              <CustomInput
                label="Last Name :"
                placeholder="Ex. Makama"
                value={lastName}
                onChangeText={setLastName}
                error={lastNameError}
              />

              {/* Action Trigger */}
              <CustomButton
                title="Next"
                variant="primary"
                onPress={handleNext}
                style={styles.submitButton}
              />
            </View>

            {/* Footer redirect */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signin')} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  demoBanner: {
    backgroundColor: 'rgba(0, 210, 133, 0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.25)',
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  demoBannerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  demoBannerTap: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3B82F6',
    fontFamily: 'Inter',
    textDecorationLine: 'underline',
  },
  demoBannerSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  headerContainer: {
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
  },
  submitButton: {
    marginTop: 20,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 36,
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  footerLink: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
});
