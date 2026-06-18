import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Lock,
  Shield,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { authService } from '../services/apiService';

export default function SecurityScreen() {
  const router = useRouter();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userObj = await authService.getMe();
      setHasPin(userObj.hasPin);
    } catch (err) {
      console.log('Failed to fetch user', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  // Collapsible section states
  const [expandedSection, setExpandedSection] = useState<'password' | 'pin' | null>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Transaction PIN states
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinError, setPinError] = useState('');

  const toggleSection = (section: 'password' | 'pin') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleUpdatePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      await authService.updatePassword({
        currentPassword,
        newPassword
      });
      
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      setPasswordError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // PIN validation & handler
  const handleUpdatePin = async () => {
    setPinError('');
    setPinSuccess(false);

    if (hasPin && currentPin.length !== 4) {
      setPinError('Please enter your current 4-digit PIN.');
      return;
    }
    if (newPin.length !== 4 || confirmPin.length !== 4) {
      setPinError('New PINs must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('New PIN verification failed.');
      return;
    }

    try {
      setPinLoading(true);
      const res = await authService.updatePin({
        currentPin: hasPin ? currentPin : undefined,
        newPin
      });
      
      setPinSuccess(true);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setHasPin(res.hasPin); // Update UI to now require current PIN next time
      setTimeout(() => setPinSuccess(false), 3000);
    } catch (error: any) {
      setPinError(error.response?.data?.message || 'Failed to update PIN');
    } finally {
      setPinLoading(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: '', color: '#1E293B' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    switch (score) {
      case 1:
        return { score, label: 'Weak Password', color: Colors.dark.red };
      case 2:
        return { score, label: 'Moderate Password', color: '#F59E0B' };
      case 3:
        return { score, label: 'Strong Password', color: '#3B82F6' };
      case 4:
        return { score, label: 'Very Secure Password', color: Colors.dark.primary };
      default:
        return { score: 0, label: '', color: '#1E293B' };
    }
  };

  const pStrength = getPasswordStrength();

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Security Settings</Text>
            <Text style={styles.headerSubtitle}>Manage your account access & authorization PIN</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <Text style={styles.sectionHeader}>Security Access Control</Text>

          {/* MODULE 1: CHANGE PASSWORD */}
          <View style={styles.collapsibleCard}>
            <TouchableOpacity 
              style={styles.cardHeader} 
              onPress={() => toggleSection('password')}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderIconLabel}>
                <Lock size={18} color={Colors.dark.primary} style={{ marginRight: 12 }} />
                <Text style={styles.cardHeaderTitle}>Change Account Password</Text>
              </View>
              {expandedSection === 'password' ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
            </TouchableOpacity>

            {expandedSection === 'password' && (
              <View style={styles.cardBody}>
                {passwordSuccess && (
                  <View style={styles.alertSuccess}>
                    <CheckCircle2 size={16} color={Colors.dark.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.alertSuccessText}>Password updated successfully!</Text>
                  </View>
                )}
                {passwordError ? (
                  <View style={styles.alertError}>
                    <AlertCircle size={16} color={Colors.dark.red} style={{ marginRight: 8 }} />
                    <Text style={styles.alertErrorText}>{passwordError}</Text>
                  </View>
                ) : null}

                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    placeholder="Enter current password"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showCurrentPassword}
                    style={styles.formInput}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeBtn}>
                    {showCurrentPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    placeholder="Min 8 characters"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showNewPassword}
                    style={styles.formInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                    {showNewPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                  </TouchableOpacity>
                </View>

                {newPassword ? (
                  <View style={styles.strengthContainer}>
                    <Text style={[styles.strengthText, { color: pStrength.color }]}>{pStrength.label}</Text>
                    <View style={styles.strengthBarBg}>
                      <View style={[styles.strengthBarFill, { 
                        width: `${(pStrength.score / 4) * 100}%`, 
                        backgroundColor: pStrength.color 
                      }]} />
                    </View>
                  </View>
                ) : null}

                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    placeholder="Re-enter new password"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showConfirmPassword}
                    style={styles.formInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                    {showConfirmPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.submitBtn, passwordLoading && { opacity: 0.7 }]} 
                  onPress={handleUpdatePassword}
                  disabled={passwordLoading}
                  activeOpacity={0.8}
                >
                  {passwordLoading ? <ActivityIndicator size="small" color="#000000" /> : <Text style={styles.submitBtnText}>Update Password</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* MODULE 2: TRANSACTION PIN */}
          <View style={styles.collapsibleCard}>
            <TouchableOpacity 
              style={styles.cardHeader} 
              onPress={() => toggleSection('pin')}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderIconLabel}>
                <Shield size={18} color="#3B82F6" style={{ marginRight: 12 }} />
                <Text style={styles.cardHeaderTitle}>{hasPin ? 'Change Transaction PIN' : 'Create Transaction PIN'}</Text>
              </View>
              {expandedSection === 'pin' ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
            </TouchableOpacity>

            {expandedSection === 'pin' && (
              <View style={styles.cardBody}>
                <Text style={styles.infoBoxText}>
                  💡 The 4-digit PIN is required to authorize escrow deposits, withdrawals, and platform trades.
                </Text>

                {pinSuccess && (
                  <View style={styles.alertSuccess}>
                    <CheckCircle2 size={16} color={Colors.dark.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.alertSuccessText}>Transaction PIN successfully updated!</Text>
                  </View>
                )}
                {pinError ? (
                  <View style={styles.alertError}>
                    <AlertCircle size={16} color={Colors.dark.red} style={{ marginRight: 8 }} />
                    <Text style={styles.alertErrorText}>{pinError}</Text>
                  </View>
                ) : null}

                {hasPin && (
                  <>
                    <Text style={styles.inputLabel}>Current 4-Digit PIN</Text>
                    <TextInput
                      placeholder="● ● ● ●"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      style={styles.pinInput}
                      value={currentPin}
                      onChangeText={setCurrentPin}
                    />
                  </>
                )}

                <Text style={styles.inputLabel}>New 4-Digit PIN</Text>
                <TextInput
                  placeholder="● ● ● ●"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  style={styles.pinInput}
                  value={newPin}
                  onChangeText={setNewPin}
                />

                <Text style={styles.inputLabel}>Confirm New PIN</Text>
                <TextInput
                  placeholder="● ● ● ●"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  style={styles.pinInput}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                />

                <TouchableOpacity 
                  style={[styles.submitBtn, { backgroundColor: '#3B82F6' }, pinLoading && { opacity: 0.7 }]} 
                  onPress={handleUpdatePin}
                  disabled={pinLoading}
                  activeOpacity={0.8}
                >
                  {pinLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.submitBtnText}>{hasPin ? 'Update PIN' : 'Set PIN'}</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>

        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#131C32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    fontFamily: 'Inter',
    marginTop: 20,
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  collapsibleCard: {
    backgroundColor: '#131C32',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    padding: 16,
    backgroundColor: '#0E1629',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'Inter',
    marginTop: 12,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A1124',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  formInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter',
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  submitBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  infoBoxText: {
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    padding: 10,
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  pinInput: {
    backgroundColor: '#0A1124',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    height: 40,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 6,
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 133, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  alertSuccessText: {
    color: Colors.dark.primary,
    fontSize: 11,
    fontFamily: 'Inter',
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  alertErrorText: {
    color: Colors.dark.red,
    fontSize: 11,
    fontFamily: 'Inter',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  strengthText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  strengthBarBg: {
    width: 100,
    height: 4,
    backgroundColor: '#0A1124',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
