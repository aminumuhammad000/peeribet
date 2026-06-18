import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Square, CheckSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { Colors } from '../constants/Colors';
import { authService } from '../services/apiService';

export default function SignUpStep3Screen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { firstName, lastName, email, phone } = params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Real-time validators ──────────────────────────────────────────
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required');
    } else if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else if (!/[A-Z]/.test(value)) {
      setPasswordError('Password must contain at least one uppercase letter');
    } else if (!/[0-9]/.test(value)) {
      setPasswordError('Password must contain at least one number');
    } else {
      setPasswordError('');
    }
  };

  const validateConfirmPassword = (value: string, pwd = password) => {
    if (!value) {
      setConfirmPasswordError('Please confirm your password');
    } else if (value !== pwd) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePassword(value);
    // Re-validate confirmPassword whenever password changes
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword, value);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    validateConfirmPassword(value);
  };

  // Password strength helpers
  const getPasswordStrength = (): { label: string; color: string; width: string } => {
    if (!password) return { label: '', color: 'transparent', width: '0%' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { label: 'Weak', color: '#EF4444', width: '25%' };
    if (score <= 2) return { label: 'Fair', color: '#F97316', width: '50%' };
    if (score <= 3) return { label: 'Good', color: '#EAB308', width: '75%' };
    return { label: 'Strong', color: '#22C55E', width: '100%' };
  };

  const strength = getPasswordStrength();

  // Button enabled only when all fields pass and terms agreed
  const isFormValid =
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    !passwordError &&
    confirmPassword === password &&
    !confirmPasswordError &&
    agreeTerms;

  const handleSignUp = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      await authService.register({
        firstName,
        lastName,
        email,
        phone,
        password,
      });
      setLoading(false);
      router.push({
        pathname: '/verify-otp',
        params: { email, phone },
      });
    } catch (error: any) {
      setLoading(false);
      const errorMsg = error.response?.data?.message || 'Something went wrong. Please try again.';
      Alert.alert('Registration Failed', errorMsg);
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
                Setup a strong password to protect your escrow outcomes trading account
              </Text>
            </View>

            {/* Input Forms */}
            <View style={styles.formContainer}>
              <CustomInput
                label="Password :"
                placeholder="********"
                value={password}
                onChangeText={handlePasswordChange}
                error={passwordError}
                secureTextEntry={true}
              />

              {/* Password strength bar */}
              {password.length > 0 ? (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarTrack}>
                    <View style={[styles.strengthBarFill, { width: strength.width, backgroundColor: strength.color }]} />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              ) : null}<CustomInput
                label="Confirm Password :"
                placeholder="********"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                error={confirmPasswordError}
                secureTextEntry={true}
              />

              {/* Password criteria hints */}
              <View style={styles.criteriaContainer}>
                <CriteriaRow met={password.length >= 6} text="At least 6 characters" />
                <CriteriaRow met={/[A-Z]/.test(password)} text="One uppercase letter" />
                <CriteriaRow met={/[0-9]/.test(password)} text="One number" />
                <CriteriaRow met={confirmPassword.length > 0 && confirmPassword === password} text="Passwords match" />
              </View>

              {/* Custom terms & condition selection row */}
              <TouchableOpacity
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.7}
                style={styles.checkboxContainer}
              >
                {agreeTerms ? (
                  <CheckSquare size={22} color={Colors.dark.primary} />
                ) : (
                  <Square size={22} color="#64748B" />
                )}<Text style={styles.checkboxText}>
                  Agree with <Text style={styles.termsText}>Terms & Condition</Text>
                </Text>
              </TouchableOpacity>

              {/* SignUp Trigger */}
              <CustomButton
                title="Sign Up"
                variant="primary"
                onPress={handleSignUp}
                loading={loading}
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

// ── Criteria row helper component ─────────────────────────────────────
function CriteriaRow({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={criteriaStyles.row}>
      <View style={[criteriaStyles.dot, { backgroundColor: met ? '#22C55E' : '#64748B' }]} />
      <Text style={[criteriaStyles.text, { color: met ? '#22C55E' : '#94A3B8' }]}>{text}</Text>
    </View>
  );
}

const criteriaStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
});

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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 8,
    gap: 10,
  },
  strengthBarTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
    width: 44,
    textAlign: 'right',
  },
  criteriaContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingVertical: 4,
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  termsText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 16,
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
