import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomButton } from '../components/CustomButton';
import { Colors } from '../constants/Colors';
import { authService } from '../services/apiService';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || 'user@example.com';
  const context = params.context as string | undefined;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(59);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChangeText = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Auto-focus previous on backspace delete
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyOtp({ email, otp: code });
      setLoading(false);
      
      if (context === 'reset_password') {
        router.replace({ pathname: '/reset-password', params: { email } });
      } else {
        router.replace({ pathname: '/welcome-user', params: { type: 'signup' } });
      }
    } catch (err: any) {
      setLoading(false);
      const errorMsg = err.response?.data?.message || 'Invalid or expired OTP';
      setError(errorMsg);
      Alert.alert('Verification Failed', errorMsg);
    }
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(59);
      setOtp(['', '', '', '', '', '']);
      setError('');
      inputs.current[0]?.focus();
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
            {/* Circular back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <ArrowLeft size={22} color="#0A1124" />
            </TouchableOpacity>

            {/* Main Header typography */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>OTP Verification</Text>
              <Text style={styles.subtitle}>
                We have sent a verification code to your email:{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>

            {/* OTP Input Boxes */}
            <View style={styles.otpOuterContainer}>
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputs.current[index] = ref; }}
                    value={digit}
                    onChangeText={(text) => handleChangeText(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus={true}
                    style={[styles.otpBox, error ? styles.otpBoxError : null]}
                  />
                ))}
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            {/* Timer or Resend link */}
            <View style={styles.timerContainer}>
              {timer > 0 ? (
                <Text style={styles.timerText}>
                  Resend code in <Text style={styles.timerAccent}>{timer}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                  <Text style={styles.resendLink}>Resend Code</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Action */}
            <CustomButton
              title="Verify"
              variant="primary"
              onPress={handleVerify}
              loading={loading}
              style={styles.submitButton}
            />

            {/* Recheck link */}
            <TouchableOpacity
              onPress={() => router.replace('/signup-step2')}
              activeOpacity={0.7}
              style={styles.recheckContainer}
            >
              <Text style={styles.recheckText}>Recheck email</Text>
            </TouchableOpacity>
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
    lineHeight: 22,
  },
  emailHighlight: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  otpOuterContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
  },
  otpBox: {
    width: 48,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#0A1124',
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
  },
  otpBoxError: {
    borderColor: Colors.dark.red,
    borderWidth: 1.5,
  },
  errorText: {
    color: Colors.dark.red,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    fontFamily: 'Inter',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  timerAccent: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  resendLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
    fontFamily: 'Inter',
  },
  submitButton: {
    marginTop: 8,
  },
  recheckContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  recheckText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: 'Inter',
  },
});
