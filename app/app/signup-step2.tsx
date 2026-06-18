import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { Colors } from '../constants/Colors';
import { authService } from '../services/apiService';

export default function SignUpStep2Screen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { firstName, lastName } = params;

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (!value.trim()) {
      setEmailError('Email address is required');
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (!value.trim()) {
      setPhoneError('Phone number is required');
    } else if (value.length < 8) {
      setPhoneError('Please enter a valid phone number');
    } else {
      setPhoneError('');
    }
  };

  // Debounced availability checks
  useEffect(() => {
    if (!email || emailError || !/\S+@\S+\.\S+/.test(email)) {
      setIsCheckingEmail(false);
      return;
    }
    setIsCheckingEmail(true);
    const timer = setTimeout(async () => {
      try {
        const res = await authService.checkAvailability({ email: email.trim() });
        if (!res.available) setEmailError(res.message);
      } catch (err: any) {
        if (err.response?.status === 400) setEmailError(err.response.data.message);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [email]);

  useEffect(() => {
    if (!phone || phoneError || phone.length < 8) {
      setIsCheckingPhone(false);
      return;
    }
    setIsCheckingPhone(true);
    const timer = setTimeout(async () => {
      try {
        const res = await authService.checkAvailability({ phone: phone.trim() });
        if (!res.available) setPhoneError(res.message);
      } catch (err: any) {
        if (err.response?.status === 400) setPhoneError(err.response.data.message);
      } finally {
        setIsCheckingPhone(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [phone]);

  // Button enabled only when both fields pass
  const isFormValid =
    email.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(email) &&
    phone.length >= 8 &&
    !emailError &&
    !phoneError &&
    !isCheckingEmail &&
    !isCheckingPhone;

  const handleNext = async () => {
    if (!isFormValid) return;
    
    // Final defensive check before proceeding
    setIsCheckingEmail(true);
    setIsCheckingPhone(true);
    try {
      const [emailStatus, phoneStatus] = await Promise.all([
        authService.checkAvailability({ email: email.trim() }),
        authService.checkAvailability({ phone: phone.trim() })
      ]);
      
      if (!emailStatus.available) {
        setEmailError(emailStatus.message);
        return;
      }
      if (!phoneStatus.available) {
        setPhoneError(phoneStatus.message);
        return;
      }

      router.push({
        pathname: '/signup-step3',
        params: { firstName, lastName, email, phone },
      });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg?.toLowerCase().includes('email')) setEmailError(msg);
      else if (msg?.toLowerCase().includes('phone')) setPhoneError(msg);
    } finally {
      setIsCheckingEmail(false);
      setIsCheckingPhone(false);
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
                error={emailError}
                keyboardType="email-address"
              />

              <CustomInput
                label="Phone Number :"
                placeholder="+234"
                value={phone}
                onChangeText={handlePhoneChange}
                error={phoneError}
                keyboardType="phone-pad"
              />

              {/* Next Control */}
              <CustomButton
                title="Next"
                variant="primary"
                onPress={handleNext}
                disabled={!isFormValid}
                loading={isCheckingEmail || isCheckingPhone}
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
