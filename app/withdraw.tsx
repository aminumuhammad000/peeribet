import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { Colors } from '../constants/Colors';

export default function WithdrawScreen() {
  const router = useRouter();

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  
  const [bankError, setBankError] = useState('');
  const [accountError, setAccountError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [loading, setLoading] = useState(false);

  const availableBalance = 18050; // Available for payout
  const isAccountResolved = accountNumber.length === 10;
  const resolvedName = isAccountResolved ? 'HAFEEZ MAKAMA' : '';

  const handleWithdraw = () => {
    let isValid = true;
    setBankError('');
    setAccountError('');
    setAmountError('');

    if (!bankName.trim()) {
      setBankError('Please enter bank name');
      isValid = false;
    }

    if (accountNumber.length !== 10) {
      setAccountError('Account number must be exactly 10 digits');
      isValid = false;
    }

    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0) {
      setAmountError('Please enter withdrawal amount');
      isValid = false;
    } else if (parsedAmount < 1000) {
      setAmountError('Minimum withdrawal is ₦1,000');
      isValid = false;
    } else if (parsedAmount > availableBalance) {
      setAmountError('Amount exceeds available balance');
      isValid = false;
    }

    if (isValid) {
      setLoading(true);
      // Simulate payout API delay
      setTimeout(() => {
        setLoading(false);
        router.replace('/(tabs)/wallet');
      }, 1500);
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

            <View style={styles.headerContainer}>
              <Text style={styles.title}>Withdraw Funds</Text>
              <Text style={styles.subtitle}>Payout settled instantly to your registered commercial bank</Text>
            </View>

            {/* Payout balance card */}
            <View style={styles.balanceInfoCard}>
              <Text style={styles.balanceInfoLabel}>Available for Payout</Text>
              <Text style={styles.balanceInfoNum}>₦{availableBalance.toLocaleString()}</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Bank Name */}
              <CustomInput
                label="Bank Name :"
                placeholder="Ex. Access Bank or GTBank"
                value={bankName}
                onChangeText={(text) => {
                  setBankName(text);
                  setBankError('');
                }}
                error={bankError}
              />

              {/* Account Number */}
              <CustomInput
                label="Account Number :"
                placeholder="Ex. 0123456789"
                value={accountNumber}
                onChangeText={(text) => {
                  setAccountNumber(text.replace(/[^0-9]/g, '').slice(0, 10));
                  setAccountError('');
                }}
                error={accountError}
                keyboardType="numeric"
              />

              {/* Resolved account name display */}
              {isAccountResolved && (
                <View style={styles.resolvedContainer}>
                  <Check size={16} color={Colors.dark.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.resolvedLabel}>Resolved Name: </Text>
                  <Text style={styles.resolvedValue}>{resolvedName}</Text>
                </View>
              )}

              {/* Amount */}
              <CustomInput
                label="Amount (₦) :"
                placeholder="Ex. ₦5,000"
                value={amount}
                onChangeText={(text) => {
                  setAmount(text.replace(/[^0-9]/g, ''));
                  setAmountError('');
                }}
                error={amountError}
                keyboardType="numeric"
              />

              {/* Proceed trigger */}
              <CustomButton
                title="Proceed with Withdrawal"
                variant="primary"
                onPress={handleWithdraw}
                loading={loading}
                style={styles.submitButton}
              />
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
  resolvedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 133, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginVertical: 4,
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
});
