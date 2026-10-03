import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Zap, Shield, TrendingUp, Layers, HelpCircle, Activity, Info, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react-native';
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
  const [rulesExpanded, setRulesExpanded] = useState(false);

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

  const getSharesDisplay = (potVal: number | undefined, ratio: number, totalPoolVal: number) => {
    const val = potVal && potVal > 0 ? potVal : Math.round(totalPoolVal * ratio);
    const shares = Math.max(10, Math.round(val / 1000));
    const amountStr = val >= 1000000 ? `₦${(val / 1000000).toFixed(1)}M` : `₦${Math.round(val / 1000)}k`;
    return `${shares.toLocaleString()} Shares (${amountStr})`;
  };

  // Contracts: Slick and not bulky (1X2 standard sequence: Home, Draw, Away)
  const contracts: ContractConfig[] = [
    {
      id: 'home_win',
      marketName: `${homeTeam} to Win`,
      title: `${homeTeam} to Win`,
      question: `Will ${homeTeam} win the match in regular time?`,
      yesOdds: homeOdds,
      noOdds: calcNoOdds(homeOdds, 2.10),
      poolAmount: Math.round(poolLiquidity * 0.35),
      p2pShares: Math.round(p2pLiquidity * 0.30 / 1000),
    },
    {
      id: 'draw',
      marketName: 'Match Draw',
      title: 'Match Draw',
      question: 'Will the match end in a tie / draw at 90 mins?',
      yesOdds: drawOdds,
      noOdds: calcNoOdds(drawOdds, 1.35),
      poolAmount: Math.round(poolLiquidity * 0.25),
      p2pShares: Math.round(p2pLiquidity * 0.20 / 1000),
    },
    {
      id: 'away_win',
      marketName: `${awayTeam} to Win`,
      title: `${awayTeam} to Win`,
      question: `Will ${awayTeam} win the match in regular time?`,
      yesOdds: awayOdds,
      noOdds: calcNoOdds(awayOdds, 1.65),
      poolAmount: Math.round(poolLiquidity * 0.40),
      p2pShares: Math.round(p2pLiquidity * 0.25 / 1000),
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
                  {isLive ? '● LIVE' : `START ${match?.startTime ? new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TODAY'}`}
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
              </View>

              <View style={styles.centerBadge}>
                <Text style={styles.centerVs}>VS</Text>
              </View>

              <View style={styles.teamCol}>
                <View style={styles.teamBadge}>
                  <Text style={styles.teamBadgeText}>{(awayTeam || 'A').slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={styles.teamName} numberOfLines={1}>{awayTeam}</Text>
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

          {/* Top Liquidity Strip (Minimalist & Compact) */}
          <View style={styles.liquidityStrip}>
            <View style={styles.liquidityStripItem}>
              <Text style={styles.liquidityStripLabel}>TOTAL POOL</Text>
              <Text style={styles.liquidityStripVal}>₦{totalLiquidity.toLocaleString()}</Text>
            </View>
            <View style={styles.liquidityStripDivider} />
            <View style={styles.liquidityStripItem}>
              <Text style={styles.liquidityStripLabel}>AMM POOL</Text>
              <Text style={[styles.liquidityStripVal, { color: '#00D285' }]}>₦{poolLiquidity.toLocaleString()}</Text>
            </View>
            <View style={styles.liquidityStripDivider} />
            <View style={styles.liquidityStripItem}>
              <Text style={styles.liquidityStripLabel}>ORDER BOOK</Text>
              <Text style={[styles.liquidityStripVal, { color: '#38BDF8' }]}>₦{p2pLiquidity.toLocaleString()}</Text>
            </View>
          </View>

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Match Contracts</Text>
            <Text style={styles.sectionNotice}>Escrow Markets</Text>
          </View>

          {/* ==================== CARD 1: MATCH CONTRACTS (YES/NO) ==================== */}
          <View style={styles.contractShowcaseCard}>
            <View style={styles.showcaseCardHeader}>
              <View style={styles.showcaseBadgeTitleRow}>
                <Text style={styles.showcaseCardTitle}>Match Winner (1X2)</Text>
                <View style={styles.greenTagBadge}>
                  <Text style={styles.greenTagText}>YES / NO</Text>
                </View>
              </View>
              <View style={styles.shareUnitPill}>
                <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
              </View>
            </View>

            <View style={styles.showcaseRowsList}>
              {/* Outcome 1: Home Win */}
              <View style={styles.showcaseOutcomeRow}>
                <View style={styles.outcomeInfoLeft}>
                  <Text style={styles.outcomeName} numberOfLines={1}>{homeTeam} Win</Text>
                </View>
                <View style={styles.outcomeActionBtns}>
                  <TouchableOpacity
                    style={styles.actionBtnYes}
                    onPress={() => handleSelectOutcome(`${homeTeam} to Win`, 'Yes', homeOdds)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnYesText}>YES</Text>
                    <Text style={styles.actionBtnSubYes}>{homeOdds.toFixed(2)}x</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnNo}
                    onPress={() => handleSelectOutcome(`${homeTeam} to Win`, 'No', calcNoOdds(homeOdds, 2.10))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnNoText}>NO</Text>
                    <Text style={styles.actionBtnSubNo}>{calcNoOdds(homeOdds, 2.10).toFixed(2)}x</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Outcome 2: Draw */}
              <View style={styles.showcaseOutcomeRow}>
                <View style={styles.outcomeInfoLeft}>
                  <Text style={styles.outcomeName}>Draw</Text>
                </View>
                <View style={styles.outcomeActionBtns}>
                  <TouchableOpacity
                    style={styles.actionBtnYes}
                    onPress={() => handleSelectOutcome('Match Draw', 'Yes', drawOdds)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnYesText}>YES</Text>
                    <Text style={styles.actionBtnSubYes}>{drawOdds.toFixed(2)}x</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnNo}
                    onPress={() => handleSelectOutcome('Match Draw', 'No', calcNoOdds(drawOdds, 1.35))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnNoText}>NO</Text>
                    <Text style={styles.actionBtnSubNo}>{calcNoOdds(drawOdds, 1.35).toFixed(2)}x</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Outcome 3: Away Win */}
              <View style={styles.showcaseOutcomeRow}>
                <View style={styles.outcomeInfoLeft}>
                  <Text style={styles.outcomeName} numberOfLines={1}>{awayTeam} Win</Text>
                </View>
                <View style={styles.outcomeActionBtns}>
                  <TouchableOpacity
                    style={styles.actionBtnYes}
                    onPress={() => handleSelectOutcome(`${awayTeam} to Win`, 'Yes', awayOdds)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnYesText}>YES</Text>
                    <Text style={styles.actionBtnSubYes}>{awayOdds.toFixed(2)}x</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnNo}
                    onPress={() => handleSelectOutcome(`${awayTeam} to Win`, 'No', calcNoOdds(awayOdds, 1.65))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnNoText}>NO</Text>
                    <Text style={styles.actionBtnSubNo}>{calcNoOdds(awayOdds, 1.65).toFixed(2)}x</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* ==================== CARD 2: OVER/UNDER 2.5 (GOALS LINE) ==================== */}
          <View style={styles.contractShowcaseCard}>
            <View style={styles.showcaseCardHeader}>
              <View style={styles.showcaseBadgeTitleRow}>
                <Text style={styles.showcaseCardTitle}>Over / Under Goals</Text>
                <View style={[styles.greenTagBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                  <Text style={[styles.greenTagText, { color: '#38BDF8' }]}>2.5 LINE</Text>
                </View>
              </View>
              <View style={styles.shareUnitPill}>
                <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
              </View>
            </View>

            <View style={styles.showcaseRowsList}>
              <View style={styles.showcaseOutcomeRow}>
                <View style={styles.outcomeInfoLeft}>
                  <Text style={styles.outcomeName}>Over 2.5 Goals</Text>
                </View>
                <View style={styles.outcomeActionBtns}>
                  <TouchableOpacity
                    style={styles.actionBtnYes}
                    onPress={() => handleSelectOutcome('Over 2.5 Goals', 'Yes', over3Odds)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnYesText}>YES</Text>
                    <Text style={styles.actionBtnSubYes}>{over3Odds.toFixed(2)}x</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnNo}
                    onPress={() => handleSelectOutcome('Under 2.5 Goals', 'No', under3Odds)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnNoText}>NO</Text>
                    <Text style={styles.actionBtnSubNo}>{under3Odds.toFixed(2)}x</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* ==================== CARD 3: BTTS (BOTH TEAMS TO SCORE) ==================== */}
          <View style={styles.contractShowcaseCard}>
            <View style={styles.showcaseCardHeader}>
              <View style={styles.showcaseBadgeTitleRow}>
                <Text style={styles.showcaseCardTitle}>Both Teams to Score</Text>
                <View style={[styles.greenTagBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                  <Text style={[styles.greenTagText, { color: '#F59E0B' }]}>BTTS</Text>
                </View>
              </View>
              <View style={styles.shareUnitPill}>
                <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
              </View>
            </View>

            <View style={styles.showcaseRowsList}>
              <View style={styles.showcaseOutcomeRow}>
                <View style={styles.outcomeInfoLeft}>
                  <Text style={styles.outcomeName}>Both Teams Score</Text>
                </View>
                <View style={styles.outcomeActionBtns}>
                  <TouchableOpacity
                    style={styles.actionBtnYes}
                    onPress={() => handleSelectOutcome('Both Teams to Score', 'Yes', bttsYesOdds)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnYesText}>YES</Text>
                    <Text style={styles.actionBtnSubYes}>{bttsYesOdds.toFixed(2)}x</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnNo}
                    onPress={() => handleSelectOutcome('Both Teams to Score', 'No', bttsNoOdds)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnNoText}>NO</Text>
                    <Text style={styles.actionBtnSubNo}>{bttsNoOdds.toFixed(2)}x</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

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

  // Compact Liquidity Strip Styles
  liquidityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 26, 48, 0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  liquidityStripItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liquidityStripLabel: {
    fontSize: 9,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  liquidityStripVal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '800',
  },
  liquidityStripDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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

  /* Categorized Contract Showcase Card Styles */
  contractShowcaseCard: {
    backgroundColor: 'rgba(19, 28, 50, 0.94)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  showcaseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  showcaseBadgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  showcaseCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  greenTagBadge: {
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.3)',
  },
  greenTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  showcaseCardSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginTop: 3,
  },
  sharesCountTop: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  showcaseRowsList: {
    gap: 8,
  },
  showcaseOutcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  outcomeInfoLeft: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  outcomeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  outcomeSubLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginTop: 1,
  },
  outcomeSharesCount: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  outcomeActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnYes: {
    backgroundColor: '#00D285',
    width: 76,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnYesText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A1124',
    fontFamily: 'Inter',
    lineHeight: 14,
  },
  actionBtnSubYes: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0A1124',
    opacity: 0.85,
    marginTop: 1,
    fontFamily: 'Inter',
    lineHeight: 12,
  },
  actionBtnNo: {
    backgroundColor: '#1E293B',
    width: 76,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  actionBtnNoText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    lineHeight: 14,
  },
  actionBtnSubNo: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
    fontFamily: 'Inter',
    lineHeight: 12,
  },
  shareUnitPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
});

