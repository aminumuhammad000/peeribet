import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { Colors } from '../constants/Colors';
import { authService } from '../services/apiService';

type AvailabilityState = 'idle' | 'checking' | 'available' | 'error';

export default function SignUpStep2Screen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { firstName, lastName } = params;

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailState, setEmailState] = useState<AvailabilityState>('idle');
  const [phoneState, setPhoneState] = useState<AvailabilityState>('idle');

  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validate and check email availability
  const checkEmail = async (candidateEmail: string) => {
    const trimmed = candidateEmail.trim();
    if (!trimmed) {
      setEmailState('idle');
      setEmailError('');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setEmailState('error');
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailState('checking');
    setEmailError('');

    try {
      const res = await authService.checkAvailability({ email: trimmed });
      if (res && res.available === false) {
        setEmailState('error');
        setEmailError(res.message || 'Email is already registered');
      } else {
        setEmailState('available');
        setEmailError('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error verifying email';
      setEmailState('error');
      setEmailError(msg);
    }
  };

  // Validate and check phone availability
  const checkPhone = async (candidatePhone: string) => {
    const trimmed = candidatePhone.trim();
    if (!trimmed) {
      setPhoneState('idle');
      setPhoneError('');
      return;
    }

    if (trimmed.length < 8) {
      setPhoneState('error');
      setPhoneError('Please enter a valid phone number');
      return;
    }

    setPhoneState('checking');
    setPhoneError('');

    try {
      const res = await authService.checkAvailability({ phone: trimmed });
      if (res && res.available === false) {
        setPhoneState('error');
        setPhoneError(res.message || 'Phone number is already registered');
      } else {
        setPhoneState('available');
        setPhoneError('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error verifying phone number';
      setPhoneState('error');
      setPhoneError(msg);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const trimmed = value.trim();

    if (emailDebounceRef.current) {
      clearTimeout(emailDebounceRef.current);
    }

    if (!trimmed) {
      setEmailState('idle');
      setEmailError('');
      return;
    }

    // Only start checking when format looks complete
    if (/\S+@\S+\.\S+/.test(trimmed)) {
      setEmailState('checking');
      setEmailError('');
      emailDebounceRef.current = setTimeout(() => {
        checkEmail(trimmed);
      }, 250);
    } else {
      setEmailState('idle');
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailState('error');
      setEmailError('Email address is required');
    } else if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setEmailState('error');
      setEmailError('Please enter a valid email address');
    } else if (emailState !== 'available') {
      checkEmail(trimmed);
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const trimmed = value.trim();

    if (phoneDebounceRef.current) {
      clearTimeout(phoneDebounceRef.current);
    }

    if (!trimmed) {
      setPhoneState('idle');
      setPhoneError('');
      return;
    }

    if (trimmed.length >= 8) {
      setPhoneState('checking');
      setPhoneError('');
      phoneDebounceRef.current = setTimeout(() => {
        checkPhone(trimmed);
      }, 250);
    } else {
      setPhoneState('idle');
      setPhoneError('');
    }
  };

  const handlePhoneBlur = () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setPhoneState('error');
      setPhoneError('Phone number is required');
    } else if (trimmed.length < 8) {
      setPhoneState('error');
      setPhoneError('Please enter a valid phone number');
    } else if (phoneState !== 'available') {
      checkPhone(trimmed);
    }
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
      if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
    };
  }, []);

  // Form is valid only when both email and phone are verified available
  const isFormValid =
    emailState === 'available' &&
    phoneState === 'available' &&
    !emailError &&
    !phoneError;

  const handleNext = () => {
    if (!isFormValid) return;
    router.push({
      pathname: '/signup-step3',
      params: { firstName, lastName, email: email.trim(), phone: phone.trim() },
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

            {/* Typography Headers */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Fill your information below or register with your social account
              </Text>
            </View>

            {/* Input Forms */}
            <View style={styles.formContainer}>
              <CustomInput
                label="Email address :"
                placeholder="Example@gmail.com"
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                error={emailError}
                success={emailState === 'available'}
                successMessage={emailState === 'available' ? 'Email is available' : undefined}
                loading={emailState === 'checking'}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <CustomInput
                label="Phone Number :"
                placeholder="+234"
                value={phone}
                onChangeText={handlePhoneChange}
                onBlur={handlePhoneBlur}
                error={phoneError}
                success={phoneState === 'available'}
                successMessage={phoneState === 'available' ? 'Phone number is available' : undefined}
                loading={phoneState === 'checking'}
                keyboardType="phone-pad"
              />

              {/* Next Control */}
              <CustomButton
                title="Next"
                variant="primary"
                onPress={handleNext}
                disabled={!isFormValid}
                loading={emailState === 'checking' || phoneState === 'checking'}
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
