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
  Alert
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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { authService, betService } from '../services/apiService';

export default function EnterAmountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Route parameters with fallback values
  const matchId = params.matchId as string;
  const matchTitle = params.matchTitle || 'Match Detail';
  const startTime = params.startTime || 'Upcoming';
  const marketName = params.marketName || 'Trade Market';
  const outcome = params.outcome as string || 'Select Outcome';
  const odds = parseFloat(params.odds as string) || 1.0;

  const [stake, setStake] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const user = await authService.getMe();
        setUserBalance(user.balance);
      } catch (err) {
        console.error('Error fetching balance:', err);
      }
    };
    fetchBalance();
  }, []);

  const handleLockTrade = async () => {
    setError('');
    const parsedStake = parseFloat(stake) || 0;

    if (parsedStake <= 0) {
      setError('Please enter a stake amount');
      return;
    }

    if (parsedStake < 1000) {
      setError('Minimum trade stake is ₦1,000');
      return;
    }

    if (parsedStake > userBalance) {
      setError(`Insufficient funds. Your available balance is ₦${userBalance.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      // Map outcome text to enum values
      let selection: any = 'HOME';
      if (outcome.includes('Draw')) selection = 'DRAW';
      else if (outcome.includes('(Short)') && !outcome.includes('Draw')) {
        // Simple logic for away in basic winner market
        if (marketName === 'Match Outcome') selection = 'AWAY';
        else if (marketName.includes('Over 2.5')) selection = 'UNDER_25';
        else if (marketName.includes('Both Teams')) selection = 'BTTS_NO';
      } else {
        if (marketName === 'Match Outcome') selection = 'HOME';
        else if (marketName.includes('Over 2.5')) selection = 'OVER_25';
        else if (marketName.includes('Both Teams')) selection = 'BTTS_YES';
      }

      await betService.placeBet({
        matchId,
        selection,
        amount: parsedStake
      });

      Alert.alert('Success', 'Trade locked in escrow successfully!', [
        { text: 'View Trades', onPress: () => router.replace('/(tabs)/trades') }
      ]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place trade. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0A1124', '#050811']}
      style={styles.background}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{matchTitle}</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Status Row */}
            <View style={styles.statusRow}>
              <CheckCircle2 size={14} color="#00D285" />
              <Text style={styles.statusText}>{startTime}</Text>
            </View>

            {/* Market name */}
            <Text style={styles.marketTitle}>{marketName}</Text>

            {/* Input Card Container */}
            <View style={styles.cardContainer}>
              <Text style={styles.outcomeTitle}>{outcome}</Text>

              {/* Enter Amount Input container */}
              <View style={styles.inputOuterContainer}>
                <View style={styles.currencyBox}>
                  <Text style={styles.currencyText}>₦</Text>
                </View>
                <View style={styles.dividerLine} />
                <TextInput
                  placeholder="Enter Amount"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  style={styles.amountInput}
                  value={stake}
                  onChangeText={(text) => {
                    setStake(text.replace(/[^0-9]/g, ''));
                    setError('');
                  }}
                />
              </View>

              {/* Error messages if any */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Limit subtext */}
              <Text style={styles.limitsText}>
                Min: <Text style={styles.highlightLimit}>₦1,000</Text> . Max:{' '}
                <Text style={styles.highlightLimit}>₦50,000</Text>
              </Text>

              {/* Continue button */}
              <TouchableOpacity
                onPress={handleLockTrade}
                activeOpacity={0.8}
                style={styles.continueButton}
                disabled={loading}
              >
                <Text style={styles.continueButtonText}>
                  {loading ? 'Processing...' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Mock Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => router.push('/(tabs)')}
          >
            <Home size={20} color="#64748B" />
            <Text style={styles.tabItemText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => router.push('/(tabs)/market')}
          >
            <BarChart2 size={20} color="#64748B" />
            <Text style={styles.tabItemText}>Market</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <RefreshCw size={20} color="#00D285" />
            <Text style={[styles.tabItemText, { color: '#00D285' }]}>Trade</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => router.push('/(tabs)/wallet')}
          >
            <Wallet size={20} color="#64748B" />
            <Text style={styles.tabItemText}>Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <User size={20} color="#64748B" />
            <Text style={styles.tabItemText}>Profile</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#151E32',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 100,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 28,
  },
  statusText: {
    marginLeft: 6,
    color: '#00D285',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: 'bold',
  },
  marketTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 24,
  },
  cardContainer: {
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  outcomeTitle: {
    fontSize: 16,
    color: '#00D285',
    fontWeight: 'bold',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 8,
  },
  inputOuterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2C56',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 16,
    marginVertical: 16,
    width: '100%',
  },
  currencyBox: {
    marginRight: 10,
  },
  currencyText: {
    fontSize: 20,
    color: '#00D285',
    fontWeight: 'bold',
  },
  dividerLine: {
    width: 1,
    height: 24,
    backgroundColor: '#3B82F6',
    marginRight: 14,
    opacity: 0.5,
  },
  amountInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontFamily: 'Inter',
    marginBottom: 10,
    textAlign: 'center',
  },
  limitsText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Inter',
    marginBottom: 20,
  },
  highlightLimit: {
    color: '#00D285',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#2E4DA7',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 58,
    backgroundColor: '#070C1B',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabItemText: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 4,
  },
});
