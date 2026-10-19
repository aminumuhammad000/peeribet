import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Zap, Shield, ShieldAlert, TrendingUp, Layers, HelpCircle, Activity, Info, ChevronDown, ChevronUp, ArrowRight, X, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { matchService, p2pService, adminService, authService, showToast } from '../services/apiService';

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

export interface ContractInfoDetail {
  title: string;
  tag: string;
  description: string;
  rule: string;
  example: string;
}

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [match, setMatch] = useState<any>(null);
  const [orderBook, setOrderBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [togglingLock, setTogglingLock] = useState(false);
  const [selectedInfoContract, setSelectedInfoContract] = useState<ContractInfoDetail | null>(null);

  const homeTeam = (params.homeTeam as string) || 'Chelsea';
  const awayTeam = (params.awayTeam as string) || 'Arsenal';
  const matchId = params.id as string;

  useEffect(() => {
    authService.getMe().then((u) => { if (u) setUser(u); }).catch(() => {});
  }, []);

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

  const isMatchAdminLocked = Boolean(match?.isLocked || match?.isOverpowered || match?.status === 'SUSPENDED');

  const handleToggleAdminMatchLock = async () => {
    const targetId = match?._id || matchId;
    if (!targetId) return;
    setTogglingLock(true);
    try {
      await adminService.toggleMatchLock(targetId, !isMatchAdminLocked);
      showToast(`Match ${!isMatchAdminLocked ? 'LOCKED (Overpowered)' : 'UNLOCKED'} successfully`, 'success');
      setMatch((prev: any) => ({
        ...prev,
        isLocked: !isMatchAdminLocked,
        isOverpowered: !isMatchAdminLocked,
        status: !isMatchAdminLocked ? 'SUSPENDED' : 'ACTIVE',
      }));
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle match lock', 'error');
    } finally {
      setTogglingLock(false);
    }
  };

  const isOutcomeOverpowered = (oddsVal: number | undefined | null) => {
    if (isMatchAdminLocked) return true;
    if (typeof oddsVal === 'number' && oddsVal <= 1.43) return true;
    return false;
  };

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
        poolAmount: match?.poolAmount || match?.pool?.totalPot || 0,
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

  const getContractInfo = (key: string): ContractInfoDetail => {
    switch (key) {
      // 🥊 UFC MARKETS
      case 'ufc_takedowns_odds':
        return {
          title: 'Takedown counts odds',
          tag: 'ODD / EVEN',
          description: 'Trade on whether total fight takedowns will be an odd or even number.',
          rule: 'Settles strictly based on official UFC/Stats Perform stats. The combined number of official takedowns landed by both fighters in the fight must be an odd number (1, 3, 5, etc.) for Odd to settle YES.',
          example: 'If Fighter A lands 2 takedowns and Fighter B lands 1, total is 3 (Odd), settling Odd to YES.',
        };
      case 'ufc_duration':
        return {
          title: 'Fight duration/stoppage',
          tag: 'DURATION',
          description: 'Trade on how many rounds the fight lasts or if it ends early.',
          rule: 'Resolves to YES for Stoppage if either fighter achieves a finish before the final bell (KO, TKO, Submission, DQ, or Stoppage). Resolves to YES for Goes Distance if it completes all rounds.',
          example: 'A 2nd-round submission settles Stoppage Before Final Bell to YES.',
        };
      case 'ufc_amount_rounds_parity':
        return {
          title: 'Amount of rounds even or odd',
          tag: 'ROUNDS PARITY',
          description: 'Trade on whether the total rounds fought ends in an even or odd number.',
          rule: 'Settles on the number of the round in which the fight concludes, or total rounds fought (e.g. Round 1, 3, or 5 = Odd; Round 2 or 4 = Even).',
          example: 'If the fight finishes in Round 3, the total rounds fought (3) is Odd, settling Odd to YES.',
        };
      case 'ufc_r1_takedown':
        return {
          title: 'Will they be takedown landed in round 1',
          tag: 'ROUND 1',
          description: 'Trade Yes or No if a takedown happens in the first round.',
          rule: 'Resolves to YES if at least one official takedown is completed by either fighter during the opening round (Round 1).',
          example: 'A single completed takedown scored in Round 1 settles YES to win.',
        };
      case 'ufc_rounds_even_odd':
        return {
          title: 'Rounds even or odd',
          tag: 'ODD / EVEN',
          description: 'Trade on whether the total number of rounds matches an even or odd number.',
          rule: 'Settles on whether the official total number of completed rounds ends in an even or odd integer.',
          example: 'If 3 full rounds are fought, Odd settles YES.',
        };

      // 🥊 BOXING MARKETS
      case 'box_over9':
        return {
          title: 'Will the fight last over 9 rounds',
          tag: 'OVER 9 ROUNDS',
          description: 'Will the fight makes it past the 9th round.',
          rule: 'Resolves to YES if both boxers answer the bell to start Round 10. Resolves to NO if the bout terminates in rounds 1 through 9.',
          example: 'If the fight reaches round 10, YES settles as winning. A stoppage in round 8 settles NO.',
        };
      case 'box_knockdown':
        return {
          title: 'Will either boxers be knocked down',
          tag: 'KNOCKDOWN',
          description: 'Will one fighter gets officially knocked down.',
          rule: 'Resolves to YES if either boxer touches the canvas from a legal blow and receives an official referee 8-count during the fight.',
          example: 'If either fighter receives an official knockdown count, YES settles as winning.',
        };
      case 'box_early_ko':
        return {
          title: 'Will there be a knockout in round 1 to 4',
          tag: 'ROUNDS 1-4',
          description: 'Will the fight ends by KO in rounds 1, 2, 3, or 4.',
          rule: 'Resolves to YES if the fight is officially stopped via KO or TKO in round 1, 2, 3, or 4.',
          example: 'A stoppage at 1:45 of Round 2 settles YES to win.',
        };
      case 'box_distance':
        return {
          title: 'Will the fight go full scheduled distance',
          tag: 'FULL DISTANCE',
          description: 'Will the fight goes all the way to the judges\' decision.',
          rule: 'Resolves to YES if all scheduled championship rounds (e.g. 12 rounds) are completed and the decision goes to judges\' scorecards.',
          example: 'If the fight reaches the final bell without stoppage, Full Distance settles YES.',
        };

      // 🏀 BASKETBALL MARKETS
      case 'nba_points_odd':
        return {
          title: 'Total game points odd',
          tag: 'ODD POINTS',
          description: 'Bet that the combined final score of both teams adds up to an odd number.',
          rule: 'Resolves to YES if the combined final score of both teams (including overtime) is an odd integer.',
          example: 'Final score 110 - 107 = 217 (Odd). Odd settles YES.',
        };
      case 'nba_points_even':
        return {
          title: 'Total game points even',
          tag: 'EVEN POINTS',
          description: 'Will the total game points be even.',
          rule: 'Resolves to YES if the combined final score of both teams (including overtime) is an even integer.',
          example: 'Final score 112 - 108 = 220 (Even). Even settles YES.',
        };
      case 'nba_team_a_odd':
        return {
          title: 'Team A total points odd',
          tag: 'TEAM A ODD',
          description: `Will the total team A points be odd.`,
          rule: `Resolves to YES if ${homeTeam}'s final official score (including overtime) is an odd number.`,
          example: `If ${homeTeam} finishes with 109 points, Odd settles YES.`,
        };
      case 'nba_team_b_even':
        return {
          title: 'Team B total points even',
          tag: 'TEAM B EVEN',
          description: `Will the total team B points be even.`,
          rule: `Resolves to YES if ${awayTeam}'s final official score (including overtime) is an even number.`,
          example: `If ${awayTeam} finishes with 106 points, Even settles YES.`,
        };

      // EUROPEAN FOOTBALL
      case 'fb_winner':
        return {
          title: 'Match Winner (1X2)',
          tag: 'REGULAR TIME',
          description: 'Trade on the match outcome at the end of standard regulation time (90 minutes plus added injury time).',
          rule: 'Settles on official 90-minute result. Extra time and penalty shootouts are excluded.',
          example: `If ${homeTeam} wins 2 - 1 at 90 minutes, ${homeTeam} Win settles YES.`,
        };
      case 'fb_over25':
        return {
          title: 'Over / Under Goals',
          tag: '2.5 LINE',
          description: 'Trade on whether the total goals scored in regular time will be 3 or more, or 2 or fewer.',
          rule: 'Settles Over if 3+ total goals are scored; settles Under if 0, 1, or 2 total goals are scored.',
          example: 'A 2 - 1 scoreline equals 3 goals, resolving Over 2.5 Goals to YES.',
        };
      case 'fb_btts':
        return {
          title: 'Both Teams to Score (BTTS)',
          tag: 'BTTS',
          description: 'Trade on whether both competing clubs will each score at least 1 goal during regular time.',
          rule: 'Settles YES if both teams score 1 or more goals. Settles NO if either or both teams fail to score.',
          example: 'A 1 - 1 or 2 - 1 scoreline settles YES; a 2 - 0 or 0 - 0 scoreline settles NO.',
        };
      case 'fb_double_chance':
        return {
          title: 'Double Chance Hedge',
          tag: 'HEDGE',
          description: 'Trade on two possible outcomes combined into a single contract to protect against downside variance.',
          rule: '1X settles YES if Home Team wins or draws. X2 settles YES if Away Team wins or draws.',
          example: 'Holding 1X pays out ₦1,000 per share as long as the home team does not lose.',
        };
      case 'fb_halftime':
        return {
          title: 'Halftime Settlement',
          tag: '1ST HALF',
          description: 'Trade on which club leads the score at the 45-minute referee halftime whistle.',
          rule: 'Settles directly upon completion of the first half (45 mins + first-half stoppage time).',
          example: `If ${homeTeam} is ahead 1 - 0 at the break, ${homeTeam} Lead at Halftime settles YES.`,
        };
      case 'fb_corners':
        return {
          title: 'Total Match Corners',
          tag: '9.5 CORNERS',
          description: 'Trade on whether the combined number of corner kicks taken by both clubs will exceed 9.5.',
          rule: 'Settles Over 9.5 if 10 or more corner kicks are taken. Awarded but un-taken corners do not count.',
          example: 'If total corners taken equals 11, Over 9.5 Match Corners settles YES.',
        };
      case 'fb_bookings':
        return {
          title: 'Total Match Bookings',
          tag: '3.5 CARDS',
          description: 'Trade on whether total disciplinary cards issued to players on the pitch will exceed 3.5.',
          rule: 'Settles Over 3.5 if combined card points exceed 3.5 (Yellow = 1 card, Red = 2 cards). Maximum 3 cards per player.',
          example: '3 yellow cards + 1 red card = 5 card points, resolving Over 3.5 Bookings to YES.',
        };

      default:
        return {
          title: 'Trade Market Details',
          tag: 'CONTRACT INFO',
          description: 'Trade on binary YES / NO outcomes with peer-matched order execution or liquidity pool jackpot distribution.',
          rule: 'All trades settle according to verified match statistics provided by official sports data providers.',
          example: 'Each winning P2P share returns ₦1,000 upon official match verification.',
        };
    }
  };

  const matchSport = String(match?.sport || params.sport || '').toLowerCase();
  const matchLeague = String(match?.league || match?.leagueName || params.league || '').toLowerCase();

  const isUFC =
    matchSport.includes('ufc') ||
    matchSport.includes('mma') ||
    matchLeague.includes('ufc') ||
    matchLeague.includes('mma') ||
    matchLeague.includes('lightweight') ||
    matchLeague.includes('heavyweight unification') ||
    matchLeague.includes('featherweight') ||
    matchLeague.includes('bantamweight') ||
    matchLeague.includes('welterweight') ||
    homeTeam.includes('Makhachev') ||
    homeTeam.includes('Jones') ||
    homeTeam.includes('Adesanya') ||
    homeTeam.includes('Pereira') ||
    homeTeam.includes('Poirier') ||
    homeTeam.includes('Aspinall') ||
    homeTeam.includes('Ankalaev') ||
    awayTeam.includes('Makhachev') ||
    awayTeam.includes('Jones') ||
    awayTeam.includes('Adesanya') ||
    awayTeam.includes('Pereira') ||
    awayTeam.includes('Poirier') ||
    awayTeam.includes('Aspinall') ||
    awayTeam.includes('Ankalaev');

  const isBoxing =
    !isUFC &&
    (matchSport.includes('box') ||
    matchLeague.includes('box') ||
    matchLeague.includes('heavyweight') ||
    matchLeague.includes('wbc') ||
    matchLeague.includes('wba') ||
    matchLeague.includes('ibf') ||
    matchLeague.includes('wbo') ||
    matchLeague.includes('championship') ||
    homeTeam.includes('Fury') ||
    homeTeam.includes('Usyk') ||
    homeTeam.includes('Joshua') ||
    homeTeam.includes('Canelo') ||
    homeTeam.includes('Crawford') ||
    homeTeam.includes('Davis') ||
    awayTeam.includes('Fury') ||
    awayTeam.includes('Usyk') ||
    awayTeam.includes('Joshua') ||
    awayTeam.includes('Canelo') ||
    awayTeam.includes('Crawford') ||
    awayTeam.includes('Davis') ||
    matchSport.includes('combat'));

  const isCombat = isUFC || isBoxing || matchSport.includes('combat');

  const isBasketball =
    matchSport.includes('basket') ||
    matchSport.includes('nba') ||
    matchLeague.includes('nba') ||
    matchLeague.includes('euroleague') ||
    homeTeam.includes('Lakers') ||
    homeTeam.includes('Celtics') ||
    homeTeam.includes('Warriors') ||
    homeTeam.includes('Nuggets') ||
    homeTeam.includes('Mavericks') ||
    awayTeam.includes('Lakers') ||
    awayTeam.includes('Celtics') ||
    awayTeam.includes('Warriors') ||
    awayTeam.includes('Nuggets') ||
    awayTeam.includes('Mavericks');

  // --- Underground Odds (Used strictly for background execution & overpower locking, NEVER displayed in UI) ---
  const homeOdds = formatOdds(match?.odds?.home, 1.85);
  const awayOdds = formatOdds(match?.odds?.away, 2.40);
  const drawOdds = formatOdds(match?.odds?.draw, 3.10);
  const over3Odds = formatOdds(match?.odds?.over25, 1.95);
  const under3Odds = formatOdds(match?.odds?.under25, 1.85);
  const bttsYesOdds = formatOdds(match?.odds?.bttsYes, 1.80);
  const bttsNoOdds = formatOdds(match?.odds?.bttsNo, 2.00);

  // European Football additions
  const doubleChance1XOdds = formatOdds(1 / (1 / homeOdds + 1 / drawOdds), 1.28);
  const doubleChanceX2Odds = formatOdds(1 / (1 / awayOdds + 1 / drawOdds), 1.42);
  const halftimeLeadHomeOdds = formatOdds(homeOdds * 1.35, 2.45);
  const halftimeLeadAwayOdds = formatOdds(calcNoOdds(homeOdds * 1.35, 1.48), 1.48);
  const cornersOverOdds = 1.85;
  const cornersUnderOdds = 1.95;
  const bookingsOverOdds = 1.80;
  const bookingsUnderOdds = 2.00;

  // UFC additions (takedown counts, fight duration/stoppage, rounds even/odd, takedown in r1)
  const finishOdds = formatOdds(match?.odds?.over25, 1.65);
  const decisionOdds = calcNoOdds(finishOdds, 2.20);
  const ufcStoppageOdds = finishOdds;
  const ufcDistanceOdds = decisionOdds;
  const takedownsOverOdds = 1.85;
  const takedownsUnderOdds = 1.95;
  const r1TakedownYesOdds = 1.75;
  const r1TakedownNoOdds = 2.05;
  const ufcRoundsEvenOdds = 1.90;
  const ufcRoundsOddOdds = 1.90;
  const takedownsOddOdds = 1.90;
  const takedownsEvenOdds = 1.90;
  const amountRoundsOddOdds = 1.90;
  const amountRoundsEvenOdds = 1.90;

  // Boxing additions (fight last over 9 rounds, knockdown during fight, knockout in round 1 to 4, full scheduled distance)
  const boxOver9Odds = 1.80;
  const boxUnder9Odds = 2.00;
  const boxKnockdownYesOdds = 1.65;
  const boxKnockdownNoOdds = 2.20;
  const boxEarlyKoYesOdds = 3.20;
  const boxEarlyKoNoOdds = 1.35;
  const boxFullDistanceYesOdds = 2.15;
  const boxFullDistanceNoOdds = 1.68;

  // Basketball additions (total game points over/under, total points odd/even, team A points odd/even, team B points even/odd)
  const overPointsOdds = 1.90;
  const underPointsOdds = 1.90;
  const totalPointsOddOdds = 1.90;
  const totalPointsEvenOdds = 1.90;
  const teamAOddOdds = 1.90;
  const teamAEvenOdds = 1.90;
  const teamBEvenOdds = 1.90;
  const teamBOddOdds = 1.90;
  const halftimeHomeOdds = formatOdds(homeOdds * 1.15, 1.75);
  const halftimeAwayOdds = formatOdds(awayOdds * 1.15, 2.05);
  const spreadHomeOdds = 1.90;
  const spreadAwayOdds = 1.90;

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
      id: 'double_chance_home',
      marketName: `${homeTeam} Win or Draw (1X)`,
      title: 'Double Chance Hedge (1X)',
      question: `Will ${homeTeam} avoid defeat (win or draw) at full time?`,
      yesOdds: formatOdds(1 / (1 / homeOdds + 1 / drawOdds), 1.28),
      noOdds: awayOdds,
      poolAmount: Math.round(poolLiquidity * 0.18),
      p2pShares: Math.round(p2pLiquidity * 0.18 / 1000),
    },
    {
      id: 'first_half_lead',
      marketName: `${homeTeam} Lead at Halftime`,
      title: 'Halftime Settlement (1st Half Lead)',
      question: `Will ${homeTeam} be ahead on score at the 45-minute halftime break?`,
      yesOdds: formatOdds(homeOdds * 1.35, 2.45),
      noOdds: formatOdds(calcNoOdds(homeOdds * 1.35, 1.48), 1.48),
      poolAmount: Math.round(poolLiquidity * 0.12),
      p2pShares: Math.round(p2pLiquidity * 0.11 / 1000),
    },
    {
      id: 'corners_15',
      marketName: 'More Than 15 Corners',
      title: 'More Than 15 Corners',
      question: 'Will there be more than 15 corner kicks taken?',
      yesOdds: cornersOverOdds,
      noOdds: cornersUnderOdds,
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
          {/* Admin Overpower Lock Control Strip */}
          {user?.role === 'admin' && (
            <View style={styles.adminControlStrip}>
              <ShieldAlert size={16} color={isMatchAdminLocked ? '#EF4444' : '#00D285'} />
              <Text style={styles.adminControlText}>
                Admin: {isMatchAdminLocked ? 'Locked (Overpowered)' : 'Active Fixture'}
              </Text>
              <TouchableOpacity
                onPress={handleToggleAdminMatchLock}
                disabled={togglingLock}
                style={[
                  styles.adminLockBtnSmall,
                  isMatchAdminLocked ? styles.adminUnlockBtnSmall : styles.adminLockBtnActive,
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.adminLockBtnText}>
                  {togglingLock ? 'Updating...' : isMatchAdminLocked ? 'Unlock Match' : 'Lock (Overpowered)'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
            <Text style={styles.sectionTitle}>
              {isUFC ? 'UFC Octagon Contracts' : isBoxing ? 'Boxing Ring Contracts' : isBasketball ? 'Basketball Contracts' : 'European Football Contracts'}
            </Text>
            <Text style={styles.sectionNotice}>Escrow Markets</Text>
          </View>

          {/* ==================== CONDITIONAL SPORT CONTRACT CARDS ==================== */}

          {isUFC ? (
            /* ==================== UFC (OCTAGON CONTRACTS) ==================== */
            <>
              {/* Card 1: Takedown counts odds */}
              <View style={styles.contractShowcaseCard}>
                <View style={styles.showcaseCardHeader}>
                  <View style={styles.showcaseBadgeTitleRow}>
                    <Text style={styles.showcaseCardTitle}>Takedown counts odds</Text>
                    <View style={styles.greenTagBadge}>
                      <Text style={styles.greenTagText}>ODD / EVEN</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.infoIconButton}
                      onPress={() => setSelectedInfoContract(getContractInfo('ufc_takedowns_odds'))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Info size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shareUnitPill}>
                    <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
                  </View>
                </View>

                <View style={styles.showcaseRowsList}>
                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>Total Takedowns: Odd</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(takedownsOddOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Total Takedowns: Odd', 'Yes', takedownsOddOdds)}
                        disabled={isOutcomeOverpowered(takedownsOddOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(takedownsOddOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(takedownsEvenOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Total Takedowns: Odd', 'No', takedownsEvenOdds)}
                        disabled={isOutcomeOverpowered(takedownsEvenOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(takedownsEvenOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>Total Takedowns: Even</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(takedownsEvenOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Total Takedowns: Even', 'Yes', takedownsEvenOdds)}
                        disabled={isOutcomeOverpowered(takedownsEvenOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(takedownsEvenOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(takedownsOddOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Total Takedowns: Even', 'No', takedownsOddOdds)}
                        disabled={isOutcomeOverpowered(takedownsOddOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(takedownsOddOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 2: Fight duration/stoppage */}
              <View style={styles.contractShowcaseCard}>
                <View style={styles.showcaseCardHeader}>
                  <View style={styles.showcaseBadgeTitleRow}>
                    <Text style={styles.showcaseCardTitle}>Fight duration/stoppage</Text>
                    <View style={[styles.greenTagBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                      <Text style={[styles.greenTagText, { color: '#38BDF8' }]}>DURATION</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.infoIconButton}
                      onPress={() => setSelectedInfoContract(getContractInfo('ufc_duration'))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Info size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shareUnitPill}>
                    <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
                  </View>
                </View>

                <View style={styles.showcaseRowsList}>
                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>Stoppage Before Final Bell</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(ufcStoppageOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Stoppage Before Final Bell', 'Yes', ufcStoppageOdds)}
                        disabled={isOutcomeOverpowered(ufcStoppageOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(ufcStoppageOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(ufcDistanceOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Stoppage Before Final Bell', 'No', ufcDistanceOdds)}
                        disabled={isOutcomeOverpowered(ufcDistanceOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(ufcDistanceOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>Goes to Decision</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(ufcDistanceOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Goes to Decision', 'Yes', ufcDistanceOdds)}
                        disabled={isOutcomeOverpowered(ufcDistanceOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(ufcDistanceOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(ufcStoppageOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Goes to Decision', 'No', ufcStoppageOdds)}
                        disabled={isOutcomeOverpowered(ufcStoppageOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(ufcStoppageOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 3: Amount of rounds even or odd */}
              <View style={styles.contractShowcaseCard}>
                <View style={styles.showcaseCardHeader}>
                  <View style={styles.showcaseBadgeTitleRow}>
                    <Text style={styles.showcaseCardTitle}>Amount of rounds even or odd</Text>
                    <View style={[styles.greenTagBadge, { backgroundColor: 'rgba(20, 184, 166, 0.15)', borderColor: 'rgba(20, 184, 166, 0.3)' }]}>
                      <Text style={[styles.greenTagText, { color: '#14B8A6' }]}>ROUNDS PARITY</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.infoIconButton}
                      onPress={() => setSelectedInfoContract(getContractInfo('ufc_amount_rounds_parity'))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Info size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shareUnitPill}>
                    <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
                  </View>
                </View>

                <View style={styles.showcaseRowsList}>
                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>Total Rounds Fought: Odd</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(amountRoundsOddOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Total Rounds Fought: Odd', 'Yes', amountRoundsOddOdds)}
                        disabled={isOutcomeOverpowered(amountRoundsOddOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(amountRoundsOddOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(amountRoundsEvenOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Total Rounds Fought: Odd', 'No', amountRoundsEvenOdds)}
                        disabled={isOutcomeOverpowered(amountRoundsEvenOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(amountRoundsEvenOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>Total Rounds Fought: Even</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(amountRoundsEvenOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Total Rounds Fought: Even', 'Yes', amountRoundsEvenOdds)}
                        disabled={isOutcomeOverpowered(amountRoundsEvenOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(amountRoundsEvenOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(amountRoundsOddOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Total Rounds Fought: Even', 'No', amountRoundsOddOdds)}
                        disabled={isOutcomeOverpowered(amountRoundsOddOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(amountRoundsOddOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : isBoxing ? (
            /* ==================== BOXING (RING CONTRACTS) ==================== */
            <>
              {/* Card 1: Will the fight last over 9 rounds */}
              <View style={styles.contractShowcaseCard}>
                <View style={styles.showcaseCardHeader}>
                  <View style={styles.showcaseBadgeTitleRow}>
                    <Text style={styles.showcaseCardTitle}>Will the fight last over 9 rounds</Text>
                    <View style={[styles.greenTagBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                      <Text style={[styles.greenTagText, { color: '#F59E0B' }]}>OVER 9 ROUNDS</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.infoIconButton}
                      onPress={() => setSelectedInfoContract(getContractInfo('box_over9'))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Info size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shareUnitPill}>
                    <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
                  </View>
                </View>

                <View style={styles.showcaseRowsList}>
                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>Fight Lasts Over 9 Rounds</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(boxOver9Odds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Fight Lasts Over 9 Rounds', 'Yes', boxOver9Odds)}
                        disabled={isOutcomeOverpowered(boxOver9Odds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(boxOver9Odds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(boxUnder9Odds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Fight Lasts Over 9 Rounds', 'No', boxUnder9Odds)}
                        disabled={isOutcomeOverpowered(boxUnder9Odds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(boxUnder9Odds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 2: Will either boxers be knocked down */}
              <View style={styles.contractShowcaseCard}>
                <View style={styles.showcaseCardHeader}>
                  <View style={styles.showcaseBadgeTitleRow}>
                    <Text style={styles.showcaseCardTitle}>Will either boxers be knocked down</Text>
                    <View style={[styles.greenTagBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                      <Text style={[styles.greenTagText, { color: '#EF4444' }]}>KNOCKDOWN</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.infoIconButton}
                      onPress={() => setSelectedInfoContract(getContractInfo('box_knockdown'))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Info size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shareUnitPill}>
                    <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
                  </View>
                </View>

                <View style={styles.showcaseRowsList}>
                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>Either Boxer Knocked Down</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(boxKnockdownYesOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Either Boxer Knocked Down', 'Yes', boxKnockdownYesOdds)}
                        disabled={isOutcomeOverpowered(boxKnockdownYesOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(boxKnockdownYesOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(boxKnockdownNoOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Either Boxer Knocked Down', 'No', boxKnockdownNoOdds)}
                        disabled={isOutcomeOverpowered(boxKnockdownNoOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(boxKnockdownNoOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 3: Will there be a knockout in round 1 to 4 */}
              <View style={styles.contractShowcaseCard}>
                <View style={styles.showcaseCardHeader}>
                  <View style={styles.showcaseBadgeTitleRow}>
                    <Text style={styles.showcaseCardTitle}>Will there be a knockout in round 1 to 4</Text>
                    <View style={[styles.greenTagBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.3)' }]}>
                      <Text style={[styles.greenTagText, { color: '#A855F7' }]}>ROUNDS 1-4</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.infoIconButton}
                      onPress={() => setSelectedInfoContract(getContractInfo('box_early_ko'))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Info size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shareUnitPill}>
                    <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
                  </View>
                </View>

                <View style={styles.showcaseRowsList}>
                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>Knockout in Rounds 1 to 4</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(boxEarlyKoYesOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Knockout in Rounds 1 to 4', 'Yes', boxEarlyKoYesOdds)}
                        disabled={isOutcomeOverpowered(boxEarlyKoYesOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(boxEarlyKoYesOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(boxEarlyKoNoOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Knockout in Rounds 1 to 4', 'No', boxEarlyKoNoOdds)}
                        disabled={isOutcomeOverpowered(boxEarlyKoNoOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(boxEarlyKoNoOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : isBasketball ? (
            /* ==================== NBA BASKETBALL ==================== */
            <>
              {/* Card 1: Total game points odd */}
              <View style={styles.contractShowcaseCard}>
                <View style={styles.showcaseCardHeader}>
                  <View style={styles.showcaseBadgeTitleRow}>
                    <Text style={styles.showcaseCardTitle}>Total game points odd</Text>
                    <View style={[styles.greenTagBadge, { backgroundColor: 'rgba(20, 184, 166, 0.15)', borderColor: 'rgba(20, 184, 166, 0.3)' }]}>
                      <Text style={[styles.greenTagText, { color: '#14B8A6' }]}>ODD POINTS</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.infoIconButton}
                      onPress={() => setSelectedInfoContract(getContractInfo('nba_points_odd'))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Info size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shareUnitPill}>
                    <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
                  </View>
                </View>

                <View style={styles.showcaseRowsList}>
                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>Total Game Points: Odd</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(totalPointsOddOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Total Game Points: Odd', 'Yes', totalPointsOddOdds)}
                        disabled={isOutcomeOverpowered(totalPointsOddOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(totalPointsOddOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(totalPointsEvenOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Total Game Points: Odd', 'No', totalPointsEvenOdds)}
                        disabled={isOutcomeOverpowered(totalPointsEvenOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(totalPointsEvenOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 2: Total game points even */}
              <View style={styles.contractShowcaseCard}>
                <View style={styles.showcaseCardHeader}>
                  <View style={styles.showcaseBadgeTitleRow}>
                    <Text style={styles.showcaseCardTitle}>Total game points even</Text>
                    <View style={[styles.greenTagBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                      <Text style={[styles.greenTagText, { color: '#38BDF8' }]}>EVEN POINTS</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.infoIconButton}
                      onPress={() => setSelectedInfoContract(getContractInfo('nba_points_even'))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Info size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shareUnitPill}>
                    <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
                  </View>
                </View>

                <View style={styles.showcaseRowsList}>
                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>Total Game Points: Even</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(totalPointsEvenOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Total Game Points: Even', 'Yes', totalPointsEvenOdds)}
                        disabled={isOutcomeOverpowered(totalPointsEvenOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(totalPointsEvenOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(totalPointsOddOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Total Game Points: Even', 'No', totalPointsOddOdds)}
                        disabled={isOutcomeOverpowered(totalPointsOddOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(totalPointsOddOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 3: Team A total points odd */}
              <View style={styles.contractShowcaseCard}>
                <View style={styles.showcaseCardHeader}>
                  <View style={styles.showcaseBadgeTitleRow}>
                    <Text style={styles.showcaseCardTitle}>Team A total points odd</Text>
                    <View style={[styles.greenTagBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                      <Text style={[styles.greenTagText, { color: '#F59E0B' }]}>TEAM A ODD</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.infoIconButton}
                      onPress={() => setSelectedInfoContract(getContractInfo('nba_team_a_odd'))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Info size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shareUnitPill}>
                    <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
                  </View>
                </View>

                <View style={styles.showcaseRowsList}>
                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>{homeTeam} Total Points: Odd</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(teamAOddOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome(`${homeTeam} Total Points: Odd`, 'Yes', teamAOddOdds)}
                        disabled={isOutcomeOverpowered(teamAOddOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(teamAOddOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(teamAEvenOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome(`${homeTeam} Total Points: Odd`, 'No', teamAEvenOdds)}
                        disabled={isOutcomeOverpowered(teamAEvenOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(teamAEvenOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* ==================== EUROPEAN FOOTBALL (DEFAULT) ==================== */
            <>
              {/* Card 1: Match Winner (1X2) */}
              <View style={styles.contractShowcaseCard}>
                <View style={styles.showcaseCardHeader}>
                  <View style={styles.showcaseBadgeTitleRow}>
                    <Text style={styles.showcaseCardTitle}>Match Winner (1X2)</Text>
                    <View style={styles.greenTagBadge}>
                      <Text style={styles.greenTagText}>YES / NO</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.infoIconButton}
                      onPress={() => setSelectedInfoContract(getContractInfo('fb_winner'))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Info size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shareUnitPill}>
                    <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
                  </View>
                </View>

                <View style={styles.showcaseRowsList}>
                  {/* Home Win */}
                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName} numberOfLines={1}>{homeTeam} Win</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(homeOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome(`${homeTeam} to Win`, 'Yes', homeOdds)}
                        disabled={isOutcomeOverpowered(homeOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(homeOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(homeOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome(`${homeTeam} to Win`, 'No', calcNoOdds(homeOdds, 2.10))}
                        disabled={isOutcomeOverpowered(homeOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(homeOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Draw */}
                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName}>Draw</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(drawOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Match Draw', 'Yes', drawOdds)}
                        disabled={isOutcomeOverpowered(drawOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(drawOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(drawOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome('Match Draw', 'No', calcNoOdds(drawOdds, 1.35))}
                        disabled={isOutcomeOverpowered(drawOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(drawOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Away Win */}
                  <View style={styles.showcaseOutcomeRow}>
                    <View style={styles.outcomeInfoLeft}>
                      <Text style={styles.outcomeName} numberOfLines={1}>{awayTeam} Win</Text>
                    </View>
                    <View style={styles.outcomeActionBtns}>
                      <TouchableOpacity
                        style={[styles.actionBtnYes, isOutcomeOverpowered(awayOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome(`${awayTeam} to Win`, 'Yes', awayOdds)}
                        disabled={isOutcomeOverpowered(awayOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnYesText}>YES</Text>
                        <Text style={styles.actionBtnSubYes}>{isOutcomeOverpowered(awayOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtnNo, isOutcomeOverpowered(awayOdds) && { opacity: 0.5 }]}
                        onPress={() => handleSelectOutcome(`${awayTeam} to Win`, 'No', calcNoOdds(awayOdds, 1.65))}
                        disabled={isOutcomeOverpowered(awayOdds)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnNoText}>NO</Text>
                        <Text style={styles.actionBtnSubNo}>{isOutcomeOverpowered(awayOdds) ? 'Locked' : '₦1k / Sh'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}

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
                {isUFC ? (
                  <>
                    <View style={styles.ruleRow}>
                      <View style={styles.ruleBullet}>
                        <Text style={styles.ruleBulletNum}>1</Text>
                      </View>
                      <View style={styles.ruleContent}>
                        <Text style={styles.ruleHeading}>Official Octagon Announcement & Settlement</Text>
                        <Text style={styles.ruleDesc}>
                          Bout winner and finish method resolve strictly on the official decision announced inside the Octagon by the athletic commission. Disqualifications (DQ) count as stoppage wins.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ruleRow}>
                      <View style={styles.ruleBullet}>
                        <Text style={styles.ruleBulletNum}>2</Text>
                      </View>
                      <View style={styles.ruleContent}>
                        <Text style={styles.ruleHeading}>Takedown Counts Odds Verification</Text>
                        <Text style={styles.ruleDesc}>
                          Takedowns are verified strictly according to official UFC stats feed (UFC.com / UFCStats). Trade on whether total fight takedowns will be an odd or even number.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ruleRow}>
                      <View style={styles.ruleBullet}>
                        <Text style={styles.ruleBulletNum}>3</Text>
                      </View>
                      <View style={styles.ruleContent}>
                        <Text style={styles.ruleHeading}>Fight Duration & Amount of Rounds Parity</Text>
                        <Text style={styles.ruleDesc}>
                          Trade on how many rounds the fight lasts or if it ends early, and whether the total rounds fought ends in an even or odd number.
                        </Text>
                      </View>
                    </View>
                  </>
                ) : isBoxing ? (
                  <>
                    <View style={styles.ruleRow}>
                      <View style={styles.ruleBullet}>
                        <Text style={styles.ruleBulletNum}>1</Text>
                      </View>
                      <View style={styles.ruleContent}>
                        <Text style={styles.ruleHeading}>Official In-Ring Sanctioning Body Ruling</Text>
                        <Text style={styles.ruleDesc}>
                          Ring winner resolves on the official decision announced by the sanctioning body (WBC / WBA / IBF / WBO / Ring Magazine).
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ruleRow}>
                      <View style={styles.ruleBullet}>
                        <Text style={styles.ruleBulletNum}>2</Text>
                      </View>
                      <View style={styles.ruleContent}>
                        <Text style={styles.ruleHeading}>Knockdown Protocol</Text>
                        <Text style={styles.ruleDesc}>
                          Knockdown recorded resolves YES only when either boxer gets officially knocked down and the referee initiates a mandatory count.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ruleRow}>
                      <View style={styles.ruleBullet}>
                        <Text style={styles.ruleBulletNum}>3</Text>
                      </View>
                      <View style={styles.ruleContent}>
                        <Text style={styles.ruleHeading}>Rounds Duration & Early Knockout (R1-4)</Text>
                        <Text style={styles.ruleDesc}>
                          Settles on whether the fight makes it past the 9th round, and whether the fight ends by KO in rounds 1, 2, 3, or 4.
                        </Text>
                      </View>
                    </View>
                  </>
                ) : isBasketball ? (
                  <>
                    <View style={styles.ruleRow}>
                      <View style={styles.ruleBullet}>
                        <Text style={styles.ruleBulletNum}>1</Text>
                      </View>
                      <View style={styles.ruleContent}>
                        <Text style={styles.ruleHeading}>Official Final Score & Overtime Inclusion</Text>
                        <Text style={styles.ruleDesc}>
                          All game points and parity contracts resolve on the official final score including all overtime (OT) periods played.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ruleRow}>
                      <View style={styles.ruleBullet}>
                        <Text style={styles.ruleBulletNum}>2</Text>
                      </View>
                      <View style={styles.ruleContent}>
                        <Text style={styles.ruleHeading}>Total Game Points Parity (Odd vs Even)</Text>
                        <Text style={styles.ruleDesc}>
                          Trade on whether the combined total final game points scored by both teams ends in an odd or even number.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ruleRow}>
                      <View style={styles.ruleBullet}>
                        <Text style={styles.ruleBulletNum}>3</Text>
                      </View>
                      <View style={styles.ruleContent}>
                        <Text style={styles.ruleHeading}>Team Points Parity Protocol</Text>
                        <Text style={styles.ruleDesc}>
                          Trade on whether the final score for Team A concludes with an odd total number of points.
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.ruleRow}>
                      <View style={styles.ruleBullet}>
                        <Text style={styles.ruleBulletNum}>1</Text>
                      </View>
                      <View style={styles.ruleContent}>
                        <Text style={styles.ruleHeading}>Official 90-Minute Regulation Time</Text>
                        <Text style={styles.ruleDesc}>
                          All contracts resolve strictly on the official 90 minutes of play plus referee stoppage/injury time. Extra time (ET) and penalty shootouts do not count.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ruleRow}>
                      <View style={styles.ruleBullet}>
                        <Text style={styles.ruleBulletNum}>2</Text>
                      </View>
                      <View style={styles.ruleContent}>
                        <Text style={styles.ruleHeading}>Match Winner (1X2) Settlement</Text>
                        <Text style={styles.ruleDesc}>
                          Settles Home Win, Draw, or Away Win based on the official final whistle score announced by the match officials and league authority.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ruleRow}>
                      <View style={styles.ruleBullet}>
                        <Text style={styles.ruleBulletNum}>3</Text>
                      </View>
                      <View style={styles.ruleContent}>
                        <Text style={styles.ruleHeading}>Escrow Settlement & Payout Protection</Text>
                        <Text style={styles.ruleDesc}>
                          All peer orders and pool liquidity are held in secure escrow. Winning outcome shares settle at ₦1,000 per share with instant dividend wallet credit.
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.ruleRow}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletNum}>⚡</Text>
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

        {/* Professional Contract Info Modal (Zero UI Overlap) */}
        <Modal
          visible={!!selectedInfoContract}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedInfoContract(null)}
        >
          <View style={styles.infoModalOverlay}>
            <View style={styles.infoModalCard}>
              <View style={styles.infoModalHeader}>
                <View style={styles.infoModalTitleCol}>
                  <View style={styles.infoModalBadgeRow}>
                    <Text style={styles.infoModalTag}>
                      {selectedInfoContract?.tag || 'MARKET DETAILS'}
                    </Text>
                  </View>
                  <Text style={styles.infoModalTitle}>
                    {selectedInfoContract?.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedInfoContract(null)}
                  style={styles.infoModalCloseBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.infoModalBody}>
                {/* Section 1: Overview */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionLabel}>HOW IT WORKS</Text>
                  <Text style={styles.infoSectionText}>
                    {selectedInfoContract?.description}
                  </Text>
                </View>

                {/* Section 2: Settlement Rules */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionLabel}>SETTLEMENT RULES</Text>
                  <View style={styles.infoRuleBox}>
                    <ShieldCheck size={16} color="#00D285" style={{ marginTop: 2 }} />
                    <Text style={styles.infoRuleText}>
                      {selectedInfoContract?.rule}
                    </Text>
                  </View>
                </View>

                {/* Section 3: Payout Example */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionLabel}>TRADING EXAMPLE</Text>
                  <View style={styles.infoExampleBox}>
                    <Zap size={14} color="#38BDF8" style={{ marginTop: 2 }} />
                    <Text style={styles.infoExampleText}>
                      {selectedInfoContract?.example}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={() => setSelectedInfoContract(null)}
                style={styles.infoModalDismissBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.infoModalDismissText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  adminControlStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 6,
  },
  adminControlText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    fontFamily: 'Inter',
  },
  adminLockBtnSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminLockBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  adminUnlockBtnSmall: {
    backgroundColor: 'rgba(0, 210, 133, 0.2)',
    borderWidth: 1,
    borderColor: '#00D285',
  },
  adminLockBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  infoIconButton: {
    padding: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#0F1A30',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 14,
    marginBottom: 14,
  },
  infoModalTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  infoModalBadgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  infoModalTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
  infoModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  infoModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalBody: {
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  infoSectionText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 19,
    fontFamily: 'Inter',
  },
  infoRuleBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0, 210, 133, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.25)',
    borderRadius: 10,
    padding: 10,
  },
  infoRuleText: {
    flex: 1,
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  infoExampleBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 10,
    padding: 10,
  },
  infoExampleText: {
    flex: 1,
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  infoModalDismissBtn: {
    backgroundColor: '#00D285',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalDismissText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#050B14',
    fontFamily: 'Inter',
  },
});

