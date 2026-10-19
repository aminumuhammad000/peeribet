import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
  Info,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import {
  authService,
  matchService,
  predictionMarketService,
  notificationService,
  showToast,
} from '../../services/apiService';
import { getSocket } from '../../services/socketService';

// Fallback curated markets across categories
const FALLBACK_POLITICS_MARKETS = [
  {
    _id: 'pol_1',
    title: 'Central Bank to cut benchmark interest rate in Q4?',
    category: 'Politics',
    subcategory: 'Policy & Economy',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 3450000,
    closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    yesOdds: 1.85,
    noOdds: 1.95,
    rules: 'Resolves to YES if the official Monetary Policy Committee announces a rate cut.',
  },
  {
    _id: 'pol_2',
    title: 'US Federal Reserve to lower rates at upcoming FOMC meeting?',
    category: 'Politics',
    subcategory: 'Global Affairs',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 5120000,
    closingDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    yesOdds: 1.72,
    noOdds: 2.10,
    rules: 'Resolves according to the official statement released by the Federal Reserve.',
  },
  {
    _id: 'pol_3',
    title: 'Nigeria Inflation Rate to drop below 28% in official NBS report?',
    category: 'Politics',
    subcategory: 'Policy & Economy',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 2180000,
    closingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    yesOdds: 2.25,
    noOdds: 1.60,
    rules: 'Resolves based on headline CPI data published by National Bureau of Statistics.',
  },
];

const isBoxingMatch = (m: any) => {
  const s = String(m?.sport || '').toLowerCase();
  const l = String(m?.league || m?.leagueName || '').toLowerCase();
  const h = String(m?.homeTeam || '').toLowerCase();
  const a = String(m?.awayTeam || '').toLowerCase();
  if (s === 'boxing') return true;
  if (l.includes('boxing') || l.includes('wbc') || l.includes('wba') || l.includes('ibf') || l.includes('wbo') || l.includes('heavyweight championship')) return true;
  if (h.includes('fury') || h.includes('usyk') || h.includes('canelo') || h.includes('crawford') || h.includes('joshua')) return true;
  if (a.includes('fury') || a.includes('usyk') || a.includes('canelo') || a.includes('crawford') || a.includes('joshua')) return true;
  return false;
};

const isUFCMatch = (m: any) => {
  if (isBoxingMatch(m)) return false;
  const s = String(m?.sport || '').toLowerCase();
  const l = String(m?.league || m?.leagueName || '').toLowerCase();
  const h = String(m?.homeTeam || '').toLowerCase();
  const a = String(m?.awayTeam || '').toLowerCase();
  if (s === 'ufc' || s === 'mma') return true;
  if (l.includes('ufc') || l.includes('mma') || l.includes('lightweight championship') || l.includes('unification title') || l.includes('light heavyweight')) return true;
  if (h.includes('makhachev') || h.includes('jones') || h.includes('aspinall') || h.includes('pereira') || h.includes('ankalaev') || h.includes('tsarukyan')) return true;
  if (a.includes('makhachev') || a.includes('jones') || a.includes('aspinall') || a.includes('pereira') || a.includes('ankalaev') || a.includes('tsarukyan')) return true;
  return false;
};

const isBasketballMatch = (m: any) => {
  const s = String(m?.sport || '').toLowerCase();
  const l = String(m?.league || m?.leagueName || '').toLowerCase();
  const h = String(m?.homeTeam || '').toLowerCase();
  const a = String(m?.awayTeam || '').toLowerCase();
  if (s.includes('basket') || s.includes('nba') || l.includes('nba') || l.includes('euroleague')) return true;
  if (h.includes('lakers') || h.includes('celtics') || h.includes('warriors') || h.includes('nuggets') || h.includes('mavericks')) return true;
  if (a.includes('lakers') || a.includes('celtics') || a.includes('warriors') || a.includes('nuggets') || a.includes('mavericks')) return true;
  return false;
};

const isFootballMatch = (m: any) => {
  return !isBoxingMatch(m) && !isUFCMatch(m) && !isBasketballMatch(m);
};

const FALLBACK_BOXING_FIXTURES = [
  {
    _id: 'box_1',
    sport: 'Boxing',
    homeTeam: 'Tyson Fury',
    awayTeam: 'Oleksandr Usyk',
    league: 'Undisputed World Heavyweight Championship',
    status: 'UPCOMING',
    startTime: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(),
    poolAmount: 9400000,
    odds: { home: 2.15, draw: 22.0, away: 1.72 },
  },
  {
    _id: 'box_2',
    sport: 'Boxing',
    homeTeam: 'Canelo Alvarez',
    awayTeam: 'Terence Crawford',
    league: 'Super Middleweight World Championship',
    status: 'UPCOMING',
    startTime: new Date(Date.now() + 200 * 60 * 60 * 1000).toISOString(),
    poolAmount: 4300000,
    odds: { home: 1.62, draw: 20.0, away: 2.30 },
  },
  {
    _id: 'box_3',
    sport: 'Boxing',
    homeTeam: 'Anthony Joshua',
    awayTeam: 'Daniel Dubois',
    league: 'IBF Heavyweight World Title',
    status: 'UPCOMING',
    startTime: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
    poolAmount: 5600000,
    odds: { home: 1.70, draw: 24.0, away: 2.10 },
  },
];

const FALLBACK_UFC_FIXTURES = [
  {
    _id: 'ufc_1',
    sport: 'UFC',
    homeTeam: 'Islam Makhachev',
    awayTeam: 'Arman Tsarukyan',
    league: 'UFC 311: Lightweight Championship',
    status: 'UPCOMING',
    startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    poolAmount: 4650000,
    odds: { home: 1.40, draw: 35.0, away: 2.95 },
  },
  {
    _id: 'ufc_2',
    sport: 'UFC',
    homeTeam: 'Jon Jones',
    awayTeam: 'Tom Aspinall',
    league: 'UFC Heavyweight Unification Title',
    status: 'UPCOMING',
    startTime: new Date(Date.now() + 168 * 60 * 60 * 1000).toISOString(),
    poolAmount: 5120000,
    odds: { home: 1.78, draw: 30.0, away: 2.05 },
  },
  {
    _id: 'ufc_3',
    sport: 'UFC',
    homeTeam: 'Alex Pereira',
    awayTeam: 'Magomed Ankalaev',
    league: 'UFC Light Heavyweight Championship',
    status: 'UPCOMING',
    startTime: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
    poolAmount: 3200000,
    odds: { home: 1.85, draw: 28.0, away: 1.95 },
  },
];

const FALLBACK_BASKETBALL_FIXTURES = [
  {
    _id: 'bb_1',
    sport: 'Basketball',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Los Angeles Lakers',
    league: 'NBA Regular Season Matchup',
    status: 'LIVE',
    startTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    poolAmount: 3820000,
    odds: { home: 1.55, draw: 15.0, away: 2.45 },
  },
  {
    _id: 'bb_2',
    sport: 'Basketball',
    homeTeam: 'Golden State Warriors',
    awayTeam: 'Denver Nuggets',
    league: 'NBA Western Conference Clash',
    status: 'UPCOMING',
    startTime: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    poolAmount: 4100000,
    odds: { home: 1.90, draw: 15.0, away: 1.90 },
  },
  {
    _id: 'bb_3',
    sport: 'Basketball',
    homeTeam: 'Dallas Mavericks',
    awayTeam: 'Phoenix Suns',
    league: 'NBA Regular Season',
    status: 'UPCOMING',
    startTime: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(),
    poolAmount: 2950000,
    odds: { home: 1.80, draw: 15.0, away: 2.00 },
  },
];


