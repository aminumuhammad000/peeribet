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
  const [termsError, setTermsError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    let isValid = true;
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('');

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    if (!agreeTerms) {
      setTermsError('You must agree to the Terms & Conditions');
      isValid = false;
    }

    if (isValid) {
      setLoading(true);
      try {
        await authService.register({
          firstName,
          lastName,
          email,
          phone,
          password
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
                onChangeText={setPassword}
                error={passwordError}
                secureTextEntry={true}
              />

              <CustomInput
                label="Confirm Password :"
                placeholder="********"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={confirmPasswordError}
                secureTextEntry={true}
              />

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
                )}
                <Text style={styles.checkboxText}>
                  Agree with <Text style={styles.termsText}>Terms & Condition</Text>
                </Text>
              </TouchableOpacity>
              
              {termsError && <Text style={styles.termsErrorText}>{termsError}</Text>}

              {/* SignUp Trigger */}
              <CustomButton
                title="Sign Up"
                variant="primary"
                onPress={handleSignUp}
                loading={loading}
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
  termsErrorText: {
    color: Colors.dark.red,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginLeft: 4,
    fontFamily: 'Inter',
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
