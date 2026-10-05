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

const FALLBACK_COMBAT_MARKETS = [
  {
    _id: 'combat_1',
    title: 'UFC 308: Ilia Topuria vs Max Holloway (Fight Winner)',
    category: 'UFC & Boxing',
    subcategory: 'Championship Matchup',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 4650000,
    closingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    yesLabel: 'Ilia Topuria',
    noLabel: 'Max Holloway',
    yesOdds: 1.78,
    noOdds: 2.05,
    rules: 'Resolves to the official UFC in-octagon winner decision.',
  },
  {
    _id: 'combat_1_method',
    title: 'UFC 308: Method of Settlement (Stoppage vs Decision)',
    category: 'UFC & Boxing',
    subcategory: 'Settlement Method',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 3120000,
    closingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    yesLabel: 'KO / TKO / Sub (Finish)',
    noLabel: 'Goes to Decision',
    yesOdds: 1.62,
    noOdds: 2.25,
    rules: 'Resolves to YES if the fight finishes before the final bell.',
  },
  {
    _id: 'combat_1_rounds',
    title: 'UFC 308: Total Rounds Contract (Over / Under 2.5 Rounds)',
    category: 'UFC & Boxing',
    subcategory: 'Round Duration',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 2480000,
    closingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    yesLabel: 'Over 2.5 Rounds',
    noLabel: 'Under 2.5 Rounds',
    yesOdds: 1.88,
    noOdds: 1.92,
    rules: 'Resolves to YES if the fight enters the second half of Round 3.',
  },
  {
    _id: 'combat_2',
    title: 'Heavyweight Championship: Fury vs Usyk II (Match Winner)',
    category: 'UFC & Boxing',
    subcategory: 'Heavyweight Boxing',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 7890000,
    closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    yesLabel: 'Tyson Fury Win',
    noLabel: 'Oleksandr Usyk Win',
    yesOdds: 1.90,
    noOdds: 1.90,
    rules: 'Resolves according to the official sanctioning body decision.',
  },
  {
    _id: 'combat_3_total',
    title: 'NBA: Celtics vs Nuggets — Total Game Points (Over / Under 218.5)',
    category: 'NBA Basketball',
    subcategory: 'Total Points',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 3820000,
    closingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    yesLabel: 'Over 218.5 Points',
    noLabel: 'Under 218.5 Points',
    yesOdds: 1.90,
    noOdds: 1.90,
    rules: 'Resolves based on official NBA aggregate final game score.',
  },
  {
    _id: 'combat_3_halftime',
    title: 'NBA: Celtics vs Nuggets — Halftime Leader Contract',
    category: 'NBA Basketball',
    subcategory: 'Halftime Settlement',
    marketType: 'YES_NO',
    status: 'ACTIVE',
    poolAmount: 2150000,
    closingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    yesLabel: 'Celtics Lead at Half',
    noLabel: 'Nuggets Lead / Tie',
    yesOdds: 1.75,
    noOdds: 2.05,
    rules: 'Resolves according to the score at the end of the 2nd quarter.',
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

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Markets', icon: '🔥' },
  { id: 'SPORTS', label: 'European Sports', icon: '⚽' },
  { id: 'POLITICS', label: 'Politics', icon: '🏛️' },
  { id: 'COMBAT', label: 'UFC & Combat', icon: '🥊' },
  { id: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎬' },
];

const STAKE_PRESETS = [500, 1000, 2500, 5000, 10000];

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('ALL');

  // Markets by Category
  const [sportsMatches, setSportsMatches] = useState<any[]>([]);
  const [politicsMarkets, setPoliticsMarkets] = useState<any[]>([]);
  const [combatMarkets, setCombatMarkets] = useState<any[]>([]);
  const [entertainmentMarkets, setEntertainmentMarkets] = useState<any[]>([]);

  // Category view all toggles
  const [expandedSports, setExpandedSports] = useState(false);
  const [expandedPolitics, setExpandedPolitics] = useState(false);
  const [expandedCombat, setExpandedCombat] = useState(false);
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

      // Sports Matches
      const rawMatches = matchesRes?.matches || [];
      setSportsMatches(rawMatches);

      // Prediction Markets
      const allMarkets = marketsRes?.markets || [];
      const pol = allMarkets.filter((m: any) =>
        /politic/i.test(m.category || '') || /governance|election|policy/i.test(m.subcategory || '')
      );
      setPoliticsMarkets(pol.length > 0 ? pol : FALLBACK_POLITICS_MARKETS);

      const com = allMarkets.filter((m: any) =>
        /ufc|boxing|nba|basketball|combat/i.test(m.category || '') ||
        /ufc|boxing|basketball/i.test(m.subcategory || '')
      );
      setCombatMarkets(com.length > 0 ? com : FALLBACK_COMBAT_MARKETS);

      const ent = allMarkets.filter((m: any) =>
        /entertainment|pop culture|music|awards/i.test(m.category || '') ||
        /spotify|music|grammy|movie/i.test(m.subcategory || '')
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

  const handleOpenTradeModal = (market: any, option: any) => {
    setActiveMarket(market);
    setSelectedOption(option);
    setStakeAmount('1000');
    setTradeModalVisible(true);
  };

  const handleExecuteTrade = async () => {
    if (!activeMarket || !selectedOption) return;
    const numericStake = parseFloat(stakeAmount);
    if (isNaN(numericStake) || numericStake <= 0) {
      showToast('Please enter a valid stake amount', 'warning');
      return;
    }

    if (user?.balance !== undefined && user.balance < numericStake) {
      showToast('Insufficient wallet balance. Please fund your wallet.', 'warning');
      return;
    }

    setIsSubmittingBet(true);
    try {
      await predictionMarketService.placeBet(activeMarket._id, {
        selection: selectedOption.label || selectedOption.id || 'YES',
        amount: numericStake,
      });

      showToast(`Trade placed: ₦${numericStake.toLocaleString()} on ${selectedOption.label || 'YES'}!`, 'success');
      setTradeModalVisible(false);

      if (user) {
        setUser({ ...user, balance: Math.max(0, (user.balance || 0) - numericStake) });
      }
      fetchData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to place trade. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingBet(false);
    }
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
  const filteredPolitics = filterBySearch(politicsMarkets, false);
  const filteredCombat = filterBySearch(combatMarkets, false);
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
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'SPORTS') &&
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
                      <Text style={styles.venueText}>
                        {(featuredMatch.leagueName || featuredMatch.league || 'EUROPEAN PREMIER LEAGUE').toUpperCase()}
                      </Text>
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

          {/* SECTION 1: ⚽ European Sports */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'SPORTS') &&
            filteredSports.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryTitleBox}>
                    <Text style={styles.categorySectionEmoji}>⚽</Text>
                    <Text style={styles.categorySectionTitle}>European Sports</Text>
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
                    <TouchableOpacity
                      key={match._id}
                      style={styles.richMarketCard}
                      activeOpacity={0.85}
                      onPress={() =>
                        router.push({
                          pathname: '/match-detail',
                          params: {
                            id: match._id,
                            homeTeam: match.homeTeam,
                            awayTeam: match.awayTeam,
                          },
                        })
                      }
                    >
                      {/* Card Top: League & Status */}
                      <View style={styles.cardTopRow}>
                        <Text style={styles.cardLeagueText} numberOfLines={1}>
                          {(match.leagueName || match.league || 'EUROPEAN MATCH').toUpperCase()}
                        </Text>
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

                      {/* Pool & Action Footer */}
                      <View style={styles.cardFooterRow}>
                        <View>
                          <Text style={styles.cardPoolLabel}>LIQUIDITY POOL</Text>
                          <Text style={styles.cardPoolValue}>
                            ₦{(match.poolAmount || 1850000).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.tradeActionButton}>
                          <Text style={styles.tradeActionButtonText}>TRADE YES / NO</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

          {/* SECTION 2: 🏛️ Politics & Governance */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'POLITICS') &&
            filteredPolitics.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryTitleBox}>
                    <Text style={styles.categorySectionEmoji}>🏛️</Text>
                    <Text style={styles.categorySectionTitle}>Politics & Governance</Text>
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
                  ).map((market) => (
                    <View key={market._id} style={styles.richMarketCard}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.cardCategoryBadge}>
                          {(market.subcategory || 'POLICY & GOVERNANCE').toUpperCase()}
                        </Text>
                        <View style={styles.closingBadge}>
                          <Clock size={11} color="#64748B" />
                          <Text style={styles.closingBadgeText}>Closes Soon</Text>
                        </View>
                      </View>

                      <Text style={styles.marketTitleText}>{market.title}</Text>

                      {/* Outcomes & Trade Buttons */}
                      <View style={styles.binaryChoiceRow}>
                        <TouchableOpacity
                          style={[styles.binaryOptionBtn, styles.binaryOptionYes]}
                          activeOpacity={0.8}
                          onPress={() => handleOpenTradeModal(market, { label: 'YES', odds: market.yesOdds || 1.85 })}
                        >
                          <Text style={styles.binaryOptionLabelYes}>YES</Text>
                          <Text style={styles.binaryOptionOdds}>₦1k = ₦{Math.round((market.yesOdds || 1.85) * 1000)}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.binaryOptionBtn, styles.binaryOptionNo]}
                          activeOpacity={0.8}
                          onPress={() => handleOpenTradeModal(market, { label: 'NO', odds: market.noOdds || 1.95 })}
                        >
                          <Text style={styles.binaryOptionLabelNo}>NO</Text>
                          <Text style={styles.binaryOptionOdds}>₦1k = ₦{Math.round((market.noOdds || 1.95) * 1000)}</Text>
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
                          style={styles.quickTradePill}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.quickTradePillText}>Trade Outcome</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

          {/* SECTION 3: 🥊 Combat Sports & Basketball */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'COMBAT') &&
            filteredCombat.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryTitleBox}>
                    <Text style={styles.categorySectionEmoji}>🥊</Text>
                    <Text style={styles.categorySectionTitle}>UFC, Boxing & NBA</Text>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>{filteredCombat.length}</Text>
                    </View>
                  </View>
                  {filteredCombat.length > CARDS_PER_CATEGORY && !searchText.trim() && (
                    <TouchableOpacity
                      onPress={() => setExpandedCombat(!expandedCombat)}
                      style={styles.viewAllBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllBtnText}>
                        {expandedCombat ? 'Show Less' : `View All (${filteredCombat.length})`}
                      </Text>
                      {expandedCombat ? (
                        <ChevronUp size={14} color="#00D285" />
                      ) : (
                        <ChevronDown size={14} color="#00D285" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Rich Combat Cards */}
                <View style={styles.cardsGrid}>
                  {(expandedCombat || searchText.trim()
                    ? filteredCombat
                    : filteredCombat.slice(0, CARDS_PER_CATEGORY)
                  ).map((market) => (
                    <View key={market._id} style={styles.richMarketCard}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.cardCategoryBadge}>
                          {(market.subcategory || 'CHAMPIONSHIP MATCHUP').toUpperCase()}
                        </Text>
                        <View style={styles.closingBadge}>
                          <Flame size={11} color="#F59E0B" />
                          <Text style={[styles.closingBadgeText, { color: '#F59E0B' }]}>High Volume</Text>
                        </View>
                      </View>

                      <Text style={styles.marketTitleText}>{market.title}</Text>

                      <View style={styles.binaryChoiceRow}>
                        <TouchableOpacity
                          style={[styles.binaryOptionBtn, styles.binaryOptionYes]}
                          activeOpacity={0.8}
                          onPress={() => handleOpenTradeModal(market, { label: market.yesLabel || 'YES', odds: market.yesOdds || 1.8 })}
                        >
                          <Text style={styles.binaryOptionLabelYes} numberOfLines={1}>
                            {market.yesLabel || 'YES'}
                          </Text>
                          <Text style={styles.binaryOptionOdds}>₦1k = ₦{Math.round((market.yesOdds || 1.8) * 1000)}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.binaryOptionBtn, styles.binaryOptionNo]}
                          activeOpacity={0.8}
                          onPress={() => handleOpenTradeModal(market, { label: market.noLabel || 'NO', odds: market.noOdds || 1.9 })}
                        >
                          <Text style={styles.binaryOptionLabelNo} numberOfLines={1}>
                            {market.noLabel || 'NO'}
                          </Text>
                          <Text style={styles.binaryOptionOdds}>₦1k = ₦{Math.round((market.noOdds || 1.9) * 1000)}</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.cardFooterRow}>
                        <View>
                          <Text style={styles.cardPoolLabel}>FIGHT POOL</Text>
                          <Text style={styles.cardPoolValue}>
                            ₦{(market.poolAmount || 3200000).toLocaleString()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleOpenTradeModal(market, { label: 'YES', odds: market.yesOdds || 1.8 })}
                          style={styles.quickTradePill}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.quickTradePillText}>Trade Contract</Text>
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
                  ).map((market) => (
                    <View key={market._id} style={styles.richMarketCard}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.cardCategoryBadge}>
                          {(market.subcategory || 'MUSIC & CULTURE').toUpperCase()}
                        </Text>
                        <View style={styles.closingBadge}>
                          <Sparkles size={11} color="#8B5CF6" />
                          <Text style={[styles.closingBadgeText, { color: '#8B5CF6' }]}>Trending</Text>
                        </View>
                      </View>

                      <Text style={styles.marketTitleText}>{market.title}</Text>

                      <View style={styles.binaryChoiceRow}>
                        <TouchableOpacity
                          style={[styles.binaryOptionBtn, styles.binaryOptionYes]}
                          activeOpacity={0.8}
                          onPress={() => handleOpenTradeModal(market, { label: 'YES', odds: market.yesOdds || 1.85 })}
                        >
                          <Text style={styles.binaryOptionLabelYes}>YES</Text>
                          <Text style={styles.binaryOptionOdds}>₦1k = ₦{Math.round((market.yesOdds || 1.85) * 1000)}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.binaryOptionBtn, styles.binaryOptionNo]}
                          activeOpacity={0.8}
                          onPress={() => handleOpenTradeModal(market, { label: 'NO', odds: market.noOdds || 1.95 })}
                        >
                          <Text style={styles.binaryOptionLabelNo}>NO</Text>
                          <Text style={styles.binaryOptionOdds}>₦1k = ₦{Math.round((market.noOdds || 1.95) * 1000)}</Text>
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
                          style={styles.quickTradePill}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.quickTradePillText}>Trade Contract</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Quick Trade Execution Modal */}
      <Modal
        visible={tradeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Execute Outcome Trade</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {activeMarket?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setTradeModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Selected Position Pill */}
            <View style={styles.selectedPositionBox}>
              <Text style={styles.positionBoxLabel}>SELECTED POSITION</Text>
              <Text style={styles.positionBoxValue}>
                {selectedOption?.label || 'YES'} (Estimated Yield: {selectedOption?.odds || '1.85'}x)
              </Text>
            </View>

            {/* Stake Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>CONTRACT STAKE (₦)</Text>
                <Text style={styles.balanceHint}>
                  Balance: ₦{(user?.balance || 0).toLocaleString()}
                </Text>
              </View>
              <TextInput
                style={styles.stakeInput}
                keyboardType="numeric"
                value={stakeAmount}
                onChangeText={setStakeAmount}
                placeholder="1000"
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Preset Amount Pills */}
            <View style={styles.presetRow}>
              {STAKE_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setStakeAmount(preset.toString())}
                  style={[
                    styles.presetPill,
                    stakeAmount === preset.toString() && styles.presetPillActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetPillText,
                      stakeAmount === preset.toString() && styles.presetPillTextActive,
                    ]}
                  >
                    ₦{preset >= 1000 ? `${preset / 1000}k` : preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Projected Payout */}
            <View style={styles.payoutPreviewRow}>
              <Text style={styles.payoutPreviewLabel}>Projected Settlement Return</Text>
              <Text style={styles.payoutPreviewValue}>
                ₦
                {Math.round(
                  (parseFloat(stakeAmount) || 0) * (selectedOption?.odds || 1.85)
                ).toLocaleString()}
              </Text>
            </View>

            {/* Confirm Trade Button */}
            <TouchableOpacity
              style={styles.confirmTradeBtn}
              activeOpacity={0.85}
              onPress={handleExecuteTrade}
              disabled={isSubmittingBet}
            >
              <LinearGradient
                colors={['#00D285', '#00A86B']}
                style={styles.confirmTradeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSubmittingBet ? (
                  <ActivityIndicator size="small" color="#090D16" />
                ) : (
                  <>
                    <Text style={styles.confirmTradeBtnText}>Confirm & Place Trade</Text>
                    <ArrowRight size={18} color="#090D16" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLeagueText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  cardCategoryBadge: {
    color: '#00D285',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
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
    fontSize: 11,
    fontWeight: '600',
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    fontSize: 13.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  vsBadgeSmall: {
    paddingHorizontal: 8,
  },
  vsBadgeSmallText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
  },
  marketTitleText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 12,
  },
  binaryChoiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  binaryOptionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  binaryOptionLabelNo: {
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  binaryOptionOdds: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '600',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
  },
  cardPoolLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardPoolValue: {
    color: '#00D285',
    fontSize: 14.5,
    fontWeight: '800',
    marginTop: 2,
  },
  tradeActionButton: {
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    borderColor: '#00D285',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tradeActionButtonText: {
    color: '#00D285',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  quickTradePill: {
    backgroundColor: '#00D285',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quickTradePillText: {
    color: '#090D16',
    fontSize: 11.5,
    fontWeight: '800',
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