const FALLBACK_ENTERTAINMENT_MARKETS = [
  {
    _id: 'ent_1',
    title: 'Grammy Awards: Album of the Year Winner 2026',
    category: 'Entertainment',
    subcategory: 'Awards & Grammys',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 2850000,
    closingDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    yesOdds: 1.80,
    noOdds: 2.00,
    rules: 'Resolves according to the official Recording Academy announcement.',
  },
  {
    _id: 'ent_2',
    title: 'Spotify Global #1: Burna Boy new track to hit #1 within 72 hours?',
    category: 'Entertainment',
    subcategory: 'Spotify & Music',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 1950000,
    closingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    yesOdds: 2.10,
    noOdds: 1.70,
    rules: 'Resolves based on Spotify Global Daily Top 50 Chart.',
  },
  {
    _id: 'ent_3',
    title: 'Global Box Office: First 2026 blockbuster to cross $1B revenue',
    category: 'Entertainment',
    subcategory: 'Movies & Box Office',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 1420000,
    closingDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    yesOdds: 1.95,
    noOdds: 1.85,
    rules: 'Resolves based on Box Office Mojo official worldwide gross records.',
  },
];

const FALLBACK_LIVE_EVENT_MARKETS = [
  {
    _id: 'live_1',
    title: 'SpaceX Starship orbital catch & recovery test in Q4?',
    category: 'Real Life Events',
    subcategory: 'Space & Tech',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 4120000,
    closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    yesOdds: 1.88,
    noOdds: 1.92,
    rules: 'Resolves to YES if SpaceX successfully catches the Starship upper stage or Super Heavy booster during an orbital flight test mission.',
  },
  {
    _id: 'live_2',
    title: 'OpenAI to officially launch or announce GPT-5 before end of year?',
    category: 'Real Life Events',
    subcategory: 'AI & Computing',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 3250000,
    closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    yesOdds: 2.10,
    noOdds: 1.70,
    rules: 'Resolves to YES if OpenAI formally announces or releases GPT-5 or next-gen flagship foundation model.',
  },
  {
    _id: 'live_3',
    title: 'Grand Theft Auto VI release date to break $1B retail revenue in 24h?',
    category: 'Pop Culture',
    subcategory: 'Gaming & Media',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 5600000,
    closingDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    yesOdds: 1.45,
    noOdds: 2.70,
    rules: 'Resolves based on official Take-Two Interactive SEC filings or verified commercial figures.',
  },
];

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Markets', icon: '🔥' },
  { id: 'FOOTBALL', label: 'Football', icon: '⚽' },
  { id: 'BOXING', label: 'Boxing', icon: '🥊' },
  { id: 'UFC', label: 'UFC', icon: '🥋' },
  { id: 'BASKETBALL', label: 'Basketball', icon: '🏀' },
  { id: 'POLITICS', label: 'Politics', icon: '🏛️' },
  { id: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎬' },
  { id: 'LIVE_EVENT', label: 'Live event Prediction', icon: '🌍' },
];

const STAKE_PRESETS = [500, 1000, 2500, 5000, 10000];

export interface ContractInfoDetail {
  title: string;
  tag: string;
  description: string;
  rule: string;
  example: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('ALL');
  const [selectedInfoContract, setSelectedInfoContract] = useState<ContractInfoDetail | null>(null);

  // Markets by Category
  const [sportsMatches, setSportsMatches] = useState<any[]>([]);
  const [boxingMatches, setBoxingMatches] = useState<any[]>([]);
  const [ufcMatches, setUfcMatches] = useState<any[]>([]);
  const [basketballMatches, setBasketballMatches] = useState<any[]>([]);
  const [politicsMarkets, setPoliticsMarkets] = useState<any[]>([]);
  const [liveEventMarkets, setLiveEventMarkets] = useState<any[]>([]);
  const [entertainmentMarkets, setEntertainmentMarkets] = useState<any[]>([]);

  // Category view all toggles
  const [expandedSports, setExpandedSports] = useState(false);
  const [expandedBoxing, setExpandedBoxing] = useState(false);
  const [expandedUFC, setExpandedUFC] = useState(false);
  const [expandedBasketball, setExpandedBasketball] = useState(false);
  const [expandedPolitics, setExpandedPolitics] = useState(false);
  const [expandedLiveEvent, setExpandedLiveEvent] = useState(false);
  const [expandedEntertainment, setExpandedEntertainment] = useState(false);

  // Quick Trade Modal
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [activeMarket, setActiveMarket] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState('1000');
  const [isSubmittingBet, setIsSubmittingBet] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [userData, notifData, matchesRes, marketsRes] = await Promise.all([
        authService.getMe().catch(() => null),
        notificationService.getAll().catch(() => ({ unreadCount: 0 })),
        matchService.getMatches({ limit: 50 }).catch(() => ({ matches: [] })),
        predictionMarketService.getMarkets({ limit: 100 }).catch(() => ({ markets: [] })),
      ]);

      if (userData) setUser(userData);
      setUnreadNotifications(notifData?.unreadCount || 0);

      const rawMatches = matchesRes?.matches || [];
      const fbMatches = rawMatches.filter(isFootballMatch);
      setSportsMatches(fbMatches);

      const boxMatches = rawMatches.filter(isBoxingMatch);
      setBoxingMatches(boxMatches.length > 0 ? boxMatches : FALLBACK_BOXING_FIXTURES);

      const ufcRaw = rawMatches.filter(isUFCMatch);
      setUfcMatches(ufcRaw.length > 0 ? ufcRaw : FALLBACK_UFC_FIXTURES);

      const bbMatches = rawMatches.filter(isBasketballMatch);
      setBasketballMatches(bbMatches.length > 0 ? bbMatches : FALLBACK_BASKETBALL_FIXTURES);

      // Prediction Markets
      const allMarkets = marketsRes?.markets || [];
      const pol = allMarkets.filter((m: any) =>
        /politic/i.test(m.category || '') || /governance|election|policy|world leaders/i.test(m.subcategory || '')
      );
      setPoliticsMarkets(pol.length > 0 ? pol : FALLBACK_POLITICS_MARKETS);

      const live = allMarkets.filter((m: any) =>
        /live event|real life|pop culture/i.test(m.category || '') ||
        /space|tech|ai|climate|science|gaming/i.test(m.subcategory || '')
      );
      setLiveEventMarkets(live.length > 0 ? live : FALLBACK_LIVE_EVENT_MARKETS);

