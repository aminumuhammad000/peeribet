import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Landmark,
  Lock,
  Flame,
  Sparkles,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  TrendingUp,
  Wallet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Info,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import {
  matchService,
  predictionMarketService,
  adminService,
  authService,
  showToast,
} from '../../services/apiService';
import { getSocket } from '../../services/socketService';

export const CATEGORIES = [
  { id: 'Football', label: 'Football', icon: '⚽', isSports: true },
  { id: 'Boxing', label: 'Boxing', icon: '🥊', isSports: true },
  { id: 'UFC', label: 'UFC', icon: '🥋', isSports: true },
  { id: 'Basketball', label: 'Basketball', icon: '🏀', isSports: true },
  { id: 'Politics', label: 'Politics', icon: '🏛️', isSports: false },
  { id: 'Entertainment', label: 'Entertainment', icon: '🎬', isSports: false },
  { id: 'Live Event Prediction', label: 'Live event Prediction', icon: '🌍', isSports: false },
];

const SUBCATEGORIES: Record<string, string[]> = {
  Politics: ['All', 'Policy & Economy', 'Elections', 'Global Affairs', 'World Leaders'],
  Entertainment: ['All', 'Spotify & Music', 'Movies & Box Office', 'Awards & Grammys'],
  'Live Event Prediction': ['All', 'Space & Tech', 'AI & Computing', 'Climate & Science', 'Pop Culture'],
};

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

const FALLBACK_FOOTBALL_FIXTURES = [
  {
    _id: '65f100000000000000000001',
    sport: 'Football',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League Super Derby',
    status: 'LIVE',
    startTime: new Date().toISOString(),
    poolAmount: 4850000,
    odds: { home: 1.85, draw: 3.10, away: 2.40 },
  },
  {
    _id: '65f100000000000000000002',
    sport: 'Football',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga El Clásico',
    status: 'UPCOMING',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    poolAmount: 7200000,
    odds: { home: 1.95, draw: 3.40, away: 2.30 },
  },
  {
    _id: '65f100000000000000000003',
    sport: 'Football',
    homeTeam: 'Manchester City',
    awayTeam: 'Liverpool',
    league: 'Premier League Title Clash',
    status: 'UPCOMING',
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    poolAmount: 6400000,
    odds: { home: 1.75, draw: 3.60, away: 2.70 },
  },
];

