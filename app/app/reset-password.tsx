import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { Colors } from '../constants/Colors';
import { authService } from '../services/apiService';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string || '';
  const otp = params.otp as string || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    let isValid = true;
    setPasswordError('');
    setConfirmPasswordError('');

    if (!password) {
      setPasswordError('New password is required');
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

    if (isValid) {
      setLoading(true);
      try {
        await authService.resetPassword({ email, otp, newPassword: password });
        setLoading(false);
        Alert.alert('Success', 'Password reset successfully!', [
          { text: 'Sign In', onPress: () => router.replace('/signin') },
        ]);
      } catch (err: any) {
        setLoading(false);
        const errorMsg = err.response?.data?.message || 'Failed to reset password. Please try again.';
        Alert.alert('Error', errorMsg);
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
            {/* White round back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <ArrowLeft size={22} color="#0A1124" />
            </TouchableOpacity>

            <View style={styles.mainContent}>
              {/* Typography headers */}
              <View style={styles.headerContainer}>
                <Text style={styles.title}>Create New Password</Text>
                <Text style={styles.subtitle}>Your new password must be different from previous used passwords.</Text>
              </View>

              {/* Input Forms */}
              <View style={styles.formContainer}>
                <CustomInput
                  label="New Password :"
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

                {/* Submit Control */}
                <CustomButton
                  title="Reset Password"
                  variant="primary"
                  onPress={handleResetPassword}
                  loading={loading}
                  style={styles.submitButton}
                />
              </View>
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
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 8,
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
    marginTop: 24,
  },
});
