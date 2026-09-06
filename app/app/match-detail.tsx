import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Zap, Shield, TrendingUp, Layers, HelpCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { matchService } from '../services/apiService';

interface ContractConfig {
  id: string;
  marketName: string;
  title: string;
  question: string;
  yesOdds: number;
  noOdds: number;
  poolAmount: number;
}

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const homeTeam = (params.homeTeam as string) || 'Chelsea';
  const awayTeam = (params.awayTeam as string) || 'Arsenal';
  const matchId = params.id as string;

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) return;
      try {
        const data = await matchService.getMatchById(matchId);
        setMatch(data);
      } catch (err: any) {
        console.error('Error fetching match detail:', err);
        setError(err.response?.data?.message || 'Something went wrong while fetching details. Try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  const handleSelectOutcome = (marketName: string, outcomeName: 'Yes' | 'No', oddsVal: number) => {
    router.push({
      pathname: '/enter-amount',
      params: {
        matchId: matchId,
        matchTitle: `${homeTeam} vs ${awayTeam}`,
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        marketName,
        outcome: outcomeName,
        odds: oddsVal,
        startTime: match?.startTime ? new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Upcoming'
      }
    });
  };

  const formatOdds = (val: number | undefined | null, fallback = 1.90) => {
    if (typeof val !== 'number' || Number.isNaN(val) || val <= 1) return fallback;
    return Number(val.toFixed(2));
  };

  const calcNoOdds = (yesOdds: number, fallback = 1.90) => {
    if (yesOdds <= 1.05) return 15.0;
    const impliedProb = 1 / yesOdds;
    const noProb = Math.max(0.05, 1 - impliedProb);
    return Number(((1 / noProb) * 0.95).toFixed(2)) || fallback;
  };

  const homeOdds = formatOdds(match?.odds?.home, 1.85);
  const awayOdds = formatOdds(match?.odds?.away, 2.40);
  const drawOdds = formatOdds(match?.odds?.draw, 3.10);
  const over3Odds = formatOdds(match?.odds?.over25, 1.95);
  const under3Odds = formatOdds(match?.odds?.under25, 1.85);
  const cornersYesOdds = 2.60;
  const cornersNoOdds = 1.48;
  const bttsYesOdds = formatOdds(match?.odds?.bttsYes, 1.80);
  const bttsNoOdds = formatOdds(match?.odds?.bttsNo, 2.00);

  const basePool = match?.poolAmount || 0;

  // Contracts matching user specification:
  // 1. Chelsea yes or no
  // 2. Arsenal yes or no
  // 3. Draw yes or no
  // 4. Over 3 goals yes or no
  // 5. More than 15 corner yes or no
  // 6. BTTS yes or no
  const contracts: ContractConfig[] = [
    {
      id: 'home_win',
      marketName: `${homeTeam} to Win`,
      title: homeTeam,
      question: `Will ${homeTeam} win the match?`,
      yesOdds: homeOdds,
      noOdds: calcNoOdds(homeOdds, 2.10),
      poolAmount: Math.round(basePool * 0.35),
    },
    {
      id: 'away_win',
      marketName: `${awayTeam} to Win`,
      title: awayTeam,
      question: `Will ${awayTeam} win the match?`,
      yesOdds: awayOdds,
      noOdds: calcNoOdds(awayOdds, 1.65),
      poolAmount: Math.round(basePool * 0.25),
    },
    {
      id: 'draw',
      marketName: 'Match Draw',
      title: 'Draw',
      question: 'Will the match end in a tie / draw?',
      yesOdds: drawOdds,
      noOdds: 1.35,
      poolAmount: Math.round(basePool * 0.15),
    },
    {
      id: 'over_3_goals',
      marketName: 'Over 3 Goals',
      title: 'Over 3 goals',
      question: 'Will 3 or more total goals be scored?',
      yesOdds: over3Odds,
      noOdds: under3Odds,
      poolAmount: Math.round(basePool * 0.12),
    },
    {
      id: 'corners_15',
      marketName: 'More Than 15 Corners',
      title: 'More than 15 corner',
      question: 'Will there be more than 15 corner kicks taken?',
      yesOdds: cornersYesOdds,
      noOdds: cornersNoOdds,
      poolAmount: Math.round(basePool * 0.08),
    },
    {
      id: 'btts',
      marketName: 'Both Teams to Score',
      title: 'BTTS (Both Teams to Score)',
      question: `Will both ${homeTeam} and ${awayTeam} score at least 1 goal?`,
      yesOdds: bttsYesOdds,
      noOdds: bttsNoOdds,
      poolAmount: Math.round(basePool * 0.05),
    },
  ];

  if (loading) {
    return (
      <View style={[styles.background, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.background, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: '#EF4444', textAlign: 'center', marginBottom: 20, fontFamily: 'Inter' }}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: '#1E293B', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontFamily: 'Inter' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLive = match?.status === 'LIVE';

  return (
    <LinearGradient colors={['#0A1124', '#050811']} style={styles.background}>
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
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{homeTeam} vs {awayTeam}</Text>
            <Text style={styles.headerSub}>{match?.leagueName || match?.league || 'MATCH PREDICTIONS'}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Match Banner Card */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerTopRow}>
              <View style={[styles.statusBadge, isLive && { backgroundColor: '#EF4444' }]}>
                <Text style={styles.statusBadgeText}>
                  {isLive ? '● LIVE NOW' : `START ${match?.startTime ? new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TODAY'}`}
                </Text>
              </View>
              <Text style={styles.bannerLeague}>
                {(match?.leagueName || match?.league || match?.competition || 'LEAGUE MATCH').toUpperCase()}
              </Text>
            </View>

            <View style={styles.matchVsRow}>
              <View style={styles.teamCol}>
                <View style={styles.teamBadge}>
                  <Text style={styles.teamBadgeText}>{(homeTeam || 'H').slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={styles.teamName} numberOfLines={1}>{homeTeam}</Text>
                <Text style={styles.teamRole}>HOME</Text>
              </View>

              <View style={styles.centerBadge}>
                <Text style={styles.centerVs}>VS</Text>
                <Text style={styles.centerSub}>MARKETS</Text>
              </View>

              <View style={styles.teamCol}>
                <View style={styles.teamBadge}>
                  <Text style={styles.teamBadgeText}>{(awayTeam || 'A').slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={styles.teamName} numberOfLines={1}>{awayTeam}</Text>
                <Text style={styles.teamRole}>AWAY</Text>
              </View>
            </View>

            <View style={styles.bannerFooter}>
              <View>
                <Text style={styles.bannerPoolLabel}>TOTAL MATCH POOL</Text>
                <Text style={styles.bannerPoolValue}>₦{(match?.poolAmount || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.shareRateBadge}>
                <Zap size={12} color="#00D285" />
                <Text style={styles.shareRateText}>1 Share = ₦1,000</Text>
              </View>
            </View>
          </View>

          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prediction Contracts</Text>
            <Text style={styles.sectionNotice}>Trade YES or NO</Text>
          </View>

          {/* Prediction Contracts List */}
          {contracts.map((contract) => (
            <View key={contract.id} style={styles.contractCard}>
              <View style={styles.contractHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.contractTitle}>{contract.title}</Text>
                  <Text style={styles.contractQuestion}>{contract.question}</Text>
                </View>
                <View style={styles.poolChip}>
                  <Text style={styles.poolChipText}>
                    Pool · ₦{contract.poolAmount.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.buttonsRow}>
                {/* YES Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.btnWrapper}
                  onPress={() => handleSelectOutcome(contract.marketName, 'Yes', contract.yesOdds)}
                >
                  <LinearGradient
                    colors={['#00D285', '#009B62']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.yesButtonInner}
                  >
                    <Text style={styles.yesButtonTitle}>YES</Text>
                    <Text style={styles.yesButtonSub}>{contract.yesOdds.toFixed(2)}x · ₦{Math.round(1000 / contract.yesOdds)}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* NO Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.btnWrapper}
                  onPress={() => handleSelectOutcome(contract.marketName, 'No', contract.noOdds)}
                >
                  <LinearGradient
                    colors={['#1E293B', '#131C32']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.noButtonInner}
                  >
                    <Text style={styles.noButtonTitle}>NO</Text>
                    <Text style={styles.noButtonSub}>{contract.noOdds.toFixed(2)}x · ₦{Math.round(1000 / contract.noOdds)}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0F1A30',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#162238',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerSub: {
    fontSize: 11,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  bannerCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(19, 28, 50, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.25)',
    marginBottom: 16,
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: 'rgba(0, 210, 133, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: '#00D285',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
  },
  bannerLeague: {
    color: '#8FA2C7',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter',
    letterSpacing: 0.8,
  },
  matchVsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
  },
  teamBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  teamBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  teamName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 1,
  },
  teamRole: {
    fontSize: 9,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  centerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.35)',
    backgroundColor: 'rgba(0, 210, 133, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  centerVs: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  centerSub: {
    fontSize: 8,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginTop: 1,
  },
  bannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
  },
  bannerPoolLabel: {
    fontSize: 9,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  bannerPoolValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  shareRateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  shareRateText: {
    fontSize: 10,
    color: '#00D285',
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  sectionNotice: {
    fontSize: 11,
    color: '#00D285',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  contractCard: {
    backgroundColor: 'rgba(19, 28, 50, 0.92)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contractTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  contractQuestion: {
    fontSize: 11,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  poolChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  poolChipText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnWrapper: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
  },
  yesButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesButtonTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
  yesButtonSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '600',
    marginTop: 2,
  },
  noButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
  },
  noButtonTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
  noButtonSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '600',
    marginTop: 2,
  },
});