const FALLBACK_BOXING_FIXTURES = [
  {
    _id: '65f1a0000000000000000001',
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
    _id: '65f1a0000000000000000002',
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
    _id: '65f1a0000000000000000003',
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
    _id: '65f1b0000000000000000001',
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
    _id: '65f1b0000000000000000002',
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
    _id: '65f1b0000000000000000003',
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
    _id: '65f1c0000000000000000001',
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
    _id: '65f1c0000000000000000002',
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
    _id: '65f1c0000000000000000003',
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

const FALLBACK_POLITICS_MARKETS = [
  {
    _id: '65f1d0000000000000000001',
    title: 'Central Bank to cut benchmark interest rate in Q4?',
    category: 'Politics',
    subcategory: 'Policy & Economy',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 3450000,
    closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    rules: 'Resolves to YES if the official Monetary Policy Committee announces a benchmark rate cut.',
    resolutionSource: 'Official Central Bank Monetary Policy Communiqué',
    options: [
      { id: 'yes', label: 'Yes', odds: 1.85, totalStaked: 1800000 },
      { id: 'no', label: 'No', odds: 1.95, totalStaked: 1650000 },
    ],
  },
  {
    _id: '65f1d0000000000000000002',
    title: 'US Federal Reserve to lower rates at upcoming FOMC meeting?',
    category: 'Politics',
    subcategory: 'Global Affairs',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 5120000,
    closingDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    rules: 'Resolves according to the official statement released by the Federal Reserve Board.',
    resolutionSource: 'Federal Reserve Official Statement',
    options: [
      { id: 'yes', label: 'Yes', odds: 1.72, totalStaked: 2800000 },
      { id: 'no', label: 'No', odds: 2.10, totalStaked: 2320000 },
    ],
  },
  {
    _id: '65f1d0000000000000000003',
    title: 'Nigeria Inflation Rate to drop below 28% in official NBS report?',
    category: 'Politics',
    subcategory: 'Policy & Economy',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 2180000,
    closingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    rules: 'Resolves based on headline CPI data published by National Bureau of Statistics.',
    resolutionSource: 'National Bureau of Statistics (NBS) CPI Report',
    options: [
      { id: 'yes', label: 'Yes', odds: 2.25, totalStaked: 850000 },
      { id: 'no', label: 'No', odds: 1.60, totalStaked: 1330000 },
    ],
  },
];

const FALLBACK_ENTERTAINMENT_MARKETS = [
  {
    _id: '65f1e0000000000000000001',
    title: 'Grammy Awards: Album of the Year Winner 2026',
    category: 'Entertainment',
    subcategory: 'Awards & Grammys',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 2850000,
    closingDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    rules: 'Resolves according to the official Recording Academy announcement.',
    resolutionSource: 'Grammy Awards Official Announcement',
    options: [
      { id: 'yes', label: 'Yes', odds: 1.80, totalStaked: 1500000 },
      { id: 'no', label: 'No', odds: 2.00, totalStaked: 1350000 },
    ],
  },
  {
    _id: '65f1e0000000000000000002',
    title: 'Spotify Global #1: Burna Boy new track to hit #1 within 72 hours?',
    category: 'Entertainment',
    subcategory: 'Spotify & Music',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 1950000,
    closingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    rules: 'Resolves based on Spotify Global Daily Top 50 Chart.',
    resolutionSource: 'Spotify Global Charts Official API',
    options: [
      { id: 'yes', label: 'Yes', odds: 2.10, totalStaked: 820000 },
      { id: 'no', label: 'No', odds: 1.70, totalStaked: 1130000 },
    ],
  },
  {
    _id: '65f1e0000000000000000003',
    title: 'Global Box Office: First 2026 blockbuster to cross $1B revenue',
    category: 'Entertainment',
    subcategory: 'Movies & Box Office',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 1420000,
    closingDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    rules: 'Resolves based on Box Office Mojo official worldwide gross records.',
    resolutionSource: 'Box Office Mojo / IMDbPro',
    options: [
      { id: 'yes', label: 'Yes', odds: 1.95, totalStaked: 720000 },
      { id: 'no', label: 'No', odds: 1.85, totalStaked: 700000 },
    ],
  },
];

const FALLBACK_LIVE_EVENT_MARKETS = [
  {
    _id: '65f1f0000000000000000001',
    title: 'SpaceX Starship orbital catch & recovery test in Q4?',
    category: 'Real Life Events',
    subcategory: 'Space & Tech',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 4120000,
    closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    rules: 'Resolves to YES if SpaceX successfully catches the Starship upper stage or Super Heavy booster during an orbital flight test mission.',
    resolutionSource: 'SpaceX Official Broadcast & FAA License Data',
    options: [
      { id: 'yes', label: 'Yes', odds: 1.88, totalStaked: 2150000 },
      { id: 'no', label: 'No', odds: 1.92, totalStaked: 1970000 },
    ],
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
    rules: 'Resolves to YES if OpenAI formally announces or releases GPT-5 or next-gen flagship foundation model.',
    resolutionSource: 'OpenAI Official Keynote & Blog',
    options: [
      { id: 'yes', label: 'Yes', odds: 2.10, totalStaked: 1300000 },
      { id: 'no', label: 'No', odds: 1.70, totalStaked: 1950000 },
    ],
  },
  {
    _id: 'live_3',
    title: 'Grand Theft Auto VI release date to break $1B retail revenue in 24h?',
    category: 'Pop Culture',
    subcategory: 'Gaming & Pop Culture',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 5600000,
    closingDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    rules: 'Resolves based on official Take-Two Interactive SEC filings or verified commercial figures.',
    resolutionSource: 'Take-Two Interactive SEC 10-Q Filing',
    options: [
      { id: 'yes', label: 'Yes', odds: 1.45, totalStaked: 3500000 },
      { id: 'no', label: 'No', odds: 2.70, totalStaked: 2100000 },
    ],
  },
];

const STAKE_PRESETS = [500, 1000, 2500, 5000, 10000];

export interface ContractInfoDetail {
  title: string;
  tag: string;
  description: string;
  rule: string;
  example: string;
}

export default function MarketScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('Football');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInfoContract, setSelectedInfoContract] = useState<ContractInfoDetail | null>(null);

  // Sports & Prediction data
  const [matches, setMatches] = useState<any[]>([]);
  const [predictionMarkets, setPredictionMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Accordion for market rules
  const [expandedRulesId, setExpandedRulesId] = useState<string | null>(null);

  const currentCategoryConfig = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  const isCurrentSports = currentCategoryConfig.isSports;

  // Load User Profile
  const fetchUser = async () => {
    try {
      const userData = await authService.getMe();
      if (userData) setUser(userData);
    } catch (e) {
      // User might be guest or offline
    }
  };

  // Fetch Sports Matches strictly categorized
  const fetchMatches = async (sportCategory: string) => {
    try {
      let normalized = 'Football';
      if (sportCategory === 'Football' || sportCategory === 'European Football') normalized = 'Football';
      else if (sportCategory === 'Boxing') normalized = 'Boxing';
      else if (sportCategory === 'UFC' || sportCategory === 'UFC & Boxing') normalized = 'UFC';
      else if (sportCategory === 'Basketball' || sportCategory === 'NBA Basketball') normalized = 'Basketball';

      const data = await matchService.getMatches({ sport: normalized, limit: 50 });
      let list = data.matches || [];

      // Client-side categorization filter safeguard
      if (normalized === 'Boxing') {
        list = list.filter(isBoxingMatch);
        if (list.length === 0) list = FALLBACK_BOXING_FIXTURES;
      } else if (normalized === 'UFC') {
        list = list.filter(isUFCMatch);
        if (list.length === 0) list = FALLBACK_UFC_FIXTURES;
      } else if (normalized === 'Basketball') {
        list = list.filter(isBasketballMatch);
        if (list.length === 0) list = FALLBACK_BASKETBALL_FIXTURES;
      } else if (normalized === 'Football') {
        list = list.filter(isFootballMatch);
        if (list.length === 0) list = FALLBACK_FOOTBALL_FIXTURES;
      }

      setMatches(list);
    } catch (error) {
      console.error('Error fetching matches:', error);
      if (sportCategory === 'Boxing') setMatches(FALLBACK_BOXING_FIXTURES);
      else if (sportCategory === 'UFC') setMatches(FALLBACK_UFC_FIXTURES);
      else if (sportCategory === 'Basketball') setMatches(FALLBACK_BASKETBALL_FIXTURES);
      else setMatches(FALLBACK_FOOTBALL_FIXTURES);
    }
  };

  // Fetch Prediction Markets
  const fetchPredictionMarkets = async (category: string, subcategory?: string, search?: string) => {
    try {
      const params: any = { category, status: 'ACTIVE' };
      if (subcategory && subcategory !== 'All') params.subcategory = subcategory;
      if (search && search.trim()) params.search = search.trim();

      const data = await predictionMarketService.getMarkets(params);
      let list = data.markets || [];
      if (list.length === 0 && !search) {
        if (category === 'Politics') list = FALLBACK_POLITICS_MARKETS;
        else if (category === 'Entertainment') list = FALLBACK_ENTERTAINMENT_MARKETS;
        else if (category === 'Live Event Prediction') list = FALLBACK_LIVE_EVENT_MARKETS;
      }
      setPredictionMarkets(list);
    } catch (error) {
      console.error('Error fetching prediction markets:', error);
      if (category === 'Politics') setPredictionMarkets(FALLBACK_POLITICS_MARKETS);
      else if (category === 'Entertainment') setPredictionMarkets(FALLBACK_ENTERTAINMENT_MARKETS);
      else if (category === 'Live Event Prediction') setPredictionMarkets(FALLBACK_LIVE_EVENT_MARKETS);
      else setPredictionMarkets([]);
    }
  };

  // Master Data Refresh
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchUser(),
      isCurrentSports ? fetchMatches(selectedCategory) : fetchPredictionMarkets(selectedCategory, selectedSubcategory, searchQuery),
    ]);
    setLoading(false);
  }, [selectedCategory, selectedSubcategory, searchQuery, isCurrentSports]);

  useEffect(() => {
    setSelectedSubcategory('All');
    setSearchQuery('');
    loadData();
  }, [selectedCategory]);

  useEffect(() => {
    if (!isCurrentSports) {
      fetchPredictionMarkets(selectedCategory, selectedSubcategory, searchQuery);
    }
  }, [selectedSubcategory, searchQuery]);

  // WebSocket Updates
  useEffect(() => {
    const socket = getSocket();
    const onMatchesUpdated = () => {
      if (isCurrentSports) fetchMatches(selectedCategory);
    };
    const onMarketUpdated = (payload: any) => {
      if (!isCurrentSports) {
        fetchPredictionMarkets(selectedCategory, selectedSubcategory, searchQuery);
      }
    };

    socket.on('matches_updated', onMatchesUpdated);
    socket.on('market_updated', onMarketUpdated);

    return () => {
      socket.off('matches_updated', onMatchesUpdated);
      socket.off('market_updated', onMarketUpdated);
    };
  }, [selectedCategory, selectedSubcategory, searchQuery, isCurrentSports]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleAdminMarketLock = async (marketId: string, currentLocked: boolean) => {
    try {
      await adminService.toggleMarketLock(marketId, !currentLocked);
      showToast(`Market ${!currentLocked ? 'LOCKED (Overpowered)' : 'UNLOCKED'} successfully`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle market lock', 'error');
    }
  };

  const handleToggleAdminMatchLock = async (matchId: string, currentLocked: boolean) => {
    try {
      await adminService.toggleMatchLock(matchId, !currentLocked);
      showToast(`Match ${!currentLocked ? 'LOCKED (Overpowered)' : 'UNLOCKED'} successfully`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle match lock', 'error');
    }
  };

  // Open Trading Screen for a Prediction Option (Same UI as 1.jpeg and 2.jpeg)
  const handleOpenTrade = (market: any, option: any) => {
    router.push({
      pathname: '/enter-amount',
      params: {
        marketId: market._id,
        matchTitle: market.title,
        marketName: market.subcategory || market.category || 'Prediction Contract',
        outcome: option.label,
        odds: option.odds || 1.95,
        isPrediction: 'true',
        poolAmount: market.poolAmount || 0,
        startTime: market.closingDate
          ? new Date(market.closingDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
          : 'Active',
      },
    });
  };

  // Filter Sports Matches by Search
  const filteredMatches = matches.filter((m) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const home = (m.homeTeam || '').toLowerCase();
    const away = (m.awayTeam || '').toLowerCase();
    const league = (m.league || '').toLowerCase();
    return home.includes(query) || away.includes(query) || league.includes(query);
  });

  const availableSubcategories = SUBCATEGORIES[selectedCategory] || ['All'];


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

  const getContractDetailInfo = (item: any, isMatch = false): ContractInfoDetail => {
    if (isMatch) {
      const sport = (item?.sport || selectedCategory || 'Football').toUpperCase();
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
    const subcat = (item?.subcategory || item?.category || selectedCategory || 'REAL LIFE EVENTS').toUpperCase();
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

  const getOutcomeSharesText = (pot: number | undefined, ratio: number, totalPool: number) => {
    const base = pot && pot > 0 ? pot : (totalPool > 0 ? Math.round(totalPool * ratio) : Math.round(250000 * ratio));
    const shares = Math.max(10, Math.round(base / 1000));
    const amountStr = base >= 1000000 ? `₦${(base / 1000000).toFixed(1)}M` : `₦${Math.round(base / 1000)}k`;
    return `${shares.toLocaleString()} Shares (${amountStr})`;
  };

  const handleTradeOutcome = (
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

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Peeribet Markets</Text>
            <Text style={styles.headerSubtitle}>
              {isCurrentSports ? 'Live Sports Trading Markets' : 'Decentralized Backdoor Prediction Markets'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.balanceBadge}
            onPress={() => router.push('/(tabs)/wallet')}
            activeOpacity={0.8}
          >
            <Wallet size={14} color={Colors.dark.primary} style={{ marginRight: 5 }} />
            <Text style={styles.balanceBadgeText}>
              ₦{(user?.balance || 0).toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 7 Categories Horizontal Slider */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                  style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                  {!cat.isSports && (
                    <View style={styles.marketBadgeDot}>
                      <Text style={styles.marketBadgeDotText}>PRO</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Subcategories (for Prediction Markets) */}
        {!isCurrentSports && (
          <View style={styles.subcategoriesWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subcategoriesScroll}
            >
              {availableSubcategories.map((sub) => {
                const isSubSelected = selectedSubcategory === sub;
                return (
                  <TouchableOpacity
                    key={sub}
                    onPress={() => setSelectedSubcategory(sub)}
                    activeOpacity={0.8}
                    style={[
                      styles.subPill,
                      isSubSelected && styles.subPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.subPillText,
                        isSubSelected && styles.subPillTextActive,
                      ]}
                    >
                      {sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Search size={15} color="#8FA2C7" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              isCurrentSports
                ? `Search ${selectedCategory} matches...`
                : `Search ${selectedCategory} predictions...`
            }
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={15} color="#8FA2C7" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Hero Information Banner */}
        <View style={styles.categoryHeroBanner}>
          <View style={styles.heroLeft}>
            <View style={styles.heroBadgeIcon}>
              <Sparkles size={14} color={Colors.dark.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroBannerTitle}>
                {selectedCategory === 'Entertainment'
                  ? 'Entertainment & Spotify Trades'
                  : selectedCategory === 'Politics'
                  ? 'Verified Backdoor Political Trades'
                  : selectedCategory === 'Real Life Events'
                  ? 'Real World & Scientific Outcomes'
                  : selectedCategory === 'Pop Culture'
                  ? 'Viral Pop Culture & Creator Markets'
                  : `${selectedCategory} Fixtures`}
              </Text>
              <Text style={styles.heroBannerSubtitle}>
                {selectedCategory === 'Entertainment'
                  ? 'Trade on Spotify streaming records, Grammy wins & movie box office budgets.'
                  : selectedCategory === 'Politics'
                  ? 'Backdoor trades on central bank rates, elections & verified government actions.'
                  : selectedCategory === 'Real Life Events'
                  ? 'SpaceX launches, frontier AI breakthroughs & real world milestones.'
                  : selectedCategory === 'Pop Culture'
                  ? 'MrBeast sub counts, GTA VI records & internet culture events.'
                  : 'Competitive peer-to-peer liquidity with zero house edge.'}
              </Text>
            </View>
          </View>
          <View style={styles.heroTagPill}>
            <Text style={styles.heroTagPillText}>
              {isCurrentSports ? 'SPORTS' : 'MARKETS'}
            </Text>
          </View>
        </View>

        {/* Main List ScrollView */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
        >
          {loading && !refreshing ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Colors.dark.primary} />
              <Text style={styles.loadingText}>Loading markets...</Text>
            </View>
          ) : isCurrentSports ? (
            /* ==================== SPORTS MATCH CARDS ==================== */
            filteredMatches.length === 0 ? (
              <View style={styles.emptyCard}>
                <Flame size={28} color="#64748B" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTitle}>No matches scheduled</Text>
                <Text style={styles.emptySubtitle}>
                  No active fixtures found for {selectedCategory}. Check back shortly for updated fixtures.
                </Text>
              </View>
            ) : (
              filteredMatches.map((match) => {
                const isLive = match.status === 'LIVE';
                const isSuspended = match.status === 'SUSPENDED';
                const isMatchAdminLocked = Boolean(match.isLocked || match.isOverpowered || isSuspended);

                const homeOdds = formatOdds(match.odds?.home, 1.85);
                const drawOdds = formatOdds(match.odds?.draw, 3.10);
                const awayOdds = formatOdds(match.odds?.away, 2.40);

                const noHomeOdds = calcNoOdds(homeOdds, 2.10);
                const noDrawOdds = calcNoOdds(drawOdds, 1.35);
                const noAwayOdds = calcNoOdds(awayOdds, 1.65);

                const totalMatchPool = match.poolAmount || match.pool?.totalPot || 250000;

                const isBoxing = selectedCategory === 'Boxing' || isBoxingMatch(match);
                const isUFC = selectedCategory === 'UFC' || isUFCMatch(match);
                const isCombatMatch = isBoxing || isUFC;
                const isBasketball = selectedCategory === 'Basketball' || isBasketballMatch(match);

                return (
                  <TouchableOpacity
                    key={match._id}
                    disabled={isMatchAdminLocked}
                    onPress={() =>
                      router.push({
                        pathname: '/match-detail',
                        params: {
                          id: match._id,
                          homeTeam: match.homeTeam,
                          awayTeam: match.awayTeam,
                          sport: selectedCategory,
                          league: match.league || '',
                          isLocked: String(isMatchAdminLocked),
                        },
                      })
                    }
                    activeOpacity={0.88}
                    style={[styles.sportsCard, isMatchAdminLocked && styles.sportsCardSuspended]}
                  >
                    {/* Admin Lock / Unlock Control Strip */}
                    {user?.role === 'admin' && (
                      <View style={styles.adminControlStrip}>
                        <ShieldAlert size={14} color={isMatchAdminLocked ? '#EF4444' : '#00D285'} />
                        <Text style={styles.adminControlText}>
                          Admin: {isMatchAdminLocked ? 'Locked (Overpowered)' : 'Active Fixture'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleToggleAdminMatchLock(match._id, isMatchAdminLocked)}
                          style={[styles.adminLockBtnSmall, isMatchAdminLocked ? styles.adminUnlockBtnSmall : styles.adminLockBtnActive]}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.adminLockBtnText}>
                            {isMatchAdminLocked ? 'Unlock Match' : 'Lock (Overpowered)'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Top League & Status Bar */}
                    <View style={styles.sportsCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <View style={styles.sportsLeagueWrap}>
                          {isLive && <Flame size={13} color="#EF4444" style={{ marginRight: 4 }} />}
                          <Text style={styles.sportsLeagueText}>{match.league || selectedCategory}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => setSelectedInfoContract(getContractDetailInfo(match, true))}
                          style={styles.infoIconButton}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Info size={13} color="#00D285" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.timeTagWrap}>
                        <Clock size={11} color={isLive ? '#EF4444' : '#8FA2C7'} style={{ marginRight: 4 }} />
                        <Text style={[styles.sportsTimeText, isLive && styles.sportsLiveTime]}>
                          {isLive
                            ? 'LIVE NOW'
                            : new Date(match.startTime).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                        </Text>
                      </View>
                    </View>

                    {/* Match Fixture Title / Preview */}
                    <View style={styles.matchFixtureBanner}>
                      <View style={styles.matchTeamHeaderWrap}>
                        <View style={styles.teamMiniBadge}>
                          <Text style={styles.teamMiniBadgeText}>
                            {(match.homeTeam || 'H').slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.matchFixtureTeamName} numberOfLines={1}>
                          {match.homeTeam}
                        </Text>
                      </View>

                      <View style={styles.matchVsTag}>
                        <Text style={styles.matchVsTagText}>VS</Text>
                      </View>

                      <View style={[styles.matchTeamHeaderWrap, { justifyContent: 'flex-end' }]}>
                        <Text style={[styles.matchFixtureTeamName, { textAlign: 'right' }]} numberOfLines={1}>
                          {match.awayTeam}
                        </Text>
                        <View style={styles.teamMiniBadge}>
                          <Text style={styles.teamMiniBadgeText}>
                            {(match.awayTeam || 'A').slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Card Title & Shares Rate Pill */}
                    <View style={styles.cardInnerHeader}>
                      <View style={styles.cardHeaderTitleWrap}>
                        <Text style={styles.cardMainTitle} numberOfLines={1}>
                          {isCombatMatch ? 'Bout Winner' : isBasketball ? 'Game Winner' : 'Match Winner'}
                        </Text>
                        <View style={styles.yesNoTagBadge}>
                          <Text style={styles.yesNoTagText}>
                            {isBoxing ? 'RING WINNER' : isUFC ? 'OCTAGON WINNER' : isBasketball ? '2-WAY' : 'YES / NO'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.shareUnitPill}>
                        <Text style={styles.shareUnitPillText}>1k = 1 Share</Text>
                      </View>
                    </View>

                    {isSuspended ? (
                      <View style={styles.suspendedBanner}>
                        <Lock size={14} color="#64748B" style={{ marginRight: 6 }} />
                        <Text style={styles.suspendedBannerText}>MARKET SUSPENDED</Text>
                      </View>
                    ) : (
                      /* Binary Outcome Rows */
                      <View style={styles.binaryRowsContainer}>
                        {/* Outcome 1: Home Team Win */}
                        {(() => {
                          const isHomeCrowdOverpowered = totalMatchPool > 50000 && (match.pool?.homePot || 0) / totalMatchPool >= 0.70;
                          const isHomeOverpowered = homeOdds <= 1.43 || isHomeCrowdOverpowered || isMatchAdminLocked;
                          return (
                            <View style={styles.binaryOutcomeRow}>
                              <View style={styles.outcomeInfoCol}>
                                <Text style={styles.outcomeTitle} numberOfLines={1}>{match.homeTeam} Win</Text>
                              </View>
                              <View style={styles.binaryActionBtns}>
                                <TouchableOpacity
                                  style={[styles.binaryBtnYes, isHomeOverpowered && { opacity: 0.5 }]}
                                  onPress={() =>
                                    handleTradeOutcome(match, `${match.homeTeam} to Win`, 'Yes', homeOdds)
                                  }
                                  disabled={isHomeOverpowered}
                                  activeOpacity={0.8}
                                >
                                  <Text style={styles.binaryBtnYesLabel}>YES</Text>
                                  <Text style={styles.binaryBtnSubTextYes}>{isHomeOverpowered ? 'Locked' : '₦1k / Sh'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.binaryBtnNo, isHomeOverpowered && { opacity: 0.5 }]}
                                  onPress={() =>
                                    handleTradeOutcome(match, `${match.homeTeam} to Win`, 'No', noHomeOdds)
                                  }
                                  disabled={isHomeOverpowered}
                                  activeOpacity={0.8}
                                >
                                  <Text style={styles.binaryBtnNoLabel}>NO</Text>
                                  <Text style={styles.binaryBtnSubTextNo}>{isHomeOverpowered ? 'Locked' : '₦1k / Sh'}</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })()}

                        {/* Outcome 2: Draw (Only for European Football, not Combat/Basketball) */}
                        {!isCombatMatch && !isBasketball && (() => {
                          const isDrawCrowdOverpowered = totalMatchPool > 50000 && (match.pool?.drawPot || 0) / totalMatchPool >= 0.70;
                          const isDrawOverpowered = drawOdds <= 1.43 || isDrawCrowdOverpowered || isMatchAdminLocked;
                          return (
                            <View style={styles.binaryOutcomeRow}>
                              <View style={styles.outcomeInfoCol}>
                                <Text style={styles.outcomeTitle}>Draw</Text>
                              </View>
                              <View style={styles.binaryActionBtns}>
                                <TouchableOpacity
                                  style={[styles.binaryBtnYes, isDrawOverpowered && { opacity: 0.5 }]}
                                  onPress={() =>
                                    handleTradeOutcome(match, 'Match Draw', 'Yes', drawOdds)
                                  }
                                  disabled={isDrawOverpowered}
                                  activeOpacity={0.8}
                                >
                                  <Text style={styles.binaryBtnYesLabel}>YES</Text>
                                  <Text style={styles.binaryBtnSubTextYes}>{isDrawOverpowered ? 'Locked' : '₦1k / Sh'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.binaryBtnNo, isDrawOverpowered && { opacity: 0.5 }]}
                                  onPress={() =>
                                    handleTradeOutcome(match, 'Match Draw', 'No', noDrawOdds)
                                  }
                                  disabled={isDrawOverpowered}
                                  activeOpacity={0.8}
                                >
                                  <Text style={styles.binaryBtnNoLabel}>NO</Text>
                                  <Text style={styles.binaryBtnSubTextNo}>{isDrawOverpowered ? 'Locked' : '₦1k / Sh'}</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })()}

                        {/* Outcome 3: Away Team Win */}
                        {(() => {
                          const isAwayCrowdOverpowered = totalMatchPool > 50000 && (match.pool?.awayPot || 0) / totalMatchPool >= 0.70;
                          const isAwayOverpowered = awayOdds <= 1.43 || isAwayCrowdOverpowered || isMatchAdminLocked;
                          return (
                            <View style={styles.binaryOutcomeRow}>
                              <View style={styles.outcomeInfoCol}>
                                <Text style={styles.outcomeTitle} numberOfLines={1}>{match.awayTeam} Win</Text>
                              </View>
                              <View style={styles.binaryActionBtns}>
                                <TouchableOpacity
                                  style={[styles.binaryBtnYes, isAwayOverpowered && { opacity: 0.5 }]}
                                  onPress={() =>
                                    handleTradeOutcome(match, `${match.awayTeam} to Win`, 'Yes', awayOdds)
                                  }
                                  disabled={isAwayOverpowered}
                                  activeOpacity={0.8}
                                >
                                  <Text style={styles.binaryBtnYesLabel}>YES</Text>
                                  <Text style={styles.binaryBtnSubTextYes}>{isAwayOverpowered ? 'Locked' : '₦1k / Sh'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.binaryBtnNo, isAwayOverpowered && { opacity: 0.5 }]}
                                  onPress={() =>
                                    handleTradeOutcome(match, `${match.awayTeam} to Win`, 'No', noAwayOdds)
                                  }
                                  disabled={isAwayOverpowered}
                                  activeOpacity={0.8}
                                >
                                  <Text style={styles.binaryBtnNoLabel}>NO</Text>
                                  <Text style={styles.binaryBtnSubTextNo}>{isAwayOverpowered ? 'Locked' : '₦1k / Sh'}</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })()}
                      </View>
                    )}

                    {/* Card Footer */}
                    <View style={styles.binaryCardFooter}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, color: '#8FA2C7', fontFamily: 'Inter', fontWeight: '600' }}>
                          ₦{(totalMatchPool).toLocaleString()} Pool
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.tradeLinkWrap}
                        onPress={() =>
                          router.push({
                            pathname: '/match-detail',
                            params: {
                              id: match._id,
                              homeTeam: match.homeTeam,
                              awayTeam: match.awayTeam,
                              sport: match.sport || selectedCategory,
                              league: match.league || '',
                            },
                          })
                        }
                      >
                        <Text style={styles.tradeLinkText}>All Contracts</Text>
                        <ArrowRight size={13} color="#00D285" style={{ marginLeft: 3 }} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            )
          ) : (
            /* ==================== PREDICTION MARKET CARDS ==================== */
            predictionMarkets.length === 0 ? (
              <View style={styles.emptyCard}>
                <Sparkles size={28} color="#64748B" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTitle}>No prediction trades yet</Text>
                <Text style={styles.emptySubtitle}>
                  There are currently no active backdoor prediction trades in {selectedCategory}
                  {selectedSubcategory !== 'All' ? ` (${selectedSubcategory})` : ''}. Admins publish new trades regularly!
                </Text>
              </View>
            ) : (
              predictionMarkets.map((market) => {
                const yesOption = market.options?.find(
                  (o: any) => o.id?.toLowerCase() === 'yes' || o.label?.toLowerCase() === 'yes'
                ) || { label: 'YES', odds: market.yesOdds || market.options?.[0]?.odds || 1.85 };
                const noOption = market.options?.find(
                  (o: any) => o.id?.toLowerCase() === 'no' || o.label?.toLowerCase() === 'no'
                ) || { label: 'NO', odds: market.noOdds || market.options?.[1]?.odds || 1.95 };

                const yesOdds = market.yesOdds || yesOption?.odds || 1.85;
                const noOdds = market.noOdds || noOption?.odds || 1.95;

                const isWholeMarketLocked = Boolean(
                  (market.isLocked || market.status === 'SUSPENDED') &&
                  (!market.lockedContracts || market.lockedContracts.length === 0)
                );
                const isYesLocked = isWholeMarketLocked || (yesOdds && yesOdds <= 1.43) || Boolean(
                  market.lockedContracts?.some((c: string) => c.toUpperCase() === 'YES' || (yesOption.id && c.toUpperCase() === String(yesOption.id).toUpperCase())) ||
                  yesOption.isLocked
                );
                const isNoLocked = isWholeMarketLocked || (noOdds && noOdds <= 1.43) || Boolean(
                  market.lockedContracts?.some((c: string) => c.toUpperCase() === 'NO' || (noOption.id && c.toUpperCase() === String(noOption.id).toUpperCase())) ||
                  noOption.isLocked
                );
                const isAllLocked = isYesLocked && isNoLocked;
                const isMarketAdminLocked = isAllLocked || Boolean(market.lockedContracts?.length > 0);

                return (
                  <View key={market._id} style={styles.richMarketCard}>
                    {/* Admin Lock / Unlock Control Strip */}
                    {user?.role === 'admin' && (
                      <View style={styles.adminControlStrip}>
                        <ShieldAlert size={14} color={isAllLocked ? '#EF4444' : '#00D285'} />
                        <Text style={styles.adminControlText}>
                          Admin: {isAllLocked ? 'All Contracts Locked' : market.lockedContracts?.length > 0 ? `Locked: ${market.lockedContracts.join(', ')}` : 'Active Market'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleToggleAdminMarketLock(market._id, isMarketAdminLocked)}
                          style={[styles.adminLockBtnSmall, isMarketAdminLocked ? styles.adminUnlockBtnSmall : styles.adminLockBtnActive]}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.adminLockBtnText}>
                            {isMarketAdminLocked ? 'Unlock All' : 'Lock All'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Top Row: Subcategory & Info Icon & Status */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardCategoryGroup}>
                        <Text style={styles.cardCategoryBadge}>
                          {(market.subcategory || selectedCategory || 'REAL LIFE EVENTS').toUpperCase()}
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
                      {isAllLocked ? (
                        <View style={[styles.closingBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                          <Lock size={11} color="#EF4444" />
                          <Text style={[styles.closingBadgeText, { color: '#EF4444' }]}>Locked</Text>
                        </View>
                      ) : (
                        <View style={styles.closingBadge}>
                          <Clock size={11} color="#64748B" />
                          <Text style={styles.closingBadgeText}>
                            {market.closingDate
                              ? `Closes ${new Date(market.closingDate).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}`
                              : 'Closes Soon'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Question Title with compact sleek styling */}
                    <Text style={styles.marketTitleText}>{market.title}</Text>

                    {/* Outcomes & Trade Buttons (Clean YES / NO layout matching Home Page) */}
                    <View style={styles.binaryChoiceRow}>
                      <TouchableOpacity
                        style={[styles.binaryOptionBtn, styles.binaryOptionYes, isYesLocked && { opacity: 0.5 }]}
                        activeOpacity={0.8}
                        disabled={isYesLocked}
                        onPress={() => handleOpenTrade(market, yesOption)}
                      >
                        <Text style={styles.binaryOptionLabelYes}>YES</Text>
                        <Text style={styles.binaryOptionOdds}>{isYesLocked ? 'Locked' : '₦1,000 / Share'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.binaryOptionBtn, styles.binaryOptionNo, isNoLocked && { opacity: 0.5 }]}
                        activeOpacity={0.8}
                        disabled={isNoLocked}
                        onPress={() => handleOpenTrade(market, noOption)}
                      >
                        <Text style={styles.binaryOptionLabelNo}>NO</Text>
                        <Text style={styles.binaryOptionOdds}>{isNoLocked ? 'Locked' : '₦1,000 / Share'}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Card Footer: Total Volume & Trade Outcome Button */}
                    <View style={styles.cardFooterRow}>
                      <View>
                        <Text style={styles.cardPoolLabel}>TOTAL VOLUME</Text>
                        <Text style={styles.cardPoolValue}>
                          ₦{(market.poolAmount || 2500000).toLocaleString()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleOpenTrade(market, yesOption)}
                        style={[styles.quickTradePill, isAllLocked && { opacity: 0.5 }]}
                        activeOpacity={0.8}
                        disabled={isAllLocked}
                      >
                        <Text style={styles.quickTradePillText}>{isAllLocked ? 'Locked' : 'Trade Outcome'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )
          )}
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
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  /* Top Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.28)',
  },
  balanceBadgeText: {
    color: Colors.dark.primary,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'Inter',
  },

  /* Categories Bar */
  categoriesWrapper: {
    paddingVertical: 8,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: 'rgba(19, 28, 50, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryPillActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryLabel: {
    color: '#8FA2C7',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  categoryLabelActive: {
    color: '#0A1124',
  },
  marketBadgeDot: {
    marginLeft: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  marketBadgeDotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#60A5FA',
    fontFamily: 'Inter',
  },

  /* Subcategories Bar */
  subcategoriesWrapper: {
    paddingBottom: 6,
  },
  subcategoriesScroll: {
    paddingHorizontal: 20,
    gap: 6,
  },
  subPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  subPillActive: {
    backgroundColor: 'rgba(0, 210, 133, 0.16)',
    borderColor: Colors.dark.primary,
  },
  subPillText: {
    fontSize: 11,
    color: '#8FA2C7',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  subPillTextActive: {
    color: Colors.dark.primary,
    fontWeight: '700',
  },

  /* Search Bar */
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(19, 28, 50, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter',
    padding: 0,
  },

  /* Hero Info Banner */
  categoryHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(19, 28, 50, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  heroBadgeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 210, 133, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  heroBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  heroBannerSubtitle: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginTop: 2,
    lineHeight: 14,
  },
  heroTagPill: {
    backgroundColor: 'rgba(0, 210, 133, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroTagPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.dark.primary,
    fontFamily: 'Inter',
    textTransform: 'uppercase',
  },

  /* Main Scroll Content */
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centerLoading: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8FA2C7',
    fontSize: 12,
    fontFamily: 'Inter',
    marginTop: 10,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(19, 28, 50, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#8FA2C7',
    fontSize: 11,
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 16,
  },

  /* ==================== SPORTS CARDS ==================== */
  sportsCard: {
    backgroundColor: 'rgba(19, 28, 50, 0.94)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sportsCardSuspended: {
    opacity: 0.6,
  },
  sportsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sportsLeagueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportsLeagueText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.primary,
    textTransform: 'uppercase',
    fontFamily: 'Inter',
  },
  timeTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportsTimeText: {
    fontSize: 10,
    color: '#8FA2C7',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  sportsLiveTime: {
    color: '#EF4444',
    fontWeight: '700',
  },
  matchFixtureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  matchTeamHeaderWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamMiniBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  teamMiniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  matchFixtureTeamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  matchVsTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.25)',
    marginHorizontal: 8,
  },
  matchVsTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  competitorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  competitorBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
  competitorBlockRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  competitorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  competitorRole: {
    fontSize: 9,
    color: '#8FA2C7',
    marginTop: 2,
    textTransform: 'uppercase',
    fontFamily: 'Inter',
  },
  matchVsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 8,
  },
  vsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark.primary,
    fontFamily: 'Inter',
  },
  suspendedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  suspendedBannerText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  sportsOddsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sportsOddBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sportsOddLabel: {
    fontSize: 9,
    color: '#8FA2C7',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  sportsOddVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark.primary,
    fontFamily: 'Inter',
  },

  /* ==================== PREDICTION MARKET CARDS ==================== */
  predCard: {
    backgroundColor: 'rgba(19, 28, 50, 0.94)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  predCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  predSubcategoryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  predSubcategoryText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#60A5FA',
    textTransform: 'uppercase',
    fontFamily: 'Inter',
  },
  closingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closingBadgeText: {
    fontSize: 10,
    color: '#8FA2C7',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  predQuestionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    lineHeight: 20,
    marginBottom: 8,
  },
  resolutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resolutionText: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    flex: 1,
  },
  rulesToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 8,
  },
  rulesToggleText: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    textDecorationLine: 'underline',
  },
  rulesDrawer: {
    backgroundColor: 'rgba(10, 17, 36, 0.6)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rulesContentText: {
    fontSize: 10,
    color: '#CBD5E1',
    lineHeight: 14,
    fontFamily: 'Inter',
  },

  /* Yes/No Sentiment & Buttons */
  yesNoContainer: {
    marginVertical: 4,
  },
  sentimentBarContainer: {
    marginBottom: 10,
  },
  sentimentLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sentimentYesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  sentimentNoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: 'Inter',
  },
  sentimentTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sentimentYesFill: {
    backgroundColor: '#00D285',
    height: '100%',
  },
  sentimentNoFill: {
    backgroundColor: '#EF4444',
    height: '100%',
  },
  binaryBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnYes: {
    flex: 1,
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnYesLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  btnNo: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnNoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  btnOddsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },

  /* Multiple Choice Container */
  mcContainer: {
    marginVertical: 4,
  },
  mcHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  mcList: {
    gap: 6,
  },
  mcItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  mcItemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  mcItemVolume: {
    fontSize: 9,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginTop: 1,
  },
  mcItemOddsBadge: {
    backgroundColor: 'rgba(0, 210, 133, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.25)',
  },
  mcItemOddsText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dark.primary,
    fontFamily: 'Inter',
  },

  /* Prediction Card Footer */
  predCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  footerStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerStatText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  footerTradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerTradePromptText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.primary,
    fontFamily: 'Inter',
  },

  /* ==================== QUICK STAKE TRADE MODAL ==================== */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#131C32',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalHeaderSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.dark.primary,
    letterSpacing: 0.5,
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  modalSelectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalSelectionLeft: {
    flex: 1,
  },
  modalSelectionLabel: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  modalSelectionVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  modalOddsBadge: {
    backgroundColor: 'rgba(0, 210, 133, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.3)',
  },
  modalOddsText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark.primary,
    fontFamily: 'Inter',
  },
  engineTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  engineTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  engineTabActive: {
    backgroundColor: 'rgba(0, 210, 133, 0.16)',
    borderColor: Colors.dark.primary,
  },
  engineTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  engineTabTextActive: {
    color: Colors.dark.primary,
    fontWeight: '800',
  },
  sectionSublabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8FA2C7',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontFamily: 'Inter',
  },
  shareCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 17, 36, 0.8)',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.4)',
    marginBottom: 10,
  },
  shareCounterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCounterBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  shareCounterDisplay: {
    alignItems: 'center',
  },
  shareCountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  shareCostText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.primary,
    marginTop: 2,
    fontFamily: 'Inter',
  },
  modalBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalBalanceLabel: {
    fontSize: 11,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  modalBalanceVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  stakeInputContainer: {
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
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark.primary,
    marginRight: 6,
    fontFamily: 'Inter',
  },
  stakeInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(0, 210, 133, 0.16)',
    borderColor: Colors.dark.primary,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  presetBtnTextActive: {
    color: Colors.dark.primary,
  },
  calculationsBox: {
    backgroundColor: 'rgba(10, 17, 36, 0.6)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 11,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  calcValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  calcProfitVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  confirmTradeBtn: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTradeBtnDisabled: {
    opacity: 0.5,
  },
  confirmTradeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A1124',
    fontFamily: 'Inter',
  },

  /* Binary Contract Card Styles (per Owner UI feedback) */
  cardInnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    gap: 8,
  },
  cardHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 8,
  },
  cardMainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: -0.2,
  },
  yesNoTagBadge: {
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  yesNoTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
    lineHeight: 12,
    includeFontPadding: false,
  },
  shareUnitPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  shareUnitPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    fontFamily: 'Inter',
    letterSpacing: 0.2,
    lineHeight: 12,
    includeFontPadding: false,
  },
  cardHeaderSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginBottom: 10,
  },
  binaryRowsContainer: {
    gap: 8,
    marginBottom: 8,
  },
  binaryOutcomeRow: {
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
  outcomeInfoCol: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  outcomeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  binaryActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  binaryBtnYes: {
    backgroundColor: '#00D285',
    width: 76,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  binaryBtnYesLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A1124',
    fontFamily: 'Inter',
    lineHeight: 14,
  },
  binaryBtnSubTextYes: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0A1124',
    opacity: 0.85,
    marginTop: 1,
    fontFamily: 'Inter',
    lineHeight: 12,
  },
  binaryBtnNo: {
    backgroundColor: '#1E293B',
    width: 76,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  binaryBtnNoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    lineHeight: 14,
  },
  binaryBtnSubTextNo: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
    fontFamily: 'Inter',
    lineHeight: 12,
  },
  binaryCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  tradeLinkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tradeLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00D285',
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
  richMarketCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardCategoryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardCategoryBadge: {
    color: '#00D285',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoIconButton: {
    padding: 3,
    backgroundColor: 'rgba(0, 210, 133, 0.1)',
    borderRadius: 12,
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
});

