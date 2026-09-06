import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { Colors } from '../constants/Colors';
import { authService, getApiErrorMessage, showToast } from '../services/apiService';

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialEmail = (Array.isArray(params.email) ? params.email[0] : params.email) || '';
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const isResetSuccess = params.resetSuccess === 'true';

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    } else {
      // Auto-load remembered email/identifier from local storage
      AsyncStorage.getItem('rememberedEmail').then((saved) => {
        if (saved && !email) {
          setEmail(saved);
        }
      }).catch(() => {});
    }
  }, [initialEmail]);

  useEffect(() => {
    if (isResetSuccess) {
      showToast('Password reset successful! Please log in.', 'success');
    }
  }, [isResetSuccess]);

  const handleSignIn = async () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    const cleanIdentifier = email.trim();

    if (!cleanIdentifier) {
      setEmailError('Email or username is required');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (isValid) {
      setLoading(true);
      try {
        await authService.login({
          emailOrPhone: cleanIdentifier,
          email: cleanIdentifier,
          username: cleanIdentifier,
          password: password,
        });

        if (rememberMe) {
          await AsyncStorage.setItem('rememberedEmail', cleanIdentifier);
        } else {
          await AsyncStorage.removeItem('rememberedEmail');
        }

        setLoading(false);
        router.replace({ pathname: '/welcome-user', params: { type: 'login' } });
      } catch (err: any) {
        setLoading(false);
        const errorMsg = getApiErrorMessage(err, 'Invalid email or password');

        if (err?.response?.data?.unverified) {
          showToast('Please verify your account OTP', 'info');
          router.push({
            pathname: '/verify-otp',
            params: { email: err.response.data.email || cleanIdentifier, type: 'signup' }
          });
          return;
        }

        setGeneralError(errorMsg);
        if (Platform.OS !== 'web') {
          Alert.alert('Login Failed', errorMsg);
        }
      }
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
            {/* White round back button matching mockup */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <ArrowLeft size={22} color="#0A1124" />
            </TouchableOpacity>

            {/* Typography headers */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Sign In</Text>
              <Text style={styles.subtitle}>Hi, Welcome back. You 've been missed</Text>
            </View>

            {/* Reset password success alert banner if applicable */}
            {isResetSuccess && (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>
                  ✓ Password reset successful! Please enter your new password to sign in.
                </Text>
              </View>
            )}

            {/* General error banner */}
            {generalError ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            ) : null}

            {/* Input Forms */}
            <View style={styles.formContainer}>
              <CustomInput
                label="Email or Username :"
                placeholder="example@gmail.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                  if (generalError) setGeneralError('');
                }}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="username"
                importantForAutofill="yes"
              />

              <CustomInput
                label="Password :"
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                  if (generalError) setGeneralError('');
                }}
                error={passwordError}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                importantForAutofill="yes"
              />

              {/* Remember Me & Forgot Password Row */}
              <View style={styles.rememberRow}>
                <TouchableOpacity
                  style={styles.rememberCheckboxRow}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/forgot-password')}
                  activeOpacity={0.7}
                  style={styles.forgotPasswordContainer}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Submit Control */}
              <CustomButton
                title="Sign In"
                variant="primary"
                onPress={handleSignIn}
                loading={loading}
                style={styles.submitButton}
              />
            </View>

            {/* Footer redirection link */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup-step1')} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Sign Up</Text>
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
  },
  successBanner: {
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    borderWidth: 1,
    borderColor: '#00D285',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  successBannerText: {
    color: '#00D285',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter',
    flex: 1,
    lineHeight: 18,
  },
  formContainer: {
    width: '100%',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  rememberCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  rememberText: {
    color: '#94A3B8',
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter',
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
