import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldCheck,
  Camera,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Upload,
  RefreshCw
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/Colors';
import { useKyc } from '../constants/KycStore';
import { authService } from '../services/apiService';

export default function KycScreen() {
  const router = useRouter();
  const { status, data, submitKyc, approveKyc, rejectKyc, resetKyc } = useKyc();

  // Form States
  const [fullName, setFullName] = useState(data?.fullName || '');
  const [dob, setDob] = useState(data?.dob || '');
  const [nationality, setNationality] = useState(data?.nationality || 'Nigeria');
  const [idType, setIdType] = useState(data?.idType || 'National ID');
  const [idNumber, setIdNumber] = useState(data?.idNumber || '');
  
  // Document Mock States
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentName, setDocumentName] = useState(data?.documentName || '');
  const [selfieUploading, setSelfieUploading] = useState(false);
  const [selfieName, setSelfieName] = useState(data?.selfieName || '');

  const [formError, setFormError] = useState('');

  // Document Uploads vs API
  const pickAndUploadDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocumentUploading(true);
        const asset = result.assets[0];
        
        // Prepare form data
        const formData = new FormData() as any;
        
        if (Platform.OS === 'web') {
          const resURL = await fetch(asset.uri);
          const blob = await resURL.blob();
          formData.append('document', blob, asset.fileName || 'document.jpg');
        } else {
          formData.append('document', {
            uri: asset.uri,
            name: asset.uri.split('/').pop() || 'document.jpg',
            type: 'image/jpeg',
          });
        }

        const res = await authService.uploadKycDocument(formData);
        
        setDocumentName(asset.uri.split('/').pop() || 'document.jpg');
        // Save the cloudinary URL somewhere if needed, currently we just need the file name to show it's uploaded
        setFormError('');
      }
    } catch (error: any) {
      console.error(error);
      const serverMsg = error.response?.data?.message || error.message;
      setFormError(`Upload failed: ${serverMsg}`);
    } finally {
      setDocumentUploading(false);
    }
  };

  const pickSelfie = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        cameraType: ImagePicker.CameraType.front,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelfieUploading(true);
        const asset = result.assets[0];
        
        // Prepare form data
        const formData = new FormData() as any;
        
        if (Platform.OS === 'web') {
          const resURL = await fetch(asset.uri);
          const blob = await resURL.blob();
          formData.append('document', blob, 'selfie.jpg');
        } else {
          formData.append('document', {
            uri: asset.uri,
            name: 'selfie.jpg',
            type: 'image/jpeg',
          });
        }

        // Normally you might have a separate route or same route. Let's reuse it for now.
        await authService.uploadKycDocument(formData);
        setSelfieName('selfie.jpg');
      }
    } catch (error: any) {
      console.error(error);
      const serverMsg = error.response?.data?.message || error.message;
      setFormError(`Selfie upload failed: ${serverMsg}`);
    } finally {
      setSelfieUploading(false);
    }
  };

  // Submit Form
  const handleSubmit = () => {
    setFormError('');
    if (!fullName.trim()) return setFormError('Full name is required.');
    if (!dob.trim() || dob.length < 10) return setFormError('Provide birth date (YYYY-MM-DD).');
    if (!idNumber.trim()) return setFormError('ID Document number is required.');
    if (!documentName) return setFormError('Please upload your ID scan document.');
    if (!selfieName) return setFormError('Please upload your verification selfie.');

    submitKyc({
      fullName,
      dob,
      nationality,
      idType,
      idNumber,
      documentName,
      selfieName,
    });
  };

  // Admin Controls
  const handleAdminApprove = () => {
    approveKyc();
  };

  const handleAdminReject = () => {
    rejectKyc('The uploaded ID scan is blurry. Please upload a clear photo under good lighting.');
  };

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
            onPress={() => router.canGoBack() ? router.back() : router.replace('/profile')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Identity Verification</Text>
            <Text style={styles.headerSubtitle}>KYC Compliance & Escrow Protection</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* STATE 1: UNVERIFIED OR REJECTED FORM */}
          {(status === 'UNVERIFIED' || status === 'REJECTED') && (
            <View>
              {/* Rejected Notice */}
              {status === 'REJECTED' && (
                <View style={styles.rejectionCard}>
                  <View style={styles.rejectionTitleRow}>
                    <AlertTriangle size={18} color={Colors.dark.red} style={{ marginRight: 8 }} />
                    <Text style={styles.rejectionTitle}>Verification Rejected</Text>
                  </View>
                  <Text style={styles.rejectionText}>{data?.rejectionReason}</Text>
                </View>
              )}

              {/* Top info card */}
              <View style={styles.introCard}>
                <ShieldCheck size={26} color={Colors.dark.primary} style={{ marginBottom: 10 }} />
                <Text style={styles.introTitle}>Secure Your Peeritrade Account</Text>
                <Text style={styles.introDesc}>
                  Under Nigerian financial regulation, we require document confirmation before authorizing active trading contracts and withdrawal transfers.
                </Text>
              </View>

              {formError ? (
                <View style={styles.errorAlert}>
                  <AlertTriangle size={16} color={Colors.dark.red} style={{ marginRight: 8 }} />
                  <Text style={styles.errorAlertText}>{formError}</Text>
                </View>
              ) : null}

              {/* CARD 1: Personal Profile */}
              <View style={styles.formCard}>
                <Text style={styles.cardSectionHeader}>1. Personal Information</Text>

                <Text style={styles.inputLabel}>Full Name (As shown on ID)</Text>
                <TextInput
                  placeholder="e.g. Hafeez Makama"
                  placeholderTextColor="#64748B"
                  style={styles.formInput}
                  value={fullName}
                  onChangeText={setFullName}
                />

                <View style={styles.formRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Date of Birth</Text>
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748B"
                      style={styles.formInput}
                      value={dob}
                      onChangeText={setDob}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>Nationality</Text>
                    <TextInput
                      placeholder="e.g. Nigeria"
                      placeholderTextColor="#64748B"
                      style={styles.formInput}
                      value={nationality}
                      onChangeText={setNationality}
                    />
                  </View>
                </View>
              </View>

              {/* CARD 2: ID Selector & Number */}
              <View style={styles.formCard}>
                <Text style={styles.cardSectionHeader}>2. ID Document Selection</Text>

                <Text style={styles.inputLabel}>Choose Document Type</Text>
                <View style={styles.typeSelectorRow}>
                  {['National ID', 'Driver License', 'Passport'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.selectorPill,
                        idType === type && styles.selectorPillActive,
                      ]}
                      onPress={() => {
                        setIdType(type);
                        setDocumentName(''); // Reset if changed type
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.selectorText,
                          idType === type && styles.selectorTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>{idType} Document Card Number</Text>
                <TextInput
                  placeholder={`Enter your ${idType} registration number`}
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  style={styles.formInput}
                  value={idNumber}
                  onChangeText={setIdNumber}
                />
              </View>

              {/* CARD 3: Document Upload Simulator */}
              <View style={styles.formCard}>
                <Text style={styles.cardSectionHeader}>3. Document Images Upload</Text>
                <Text style={styles.uploadSubtitle}>Provide files for compliance audit.</Text>

                {/* Document Scans */}
                <Text style={styles.uploadLabel}>Front of ID Document</Text>
                {documentName ? (
                  <View style={styles.fileSuccessBox}>
                    <FileText size={18} color={Colors.dark.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.fileNameText} numberOfLines={1}>{documentName}</Text>
                    <TouchableOpacity style={styles.retryUploadBtn} onPress={pickAndUploadDocument}>
                      <RefreshCw size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadBox}
                    onPress={pickAndUploadDocument}
                    disabled={documentUploading}
                    activeOpacity={0.8}
                  >
                    {documentUploading ? (
                      <ActivityIndicator size="small" color={Colors.dark.primary} />
                    ) : (
                      <>
                        <Upload size={20} color="#64748B" style={{ marginBottom: 6 }} />
                        <Text style={styles.uploadBoxText}>Tap to scan Front of Document</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Selfie */}
                <Text style={[styles.uploadLabel, { marginTop: 14 }]}>Selfie holding your {idType}</Text>
                {selfieName ? (
                  <View style={styles.fileSuccessBox}>
                    <Camera size={18} color={Colors.dark.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.fileNameText} numberOfLines={1}>{selfieName}</Text>
                    <TouchableOpacity style={styles.retryUploadBtn} onPress={pickSelfie}>
                      <RefreshCw size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadBox}
                    onPress={pickSelfie}
                    disabled={selfieUploading}
                    activeOpacity={0.8}
                  >
                    {selfieUploading ? (
                      <ActivityIndicator size="small" color={Colors.dark.primary} />
                    ) : (
                      <>
                        <Camera size={20} color="#64748B" style={{ marginBottom: 6 }} />
                        <Text style={styles.uploadBoxText}>Tap to capture confirmation selfie</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>Submit KYC for Verification</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STATE 2: PENDING REVIEW WITH ADMIN SIMULATOR */}
          {status === 'PENDING' && (
            <View>
              {/* Review status card */}
              <View style={styles.pendingCard}>
                <View style={styles.pendingLoaderContainer}>
                  <ActivityIndicator size="large" color="#F59E0B" />
                </View>
                <Text style={styles.pendingTitle}>Compliance Verification Pending</Text>
                <Text style={styles.pendingDesc}>
                  Your personal identity document data has been submitted and is currently locked in queue. Our admins will verify the records shortly.
                </Text>
              </View>

              {/* Submitted Details Review */}
              <View style={styles.summaryCard}>
                <Text style={styles.summarySectionTitle}>Details Submitted</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Full Name</Text>
                  <Text style={styles.summaryValue}>{data?.fullName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date of Birth</Text>
                  <Text style={styles.summaryValue}>{data?.dob}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Nationality</Text>
                  <Text style={styles.summaryValue}>{data?.nationality}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>ID Document Type</Text>
                  <Text style={styles.summaryValue}>{data?.idType}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>ID Number</Text>
                  <Text style={styles.summaryValue}>{data?.idNumber}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Document Scan</Text>
                  <Text style={styles.summaryValue}>{data?.documentName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Verification Selfie</Text>
                  <Text style={styles.summaryValue}>{data?.selfieName}</Text>
                </View>
              </View>

              {/* ADMIN SIMULATOR CONSOLE BOX */}
              <View style={styles.adminConsoleCard}>
                <View style={styles.adminHeader}>
                  <ShieldCheck size={18} color={Colors.dark.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.adminTitle}>Admin Simulator Control Panel</Text>
                </View>
                <Text style={styles.adminDesc}>
                  Use these controls to simulate how an administrator processes verification requests behind the scenes.
                </Text>

                <View style={styles.adminButtonsRow}>
                  <TouchableOpacity
                    style={[styles.adminBtn, styles.adminRejectBtn]}
                    onPress={handleAdminReject}
                    activeOpacity={0.8}
                  >
                    <UserX size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.adminBtnText}>Reject Submission</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.adminBtn, styles.adminApproveBtn]}
                    onPress={handleAdminApprove}
                    activeOpacity={0.8}
                  >
                    <UserCheck size={18} color="#000000" style={{ marginRight: 6 }} />
                    <Text style={[styles.adminBtnText, { color: '#000000' }]}>Approve User</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* STATE 3: VERIFIED STATE */}
          {status === 'VERIFIED' && (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <View style={styles.verifiedIconCircle}>
                <ShieldCheck size={50} color={Colors.dark.primary} />
              </View>
              
              <Text style={styles.verifiedHeader}>Identity Confirmed</Text>
              <Text style={styles.verifiedSub}>Your Peeritrade profile is fully KYC verified</Text>

              <View style={styles.verifiedDetailsCard}>
                <View style={styles.vdRow}>
                  <CheckCircle2 size={16} color={Colors.dark.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.vdText}>KYC Verified Compliance Level 1</Text>
                </View>
                <View style={styles.vdRow}>
                  <CheckCircle2 size={16} color={Colors.dark.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.vdText}>Unlimited Wallet Deposits & Trades</Text>
                </View>
                <View style={styles.vdRow}>
                  <CheckCircle2 size={16} color={Colors.dark.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.vdText}>Unlimited Bank Cash-outs & Payouts</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.vdLabel}>Verified Name</Text>
                  <Text style={styles.vdValue}>{data?.fullName || 'Hafeez Makama'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.vdLabel}>Document Type</Text>
                  <Text style={styles.vdValue}>{data?.idType || 'NIN'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.vdLabel}>National ID Number</Text>
                  <Text style={styles.vdValue}>•••• •••• {data?.idNumber ? data.idNumber.slice(-4) : '8291'}</Text>
                </View>
              </View>

              {/* Reset Control (Testing) */}
              <TouchableOpacity
                style={styles.resetKycBtn}
                onPress={resetKyc}
                activeOpacity={0.8}
              >
                <Text style={styles.resetKycText}>Reset KYC Status (For Testing)</Text>
              </TouchableOpacity>
            </View>
          )}

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
  introCard: {
    backgroundColor: 'rgba(0, 210, 133, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.15)',
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  introDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    fontFamily: 'Inter',
    marginTop: 6,
  },
  rejectionCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  rejectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rejectionTitle: {
    color: Colors.dark.red,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  rejectionText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontFamily: 'Inter',
    lineHeight: 16,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorAlertText: {
    color: Colors.dark.red,
    fontSize: 11,
    fontFamily: 'Inter',
  },
  formCard: {
    backgroundColor: '#131C32',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginBottom: 14,
  },
  cardSectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 6,
    fontFamily: 'Inter',
    marginTop: 10,
  },
  formInput: {
    backgroundColor: '#0A1124',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  selectorPill: {
    backgroundColor: '#0A1124',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  selectorPillActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(0, 210, 133, 0.05)',
  },
  selectorText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  selectorTextActive: {
    color: Colors.dark.primary,
  },
  uploadSubtitle: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Inter',
    marginBottom: 14,
  },
  uploadLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'Inter',
  },
  uploadBox: {
    backgroundColor: '#0A1124',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#334155',
    borderRadius: 12,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxText: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: 'Inter',
  },
  fileSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E294B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
  },
  fileNameText: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
    fontFamily: 'Inter',
  },
  retryUploadBtn: {
    padding: 6,
  },
  submitButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  pendingCard: {
    backgroundColor: '#131C32',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  pendingLoaderContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  pendingDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    textAlign: 'center',
    fontFamily: 'Inter',
    marginTop: 10,
  },
  summaryCard: {
    backgroundColor: '#131C32',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginTop: 12,
  },
  summarySectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Inter',
  },
  summaryValue: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  adminConsoleCard: {
    backgroundColor: '#1E2538',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.dark.electricBlue,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  adminTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  adminDesc: {
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 15,
    fontFamily: 'Inter',
    marginBottom: 14,
  },
  adminButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adminBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminRejectBtn: {
    backgroundColor: Colors.dark.red,
    marginRight: 6,
  },
  adminApproveBtn: {
    backgroundColor: Colors.dark.primary,
    marginLeft: 6,
  },
  adminBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  verifiedIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 210, 133, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  verifiedHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  verifiedSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  verifiedDetailsCard: {
    backgroundColor: '#131C32',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    width: '100%',
    marginTop: 20,
  },
  vdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  vdText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 12,
  },
  vdLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Inter',
  },
  vdValue: {
    fontSize: 11,
    color: Colors.dark.primary,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  resetKycBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 30,
    marginBottom: 20,
  },
  resetKycText: {
    color: Colors.dark.red,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
});
