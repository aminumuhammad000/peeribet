import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, ShieldCheck, Key, Settings, HelpCircle, FileText, LogOut, ChevronRight, Edit2, Check, X, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useKyc } from '../../constants/KycStore';
import { authService } from '../../services/apiService';

export default function ProfileScreen() {
  const router = useRouter();
  const { status } = useKyc();

  // Editable Profile States
  const [profileName, setProfileName] = useState('User');
  const [profileUsername, setProfileUsername] = useState('user');
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      setProfileName(`${userData.firstName} ${userData.lastName}`);
      setProfileUsername(userData.email.split('@')[0]); // Placeholder for username
    } catch (error) {
      console.error('Error fetching user for profile:', error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  };

  const profileEmail = user?.email || '...';
  const profilePhone = user?.phone || '...';

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleStartEdit = () => {
    setTempName(profileName);
    setTempUsername(profileUsername);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (tempName.trim()) {
      setProfileName(tempName);
      setProfileUsername(tempUsername);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            router.replace('/welcome');
          }
        },
      ]
    );
  };

  const getKycBadge = () => {
    switch (status) {
      case 'VERIFIED': return 'VERIFIED';
      case 'PENDING': return 'PENDING';
      case 'REJECTED': return 'REJECTED';
      default: return 'UNVERIFIED';
    }
  };

  const getKycBadgeColor = () => {
    switch (status) {
      case 'VERIFIED': return Colors.dark.primary;
      case 'PENDING': return '#F59E0B';
      case 'REJECTED': return Colors.dark.red;
      default: return '#64748B';
    }
  };

  const getKycSub = () => {
    switch (status) {
      case 'VERIFIED': return 'KYC verified & active';
      case 'PENDING': return 'Under admin review';
      case 'REJECTED': return 'Verification rejected. Retry';
      default: return 'Verify your identity';
    }
  };

  const settingsList = [
    {
      id: '1',
      title: 'Identity Verification',
      sub: getKycSub(),
      icon: <ShieldCheck size={20} color={getKycBadgeColor()} />,
      badge: getKycBadge(),
    },
    {
      id: '2',
      title: 'Security Settings',
      sub: 'Change password & Transaction PIN',
      icon: <Key size={20} color="#3B82F6" />,
      badge: null,
    },
    {
      id: '4',
      title: 'FAQ & Support Helpdesk',
      sub: 'Chat live with escrow handlers',
      icon: <HelpCircle size={20} color="#F59E0B" />,
      badge: null,
    },
    {
      id: '5',
      title: 'Legal & Privacy Policy',
      sub: 'Read Peeritrade rules & guidelines',
      icon: <FileText size={20} color="#10B981" />,
      badge: null,
    },
  ];

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>User Account</Text>
          <User size={22} color={Colors.dark.primary} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
        >
          {/* Avatar and Meta Information */}
          <View style={[styles.avatarCard, { position: 'relative' }]}>
            {!isEditing ? (
              <TouchableOpacity
                style={styles.editIconBtn}
                onPress={handleStartEdit}
                activeOpacity={0.7}
              >
                <Edit2 size={16} color={Colors.dark.primary} />
              </TouchableOpacity>
            ) : null}

            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(isEditing ? tempName : profileName)}</Text>
            </View>

            {!isEditing ? (
              <>
                <Text style={styles.profileName}>{profileName}</Text>
                <Text style={styles.profileUsername}>@{profileUsername}</Text>
                <Text style={styles.profileEmail}>{profileEmail}</Text>
                <Text style={styles.profilePhone}>{profilePhone}</Text>
              </>
            ) : (
              <View style={{ width: '100%', alignItems: 'center' }}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  placeholder="Enter full name"
                  placeholderTextColor="#64748B"
                  style={styles.editInput}
                  value={tempName}
                  onChangeText={setTempName}
                />

                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  placeholder="Enter username"
                  placeholderTextColor="#64748B"
                  style={styles.editInput}
                  value={tempUsername}
                  onChangeText={setTempUsername}
                  autoCapitalize="none"
                />

                <Text style={[styles.inputLabel, { marginTop: 8 }]}>Email (Locked)</Text>
                <View style={styles.lockedInputRow}>
                  <Text style={styles.lockedInputText}>{profileEmail}</Text>
                  <Lock size={12} color="#64748B" style={{ marginLeft: 6 }} />
                </View>

                <Text style={styles.inputLabel}>Phone (Locked)</Text>
                <View style={styles.lockedInputRow}>
                  <Text style={styles.lockedInputText}>{profilePhone}</Text>
                  <Lock size={12} color="#64748B" style={{ marginLeft: 6 }} />
                </View>

                <Text style={styles.lockNoteText}>
                  * Phone and email are verified contact channels and cannot be edited.
                </Text>

                {/* Save & Cancel Row */}
                <View style={styles.editButtonsRow}>
                  <TouchableOpacity
                    style={[styles.editBtn, styles.cancelBtn]}
                    onPress={handleCancelEdit}
                    activeOpacity={0.8}
                  >
                    <X size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                    <Text style={[styles.editBtnText, styles.cancelBtnText]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.editBtn, styles.saveBtn]}
                    onPress={handleSaveEdit}
                    activeOpacity={0.8}
                  >
                    <Check size={12} color="#000000" style={{ marginRight: 4 }} />
                    <Text style={[styles.editBtnText, styles.saveBtnText]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Quick Balance Banner */}
          <View style={styles.balanceBanner}>
            <View>
              <Text style={styles.bbLabel}>Available Balance</Text>
              <Text style={styles.bbNum}>₦{(user?.balance || 0).toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/wallet')}
              activeOpacity={0.8}
              style={styles.bbButton}
            >
              <Text style={styles.bbButtonText}>Fund Wallet</Text>
            </TouchableOpacity>
          </View>

          {/* Configuration Lists */}
          <Text style={styles.sectionTitle}>Account Settings</Text>

          {settingsList.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              style={styles.settingCard}
              onPress={() => {
                if (item.id === '1') {
                  router.push('/kyc');
                } else if (item.id === '2') {
                  router.push('/security');
                } else if (item.id === '4') {
                  router.push('/helpdesk');
                } else if (item.id === '5') {
                  router.push('/legal');
                }
              }}
            >
              <View style={styles.settingIconBox}>
                {item.icon}
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingSub}>{item.sub}</Text>
              </View>
              {item.badge ? (
                <View style={[
                  styles.verifiedBadge,
                  item.id === '1' && {
                    backgroundColor: status === 'VERIFIED' ? 'rgba(0, 210, 133, 0.1)' : status === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' : status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    borderColor: status === 'VERIFIED' ? 'rgba(0, 210, 133, 0.3)' : status === 'PENDING' ? 'rgba(245, 158, 11, 0.3)' : status === 'REJECTED' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(100, 116, 139, 0.3)',
                  }
                ]}>
                  <Text style={[
                    styles.verifiedBadgeText,
                    item.id === '1' && {
                      color: getKycBadgeColor(),
                    }
                  ]}>{item.badge}</Text>
                </View>
              ) : (
                <ChevronRight size={18} color="#64748B" />
              )}
            </TouchableOpacity>
          ))}

          {/* Log Out Control */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={styles.logoutButton}
          >
            <LogOut size={20} color={Colors.dark.red} style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log Out Account</Text>
          </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatarCard: {
    backgroundColor: '#131C32',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  profileEmail: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  profilePhone: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  balanceBanner: {
    backgroundColor: '#1E294B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bbLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  bbNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  bbButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bbButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 10,
  },
  settingCard: {
    backgroundColor: '#131C32',
    borderRadius: 16,
    padding: 14,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  settingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0A1124',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  settingSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(0, 210, 133, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.3)',
  },
  verifiedBadgeText: {
    color: Colors.dark.primary,
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Inter',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    height: 48,
    marginTop: 24,
    marginBottom: 8,
  },
  logoutText: {
    color: Colors.dark.red,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  profileUsername: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontFamily: 'Inter',
    marginTop: 2,
    fontWeight: 'bold',
  },
  editIconBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A1124',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  editInput: {
    backgroundColor: '#0A1124',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    height: 36,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Inter',
    width: '100%',
  },
  lockedInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    height: 36,
    paddingHorizontal: 12,
    width: '100%',
  },
  lockedInputText: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'Inter',
  },
  lockNoteText: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
  },
  editBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  saveBtn: {
    backgroundColor: Colors.dark.primary,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: 'transparent',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  saveBtnText: {
    color: '#000000',
  },
  cancelBtnText: {
    color: '#94A3B8',
  },
});