      const ent = allMarkets.filter((m: any) =>
        /entertainment/i.test(m.category || '') ||
        /spotify|music|grammy|movie|awards/i.test(m.subcategory || '')
      );
      setEntertainmentMarkets(ent.length > 0 ? ent : FALLBACK_ENTERTAINMENT_MARKETS);
    } catch (error) {
      console.error('Error fetching home screen data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const socket = getSocket();
    socket.on('matches_updated', () => {
      fetchData();
    });

    return () => {
      socket.off('matches_updated');
    };
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatMatchTime = (value: string | Date | undefined) => {
    if (!value) return 'LIVE';
    const date = new Date(value);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const calcNoOdds = (yesOdds: number, fallback = 1.90) => {
    if (yesOdds <= 1.05) return 15.0;
    const impliedProb = 1 / yesOdds;
    const noProb = Math.max(0.05, 1 - impliedProb);
    return Number(((1 / noProb) * 0.95).toFixed(2)) || fallback;
  };

  const getContractDetailInfo = (item: any, isMatch = false): ContractInfoDetail => {
    if (isMatch) {
      const sport = (item?.sport || 'Football').toUpperCase();
      const home = item?.homeTeam || 'Home';
      const away = item?.awayTeam || 'Away';
      const league = (item?.leagueName || item?.league || 'Championship Match').toUpperCase();
      return {
        title: `${home} vs ${away}`,
        tag: `${sport} • ${league}`,
        description: `Trade on the outright full-time match winner. Choose YES for ${home} victory, or NO for draw or ${away} victory.`,
        rule: 'Resolves strictly based on the official final score at the conclusion of regular and stoppage time (or official judges decision / KO / stoppage for combat sports).',
        example: '₦1,000 = 1 Share. Winners receive their proportional pro-rata share of the loser escrow pot upon official settlement.',
      };
    }

    const title = item?.title || 'Prediction Contract';
    const subcat = (item?.subcategory || item?.category || 'REAL LIFE EVENTS').toUpperCase();
    const rules = item?.rules || 'Resolves based on official announcement or verified public records.';

    if (title.toLowerCase().includes('spacex') || title.toLowerCase().includes('starship')) {
      return {
        title,
        tag: 'AEROSPACE & TECH',
        description: 'Trade on whether SpaceX successfully executes the orbital catch and booster recovery during the designated flight test window.',
        rule: 'Settles to YES if SpaceX public mission telemetry, FAA flight logs, or company broadcast confirms successful booster catch/recovery.',
        example: '₦1,000 = 1 Share. If YES wins, payout is distributed pro-rata from the entire loser pool at market resolution.',
      };
    }

    if (title.toLowerCase().includes('openai') || title.toLowerCase().includes('gpt')) {
      return {
        title,
        tag: 'ARTIFICIAL INTELLIGENCE',
        description: 'Trade on whether OpenAI officially announces or launches GPT-5 or next-gen flagship foundation model before the specified deadline.',
        rule: 'Resolves to YES if OpenAI formally announces the model on their official website, developer livestream, or executive press release.',
        example: '₦1,000 = 1 Share. Winning YES shares receive proportional distribution from the NO escrow pot.',
      };
    }

    if (title.toLowerCase().includes('gta') || title.toLowerCase().includes('grand theft auto')) {
      return {
        title,
        tag: 'GAMING & ENTERTAINMENT',
        description: 'Trade on whether Grand Theft Auto VI achieves over $1 Billion in retail and digital gross revenue within 24 hours of official launch.',
        rule: 'Settles based on verified SEC regulatory filings or official publisher press release from Take-Two Interactive.',
        example: '₦1,000 = 1 Share. Pro-rata pool distribution to winning outcome holders upon verified commercial confirmation.',
      };
    }

    if (title.toLowerCase().includes('rate') || title.toLowerCase().includes('cpi') || title.toLowerCase().includes('inflation')) {
      return {
        title,
        tag: 'ECONOMIC POLICY',
        description: 'Trade on official macroeconomic indicator releases and central bank monetary committee decisions.',
        rule: rules,
        example: '₦1,000 = 1 Share. Resolves strictly based on headline data from the National Bureau of Statistics or Central Bank.',
      };
    }

    if (title.toLowerCase().includes('grammy') || title.toLowerCase().includes('spotify') || title.toLowerCase().includes('album')) {
      return {
        title,
        tag: 'MUSIC & ENTERTAINMENT',
        description: 'Trade on cultural awards, Billboard chart achievements, and global streaming milestones.',
        rule: rules,
        example: '₦1,000 = 1 Share. Official award organization or verified chart provider data determines settlement.',
      };
    }

    return {
      title,
      tag: subcat,
      description: `Trade on whether this binary event outcome occurs before the scheduled resolution time.`,
      rule: rules,
      example: '₦1,000 = 1 Share. All funds are locked in transparent smart escrow and distributed pro-rata upon verified resolution.',
    };
  };

  const handleTradeSportOutcome = (
    match: any,
    marketName: string,
    outcome: 'Yes' | 'No',
    oddsVal: number
  ) => {
    router.push({
      pathname: '/enter-amount',
      params: {
        matchId: match._id,
        matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        marketName,
        outcome,
        odds: oddsVal,
        poolAmount: match.poolAmount || match.pool?.totalPot || 0,
        startTime: match?.startTime
          ? new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Upcoming',
      },
    });
  };

  const handleOpenTradeModal = (market: any, option: any) => {
    router.push({
      pathname: '/enter-amount',
      params: {
        marketId: market._id,
        matchTitle: market.title,
        marketName: market.subcategory || market.category || 'Prediction Contract',
        outcome: option.label || 'YES',
        odds: option.odds || 1.95,
        isPrediction: 'true',
        poolAmount: market.poolAmount || 0,
        startTime: market.closingDate
          ? new Date(market.closingDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
          : 'Active',
      },
    });
  };

  // Featured Match
  const featuredMatch =
    sportsMatches.find((m) => m.isPromoted && (m.status === 'LIVE' || m.status === 'UPCOMING')) ||
    sportsMatches.find((m) => m.status === 'LIVE') ||
    sportsMatches[0] ||
    null;

  // Filtered by Search
  const filterBySearch = (items: any[], isMatch = false) => {
    if (!searchText.trim()) return items;
    const q = searchText.trim().toLowerCase();
    return items.filter((item) => {
      if (isMatch) {
        return (
          (item.homeTeam || '').toLowerCase().includes(q) ||
          (item.awayTeam || '').toLowerCase().includes(q) ||
          (item.leagueName || item.league || '').toLowerCase().includes(q)
        );
      }
      return (
        (item.title || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.subcategory || '').toLowerCase().includes(q)
      );
    });
  };

  const filteredSports = filterBySearch(sportsMatches, true);
  const filteredBoxing = filterBySearch(boxingMatches, true);
  const filteredUFC = filterBySearch(ufcMatches, true);
  const filteredBasketball = filterBySearch(basketballMatches, true);
  const filteredPolitics = filterBySearch(politicsMarkets, false);
  const filteredLiveEvents = filterBySearch(liveEventMarkets, false);
  const filteredEntertainment = filterBySearch(entertainmentMarkets, false);

  const CARDS_PER_CATEGORY = 3;

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.profileTouch}
            onPress={() => router.push('/profile')}
            activeOpacity={0.8}
          >
            <Image
              source={{
                uri:
                  user?.profileImage ||
                  `https://ui-avatars.com/api/?name=${user?.firstName || 'User'}&background=00D285&color=090D16&size=128&bold=true`,
              }}
              style={styles.avatar}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerGreeting}>Hey {user?.firstName || 'Trader'}</Text>
              <Text style={styles.headerSub}>Ready to trade outcomes?</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <Bell size={22} color="#FFFFFF" />
            {unreadNotifications > 0 ? (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.dark.primary}
            />
          }
        >
          {/* Universal Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={18} color="#64748B" />
            <TextInput
              placeholder="Search sports, politics, or entertainment..."
              placeholderTextColor="#64748B"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
            {searchText.trim().length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearSearchButton}
                activeOpacity={0.7}
              >
                <X size={16} color="#8FA2C7" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Horizontal Filter Pills */}
          {!searchText.trim() && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsContainer}
            >
              {CATEGORY_TABS.map((tab) => {
                const isSelected = activeCategoryTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setActiveCategoryTab(tab.id)}
                    activeOpacity={0.8}
                    style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                  >
                    <Text style={styles.categoryPillIcon}>{tab.icon}</Text>
                    <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Hero / Featured Live Card (When ALL or SPORTS tab selected) */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'FOOTBALL') &&
            !searchText.trim() &&
            featuredMatch && (
              <View style={styles.featuredSection}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: '/match-detail',
                      params: {
                        id: featuredMatch._id,
                        homeTeam: featuredMatch.homeTeam,
                        awayTeam: featuredMatch.awayTeam,
                      },
                    })
                  }
                >
                  <LinearGradient
                    colors={['#0F1B38', '#070D1C']}
                    style={styles.featuredCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.featuredTopRow}>
                      <View
                        style={[
                          styles.liveTag,
                          featuredMatch.status === 'LIVE'
                            ? { backgroundColor: '#EF4444' }
                            : { backgroundColor: 'rgba(0, 210, 133, 0.15)', borderColor: '#00D285', borderWidth: 1 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.liveTagText,
                            featuredMatch.status !== 'LIVE' && { color: '#00D285' },
                          ]}
                        >
                          {featuredMatch.status === 'LIVE'
                            ? '● LIVE MATCH'
                            : `KICKOFF ${formatMatchTime(featuredMatch.startTime)}`}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.venueText}>
                          {(featuredMatch.leagueName || featuredMatch.league || 'EUROPEAN PREMIER LEAGUE').toUpperCase()}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setSelectedInfoContract(getContractDetailInfo(featuredMatch, true))}
                          style={styles.infoIconButton}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Info size={13} color="#00D285" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.featuredTeamsRow}>
                      <View style={styles.featuredTeamColumn}>
                        <View style={styles.teamBadge}>
                          <Text style={styles.teamBadgeText}>
                            {(featuredMatch.homeTeam || 'H').slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.featuredTeamName} numberOfLines={1}>
                          {featuredMatch.homeTeam}
                        </Text>
                        <Text style={styles.featuredTeamLabel}>HOME</Text>
                      </View>

                      <View style={styles.featuredCenterBadge}>
                        <Text style={styles.centerBadgeText}>VS</Text>
                        <Text style={styles.centerBadgeLabel}>OUTCOME</Text>
                      </View>

                      <View style={styles.featuredTeamColumn}>
                        <View style={styles.teamBadge}>
                          <Text style={styles.teamBadgeText}>
                            {(featuredMatch.awayTeam || 'A').slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.featuredTeamName} numberOfLines={1}>
                          {featuredMatch.awayTeam}
                        </Text>
                        <Text style={styles.featuredTeamLabel}>AWAY</Text>
                      </View>
                    </View>

                    <View style={styles.sharesBadgeRow}>
                      <View style={styles.shareBadgePill}>
                        <Text style={styles.shareBadgePillText}>1k = 1 Share</Text>
                      </View>
                      <Text style={styles.shareSubText}>P2P Escrow & Pro-Rata Pool</Text>
                    </View>

                    {/* Featured Live Match Binary YES / NO Trades */}
                    {(() => {
                      const featHomeOdds = featuredMatch.odds?.home || 1.85;
                      const featNoHomeOdds = calcNoOdds(featHomeOdds, 2.10);
                      const isFeatLocked = featHomeOdds <= 1.43 || Boolean(featuredMatch.isLocked || featuredMatch.isOverpowered || featuredMatch.status === 'SUSPENDED');
                      return (
                        <View style={[styles.binaryChoiceRow, { marginTop: 10, marginBottom: 12 }]}>
                          <TouchableOpacity
                            style={[styles.binaryOptionBtn, styles.binaryOptionYes, isFeatLocked && { opacity: 0.5 }]}
                            activeOpacity={0.8}
                            disabled={isFeatLocked}
                            onPress={() => handleTradeSportOutcome(featuredMatch, `${featuredMatch.homeTeam} to Win`, 'Yes', featHomeOdds)}
                          >
                            <Text style={styles.binaryOptionLabelYes}>YES</Text>
                            <Text style={styles.binaryOptionOdds}>{isFeatLocked ? 'Locked' : '₦1,000 / Share'}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.binaryOptionBtn, styles.binaryOptionNo, isFeatLocked && { opacity: 0.5 }]}
                            activeOpacity={0.8}
                            disabled={isFeatLocked}
                            onPress={() => handleTradeSportOutcome(featuredMatch, `${featuredMatch.homeTeam} to Win`, 'No', featNoHomeOdds)}
                          >
                            <Text style={styles.binaryOptionLabelNo}>NO</Text>
                            <Text style={styles.binaryOptionOdds}>{isFeatLocked ? 'Locked' : '₦1,000 / Share'}</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })()}

                    <View style={styles.featuredFooter}>
                      <View>
                        <Text style={styles.footerLabel}>LIQUIDITY POOL</Text>
                        <Text style={styles.footerValue}>
                          ₦{(featuredMatch.poolAmount || 2850000).toLocaleString()}
                        </Text>
                      </View>
                      <LinearGradient
                        colors={['#00D285', '#00A86B']}
                        style={styles.enterButton}
                      >
                        <Text style={styles.enterButtonText}>TRADE CONTRACTS</Text>
                        <ArrowRight size={14} color="#090D16" />
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

          {/* SECTION 1: ⚽ Football */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'FOOTBALL' || activeCategoryTab === 'SPORTS') &&
            filteredSports.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryTitleBox}>
                    <Text style={styles.categorySectionEmoji}>⚽</Text>
                    <Text style={styles.categorySectionTitle}>Football</Text>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>{filteredSports.length}</Text>
                    </View>
                  </View>
                  {filteredSports.length > CARDS_PER_CATEGORY && !searchText.trim() && (
                    <TouchableOpacity
                      onPress={() => setExpandedSports(!expandedSports)}
                      style={styles.viewAllBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllBtnText}>
                        {expandedSports ? 'Show Less' : `View All (${filteredSports.length})`}
                      </Text>
                      {expandedSports ? (
                        <ChevronUp size={14} color="#00D285" />
                      ) : (
                        <ChevronDown size={14} color="#00D285" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Rich European Match Cards */}
                <View style={styles.cardsGrid}>
                  {(expandedSports || searchText.trim()
                    ? filteredSports
                    : filteredSports.slice(0, CARDS_PER_CATEGORY)
                  ).map((match) => (
                    <View
                      key={match._id}
                      style={styles.richMarketCard}
                    >
                      {/* Card Top: League & Status */}
                      <View style={styles.cardTopRow}>
                        <View style={styles.cardCategoryGroup}>
                          <Text style={styles.cardLeagueText} numberOfLines={1}>
                            {(match.leagueName || match.league || 'EUROPEAN MATCH').toUpperCase()}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setSelectedInfoContract(getContractDetailInfo(match, true))}
                            style={styles.infoIconButton}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Info size={13} color="#00D285" />
                          </TouchableOpacity>
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            match.status === 'LIVE' ? styles.statusPillLive : styles.statusPillUpcoming,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              match.status === 'LIVE' ? styles.statusTextLive : styles.statusTextUpcoming,
                            ]}
                          >
                            {match.status === 'LIVE' ? '● LIVE' : formatMatchTime(match.startTime)}
                          </Text>
                        </View>
                      </View>

                      {/* Teams Matchup Row */}
                      <View style={styles.matchupRow}>
                        <View style={styles.teamSide}>
                          <View style={styles.smallTeamBadge}>
                            <Text style={styles.smallTeamBadgeText}>
                              {(match.homeTeam || 'H').slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.teamNameMain} numberOfLines={1}>
                            {match.homeTeam}
                          </Text>
                        </View>

                        <View style={styles.vsBadgeSmall}>
                          <Text style={styles.vsBadgeSmallText}>VS</Text>
                        </View>

                        <View style={styles.teamSideRight}>
                          <Text style={[styles.teamNameMain, { textAlign: 'right' }]} numberOfLines={1}>
                            {match.awayTeam}
                          </Text>
                          <View style={styles.smallTeamBadge}>
                            <Text style={styles.smallTeamBadgeText}>
                              {(match.awayTeam || 'A').slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Outcomes & Trade Buttons */}
                      {(() => {
                        const homeOdds = match.odds?.home || 1.85;
                        const noHomeOdds = calcNoOdds(homeOdds, 2.10);
                        const isOverpowered = homeOdds <= 1.43 || Boolean(match.isLocked || match.isOverpowered || match.status === 'SUSPENDED');
                        return (
                          <View style={styles.binaryChoiceRow}>
                            <TouchableOpacity
                              style={[styles.binaryOptionBtn, styles.binaryOptionYes, isOverpowered && { opacity: 0.5 }]}
                              activeOpacity={0.8}
                              disabled={isOverpowered}
                              onPress={() => handleTradeSportOutcome(match, `${match.homeTeam} to Win`, 'Yes', homeOdds)}
                            >
                              <Text style={styles.binaryOptionLabelYes}>YES</Text>
                              <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.binaryOptionBtn, styles.binaryOptionNo, isOverpowered && { opacity: 0.5 }]}
                              activeOpacity={0.8}
                              disabled={isOverpowered}
                              onPress={() => handleTradeSportOutcome(match, `${match.homeTeam} to Win`, 'No', noHomeOdds)}
                            >
                              <Text style={styles.binaryOptionLabelNo}>NO</Text>
                              <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })()}

                      {/* Pool & Action Footer */}
                      <View style={styles.cardFooterRow}>
                        <View>
                          <Text style={styles.cardPoolLabel}>TOTAL VOLUME</Text>
                          <Text style={styles.cardPoolValue}>
                            ₦{(match.poolAmount || 1850000).toLocaleString()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.quickTradePill}
                          onPress={() =>
                            router.push({
                              pathname: '/match-detail',
                              params: {
                                id: match._id,
                                homeTeam: match.homeTeam,
                                awayTeam: match.awayTeam,
                                sport: 'Football',
                                league: match.leagueName || match.league || '',
                              },
                            })
                          }
                        >
                          <Text style={styles.quickTradePillText}>All Contracts</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

          {/* SECTION: 🏛️ Politics & Policy Contracts */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'POLITICS') &&
            filteredPolitics.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryTitleBox}>
                    <Text style={styles.categorySectionEmoji}>🏛️</Text>
                    <Text style={styles.categorySectionTitle}>Politics & Policy</Text>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>{filteredPolitics.length}</Text>
                    </View>
                  </View>
                  {filteredPolitics.length > CARDS_PER_CATEGORY && !searchText.trim() && (
                    <TouchableOpacity
                      onPress={() => setExpandedPolitics(!expandedPolitics)}
                      style={styles.viewAllBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllBtnText}>
                        {expandedPolitics ? 'Show Less' : `View All (${filteredPolitics.length})`}
                      </Text>
                      {expandedPolitics ? (
                        <ChevronUp size={14} color="#00D285" />
                      ) : (
                        <ChevronDown size={14} color="#00D285" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Rich Politics Prediction Cards */}
                <View style={styles.cardsGrid}>
                  {(expandedPolitics || searchText.trim()
                    ? filteredPolitics
                    : filteredPolitics.slice(0, CARDS_PER_CATEGORY)
                  ).map((market) => {
                    const isOverpowered = (market.yesOdds && market.yesOdds <= 1.43) || (market.noOdds && market.noOdds <= 1.43) || Boolean(market.isLocked || market.isOverpowered || market.status === 'SUSPENDED');
                    return (
                      <View key={market._id} style={styles.richMarketCard}>
                        <View style={styles.cardTopRow}>
                          <View style={styles.cardCategoryGroup}>
                            <Text style={styles.cardCategoryBadge}>
                              {(market.subcategory || 'POLICY & GOVERNANCE').toUpperCase()}
                            </Text>
                            <TouchableOpacity
                              onPress={() => setSelectedInfoContract(getContractDetailInfo(market, false))}
                              style={styles.infoIconButton}
                              activeOpacity={0.7}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Info size={13} color="#00D285" />
                            </TouchableOpacity>
                          </View>
                          {isOverpowered ? (
                            <View style={[styles.closingBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                              <Lock size={11} color="#EF4444" />
                              <Text style={[styles.closingBadgeText, { color: '#EF4444' }]}>Locked</Text>
                            </View>
                          ) : (
                            <View style={styles.closingBadge}>
                              <Clock size={11} color="#64748B" />
                              <Text style={styles.closingBadgeText}>Closes Soon</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.marketTitleText}>{market.title}</Text>

                        {/* Outcomes & Trade Buttons */}
                        <View style={styles.binaryChoiceRow}>
                          <TouchableOpacity
                            style={[styles.binaryOptionBtn, styles.binaryOptionYes, isOverpowered && { opacity: 0.5 }]}
                            activeOpacity={0.8}
                            disabled={isOverpowered}
                            onPress={() => handleOpenTradeModal(market, { label: 'YES', odds: market.yesOdds || 1.85 })}
                          >
                            <Text style={styles.binaryOptionLabelYes}>YES</Text>
                            <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.binaryOptionBtn, styles.binaryOptionNo, isOverpowered && { opacity: 0.5 }]}
                            activeOpacity={0.8}
                            disabled={isOverpowered}
                            onPress={() => handleOpenTradeModal(market, { label: 'NO', odds: market.noOdds || 1.95 })}
                          >
                            <Text style={styles.binaryOptionLabelNo}>NO</Text>
                            <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.cardFooterRow}>
                          <View>
                            <Text style={styles.cardPoolLabel}>TOTAL VOLUME</Text>
                            <Text style={styles.cardPoolValue}>
                              ₦{(market.poolAmount || 2500000).toLocaleString()}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleOpenTradeModal(market, { label: 'YES', odds: market.yesOdds || 1.85 })}
                            style={[styles.quickTradePill, isOverpowered && { opacity: 0.5 }]}
                            activeOpacity={0.8}
                            disabled={isOverpowered}
                          >
                            <Text style={styles.quickTradePillText}>{isOverpowered ? 'Locked' : 'Trade Outcome'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

          {/* SECTION: 🌍 Live Event Prediction */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'LIVE_EVENT') &&
            filteredLiveEvents.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryTitleBox}>
                    <Text style={styles.categorySectionEmoji}>🌍</Text>
                    <Text style={styles.categorySectionTitle}>Live event Prediction</Text>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>{filteredLiveEvents.length}</Text>
                    </View>
                  </View>
                  {filteredLiveEvents.length > CARDS_PER_CATEGORY && !searchText.trim() && (
                    <TouchableOpacity
                      onPress={() => setExpandedLiveEvent(!expandedLiveEvent)}
                      style={styles.viewAllBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllBtnText}>
                        {expandedLiveEvent ? 'Show Less' : `View All (${filteredLiveEvents.length})`}
                      </Text>
                      {expandedLiveEvent ? (
                        <ChevronUp size={14} color="#00D285" />
                      ) : (
                        <ChevronDown size={14} color="#00D285" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Rich Live Event Cards */}
                <View style={styles.cardsGrid}>
                  {(expandedLiveEvent || searchText.trim()
                    ? filteredLiveEvents
                    : filteredLiveEvents.slice(0, CARDS_PER_CATEGORY)
                  ).map((market) => {
                    const isOverpowered = (market.yesOdds && market.yesOdds <= 1.43) || (market.noOdds && market.noOdds <= 1.43) || Boolean(market.isLocked || market.isOverpowered || market.status === 'SUSPENDED');
                    return (
                      <View key={market._id} style={styles.richMarketCard}>
                        <View style={styles.cardTopRow}>
                          <View style={styles.cardCategoryGroup}>
                            <Text style={styles.cardCategoryBadge}>
                              {(market.subcategory || 'REAL LIFE EVENTS').toUpperCase()}
                            </Text>
                            <TouchableOpacity
                              onPress={() => setSelectedInfoContract(getContractDetailInfo(market, false))}
                              style={styles.infoIconButton}
                              activeOpacity={0.7}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Info size={13} color="#00D285" />
                            </TouchableOpacity>
                          </View>
                          {isOverpowered ? (
                            <View style={[styles.closingBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                              <Lock size={11} color="#EF4444" />
                              <Text style={[styles.closingBadgeText, { color: '#EF4444' }]}>Locked</Text>
                            </View>
                          ) : (
                            <View style={styles.closingBadge}>
                              <Clock size={11} color="#64748B" />
                              <Text style={styles.closingBadgeText}>Closes Soon</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.marketTitleText}>{market.title}</Text>

                        {/* Outcomes & Trade Buttons */}
                        <View style={styles.binaryChoiceRow}>
                          <TouchableOpacity
                            style={[styles.binaryOptionBtn, styles.binaryOptionYes, isOverpowered && { opacity: 0.5 }]}
                            activeOpacity={0.8}
                            disabled={isOverpowered}
                            onPress={() => handleOpenTradeModal(market, { label: 'YES', odds: market.yesOdds || 1.85 })}
                          >
                            <Text style={styles.binaryOptionLabelYes}>YES</Text>
                            <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.binaryOptionBtn, styles.binaryOptionNo, isOverpowered && { opacity: 0.5 }]}
                            activeOpacity={0.8}
                            disabled={isOverpowered}
                            onPress={() => handleOpenTradeModal(market, { label: 'NO', odds: market.noOdds || 1.95 })}
                          >
                            <Text style={styles.binaryOptionLabelNo}>NO</Text>
                            <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.cardFooterRow}>
                          <View>
                            <Text style={styles.cardPoolLabel}>TOTAL VOLUME</Text>
                            <Text style={styles.cardPoolValue}>
                              ₦{(market.poolAmount || 2500000).toLocaleString()}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleOpenTradeModal(market, { label: 'YES', odds: market.yesOdds || 1.85 })}
                            style={[styles.quickTradePill, isOverpowered && { opacity: 0.5 }]}
                            activeOpacity={0.8}
                            disabled={isOverpowered}
                          >
                            <Text style={styles.quickTradePillText}>{isOverpowered ? 'Locked' : 'Trade Outcome'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

          {/* SECTION 2: 🥊 Boxing Ring Contracts */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'BOXING') &&
            filteredBoxing.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryTitleBox}>
                    <Text style={styles.categorySectionEmoji}>🥊</Text>
                    <Text style={styles.categorySectionTitle}>Boxing Ring Contracts</Text>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>{filteredBoxing.length}</Text>
                    </View>
                  </View>
                  {filteredBoxing.length > CARDS_PER_CATEGORY && !searchText.trim() && (
                    <TouchableOpacity
                      onPress={() => setExpandedBoxing(!expandedBoxing)}
                      style={styles.viewAllBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllBtnText}>
                        {expandedBoxing ? 'Show Less' : `View All (${filteredBoxing.length})`}
                      </Text>
                      {expandedBoxing ? (
                        <ChevronUp size={14} color="#00D285" />
                      ) : (
                        <ChevronDown size={14} color="#00D285" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Boxing Cards */}
                <View style={styles.cardsGrid}>
                  {(expandedBoxing || searchText.trim()
                    ? filteredBoxing
                    : filteredBoxing.slice(0, CARDS_PER_CATEGORY)
                  ).map((match) => (
                    <View
                      key={match._id}
                      style={styles.richMarketCard}
                    >
                      {/* Card Top: League & Status */}
                      <View style={styles.cardTopRow}>
                        <View style={styles.cardCategoryGroup}>
                          <Text style={styles.cardLeagueText} numberOfLines={1}>
                            {(match.leagueName || match.league || 'WORLD CHAMPIONSHIP BOXING').toUpperCase()}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setSelectedInfoContract(getContractDetailInfo(match, true))}
                            style={styles.infoIconButton}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Info size={13} color="#00D285" />
                          </TouchableOpacity>
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            match.status === 'LIVE' ? styles.statusPillLive : styles.statusPillUpcoming,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              match.status === 'LIVE' ? styles.statusTextLive : styles.statusTextUpcoming,
                            ]}
                          >
                            {match.status === 'LIVE' ? '● LIVE' : formatMatchTime(match.startTime)}
                          </Text>
                        </View>
                      </View>

                      {/* Fighters Matchup Row */}
                      <View style={styles.matchupRow}>
                        <View style={styles.teamSide}>
                          <View style={[styles.smallTeamBadge, { borderColor: '#F59E0B' }]}>
                            <Text style={[styles.smallTeamBadgeText, { color: '#F59E0B' }]}>
                              {(match.homeTeam || 'H').slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.teamNameMain} numberOfLines={1}>
                            {match.homeTeam}
                          </Text>
                        </View>

                        <View style={styles.vsBadgeSmall}>
                          <Text style={styles.vsBadgeSmallText}>VS</Text>
                        </View>

                        <View style={styles.teamSideRight}>
                          <Text style={[styles.teamNameMain, { textAlign: 'right' }]} numberOfLines={1}>
                            {match.awayTeam}
                          </Text>
                          <View style={[styles.smallTeamBadge, { borderColor: '#38BDF8' }]}>
                            <Text style={[styles.smallTeamBadgeText, { color: '#38BDF8' }]}>
                              {(match.awayTeam || 'A').slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Outcomes & Trade Buttons */}
                      {(() => {
                        const homeOdds = match.odds?.home || 1.85;
                        const noHomeOdds = calcNoOdds(homeOdds, 2.10);
                        const isOverpowered = homeOdds <= 1.43 || Boolean(match.isLocked || match.isOverpowered || match.status === 'SUSPENDED');
                        return (
                          <View style={styles.binaryChoiceRow}>
                            <TouchableOpacity
                              style={[styles.binaryOptionBtn, styles.binaryOptionYes, isOverpowered && { opacity: 0.5 }]}
                              activeOpacity={0.8}
                              disabled={isOverpowered}
                              onPress={() => handleTradeSportOutcome(match, `${match.homeTeam} to Win`, 'Yes', homeOdds)}
                            >
                              <Text style={styles.binaryOptionLabelYes}>YES</Text>
                              <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.binaryOptionBtn, styles.binaryOptionNo, isOverpowered && { opacity: 0.5 }]}
                              activeOpacity={0.8}
                              disabled={isOverpowered}
                              onPress={() => handleTradeSportOutcome(match, `${match.homeTeam} to Win`, 'No', noHomeOdds)}
                            >
                              <Text style={styles.binaryOptionLabelNo}>NO</Text>
                              <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })()}

                      {/* Pool & Action Footer */}
                      <View style={styles.cardFooterRow}>
                        <View>
                          <Text style={styles.cardPoolLabel}>TOTAL VOLUME</Text>
                          <Text style={styles.cardPoolValue}>
                            ₦{(match.poolAmount || 4500000).toLocaleString()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.quickTradePill}
                          onPress={() =>
                            router.push({
                              pathname: '/match-detail',
                              params: {
                                id: match._id,
                                homeTeam: match.homeTeam,
                                awayTeam: match.awayTeam,
                                sport: 'Boxing',
                                league: match.leagueName || match.league || '',
                              },
                            })
                          }
                        >
                          <Text style={styles.quickTradePillText}>All Contracts</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

          {/* SECTION 3: 🥋 UFC Octagon Contracts */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'UFC') &&
            filteredUFC.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryTitleBox}>
                    <Text style={styles.categorySectionEmoji}>🥋</Text>
                    <Text style={styles.categorySectionTitle}>UFC Octagon Contracts</Text>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>{filteredUFC.length}</Text>
                    </View>
                  </View>
                  {filteredUFC.length > CARDS_PER_CATEGORY && !searchText.trim() && (
                    <TouchableOpacity
                      onPress={() => setExpandedUFC(!expandedUFC)}
                      style={styles.viewAllBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllBtnText}>
                        {expandedUFC ? 'Show Less' : `View All (${filteredUFC.length})`}
                      </Text>
                      {expandedUFC ? (
                        <ChevronUp size={14} color="#00D285" />
                      ) : (
                        <ChevronDown size={14} color="#00D285" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* UFC Cards */}
                <View style={styles.cardsGrid}>
                  {(expandedUFC || searchText.trim()
                    ? filteredUFC
                    : filteredUFC.slice(0, CARDS_PER_CATEGORY)
                  ).map((match) => (
                    <View
                      key={match._id}
                      style={styles.richMarketCard}
                    >
                      {/* Card Top: League & Status */}
                      <View style={styles.cardTopRow}>
                        <View style={styles.cardCategoryGroup}>
                          <Text style={styles.cardLeagueText} numberOfLines={1}>
                            {(match.leagueName || match.league || 'UFC CHAMPIONSHIP').toUpperCase()}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setSelectedInfoContract(getContractDetailInfo(match, true))}
                            style={styles.infoIconButton}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Info size={13} color="#00D285" />
                          </TouchableOpacity>
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            match.status === 'LIVE' ? styles.statusPillLive : styles.statusPillUpcoming,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              match.status === 'LIVE' ? styles.statusTextLive : styles.statusTextUpcoming,
                            ]}
                          >
                            {match.status === 'LIVE' ? '● LIVE' : formatMatchTime(match.startTime)}
                          </Text>
                        </View>
                      </View>

                      {/* Fighters Matchup Row */}
                      <View style={styles.matchupRow}>
                        <View style={styles.teamSide}>
                          <View style={[styles.smallTeamBadge, { borderColor: '#10B981' }]}>
                            <Text style={[styles.smallTeamBadgeText, { color: '#10B981' }]}>
                              {(match.homeTeam || 'H').slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.teamNameMain} numberOfLines={1}>
                            {match.homeTeam}
                          </Text>
                        </View>

                        <View style={styles.vsBadgeSmall}>
                          <Text style={styles.vsBadgeSmallText}>VS</Text>
                        </View>

                        <View style={styles.teamSideRight}>
                          <Text style={[styles.teamNameMain, { textAlign: 'right' }]} numberOfLines={1}>
                            {match.awayTeam}
                          </Text>
                          <View style={[styles.smallTeamBadge, { borderColor: '#EF4444' }]}>
                            <Text style={[styles.smallTeamBadgeText, { color: '#EF4444' }]}>
                              {(match.awayTeam || 'A').slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Outcomes & Trade Buttons */}
                      {(() => {
                        const homeOdds = match.odds?.home || 1.85;
                        const noHomeOdds = calcNoOdds(homeOdds, 2.10);
                        const isOverpowered = homeOdds <= 1.43 || Boolean(match.isLocked || match.isOverpowered || match.status === 'SUSPENDED');
                        return (
                          <View style={styles.binaryChoiceRow}>
                            <TouchableOpacity
                              style={[styles.binaryOptionBtn, styles.binaryOptionYes, isOverpowered && { opacity: 0.5 }]}
                              activeOpacity={0.8}
                              disabled={isOverpowered}
                              onPress={() => handleTradeSportOutcome(match, `${match.homeTeam} to Win`, 'Yes', homeOdds)}
                            >
                              <Text style={styles.binaryOptionLabelYes}>YES</Text>
                              <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.binaryOptionBtn, styles.binaryOptionNo, isOverpowered && { opacity: 0.5 }]}
                              activeOpacity={0.8}
                              disabled={isOverpowered}
                              onPress={() => handleTradeSportOutcome(match, `${match.homeTeam} to Win`, 'No', noHomeOdds)}
                            >
                              <Text style={styles.binaryOptionLabelNo}>NO</Text>
                              <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })()}

                      {/* Pool & Action Footer */}
                      <View style={styles.cardFooterRow}>
                        <View>
                          <Text style={styles.cardPoolLabel}>TOTAL VOLUME</Text>
                          <Text style={styles.cardPoolValue}>
                            ₦{(match.poolAmount || 3900000).toLocaleString()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.quickTradePill}
                          onPress={() =>
                            router.push({
                              pathname: '/match-detail',
                              params: {
                                id: match._id,
                                homeTeam: match.homeTeam,
                                awayTeam: match.awayTeam,
                                sport: 'UFC',
                                league: match.leagueName || match.league || '',
                              },
                            })
                          }
                        >
                          <Text style={styles.quickTradePillText}>All Contracts</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

          {/* SECTION 4: 🏀 NBA Basketball Contracts */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'BASKETBALL') &&
            filteredBasketball.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryTitleBox}>
                    <Text style={styles.categorySectionEmoji}>🏀</Text>
                    <Text style={styles.categorySectionTitle}>NBA Basketball Contracts</Text>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>{filteredBasketball.length}</Text>
                    </View>
                  </View>
                  {filteredBasketball.length > CARDS_PER_CATEGORY && !searchText.trim() && (
                    <TouchableOpacity
                      onPress={() => setExpandedBasketball(!expandedBasketball)}
                      style={styles.viewAllBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllBtnText}>
                        {expandedBasketball ? 'Show Less' : `View All (${filteredBasketball.length})`}
                      </Text>
                      {expandedBasketball ? (
                        <ChevronUp size={14} color="#00D285" />
                      ) : (
                        <ChevronDown size={14} color="#00D285" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Basketball Cards */}
                <View style={styles.cardsGrid}>
                  {(expandedBasketball || searchText.trim()
                    ? filteredBasketball
                    : filteredBasketball.slice(0, CARDS_PER_CATEGORY)
                  ).map((match) => (
                    <View
                      key={match._id}
                      style={styles.richMarketCard}
                    >
                      {/* Card Top: League & Status */}
                      <View style={styles.cardTopRow}>
                        <View style={styles.cardCategoryGroup}>
                          <Text style={styles.cardLeagueText} numberOfLines={1}>
                            {(match.leagueName || match.league || 'NBA BASKETBALL').toUpperCase()}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setSelectedInfoContract(getContractDetailInfo(match, true))}
                            style={styles.infoIconButton}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Info size={13} color="#00D285" />
                          </TouchableOpacity>
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            match.status === 'LIVE' ? styles.statusPillLive : styles.statusPillUpcoming,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              match.status === 'LIVE' ? styles.statusTextLive : styles.statusTextUpcoming,
                            ]}
                          >
                            {match.status === 'LIVE' ? '● LIVE' : formatMatchTime(match.startTime)}
                          </Text>
                        </View>
                      </View>

                      {/* Teams Matchup Row */}
                      <View style={styles.matchupRow}>
                        <View style={styles.teamSide}>
                          <View style={[styles.smallTeamBadge, { borderColor: '#8B5CF6' }]}>
                            <Text style={[styles.smallTeamBadgeText, { color: '#8B5CF6' }]}>
                              {(match.homeTeam || 'H').slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.teamNameMain} numberOfLines={1}>
                            {match.homeTeam}
                          </Text>
                        </View>

                        <View style={styles.vsBadgeSmall}>
                          <Text style={styles.vsBadgeSmallText}>VS</Text>
                        </View>

                        <View style={styles.teamSideRight}>
                          <Text style={[styles.teamNameMain, { textAlign: 'right' }]} numberOfLines={1}>
                            {match.awayTeam}
                          </Text>
                          <View style={[styles.smallTeamBadge, { borderColor: '#EC4899' }]}>
                            <Text style={[styles.smallTeamBadgeText, { color: '#EC4899' }]}>
                              {(match.awayTeam || 'A').slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Outcomes & Trade Buttons */}
                      {(() => {
                        const homeOdds = match.odds?.home || 1.85;
                        const noHomeOdds = calcNoOdds(homeOdds, 2.10);
                        const isOverpowered = homeOdds <= 1.43 || Boolean(match.isLocked || match.isOverpowered || match.status === 'SUSPENDED');
                        return (
                          <View style={styles.binaryChoiceRow}>
                            <TouchableOpacity
                              style={[styles.binaryOptionBtn, styles.binaryOptionYes, isOverpowered && { opacity: 0.5 }]}
                              activeOpacity={0.8}
                              disabled={isOverpowered}
                              onPress={() => handleTradeSportOutcome(match, `${match.homeTeam} to Win`, 'Yes', homeOdds)}
                            >
                              <Text style={styles.binaryOptionLabelYes}>YES</Text>
                              <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.binaryOptionBtn, styles.binaryOptionNo, isOverpowered && { opacity: 0.5 }]}
                              activeOpacity={0.8}
                              disabled={isOverpowered}
                              onPress={() => handleTradeSportOutcome(match, `${match.homeTeam} to Win`, 'No', noHomeOdds)}
                            >
                              <Text style={styles.binaryOptionLabelNo}>NO</Text>
                              <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })()}

                      {/* Pool & Action Footer */}
                      <View style={styles.cardFooterRow}>
                        <View>
                          <Text style={styles.cardPoolLabel}>TOTAL VOLUME</Text>
                          <Text style={styles.cardPoolValue}>
                            ₦{(match.poolAmount || 3820000).toLocaleString()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.quickTradePill}
                          onPress={() =>
                            router.push({
                              pathname: '/match-detail',
                              params: {
                                id: match._id,
                                homeTeam: match.homeTeam,
                                awayTeam: match.awayTeam,
                                sport: 'Basketball',
                                league: match.leagueName || match.league || '',
                              },
                            })
                          }
                        >
                          <Text style={styles.quickTradePillText}>All Contracts</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

          {/* SECTION 4: 🎬 Entertainment & Pop Culture */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'ENTERTAINMENT') &&
            filteredEntertainment.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryTitleBox}>
                    <Text style={styles.categorySectionEmoji}>🎬</Text>
                    <Text style={styles.categorySectionTitle}>Entertainment & Culture</Text>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>{filteredEntertainment.length}</Text>
                    </View>
                  </View>
                  {filteredEntertainment.length > CARDS_PER_CATEGORY && !searchText.trim() && (
                    <TouchableOpacity
                      onPress={() => setExpandedEntertainment(!expandedEntertainment)}
                      style={styles.viewAllBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllBtnText}>
                        {expandedEntertainment ? 'Show Less' : `View All (${filteredEntertainment.length})`}
                      </Text>
                      {expandedEntertainment ? (
                        <ChevronUp size={14} color="#00D285" />
                      ) : (
                        <ChevronDown size={14} color="#00D285" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Rich Entertainment Cards */}
                <View style={styles.cardsGrid}>
                  {(expandedEntertainment || searchText.trim()
                    ? filteredEntertainment
                    : filteredEntertainment.slice(0, CARDS_PER_CATEGORY)
                  ).map((market) => {
                    const isOverpowered = (market.yesOdds && market.yesOdds <= 1.43) || (market.noOdds && market.noOdds <= 1.43) || Boolean(market.isLocked || market.isOverpowered || market.status === 'SUSPENDED');
                    return (
                      <View key={market._id} style={styles.richMarketCard}>
                        <View style={styles.cardTopRow}>
                          <View style={styles.cardCategoryGroup}>
                            <Text style={styles.cardCategoryBadge}>
                              {(market.subcategory || 'MUSIC & CULTURE').toUpperCase()}
                            </Text>
                            <TouchableOpacity
                              onPress={() => setSelectedInfoContract(getContractDetailInfo(market, false))}
                              style={styles.infoIconButton}
                              activeOpacity={0.7}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Info size={13} color="#00D285" />
                            </TouchableOpacity>
                          </View>
                          {isOverpowered ? (
                            <View style={[styles.closingBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                              <Lock size={11} color="#EF4444" />
                              <Text style={[styles.closingBadgeText, { color: '#EF4444' }]}>Locked</Text>
                            </View>
                          ) : (
                            <View style={styles.closingBadge}>
                              <Sparkles size={11} color="#8B5CF6" />
                              <Text style={[styles.closingBadgeText, { color: '#8B5CF6' }]}>Trending</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.marketTitleText}>{market.title}</Text>

                        <View style={styles.binaryChoiceRow}>
                          <TouchableOpacity
                            style={[styles.binaryOptionBtn, styles.binaryOptionYes, isOverpowered && { opacity: 0.5 }]}
                            activeOpacity={0.8}
                            disabled={isOverpowered}
                            onPress={() => handleOpenTradeModal(market, { label: 'YES', odds: market.yesOdds || 1.85 })}
                          >
                            <Text style={styles.binaryOptionLabelYes}>YES</Text>
                            <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.binaryOptionBtn, styles.binaryOptionNo, isOverpowered && { opacity: 0.5 }]}
                            activeOpacity={0.8}
                            disabled={isOverpowered}
                            onPress={() => handleOpenTradeModal(market, { label: 'NO', odds: market.noOdds || 1.95 })}
                          >
                            <Text style={styles.binaryOptionLabelNo}>NO</Text>
                            <Text style={styles.binaryOptionOdds}>{isOverpowered ? 'Locked' : '₦1,000 / Share'}</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.cardFooterRow}>
                          <View>
                            <Text style={styles.cardPoolLabel}>MARKET VOLUME</Text>
                            <Text style={styles.cardPoolValue}>
                              ₦{(market.poolAmount || 1950000).toLocaleString()}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleOpenTradeModal(market, { label: 'YES', odds: market.yesOdds || 1.85 })}
                            style={[styles.quickTradePill, isOverpowered && { opacity: 0.5 }]}
                            activeOpacity={0.8}
                            disabled={isOverpowered}
                          >
                            <Text style={styles.quickTradePillText}>{isOverpowered ? 'Locked' : 'Trade Contract'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Contract Info / Specification Modal */}
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
                      {selectedInfoContract?.tag || 'MARKET SPEC'}
                    </Text>
                  </View>
                  <Text style={styles.infoModalTitle} numberOfLines={2}>
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

              <ScrollView
                style={styles.infoModalBody}
                showsVerticalScrollIndicator={false}
              >
                {/* Section 1: Overview */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionLabel}>HOW THIS TRADE WORKS</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  profileTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#00D285',
  },
  headerTextContainer: { flex: 1 },
  headerGreeting: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerSub: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  iconButton: {
    marginLeft: 16,
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  scrollContent: { paddingBottom: 32 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 28, 50, 0.95)',
    marginHorizontal: 20,
    height: 48,
    borderRadius: 999,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    marginLeft: 10,
    fontFamily: 'Inter',
  },
  clearSearchButton: { padding: 4 },
  categoryPillsContainer: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    borderColor: '#00D285',
  },
  categoryPillIcon: { fontSize: 13 },
  categoryPillText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  categoryPillTextActive: {
    color: '#00D285',
    fontWeight: '700',
  },
  featuredSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  featuredCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.3)',
    shadowColor: '#00D285',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveTagText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  venueText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featuredTeamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  featuredTeamColumn: {
    alignItems: 'center',
    flex: 1,
  },
  teamBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  teamBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  featuredTeamName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  featuredTeamLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featuredCenterBadge: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  centerBadgeText: {
    color: '#00D285',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  centerBadgeLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sharesBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
  },
  shareBadgePill: {
    backgroundColor: 'rgba(0, 210, 133, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  shareBadgePillText: {
    color: '#00D285',
    fontSize: 11,
    fontWeight: '800',
  },
  shareSubText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '500',
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 14,
  },
  footerLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  footerValue: {
    color: '#00D285',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  enterButtonText: {
    color: '#090D16',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categorySectionEmoji: { fontSize: 18 },
  categorySectionTitle: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  categoryCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCountText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllBtnText: {
    color: '#00D285',
    fontSize: 12.5,
    fontWeight: '700',
  },
  cardsGrid: {
    gap: 12,
  },
  richMarketCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLeagueText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  cardCategoryBadge: {
    color: '#00D285',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardCategoryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoIconButton: {
    padding: 3,
    backgroundColor: 'rgba(0, 210, 133, 0.1)',
    borderRadius: 12,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillLive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  statusPillUpcoming: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextLive: { color: '#EF4444' },
  statusTextUpcoming: { color: '#94A3B8' },
  closingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  closingBadgeText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teamSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  teamSideRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  smallTeamBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  smallTeamBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  teamNameMain: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  vsBadgeSmall: {
    paddingHorizontal: 8,
  },
  vsBadgeSmallText: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '900',
  },
  marketTitleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 10,
  },
  binaryChoiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  binaryOptionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  binaryOptionYes: {
    backgroundColor: 'rgba(0, 210, 133, 0.08)',
    borderColor: 'rgba(0, 210, 133, 0.3)',
  },
  binaryOptionNo: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  binaryOptionLabelYes: {
    color: '#00D285',
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 1,
  },
  binaryOptionLabelNo: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 1,
  },
  binaryOptionOdds: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '600',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 10,
  },
  cardPoolLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardPoolValue: {
    color: '#00D285',
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 2,
  },
  tradeActionButton: {
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    borderColor: '#00D285',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tradeActionButtonText: {
    color: '#00D285',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  quickTradePill: {
    backgroundColor: '#00D285',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quickTradePillText: {
    color: '#090D16',
    fontSize: 10.5,
    fontWeight: '800',
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
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
    letterSpacing: 0.5,
  },
  infoModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
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
    marginBottom: 6,
  },
  infoSectionText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 19,
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
  },
  infoModalDismissBtn: {
    backgroundColor: '#00D285',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalDismissText: {
    color: '#090D16',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    color: '#94A3B8',
    fontSize: 12.5,
    marginTop: 4,
    maxWidth: 280,
  },
  modalCloseBtn: {
    padding: 4,
  },
  selectedPositionBox: {
    backgroundColor: 'rgba(0, 210, 133, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.3)',
    marginBottom: 18,
  },
  positionBoxLabel: {
    color: '#00D285',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  positionBoxValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  balanceHint: {
    color: '#00D285',
    fontSize: 11,
    fontWeight: '600',
  },
  stakeInput: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  presetPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  presetPillActive: {
    backgroundColor: 'rgba(0, 210, 133, 0.2)',
    borderColor: '#00D285',
  },
  presetPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  presetPillTextActive: {
    color: '#00D285',
  },
  payoutPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  payoutPreviewLabel: {
    color: '#94A3B8',
    fontSize: 12.5,
  },
  payoutPreviewValue: {
    color: '#00D285',
    fontSize: 16,
    fontWeight: '800',
  },
  confirmTradeBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmTradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmTradeBtnText: {
    color: '#090D16',
    fontSize: 15,
    fontWeight: '800',
  },
});
