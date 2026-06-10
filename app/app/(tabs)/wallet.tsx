import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, Copy, ArrowUpRight, ArrowDownLeft, Check, X, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { authService, transactionService, walletService } from '../../services/apiService';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';

export default function WalletScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [virtualAccount, setVirtualAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Provisioning state
  const [showBvnModal, setShowBvnModal] = useState(false);
  const [bvn, setBvn] = useState('');
  const [bvnError, setBvnError] = useState('');
  const [provisioning, setProvisioning] = useState(false);

  const fetchData = async () => {
    try {
      const [userData, txHistory, vaData] = await Promise.all([
        authService.getMe(),
        transactionService.getHistory(),
        walletService.getVirtualAccount()
      ]);
      setUser(userData);
      setTransactions(txHistory);
      setVirtualAccount(vaData.data);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const copyToClipboard = () => {
    // In a real app use Clipboard.setString(virtualAccount.accountNumber)
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProvision = async () => {
    if (!bvn || bvn.length !== 11) {
      setBvnError('Please enter a valid 11-digit BVN');
      return;
    }

    setProvisioning(true);
    setBvnError('');
    try {
      const res = await walletService.provisionVirtualAccount(bvn);
      setVirtualAccount(res.data);
      setShowBvnModal(false);
      setBvn('');
      Alert.alert('Success', 'Your virtual account has been created successfully!');
      fetchData(); // Refresh all data
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create virtual account';
      setBvnError(msg);
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Escrow Wallet</Text>
          <Wallet size={22} color={Colors.dark.primary} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
        >
          {/* Balance Card display */}
          <LinearGradient
            colors={['#00D285', '#009F65']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>Total Value Portfolio</Text>
            <Text style={styles.balanceNum}>₦{(user?.balance || 0).toLocaleString()}</Text>

            <View style={styles.balanceSplitRow}>
              <View>
                <Text style={styles.splitLabel}>Available Funds</Text>
                <Text style={styles.splitNum}>₦{(user?.balance || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View>
                <Text style={styles.splitLabel}>P2P Escrow Locked</Text>
                <Text style={styles.splitNum}>₦0.00</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Action Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => !virtualAccount ? setShowBvnModal(true) : {}}
              activeOpacity={0.8}
              style={[styles.actionButton, { marginRight: 12 }]}
            >
              <ArrowDownLeft size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>Quick Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/withdraw')}
              activeOpacity={0.8}
              style={[styles.actionButton, { backgroundColor: '#131C32', borderWidth: 1, borderColor: '#1E293B' }]}
            >
              <ArrowUpRight size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          {/* Bank transfer payment detail boxes */}
          <Text style={styles.sectionTitle}>Escrow Fund Deposit</Text>
          
          {virtualAccount ? (
            <View style={styles.virtualAccountCard}>
              <View style={styles.vaHeader}>
                <Text style={styles.vaTitle}>Virtual Funding Details</Text>
                <Text style={styles.vaSubtitle}>Transfer to instant credit your trading escrow wallet</Text>
              </View>

              <View style={styles.vaDetails}>
                <View style={styles.vaRow}>
                  <Text style={styles.vaLabel}>Bank Name :</Text>
                  <Text style={styles.vaValBold}>{virtualAccount.bankName}</Text>
                </View>

                <View style={styles.vaRow}>
                  <Text style={styles.vaLabel}>Account Name :</Text>
                  <Text style={styles.vaVal}>{virtualAccount.accountName}</Text>
                </View>

                <View style={[styles.vaRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vaLabel}>Account Number :</Text>
                    <Text style={styles.vaAccountNum}>{virtualAccount.accountNumber}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={copyToClipboard}
                    activeOpacity={0.7}
                    style={styles.copyButton}
                  >
                    {copied ? (
                      <Check size={16} color={Colors.dark.primary} />
                    ) : (
                      <Copy size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => setShowBvnModal(true)}
              activeOpacity={0.9} 
              style={styles.noAccountCard}
            >
              <View style={styles.noAccountIcon}>
                <ShieldCheck size={28} color={Colors.dark.primary} />
              </View>
              <Text style={styles.noAccountTitle}>Generate Virtual Account</Text>
              <Text style={styles.noAccountSub}>Securely fund your wallet by generating a dedicated bank account for your trades.</Text>
              <View style={styles.generateBtnInline}>
                 <Text style={styles.generateBtnText}>Get Started</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* History Transactions lists */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Ledger Entries</Text>
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <View key={tx._id} style={styles.txCard}>
                <View style={[styles.txIconBox, tx.type === 'deposit' || tx.type === 'bet_won' ? styles.txIconBoxCredit : styles.txIconBoxDebit]}>
                  {tx.type === 'deposit' || tx.type === 'bet_won' ? (
                    <ArrowDownLeft size={16} color={Colors.dark.primary} />
                  ) : (
                    <ArrowUpRight size={16} color={Colors.dark.red} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.txType}>{tx.type.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.txMeta}>{tx.status} • {new Date(tx.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.txAmount, tx.type === 'deposit' || tx.type === 'bet_won' ? styles.txAmountCredit : styles.txAmountDebit]}>
                  {tx.type === 'deposit' || tx.type === 'bet_won' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No transactions found yet.</Text>
            </View>
          )}
        </ScrollView>

        {/* BVN Modal */}
        <Modal
          visible={showBvnModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowBvnModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Identification</Text>
                <TouchableOpacity onPress={() => setShowBvnModal(false)}>
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSub}>Enter your 11-digit Bank Verification Number (BVN) to create your virtual funding account.</Text>
              
              <View style={styles.secureNotice}>
                <ShieldCheck size={16} color="#00D285" />
                <Text style={styles.secureText}>Standard identity verification secured by VTStack</Text>
              </View>

              <CustomInput
                label="BVN Number"
                placeholder="22XXXXXXXXX"
                value={bvn}
                onChangeText={(text) => setBvn(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={11}
                error={bvnError}
              />

              <CustomButton
                title="Generate Account"
                variant="primary"
                onPress={handleProvision}
                loading={provisioning}
                style={{ marginTop: 20 }}
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
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#E0F2FE',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  balanceNum: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginTop: 4,
    marginBottom: 20,
  },
  balanceSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 16,
  },
  splitLabel: {
    fontSize: 10,
    color: '#E0F2FE',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  splitNum: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  dividerVertical: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    marginVertical: 18,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.dark.primary,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
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
  virtualAccountCard: {
    backgroundColor: '#131C32',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
  },
  vaHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 12,
    marginBottom: 12,
  },
  vaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  vaSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  vaDetails: {
    width: '100%',
  },
  vaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0A1124',
  },
  vaLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  vaValBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  vaVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  vaAccountNum: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark.primary,
    fontFamily: 'Inter',
    marginTop: 4,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAccountCard: {
    backgroundColor: '#131C32',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 24,
    alignItems: 'center',
  },
  noAccountIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 210, 133, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noAccountTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  noAccountSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Inter',
    marginBottom: 20,
  },
  generateBtnInline: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  generateBtnText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  txCard: {
    backgroundColor: '#131C32',
    borderRadius: 16,
    padding: 14,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconBoxCredit: {
    backgroundColor: 'rgba(0, 210, 133, 0.1)',
  },
  txIconBoxDebit: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  txType: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  txMeta: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  txAmountCredit: {
    color: Colors.dark.primary,
  },
  txAmountDebit: {
    color: Colors.dark.red,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#64748B',
    fontSize: 13,
    fontFamily: 'Inter',
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
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  modalSub: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    fontFamily: 'Inter',
    marginBottom: 20,
  },
  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 133, 0.05)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 24,
  },
  secureText: {
    fontSize: 11,
    color: '#00D285',
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter',
  },
});

