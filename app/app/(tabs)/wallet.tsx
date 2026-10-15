import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wallet,
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  ShieldCheck,
  CreditCard,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { authService, transactionService, walletService } from '../../services/apiService';

export default function WalletScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [virtualAccount, setVirtualAccount] = useState<any>(null);

  // Flutterwave Deposit State
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('5000');
  const [depositMethod, setDepositMethod] = useState<'FLUTTERWAVE' | 'VIRTUAL_ACCOUNT'>('FLUTTERWAVE');
  const [initializingDeposit, setInitializingDeposit] = useState(false);
  const [activeTxRef, setActiveTxRef] = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  
  // Pagination State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [autoPrompted, setAutoPrompted] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  const fetchData = async (pageNum = 1) => {
    try {
      const [userData, txHistory, vaData] = await Promise.all([
        authService.getMe(),
        transactionService.getHistory({ page: pageNum, limit: 15 }),
        walletService.getVirtualAccount()
      ]);
      setUser(userData);
      
      if (pageNum === 1) {
        setTransactions(txHistory.transactions || []);
      } else {
        setTransactions(prev => [...prev, ...(txHistory.transactions || [])]);
      }
      setTotalPages(txHistory.totalPages || 1);
      setPage(pageNum);

      const account = vaData?.data;
      setVirtualAccount(account?.accountNumber ? account : null);
    } catch (error: any) {
      console.error('Error fetching wallet data:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load wallet data.';
      Alert.alert('Error', message);
      setVirtualAccount(null);
    } finally {
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    fetchData(1);
    const interval = setInterval(() => {
      fetchData(1);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const loadMoreTransactions = async () => {
    if (page >= totalPages || loadingMore || refreshing) return;
    setLoadingMore(true);
    await fetchData(page + 1);
    setLoadingMore(false);
  };

  const hasVirtualAccount = Boolean(virtualAccount?.accountNumber);

  useEffect(() => {
    if (hasLoaded && user && !hasVirtualAccount && !autoPrompted && !provisioning) {
      setAutoPrompted(true);
      handleProvision(true);
    }
  }, [hasLoaded, user, hasVirtualAccount, autoPrompted, provisioning]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(1);
    setRefreshing(false);
  };

  const copyToClipboard = () => {
    // In a real app use Clipboard.setString(virtualAccount.accountNumber)
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProvision = async (isSilent = false) => {
    setProvisioning(true);
    try {
      const res = await walletService.provisionVirtualAccount();
      const accountData = res?.data ?? res;
      setVirtualAccount(accountData);
      if (!isSilent) {
        Alert.alert('Success', 'Your virtual account has been generated successfully!');
      }
      fetchData(1); // Refresh all data
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create virtual account';
      if (!isSilent) {
        Alert.alert('Error', msg);
      }
    } finally {
      setProvisioning(false);
    }
  };

  const handleProceedFlutterwave = async () => {
    const num = Number(depositAmount);
    if (!num || num < 200) {
      Alert.alert('Invalid Amount', 'Minimum deposit via Flutterwave is ₦200');
      return;
    }
    setInitializingDeposit(true);
    try {
      const res = await walletService.initializeFlutterwaveDeposit({ amount: num });
      if (res?.link) {
        setActiveTxRef(res.txRef);
        await Linking.openURL(res.link);
      } else {
        Alert.alert('Error', 'Unable to generate Flutterwave checkout link.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Payment initialization failed.';
      Alert.alert('Payment Error', msg);
    } finally {
      setInitializingDeposit(false);
    }
  };

  const handleVerifyFlutterwave = async () => {
    if (!activeTxRef) return;
    setIsVerifyingPayment(true);
    try {
      const res = await walletService.verifyFlutterwaveDeposit(activeTxRef);
      Alert.alert('Deposit Confirmed! 💳', res.message || 'Funds credited to wallet.');
      setActiveTxRef(null);
      setDepositModalVisible(false);
      fetchData(1);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Payment verification in progress. Tap again shortly.';
      Alert.alert('Status', msg);
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const renderHeader = () => (
    <View style={{ paddingBottom: 10 }}>
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
          onPress={() => setDepositModalVisible(true)}
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
      
      {hasVirtualAccount ? (
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
          onPress={() => handleProvision()}
          activeOpacity={0.9} 
          disabled={provisioning}
          style={styles.noAccountCard}
        >
          <View style={styles.noAccountIcon}>
            <ShieldCheck size={28} color={Colors.dark.primary} />
          </View>
          <Text style={styles.noAccountTitle}>Generate Virtual Account</Text>
          <Text style={styles.noAccountSub}>Securely fund your wallet by generating a dedicated bank account for your trades.</Text>
          <View style={styles.generateBtnInline}>
            {provisioning ? (
              <ActivityIndicator size="small" color="#0A1124" />
            ) : (
              <Text style={styles.generateBtnText}>Get Started</Text>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* History Transactions lists */}
      <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Recent Ledger Entries</Text>
    </View>
  );

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

        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
          onEndReached={loadMoreTransactions}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No transactions found yet.</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={Colors.dark.primary} />
              </View>
            ) : null
          }
          renderItem={({ item: tx }) => {
            const isCredit = ['deposit', 'bet_won', 'airdrop_bonus', 'promo_reward', 'referral_bonus', 'p2p_trade_won', 'pool_jackpot_won', 'bridge_pool_won', 'refund', 'p2p_unmatched_refund'].includes(tx.type);
            const isAirdrop = tx.type === 'airdrop_bonus' || tx.type === 'promo_reward';
            const isReferral = tx.type === 'referral_bonus';
            return (
              <View style={styles.txCard}>
                <View style={[styles.txIconBox, isCredit ? styles.txIconBoxCredit : styles.txIconBoxDebit]}>
                  {isCredit ? (
                    <ArrowDownLeft size={16} color={Colors.dark.primary} />
                  ) : (
                    <ArrowUpRight size={16} color={Colors.dark.red} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.txType}>
                    {isAirdrop ? 'AIRDROP BONUS 🎁' : isReferral ? 'REFERRAL BONUS 👥' : tx.type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.txMeta}>{tx.description || `${tx.status} • ${new Date(tx.createdAt).toLocaleDateString()}`}</Text>
                </View>
                <Text style={[styles.txAmount, isCredit ? styles.txAmountCredit : styles.txAmountDebit]}>
                  {isCredit ? '+' : '-'}₦{tx.amount.toLocaleString()}
                </Text>
              </View>
            );
          }}
        />

        {/* ==================== DEPOSIT MODAL ==================== */}
        <Modal
          visible={depositModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDepositModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderSubtitle}>FUND TRADING WALLET</Text>
                  <Text style={styles.modalHeaderTitle}>Instant Escrow Deposit</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setDepositModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Method Toggle */}
              <View style={styles.methodTabsRow}>
                <TouchableOpacity
                  onPress={() => setDepositMethod('FLUTTERWAVE')}
                  style={[
                    styles.methodTab,
                    depositMethod === 'FLUTTERWAVE' && styles.methodTabActive,
                  ]}
                >
                  <CreditCard
                    size={14}
                    color={depositMethod === 'FLUTTERWAVE' ? Colors.dark.primary : '#8FA2C7'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      depositMethod === 'FLUTTERWAVE' && styles.methodTabTextActive,
                    ]}
                  >
                    Flutterwave Card / USSD
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDepositMethod('VIRTUAL_ACCOUNT')}
                  style={[
                    styles.methodTab,
                    depositMethod === 'VIRTUAL_ACCOUNT' && styles.methodTabActive,
                  ]}
                >
                  <ShieldCheck
                    size={14}
                    color={depositMethod === 'VIRTUAL_ACCOUNT' ? Colors.dark.primary : '#8FA2C7'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      depositMethod === 'VIRTUAL_ACCOUNT' && styles.methodTabTextActive,
                    ]}
                  >
                    PalmPay Transfer
                  </Text>
                </TouchableOpacity>
              </View>

              {depositMethod === 'FLUTTERWAVE' ? (
                <View>
                  <Text style={styles.inputSublabel}>DEPOSIT AMOUNT (NGN)</Text>
                  <View style={styles.amountInputBox}>
                    <Text style={styles.currencyPrefix}>₦</Text>
                    <TextInput
                      style={styles.amountInput}
                      keyboardType="numeric"
                      value={depositAmount}
                      onChangeText={(val) => setDepositAmount(val.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  {/* Preset Amount Chips */}
                  <View style={styles.presetChipsRow}>
                    {['1000', '2500', '5000', '10000', '25000'].map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        onPress={() => setDepositAmount(amt)}
                        style={[
                          styles.presetChip,
                          depositAmount === amt && styles.presetChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            depositAmount === amt && styles.presetChipTextActive,
                          ]}
                        >
                          ₦{parseInt(amt) >= 1000 ? `${parseInt(amt) / 1000}k` : amt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.trustBadgeRow}>
                    <Sparkles size={12} color="#00D285" style={{ marginRight: 6 }} />
                    <Text style={styles.trustBadgeText}>
                      Secured by Flutterwave • Card, Bank Transfer, USSD
                    </Text>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    onPress={handleProceedFlutterwave}
                    disabled={initializingDeposit || Number(depositAmount) < 200}
                    activeOpacity={0.85}
                    style={[
                      styles.primaryModalBtn,
                      (initializingDeposit || Number(depositAmount) < 200) && { opacity: 0.5 },
                    ]}
                  >
                    {initializingDeposit ? (
                      <ActivityIndicator color="#0A1124" />
                    ) : (
                      <Text style={styles.primaryModalBtnText}>
                        Pay with Flutterwave • ₦{Number(depositAmount || 0).toLocaleString()}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {activeTxRef ? (
                    <TouchableOpacity
                      onPress={handleVerifyFlutterwave}
                      disabled={isVerifyingPayment}
                      activeOpacity={0.85}
                      style={styles.secondaryVerifyBtn}
                    >
                      {isVerifyingPayment ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.secondaryVerifyBtnText}>
                          I Have Completed Payment (Verify Now)
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                /* PalmPay Dedicated Account View */
                <View>
                  {hasVirtualAccount ? (
                    <View style={styles.modalVaBox}>
                      <Text style={styles.modalVaTitle}>Your Dedicated PalmPay Account</Text>
                      <Text style={styles.modalVaSub}>
                        Transfer directly from any bank app to credit your wallet instantly.
                      </Text>

                      <View style={styles.modalVaRow}>
                        <Text style={styles.modalVaLabel}>Bank:</Text>
                        <Text style={styles.modalVaVal}>{virtualAccount.bankName}</Text>
                      </View>
                      <View style={styles.modalVaRow}>
                        <Text style={styles.modalVaLabel}>Account Name:</Text>
                        <Text style={styles.modalVaVal}>{virtualAccount.accountName}</Text>
                      </View>
                      <View style={styles.modalVaRow}>
                        <Text style={styles.modalVaLabel}>Account Number:</Text>
                        <Text style={styles.modalVaNum}>{virtualAccount.accountNumber}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={copyToClipboard}
                        style={styles.copyVaBtn}
                        activeOpacity={0.8}
                      >
                        <Copy size={14} color="#0A1124" style={{ marginRight: 6 }} />
                        <Text style={styles.copyVaBtnText}>{copied ? 'Copied!' : 'Copy Account Number'}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.modalVaBox}>
                      <Text style={styles.modalVaTitle}>No Virtual Account Yet</Text>
                      <TouchableOpacity
                        onPress={() => handleProvision()}
                        disabled={provisioning}
                        style={styles.primaryModalBtn}
                      >
                        {provisioning ? (
                          <ActivityIndicator color="#0A1124" />
                        ) : (
                          <Text style={styles.primaryModalBtnText}>Generate Account</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.dark.primary,
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  methodTabActive: {
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    borderColor: Colors.dark.primary,
  },
  methodTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  methodTabTextActive: {
    color: Colors.dark.primary,
    fontWeight: '800',
  },
  inputSublabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8FA2C7',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: 'Inter',
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 17, 36, 0.8)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.4)',
    marginBottom: 10,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark.primary,
    marginRight: 8,
    fontFamily: 'Inter',
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetChipActive: {
    backgroundColor: 'rgba(0, 210, 133, 0.16)',
    borderColor: Colors.dark.primary,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  presetChipTextActive: {
    color: Colors.dark.primary,
    fontWeight: '800',
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  trustBadgeText: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    flex: 1,
  },
  primaryModalBtn: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryModalBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A1124',
    fontFamily: 'Inter',
  },
  secondaryVerifyBtn: {
    marginTop: 10,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  secondaryVerifyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  modalVaBox: {
    backgroundColor: 'rgba(10, 17, 36, 0.6)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalVaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  modalVaSub: {
    fontSize: 11,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  modalVaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalVaLabel: {
    fontSize: 11,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  modalVaVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  modalVaNum: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark.primary,
    fontFamily: 'Inter',
  },
  copyVaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primary,
    borderRadius: 10,
    height: 38,
    marginTop: 14,
  },
  copyVaBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A1124',
    fontFamily: 'Inter',
  },
});

