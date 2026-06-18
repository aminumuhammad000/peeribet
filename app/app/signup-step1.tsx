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

  // ── Real-time validators ──────────────────────────────────────────
  const validateFirstName = (value: string) => {
    if (!value.trim()) {
      setFirstNameError('First name is required');
    } else if (value.trim().length < 2) {
      setFirstNameError('First name must be at least 2 characters');
    } else {
      setFirstNameError('');
    }
  };

  const validateLastName = (value: string) => {
    if (!value.trim()) {
      setLastNameError('Last name is required');
    } else if (value.trim().length < 2) {
      setLastNameError('Last name must be at least 2 characters');
    } else {
      setLastNameError('');
    }
  };

  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    validateFirstName(value);
  };

  const handleLastNameChange = (value: string) => {
    setLastName(value);
    validateLastName(value);
  };

  // Button is only enabled when both fields pass validation
  const isFormValid =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    !firstNameError &&
    !lastNameError;

  const handleNext = () => {
    if (!isFormValid) return;
    router.push({
      pathname: '/signup-step2',
      params: { firstName, lastName },
    });
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
                placeholder="Ex. John"
                value={firstName}
                onChangeText={handleFirstNameChange}
                error={firstNameError}
              />

              <CustomInput
                label="Last Name :"
                placeholder="Ex. Doe"
                value={lastName}
                onChangeText={handleLastNameChange}
                error={lastNameError}
              />

              {/* Action Trigger */}
              <CustomButton
                title="Next"
                variant="primary"
                onPress={handleNext}
                disabled={!isFormValid}
                style={styles.submitButton}
              />
            </View>

            {/* Footer redirect */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text><TouchableOpacity onPress={() => router.push('/signin')} activeOpacity={0.7}>
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
