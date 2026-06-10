import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, ChevronDown, Search, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { Colors } from '../constants/Colors';
import { authService, walletService } from '../services/apiService';

export default function WithdrawScreen() {
  const router = useRouter();

  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resolvedName, setResolvedName] = useState('');
  const [bankError, setBankError] = useState('');
  const [accountError, setAccountError] = useState('');
  const [amountError, setAmountError] = useState('');
  
  // Bank Picker State
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [u, b] = await Promise.all([
          authService.getMe(),
          walletService.getBanks()
        ]);
        setUser(u);
        setBanks(b.data || b);
      } catch (err) {
        console.error('Failed to init withdrawal:', err);
      }
    };
    init();
  }, []);

  // Handle Name Enquiry when 10 digits are filled
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) {
      handleNameEnquiry();
    } else {
      setResolvedName('');
    }
  }, [accountNumber, selectedBank]);

  const handleNameEnquiry = async () => {
    setVerifying(true);
    setAccountError('');
    try {
      const res = await walletService.verifyBankAccount(selectedBank.code, accountNumber);
      setResolvedName(res.data.accountName);
    } catch (err: any) {
      setAccountError(err.response?.data?.message || 'Verification failed');
      setResolvedName('');
    } finally {
      setVerifying(false);
    }
  };

  const handleWithdraw = async () => {
    let isValid = true;
    setBankError('');
    setAccountError('');
    setAmountError('');

    if (!selectedBank) {
      setBankError('Please select a bank');
      isValid = false;
    }

    if (accountNumber.length !== 10) {
      setAccountError('Account number must be 10 digits');
      isValid = false;
    } else if (!resolvedName) {
      setAccountError('Please verify account number first');
      isValid = false;
    }

    const parsedAmount = parseFloat(amount) || 0;
    const availableBalance = user?.balance || 0;

    if (parsedAmount <= 0) {
      setAmountError('Please enter amount');
      isValid = false;
    } else if (parsedAmount < 100) {
      setAmountError('Minimum withdrawal is ₦100');
      isValid = false;
    } else if (parsedAmount > availableBalance) {
      setAmountError('Amount exceeds available balance');
      isValid = false;
    }

    if (isValid) {
      setLoading(true);
      try {
        await walletService.requestWithdrawal({
          amount: parsedAmount,
          bankCode: selectedBank.code,
          accountNumber,
          accountName: resolvedName
        });
        
        Alert.alert('Success', 'Withdrawal processed successfully!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/wallet') }
        ]);
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.message || 'Payout failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredBanks = banks.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={22} color="#0A1124" />
            </TouchableOpacity>

            <View style={styles.headerContainer}>
              <Text style={styles.title}>Withdraw Funds</Text>
              <Text style={styles.subtitle}>Payout settled instantly to your registered commercial bank</Text>
            </View>

            <View style={styles.balanceInfoCard}>
              <Text style={styles.balanceInfoLabel}>Available for Payout</Text>
              <Text style={styles.balanceInfoNum}>₦{(user?.balance || 0).toLocaleString()}</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Bank Selection */}
              <Text style={styles.inputLabel}>Bank Name :</Text>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => setShowBankPicker(true)} 
                style={[styles.bankSelector, bankError ? { borderColor: Colors.dark.red } : null]}
              >
                <Text style={[styles.bankValue, !selectedBank ? { color: '#94A3B8' } : null]}>
                  {selectedBank ? selectedBank.name : 'Select Destination Bank'}
                </Text>
                <ChevronDown size={20} color="#64748B" />
              </TouchableOpacity>
              {bankError ? <Text style={styles.errorText}>{bankError}</Text> : null}

              {/* Account Number */}
              <CustomInput
                label="Account Number :"
                placeholder="Ex. 0123456789"
                value={accountNumber}
                onChangeText={(text) => {
                  setAccountNumber(text.replace(/[^0-9]/g, '').slice(0, 10));
                  setAccountError('');
                  setResolvedName('');
                }}
                error={accountError}
                keyboardType="numeric"
                maxLength={10}
              />

              {/* Resolved account name display */}
              {verifying ? (
                <View style={styles.verifyingContainer}>
                  <ActivityIndicator size="small" color={Colors.dark.primary} />
                  <Text style={styles.verifyingText}>Resolving account name...</Text>
                </View>
              ) : resolvedName ? (
                <View style={styles.resolvedContainer}>
                  <Check size={16} color={Colors.dark.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.resolvedLabel}>Resolved Name: </Text>
                  <Text style={styles.resolvedValue}>{resolvedName}</Text>
                </View>
              ) : null}

              {/* Amount */}
              <CustomInput
                label="Amount (₦) :"
                placeholder="Ex. 5000"
                value={amount}
                onChangeText={(text) => {
                  setAmount(text.replace(/[^0-9]/g, ''));
                  setAmountError('');
                }}
                error={amountError}
                keyboardType="numeric"
              />

              <CustomButton
                title="Confirm Withdrawal"
                variant="primary"
                onPress={handleWithdraw}
                loading={loading}
                style={styles.submitButton}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bank Picker Modal */}
        <Modal visible={showBankPicker} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Bank</Text>
                <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                  <X size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <Search size={18} color="#64748B" />
                <TextInput 
                  placeholder="Search bank name..." 
                  placeholderTextColor="#64748B"
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <FlatList
                data={filteredBanks}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.bankItem} 
                    onPress={() => {
                      setSelectedBank(item);
                      setShowBankPicker(false);
                      setBankError('');
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.bankItemName}>{item.name}</Text>
                    {selectedBank?.code === item.code && <Check size={18} color={Colors.dark.primary} />}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
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
  balanceInfoCard: {
    backgroundColor: '#131C32',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  balanceInfoLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  balanceInfoNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    color: '#ECEFF1',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    marginBottom: 8,
  },
  bankValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0A1124',
    fontFamily: 'Inter',
  },
  errorText: {
    color: Colors.dark.red,
    fontSize: 12,
    fontWeight: '600',
    marginTop: -4,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'Inter',
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
  },
  verifyingText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  resolvedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 133, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  resolvedLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  resolvedValue: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontWeight: '900',
    fontFamily: 'Inter',
  },
  submitButton: {
    marginTop: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A1124',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 15,
    fontFamily: 'Inter',
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  bankItemName: {
    fontSize: 16,
    color: '#ECEFF1',
    fontFamily: 'Inter',
  },
});
