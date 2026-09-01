import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  BarChart2,
  RefreshCw,
  Wallet,
  User,
  Zap,
  TrendingUp,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { authService, p2pService, poolService, showToast } from '../services/apiService';

export default function EnterAmountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Route parameters with fallback values
  const matchId = params.matchId as string;
  const matchTitle = (params.matchTitle as string) || 'Match Detail';
  const startTime = (params.startTime as string) || 'Upcoming';
  const marketName = (params.marketName as string) || 'Match Outcome';
  const outcome = (params.outcome as string) || 'HOME';
  const odds = parseFloat(params.odds as string) || 1.95;

  // Trading Mode: 'P2P' (OrderBook Flow) vs 'POOL' (Pro-Rata Jackpot)
  const [tradingMode, setTradingMode] = useState<'P2P' | 'POOL'>('P2P');

  // P2P State
  const [shares, setShares] = useState(1);
  const SHARE_PRICE = 1000; // ₦1,000 = 1 Share

  // Pool State
  const [poolStake, setPoolStake] = useState('1000');
  const [poolDetails, setPoolDetails] = useState<any>(null);

  // Common State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [orderBook, setOrderBook] = useState<any>(null);

  // Map outcome text to selection key
  const getMappedSelection = (): 'HOME' | 'DRAW' | 'AWAY' | 'OVER_25' | 'UNDER_25' | 'BTTS_YES' | 'BTTS_NO' => {
    const out = outcome.toUpperCase();
    if (marketName.includes('Over 2.5') || marketName.includes('Over/Under')) {
      return out === 'NO' || out === 'UNDER' || out === 'UNDER_25' ? 'UNDER_25' : 'OVER_25';
    }
    if (marketName.includes('Both Teams') || marketName.includes('BTTS')) {
      return out === 'NO' || out === 'BTTS_NO' ? 'BTTS_NO' : 'BTTS_YES';
    }
    if (out === 'DRAW' || out === 'X') return 'DRAW';
    if (out === 'AWAY' || out === '2' || out === 'NO') return 'AWAY';
    return 'HOME';
  };

  const currentSelection = getMappedSelection();

  const fetchData = async () => {
    try {
      const [user, bookData, poolData] = await Promise.all([
        authService.getMe(),
        matchId ? p2pService.getOrderBook(matchId).catch(() => null) : null,
        matchId ? poolService.getPoolBreakdown(matchId).catch(() => null) : null,
      ]);

      if (user) setUserBalance(user.balance || 0);
      if (bookData?.orderBook) setOrderBook(bookData.orderBook);
      if (poolData) setPoolDetails(poolData);
    } catch (err) {
      console.error('Error fetching enter-amount data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [matchId]);

  // Calculations for P2P Mode
  const p2pTotalAmount = shares * SHARE_PRICE;
  const p2pGrossProfit = p2pTotalAmount; // 1:1 match
  const p2pFee = p2pGrossProfit * 0.05; // 5% fee on profit
  const p2pNetWin = p2pTotalAmount + (p2pGrossProfit - p2pFee);

  // Opposing open shares available in order book
  const opposingOpenShares = (() => {
    if (!orderBook) return 0;
    if (currentSelection === 'HOME') return (orderBook.AWAY?.openShares || 0) + (orderBook.DRAW?.openShares || 0);
    if (currentSelection === 'AWAY') return (orderBook.HOME?.openShares || 0) + (orderBook.DRAW?.openShares || 0);
    if (currentSelection === 'DRAW') return (orderBook.HOME?.openShares || 0) + (orderBook.AWAY?.openShares || 0);
    if (currentSelection === 'OVER_25') return orderBook.UNDER_25?.openShares || 0;
    if (currentSelection === 'UNDER_25') return orderBook.OVER_25?.openShares || 0;
    if (currentSelection === 'BTTS_YES') return orderBook.BTTS_NO?.openShares || 0;
    if (currentSelection === 'BTTS_NO') return orderBook.BTTS_YES?.openShares || 0;
    return 0;
  })();

  const instantMatchEstimate = Math.min(shares, opposingOpenShares);
  const queuePendingEstimate = Math.max(0, shares - opposingOpenShares);

  // Calculations for Pool Mode
  const parsedPoolStake = parseFloat(poolStake) || 0;
  const outcomePool = poolDetails?.outcomes?.[currentSelection]?.pot || 0;
  const totalPoolPot = (poolDetails?.totalPot || 0) + parsedPoolStake;
  const netPoolPot = totalPoolPot * 0.95; // 5% House Fee
  const outcomeTotalStake = outcomePool + parsedPoolStake;
  const projectedPoolMultiplier = outcomeTotalStake > 0 ? (netPoolPot / outcomeTotalStake).toFixed(2) : '2.00';
  const estimatedPoolPayout = Math.round(parsedPoolStake * parseFloat(projectedPoolMultiplier));

  // Handle Submission
  const handleSubmitTrade = async () => {
    setError('');
    if (!matchId) {
      setError('Please select a valid match');
      return;
    }

    if (tradingMode === 'P2P') {
      if (shares < 1) {
        setError('Minimum is 1 share (₦1,000)');
        return;
      }
      if (p2pTotalAmount > userBalance) {
        setError(`Insufficient funds. Available: ₦${userBalance.toLocaleString()}`);
        return;
      }

      setLoading(true);
      try {
        const res = await p2pService.placeOrder({
          matchId,
          market: 'MATCH_OUTCOME',
          selection: currentSelection,
          shares,
        });

        setUserBalance(res.balance);
        showToast(`P2P Order Placed! ${res.instantMatchedShares} matched • ${res.queuedPendingShares} queued`, 'success');

        Alert.alert(
          'P2P Order Placed ⚡',
          `Shares: ${shares} (₦${p2pTotalAmount.toLocaleString()})\nInstant Matched: ${res.instantMatchedShares} shares\nPending in OrderBook: ${res.queuedPendingShares} shares\n\n*If unmatched shares remain before kickoff, you will receive a Bridge Offer to convert to the Pool jackpot.*`,
          [{ text: 'View Trades', onPress: () => router.replace('/(tabs)/trades') }]
        );
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to place P2P order');
      } finally {
        setLoading(false);
      }
    } else {
      // Pool Mode
      if (parsedPoolStake < 100) {
        setError('Minimum pool entry is ₦100');
        return;
      }
      if (parsedPoolStake > userBalance) {
        setError(`Insufficient funds. Available: ₦${userBalance.toLocaleString()}`);
        return;
      }

      setLoading(true);
      try {
        const res = await poolService.enterPool({
          matchId,
          market: 'MATCH_OUTCOME',
          selection: currentSelection,
          amount: parsedPoolStake,
        });

        setUserBalance(res.balance);
        showToast('Entered Pool Jackpot Successfully 💰', 'success');

        Alert.alert(
          'Pool Entry Confirmed 💰',
          `Stake: ₦${parsedPoolStake.toLocaleString()}\nOutcome: ${currentSelection}\nProjected Return: ~${projectedPoolMultiplier}x\n\n*Payouts will be distributed pro-rata from the giant pot upon match finish.*`,
          [{ text: 'View Trades', onPress: () => router.replace('/(tabs)/trades') }]
        );
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to enter pool');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <LinearGradient colors={['#0A1124', '#050811']} style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{matchTitle}</Text>
            <Text style={styles.headerSubtitle}>{marketName} • {outcome}</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Dual-Mode Selector Switch */}
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                style={[styles.modeButton, tradingMode === 'P2P' && styles.modeButtonActiveP2P]}
                onPress={() => setTradingMode('P2P')}
                activeOpacity={0.8}
              >
                <Zap size={16} color={tradingMode === 'P2P' ? '#00D285' : '#8FA2C7'} />
                <Text style={[styles.modeButtonText, tradingMode === 'P2P' && styles.modeTextActiveP2P]}>
                  P2P Exchange
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeButton, tradingMode === 'POOL' && styles.modeButtonActivePool]}
                onPress={() => setTradingMode('POOL')}
                activeOpacity={0.8}
              >
                <Layers size={16} color={tradingMode === 'POOL' ? '#3B82F6' : '#8FA2C7'} />
                <Text style={[styles.modeButtonText, tradingMode === 'POOL' && styles.modeTextActivePool]}>
                  Jackpot Pool
                </Text>
              </TouchableOpacity>
            </View>

            {/* ─── P2P MODE UI ─── */}
            {tradingMode === 'P2P' ? (
              <View style={styles.cardContainer}>
                <View style={styles.badgeRow}>
                  <View style={styles.p2pTag}>
                    <Zap size={12} color="#00D285" />
                    <Text style={styles.p2pTagText}>1:1 FLOW MATCHING</Text>
                  </View>
                  <Text style={styles.shareUnitNote}>₦1,000 = 1 Share</Text>
                </View>

                {/* Shares Stepper */}
                <Text style={styles.sectionLabel}>Select Number of Shares</Text>
                <View style={styles.sharesStepperContainer}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setShares((prev) => Math.max(1, prev - 1))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>

                  <View style={styles.sharesDisplay}>
                    <Text style={styles.sharesCountText}>{shares}</Text>
                    <Text style={styles.sharesSubText}>SHARES = ₦{p2pTotalAmount.toLocaleString()}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setShares((prev) => prev + 1)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Share Chips */}
                <View style={styles.chipsRow}>
                  {[1, 5, 10, 25, 50, 100].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.chip, shares === num && styles.chipActive]}
                      onPress={() => setShares(num)}
                    >
                      <Text style={[styles.chipText, shares === num && styles.chipTextActive]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Live OrderBook Fill Velocity */}
                <View style={styles.velocityBox}>
                  <View style={styles.velocityRow}>
                    <Text style={styles.velocityLabel}>Instant Fill Available:</Text>
                    <Text style={styles.velocityValue}>{instantMatchEstimate} shares</Text>
                  </View>
                  <View style={styles.velocityRow}>
                    <Text style={styles.velocityLabel}>Queued in OrderBook:</Text>
                    <Text style={styles.velocityValueSecondary}>{queuePendingEstimate} shares</Text>
                  </View>
                  <View style={styles.bridgeNoteRow}>
                    <Sparkles size={13} color="#00D285" />
                    <Text style={styles.bridgeNoteText}>
                      Unmatched shares unlock Bridge Protocol for 2x return or Jackpot at 60% countdown.
                    </Text>
                  </View>
                </View>

                {/* Error messages */}
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* P2P Summary Box */}
                <View style={styles.summaryContainer}>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Total Stake</Text>
                    <Text style={styles.summaryValue}>₦{p2pTotalAmount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Platform Fee (5% on profit)</Text>
                    <Text style={styles.summaryValue}>-₦{p2pFee.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Net Payout on Win</Text>
                    <Text style={[styles.summaryValue, { color: '#00D285', fontWeight: '800' }]}>
                      ₦{Math.round(p2pNetWin).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Available Balance</Text>
                    <Text style={styles.summaryValue}>₦{userBalance.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Submit P2P Button */}
                <TouchableOpacity
                  onPress={handleSubmitTrade}
                  activeOpacity={0.8}
                  style={styles.p2pSubmitButton}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#050811" />
                  ) : (
                    <Text style={styles.p2pSubmitText}>Place P2P Order (₦{p2pTotalAmount.toLocaleString()})</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* ─── POOL JACKPOT MODE UI ─── */
              <View style={styles.cardContainer}>
                <View style={styles.badgeRow}>
                  <View style={styles.poolTag}>
                    <Layers size={12} color="#3B82F6" />
                    <Text style={styles.poolTagText}>GIANT PRO-RATA POT</Text>
                  </View>
                  <Text style={styles.shareUnitNote}>Min ₦100</Text>
                </View>

                {/* Giant Pot Visualizer */}
                <View style={styles.potVisualizer}>
                  <Text style={styles.potVisualizerTitle}>Total Match Jackpot Pot</Text>
                  <Text style={styles.potVisualizerAmount}>₦{totalPoolPot.toLocaleString()}</Text>
                  <View style={styles.multiplierBadge}>
                    <TrendingUp size={14} color="#00D285" />
                    <Text style={styles.multiplierBadgeText}>Est. Multiplier: {projectedPoolMultiplier}x</Text>
                  </View>
                </View>

                {/* Custom Stake Input */}
                <Text style={styles.sectionLabel}>Enter Pool Stake (₦)</Text>
                <View style={styles.inputOuterContainer}>
                  <View style={styles.currencyBox}>
                    <Text style={styles.currencyText}>₦</Text>
                  </View>
                  <View style={styles.dividerLine} />
                  <TextInput
                    placeholder="Enter amount"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    style={styles.amountInput}
                    value={poolStake}
                    onChangeText={(t) => {
                      setPoolStake(t.replace(/[^0-9]/g, ''));
                      setError('');
                    }}
                  />
                </View>

                {/* Quick Stake Chips */}
                <View style={styles.chipsRow}>
                  {[1000, 5000, 10000, 25000, 50000].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.chip, poolStake === val.toString() && styles.chipActivePool]}
                      onPress={() => setPoolStake(val.toString())}
                    >
                      <Text style={[styles.chipText, poolStake === val.toString() && styles.chipTextActive]}>
                        ₦{(val / 1000).toFixed(0)}k
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Error messages */}
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Pool Summary Box */}
                <View style={styles.summaryContainer}>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Outcome Selected</Text>
                    <Text style={styles.summaryValue}>{currentSelection}</Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>House Platform Fee</Text>
                    <Text style={styles.summaryValue}>5% of Total Pot</Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Est. Pro-Rata Jackpot Payout</Text>
                    <Text style={[styles.summaryValue, { color: '#3B82F6', fontWeight: '800' }]}>
                      ₦{estimatedPoolPayout.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Available Balance</Text>
                    <Text style={styles.summaryValue}>₦{userBalance.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Submit Pool Button */}
                <TouchableOpacity
                  onPress={handleSubmitTrade}
                  activeOpacity={0.8}
                  style={styles.poolSubmitButton}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.poolSubmitText}>
                      Enter Jackpot Pool (₦{parsedPoolStake.toLocaleString()})
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(19, 28, 50, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: { marginRight: 14, padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter' },
  headerSubtitle: { fontSize: 12, color: '#8FA2C7', fontFamily: 'Inter', marginTop: 2 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60, alignItems: 'center' },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(19, 28, 50, 0.9)',
    borderRadius: 16,
    padding: 4,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  modeButtonActiveP2P: {
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    borderWidth: 1,
    borderColor: '#00D285',
  },
  modeButtonActivePool: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  modeButtonText: { fontSize: 13, fontWeight: '700', color: '#8FA2C7', fontFamily: 'Inter' },
  modeTextActiveP2P: { color: '#00D285' },
  modeTextActivePool: { color: '#3B82F6' },
  cardContainer: {
    width: '100%',
    backgroundColor: 'rgba(19, 28, 50, 0.85)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  p2pTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.25)',
  },
  p2pTagText: { color: '#00D285', fontSize: 10, fontWeight: '800', fontFamily: 'Inter' },
  poolTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  poolTagText: { color: '#3B82F6', fontSize: 10, fontWeight: '800', fontFamily: 'Inter' },
  shareUnitNote: { color: '#8FA2C7', fontSize: 11, fontWeight: '600', fontFamily: 'Inter' },
  sectionLabel: { color: '#8FA2C7', fontSize: 12, fontWeight: '600', marginBottom: 8, fontFamily: 'Inter' },
  sharesStepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 17, 36, 0.8)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  sharesDisplay: { alignItems: 'center' },
  sharesCountText: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', fontFamily: 'Inter' },
  sharesSubText: { color: '#00D285', fontSize: 11, fontWeight: '700', fontFamily: 'Inter', marginTop: 2 },
  chipsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 6 },
  chip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: { backgroundColor: '#00D285', borderColor: '#00D285' },
  chipActivePool: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { color: '#8FA2C7', fontSize: 12, fontWeight: '700', fontFamily: 'Inter' },
  chipTextActive: { color: '#050811' },
  velocityBox: {
    backgroundColor: 'rgba(10, 17, 36, 0.6)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  velocityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  velocityLabel: { color: '#8FA2C7', fontSize: 12, fontFamily: 'Inter' },
  velocityValue: { color: '#00D285', fontSize: 12, fontWeight: '700', fontFamily: 'Inter' },
  velocityValueSecondary: { color: '#F59E0B', fontSize: 12, fontWeight: '700', fontFamily: 'Inter' },
  bridgeNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  bridgeNoteText: { color: '#8FA2C7', fontSize: 10, fontFamily: 'Inter', flex: 1 },
  potVisualizer: {
    backgroundColor: 'rgba(10, 17, 36, 0.7)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  potVisualizerTitle: { color: '#8FA2C7', fontSize: 11, textTransform: 'uppercase', fontFamily: 'Inter' },
  potVisualizerAmount: { color: '#3B82F6', fontSize: 28, fontWeight: '800', fontFamily: 'Inter', marginVertical: 4 },
  multiplierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  multiplierBadgeText: { color: '#00D285', fontSize: 11, fontWeight: '700', fontFamily: 'Inter' },
  inputOuterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 17, 36, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    height: 52,
    marginBottom: 12,
  },
  currencyBox: { paddingHorizontal: 4 },
  currencyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  dividerLine: { width: 1, height: 24, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginHorizontal: 8 },
  amountInput: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: 'Inter' },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 10, fontFamily: 'Inter' },
  summaryContainer: {
    backgroundColor: 'rgba(10, 17, 36, 0.6)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  summaryBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#8FA2C7', fontSize: 12, fontFamily: 'Inter' },
  summaryValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', fontFamily: 'Inter' },
  p2pSubmitButton: {
    backgroundColor: '#00D285',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D285',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  p2pSubmitText: { color: '#050811', fontSize: 15, fontWeight: '800', fontFamily: 'Inter' },
  poolSubmitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  poolSubmitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', fontFamily: 'Inter' },
});
