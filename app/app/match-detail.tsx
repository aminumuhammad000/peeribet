import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Zap, Shield, TrendingUp, Layers, HelpCircle, Activity, Info, ChevronDown, ChevronUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { matchService, p2pService } from '../services/apiService';

interface ContractConfig {
  id: string;
  marketName: string;
  title: string;
  question: string;
  yesOdds: number;
  noOdds: number;
  poolAmount: number;
  p2pShares?: number;
}

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [match, setMatch] = useState<any>(null);
  const [orderBook, setOrderBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rulesExpanded, setRulesExpanded] = useState(true);

  const homeTeam = (params.homeTeam as string) || 'Chelsea';
  const awayTeam = (params.awayTeam as string) || 'Arsenal';
  const matchId = params.id as string;

  useEffect(() => {
    const fetchMatchAndOrderBook = async () => {
      if (!matchId) return;
      try {
        const [matchData, obData] = await Promise.all([
          matchService.getMatchById(matchId).catch(() => null),
          p2pService.getOrderBook(matchId).catch(() => null),
        ]);
        if (matchData) setMatch(matchData);
        if (obData) setOrderBook(obData);
      } catch (err: any) {
        console.error('Error fetching match detail:', err);
        setError(err.response?.data?.message || 'Something went wrong while fetching details. Try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchMatchAndOrderBook();
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

  // Liquidity Calculations (Separate Pool and P2P Trading Liquidity)
  const basePool = match?.poolAmount || match?.pool?.totalPool || 0;
  const poolLiquidity = basePool > 0 ? basePool : 250000;

  let p2pOpenShares = match?.p2pStats?.openShares || 0;
  if (orderBook?.orderBook) {
    const obShares = Object.values(orderBook.orderBook).reduce(
      (acc: number, item: any) => acc + (item.openShares || 0),
      0
    );
    if (obShares > p2pOpenShares) p2pOpenShares = obShares;
  }
  const p2pLiquidity = Math.max(
    p2pOpenShares * 1000,
    orderBook?.totalP2PVolume || 0,
    Math.round(poolLiquidity * 0.45)
  );
  const totalLiquidity = poolLiquidity + p2pLiquidity;
  const poolPercent = Math.max(15, Math.min(85, Math.round((poolLiquidity / totalLiquidity) * 100)));
  const p2pPercent = 100 - poolPercent;

  // Contracts: Slick and not bulky
  const contracts: ContractConfig[] = [
    {
      id: 'home_win',
      marketName: `${homeTeam} to Win`,
      title: `${homeTeam} to Win`,
      question: `Will ${homeTeam} win the match in regular time?`,
      yesOdds: homeOdds,
      noOdds: calcNoOdds(homeOdds, 2.10),
      poolAmount: Math.round(poolLiquidity * 0.32),
      p2pShares: Math.round(p2pLiquidity * 0.30 / 1000),
    },
    {
      id: 'away_win',
      marketName: `${awayTeam} to Win`,
      title: `${awayTeam} to Win`,
      question: `Will ${awayTeam} win the match in regular time?`,
      yesOdds: awayOdds,
      noOdds: calcNoOdds(awayOdds, 1.65),
      poolAmount: Math.round(poolLiquidity * 0.24),
      p2pShares: Math.round(p2pLiquidity * 0.25 / 1000),
    },
    {
      id: 'draw',
      marketName: 'Match Draw',
      title: 'Match Draw',
      question: 'Will the match end in a tie / draw at 90 mins?',
      yesOdds: drawOdds,
      noOdds: 1.35,
      poolAmount: Math.round(poolLiquidity * 0.16),
      p2pShares: Math.round(p2pLiquidity * 0.15 / 1000),
    },
    {
      id: 'btts',
      marketName: 'Both Teams to Score',
      title: 'Both Teams to Score (BTTS)',
      question: `Will both ${homeTeam} and ${awayTeam} score at least 1 goal?`,
      yesOdds: bttsYesOdds,
      noOdds: bttsNoOdds,
      poolAmount: Math.round(poolLiquidity * 0.14),
      p2pShares: Math.round(p2pLiquidity * 0.16 / 1000),
    },
    {
      id: 'over_3_goals',
      marketName: 'Over 3 Goals',
      title: 'Over 3 Goals',
      question: 'Will 3 or more total aggregate goals be scored?',
      yesOdds: over3Odds,
      noOdds: under3Odds,
      poolAmount: Math.round(poolLiquidity * 0.10),
      p2pShares: Math.round(p2pLiquidity * 0.09 / 1000),
    },
    {
      id: 'corners_15',
      marketName: 'More Than 15 Corners',
      title: 'More Than 15 Corners',
      question: 'Will there be more than 15 corner kicks taken?',
      yesOdds: cornersYesOdds,
      noOdds: cornersNoOdds,
      poolAmount: Math.round(poolLiquidity * 0.04),
      p2pShares: Math.round(p2pLiquidity * 0.05 / 1000),
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
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{homeTeam} vs {awayTeam}</Text>
            <Text style={styles.headerSub}>{match?.leagueName || match?.league || 'MATCH PREDICTIONS'}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Match Banner Card (Compact & Modern) */}
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
              <View style={styles.shareUnitPill}>
                <Zap size={11} color="#00D285" />
                <Text style={styles.shareUnitText}>1 Share = ₦1,000</Text>
              </View>
              <Text style={styles.contractFormatNotice}>Binary YES / NO Contracts</Text>
            </View>
          </View>

          {/* Top Liquidity Monitor (Separate Pool and P2P Trading Liquidity) */}
          <View style={styles.liquidityMonitorCard}>
            <View style={styles.monitorHeaderRow}>
              <View style={styles.monitorTitleLeft}>
                <View style={styles.pulsingDot} />
                <Text style={styles.monitorTitle}>LIQUIDITY MONITOR</Text>
              </View>
              <View style={styles.totalLiquidityBadge}>
                <Text style={styles.totalLiquidityLabel}>TOTAL</Text>
                <Text style={styles.totalLiquidityValue}>₦{totalLiquidity.toLocaleString()}</Text>
              </View>
            </View>

            {/* Split Liquidity Grid (P2P vs Pool Separate) */}
            <View style={styles.liquidityGrid}>
              {/* Pool Trading Liquidity Panel */}
              <View style={[styles.liquidityPanel, styles.poolPanelBorder]}>
                <View style={styles.panelHeader}>
                  <View style={[styles.panelIconBox, { backgroundColor: 'rgba(0, 210, 133, 0.12)' }]}>
                    <Layers size={14} color="#00D285" />
                  </View>
                  <View style={styles.panelTag}>
                    <Text style={styles.panelTagText}>AMM POOL</Text>
                  </View>
                </View>
                <Text style={styles.panelTypeTitle}>Pool Trading</Text>
                <Text style={styles.panelAmount}>₦{poolLiquidity.toLocaleString()}</Text>
                <View style={styles.panelFooterRow}>
                  <Text style={styles.panelSubText}>
                    {Math.round(poolLiquidity / 1000).toLocaleString()} Shares
                  </Text>
                  <Text style={[styles.panelSharePct, { color: '#00D285' }]}>{poolPercent}%</Text>
                </View>
              </View>

              {/* P2P Order Book Liquidity Panel */}
              <View style={[styles.liquidityPanel, styles.p2pPanelBorder]}>
                <View style={styles.panelHeader}>
                  <View style={[styles.panelIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                    <TrendingUp size={14} color="#38BDF8" />
                  </View>
                  <View style={[styles.panelTag, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <Text style={[styles.panelTagText, { color: '#38BDF8' }]}>ORDER BOOK</Text>
                  </View>
                </View>
                <Text style={styles.panelTypeTitle}>P2P Trading</Text>
                <Text style={[styles.panelAmount, { color: '#38BDF8' }]}>₦{p2pLiquidity.toLocaleString()}</Text>
                <View style={styles.panelFooterRow}>
                  <Text style={styles.panelSubText}>
                    {Math.round(p2pLiquidity / 1000).toLocaleString()} Open
                  </Text>
                  <Text style={[styles.panelSharePct, { color: '#38BDF8' }]}>{p2pPercent}%</Text>
                </View>
              </View>
            </View>

            {/* Visual Liquidity Split Ratio Bar */}
            <View style={styles.ratioBarTrack}>
              <View style={[styles.ratioBarFillPool, { width: `${poolPercent}%` }]} />
              <View style={[styles.ratioBarFillP2P, { width: `${p2pPercent}%` }]} />
            </View>
            <View style={styles.ratioLabelsRow}>
              <Text style={styles.ratioLabelText}>Pool: {poolPercent}%</Text>
              <Text style={styles.ratioLabelText}>P2P: {p2pPercent}%</Text>
            </View>
          </View>

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prediction Markets</Text>
            <Text style={styles.sectionNotice}>Tap YES or NO to trade</Text>
          </View>

          {/* Prediction Contracts List (Slick and Not Bulky) */}
          {contracts.map((contract) => (
            <View key={contract.id} style={styles.contractCard}>
              <View style={styles.contractHeader}>
                <View style={styles.contractTextContainer}>
                  <Text style={styles.contractTitle}>{contract.title}</Text>
                  <Text style={styles.contractQuestion} numberOfLines={1}>{contract.question}</Text>
                </View>
                <View style={styles.poolChip}>
                  <Text style={styles.poolChipText}>
                    ₦{contract.poolAmount.toLocaleString()}
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
                    colors={['#00D285', '#009F65']}
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
                    colors={['#172239', '#101728']}
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

          {/* Market Resolution Explainer at the Bottom of the Menu */}
          <View style={styles.resolutionCard}>
            <TouchableOpacity
              style={styles.resolutionHeader}
              onPress={() => setRulesExpanded((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={styles.resolutionTitleRow}>
                <View style={styles.resolutionIconBadge}>
                  <Shield size={16} color="#00D285" />
                </View>
                <View>
                  <Text style={styles.resolutionMainTitle}>How Markets Resolve</Text>
                  <Text style={styles.resolutionSubTitle}>Official Settlement & Resolution Protocol</Text>
                </View>
              </View>
              {rulesExpanded ? (
                <ChevronUp size={18} color="#8FA2C7" />
              ) : (
                <ChevronDown size={18} color="#8FA2C7" />
              )}
            </TouchableOpacity>

            {rulesExpanded && (
              <View style={styles.resolutionBody}>
                {/* Rule 1: Regulation Full Time */}
                <View style={styles.ruleRow}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletNum}>1</Text>
                  </View>
                  <View style={styles.ruleContent}>
                    <Text style={styles.ruleHeading}>Official 90-Minute Regulation Time</Text>
                    <Text style={styles.ruleDesc}>
                      All contracts resolve strictly on the official 90 minutes of play plus referee stoppage/injury time. Extra time (ET) and penalty shootouts do not count unless specified in a dedicated overtime market.
                    </Text>
                  </View>
                </View>

                {/* Rule 2: Both Teams to Score */}
                <View style={styles.ruleRow}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletNum}>2</Text>
                  </View>
                  <View style={styles.ruleContent}>
                    <Text style={styles.ruleHeading}>Both Teams to Score (BTTS)</Text>
                    <Text style={styles.ruleDesc}>
                      Resolves <Text style={{ color: '#00D285', fontWeight: '700' }}>YES</Text> immediately as soon as both teams score at least 1 goal in regulation. Resolves <Text style={{ color: '#EF4444', fontWeight: '700' }}>NO</Text> at full-time whistle if either team has failed to score.
                    </Text>
                  </View>
                </View>

                {/* Rule 3: Win & Draw Contracts */}
                <View style={styles.ruleRow}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletNum}>3</Text>
                  </View>
                  <View style={styles.ruleContent}>
                    <Text style={styles.ruleHeading}>Match Outcomes (Win / Draw)</Text>
                    <Text style={styles.ruleDesc}>
                      Resolved based on the final official scoreline. If a fixture is officially abandoned or postponed for more than 24 hours without resumption, all open share orders are voided and 100% refunded.
                    </Text>
                  </View>
                </View>

                {/* Rule 4: Over 3 Goals & Corners */}
                <View style={styles.ruleRow}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletNum}>4</Text>
                  </View>
                  <View style={styles.ruleContent}>
                    <Text style={styles.ruleHeading}>Over 3 Goals & Corner Markets</Text>
                    <Text style={styles.ruleDesc}>
                      Over 3 goals requires 3 or more total aggregate goals by both teams (own goals count). Corner kick markets count only corners physically taken before the final whistle (awarded but un-taken corners do not count).
                    </Text>
                  </View>
                </View>

                {/* Rule 5: Instant Share Settlement */}
                <View style={styles.ruleRow}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletNum}>5</Text>
                  </View>
                  <View style={styles.ruleContent}>
                    <Text style={styles.ruleHeading}>Automated Wallet Payout</Text>
                    <Text style={styles.ruleDesc}>
                      Winning shares settle immediately upon provider confirmation at <Text style={{ color: '#00D285', fontWeight: '700' }}>₦1,000 per share</Text> (or 100% of final pool dividend), credited automatically to your cash wallet with zero wagering locks.
                    </Text>
                  </View>
                </View>

                {/* Trust Footer */}
                <View style={styles.resolutionTrustBadge}>
                  <CheckCircle size={14} color="#00D285" />
                  <Text style={styles.resolutionTrustText}>
                    Verified by Official League Feed & Multi-Source Settlement Engine
                  </Text>
                </View>
              </View>
            )}
          </View>
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
    paddingVertical: 12,
    backgroundColor: '#0F1A30',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#162238',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerSub: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  bannerCard: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(19, 28, 50, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.22)',
    marginBottom: 12,
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: 'rgba(0, 210, 133, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2,
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
    letterSpacing: 0.6,
  },
  matchVsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
  },
  teamBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  teamBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  teamName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  teamRole: {
    fontSize: 8,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  centerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.35)',
    backgroundColor: 'rgba(0, 210, 133, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  centerVs: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  centerSub: {
    fontSize: 7,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  bannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 7,
  },
  shareUnitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  shareUnitText: {
    fontSize: 9,
    color: '#00D285',
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  contractFormatNotice: {
    fontSize: 9,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },

  // Liquidity Monitor Styles
  liquidityMonitorCard: {
    backgroundColor: 'rgba(15, 26, 48, 0.95)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.25)',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  monitorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monitorTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D285',
    shadowColor: '#00D285',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  monitorTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Inter',
    letterSpacing: 0.8,
  },
  totalLiquidityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  totalLiquidityLabel: {
    fontSize: 9,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  totalLiquidityValue: {
    fontSize: 11,
    color: '#00D285',
    fontFamily: 'Inter',
    fontWeight: '800',
  },
  liquidityGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  liquidityPanel: {
    flex: 1,
    backgroundColor: 'rgba(10, 18, 36, 0.85)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  poolPanelBorder: {
    borderColor: 'rgba(0, 210, 133, 0.3)',
  },
  p2pPanelBorder: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  panelIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTag: {
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  panelTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  panelTypeTitle: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    fontWeight: '600',
    marginBottom: 2,
  },
  panelAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  panelFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelSubText: {
    fontSize: 9,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  panelSharePct: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  ratioBarTrack: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 4,
  },
  ratioBarFillPool: {
    backgroundColor: '#00D285',
    height: '100%',
  },
  ratioBarFillP2P: {
    backgroundColor: '#38BDF8',
    height: '100%',
  },
  ratioLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratioLabelText: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: 'Inter',
    fontWeight: '600',
  },

  // Prediction Contracts Styles (Slick & Not Bulky)
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  sectionNotice: {
    fontSize: 10,
    color: '#00D285',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  contractCard: {
    backgroundColor: 'rgba(15, 24, 44, 0.92)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contractTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  contractTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 1,
  },
  contractQuestion: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  poolChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  poolChipText: {
    fontSize: 9,
    color: '#00D285',
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnWrapper: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    overflow: 'hidden',
  },
  yesButtonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  yesButtonTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  yesButtonSub: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  noButtonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 10,
  },
  noButtonTitle: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  noButtonSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '600',
  },

  // Market Resolution Explainer Styles (Bottom of Menu)
  resolutionCard: {
    backgroundColor: 'rgba(15, 24, 44, 0.94)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  resolutionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(21, 33, 61, 0.7)',
  },
  resolutionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  resolutionIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 210, 133, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolutionMainTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  resolutionSubTitle: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginTop: 1,
  },
  resolutionBody: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  ruleBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  ruleBulletNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  ruleContent: {
    flex: 1,
  },
  ruleHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  ruleDesc: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
    lineHeight: 16,
  },
  resolutionTrustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 210, 133, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  resolutionTrustText: {
    flex: 1,
    fontSize: 10,
    color: '#00D285',
    fontFamily: 'Inter',
    fontWeight: '600',
    lineHeight: 14,
  },
});

