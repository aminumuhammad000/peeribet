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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import {
  matchService,
  predictionMarketService,
  authService,
  showToast,
} from '../../services/apiService';
import { getSocket } from '../../services/socketService';

export const CATEGORIES = [
  { id: 'European Football', label: 'European Football', icon: '⚽', isSports: true },
  { id: 'UFC & Boxing', label: 'UFC & Boxing', icon: '🥊', isSports: true },
  { id: 'NBA Basketball', label: 'NBA Basketball', icon: '🏀', isSports: true },
  { id: 'Entertainment', label: 'Entertainment', icon: '🎬', isSports: false },
  { id: 'Politics', label: 'Politics', icon: '🏛️', isSports: false },
  { id: 'Real Life Events', label: 'Real Life Events', icon: '🌍', isSports: false },
  { id: 'Pop Culture', label: 'Pop Culture', icon: '🔥', isSports: false },
];

const SUBCATEGORIES: Record<string, string[]> = {
  Entertainment: ['All', 'Spotify & Music', 'Movies & Box Office', 'Awards & Grammys'],
  Politics: ['All', 'Policy & Economy', 'Elections', 'Global Affairs'],
  'Real Life Events': ['All', 'Space & Science', 'Tech & AI', 'Climate & Nature'],
  'Pop Culture': ['All', 'Gaming & Tech', 'Social Media', 'Viral Trends'],
};

const STAKE_PRESETS = [500, 1000, 2500, 5000, 10000];

export default function MarketScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('European Football');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Sports & Prediction data
  const [matches, setMatches] = useState<any[]>([]);
  const [predictionMarkets, setPredictionMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Accordion for market rules
  const [expandedRulesId, setExpandedRulesId] = useState<string | null>(null);

  // Quick Stake Trade Modal State
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [activeMarket, setActiveMarket] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState('1000');
  const [isSubmittingBet, setIsSubmittingBet] = useState(false);

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

  // Fetch Sports Matches
  const fetchMatches = async (sportCategory: string) => {
    try {
      let normalized = 'Football';
      if (sportCategory === 'European Football') normalized = 'Football';
      else if (sportCategory === 'UFC & Boxing') normalized = 'UFC & Boxing';
      else if (sportCategory === 'NBA Basketball') normalized = 'NBA Basketball';

      const data = await matchService.getMatches({ sport: normalized, limit: 50 });
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  // Fetch Prediction Markets
  const fetchPredictionMarkets = async (category: string, subcategory?: string, search?: string) => {
    try {
      const params: any = { category, status: 'ACTIVE' };
      if (subcategory && subcategory !== 'All') params.subcategory = subcategory;
      if (search && search.trim()) params.search = search.trim();

      const data = await predictionMarketService.getMarkets(params);
      setPredictionMarkets(data.markets || []);
    } catch (error) {
      console.error('Error fetching prediction markets:', error);
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

  // Open Quick Stake Modal for a Prediction Option
  const handleOpenTrade = (market: any, option: any) => {
    setActiveMarket(market);
    setSelectedOption(option);
    setStakeAmount('1000');
    setTradeModalVisible(true);
  };

  // Submit Prediction Bet
  const handleConfirmPrediction = async () => {
    if (!activeMarket || !selectedOption) return;
    const numericStake = parseFloat(stakeAmount);
    if (isNaN(numericStake) || numericStake < 100) {
      showToast('Minimum stake is ₦100', 'warning');
      return;
    }

    const currentBal = user?.balance || 0;
    if (currentBal < numericStake) {
      showToast(`Insufficient balance (₦${currentBal.toLocaleString()}). Please fund wallet.`, 'error');
      return;
    }

    setIsSubmittingBet(true);
    try {
      const res = await predictionMarketService.placeBet(activeMarket._id, {
        selection: selectedOption.label,
        amount: numericStake,
      });

      showToast(`Prediction placed successfully! 🎯`, 'success');
      if (res?.newBalance !== undefined) {
        setUser((prev: any) => ({ ...prev, balance: res.newBalance }));
      } else {
        fetchUser();
      }

      setTradeModalVisible(false);
      // Refresh markets to update pool amounts
      fetchPredictionMarkets(selectedCategory, selectedSubcategory, searchQuery);
    } catch (err: any) {
      console.error('Bet submission failed:', err);
      const msg = err?.response?.data?.message || 'Failed to place trade. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingBet(false);
    }
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

  // Potential payout calculation for modal
  const numericStake = parseFloat(stakeAmount) || 0;
  const currentOdds = selectedOption?.odds || 1.9;
  const potentialPayout = Math.round(numericStake * currentOdds);
  const potentialProfit = Math.max(0, potentialPayout - numericStake);

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
              {isCurrentSports ? 'Live Sports & Odds' : 'Decentralized Backdoor Prediction Markets'}
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
                  ? 'Entertainment & Spotify Bets'
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
                  : 'Competitive peer-to-peer odds with zero house edge.'}
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

                return (
                  <TouchableOpacity
                    key={match._id}
                    disabled={isSuspended}
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
                    activeOpacity={0.85}
                    style={[styles.sportsCard, isSuspended && styles.sportsCardSuspended]}
                  >
                    {/* Top League & Status Row */}
                    <View style={styles.sportsCardHeader}>
                      <View style={styles.sportsLeagueWrap}>
                        {isLive && <Flame size={13} color="#EF4444" style={{ marginRight: 4 }} />}
                        <Text style={styles.sportsLeagueText}>{match.league || selectedCategory}</Text>
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

                    {/* Competitors Row */}
                    <View style={styles.competitorsRow}>
                      <View style={styles.competitorBlock}>
                        <Text style={styles.competitorName} numberOfLines={1}>
                          {match.homeTeam}
                        </Text>
                        <Text style={styles.competitorRole}>
                          {selectedCategory === 'UFC & Boxing' ? 'Fighter 1' : 'Home'}
                        </Text>
                      </View>

                      <View style={styles.matchVsBadge}>
                        {isLive ? (
                          <Text style={styles.scoreText}>
                            {match.scoreHome ?? 0} - {match.scoreAway ?? 0}
                          </Text>
                        ) : (
                          <Text style={styles.vsText}>VS</Text>
                        )}
                      </View>

                      <View style={styles.competitorBlockRight}>
                        <Text style={styles.competitorName} numberOfLines={1}>
                          {match.awayTeam}
                        </Text>
                        <Text style={styles.competitorRole}>
                          {selectedCategory === 'UFC & Boxing' ? 'Fighter 2' : 'Away'}
                        </Text>
                      </View>
                    </View>

                    {/* Odds Grid */}
                    {isSuspended ? (
                      <View style={styles.suspendedBanner}>
                        <Lock size={14} color="#64748B" style={{ marginRight: 6 }} />
                        <Text style={styles.suspendedBannerText}>MARKET SUSPENDED</Text>
                      </View>
                    ) : (
                      <View style={styles.sportsOddsRow}>
                        <View style={styles.sportsOddBox}>
                          <Text style={styles.sportsOddLabel}>
                            {selectedCategory === 'UFC & Boxing' ? '1 (Fighter 1)' : '1 (Home)'}
                          </Text>
                          <Text style={styles.sportsOddVal}>
                            {match.odds?.home ? match.odds.home.toFixed(2) : '1.90'}
                          </Text>
                        </View>
                        {selectedCategory === 'European Football' && (
                          <View style={styles.sportsOddBox}>
                            <Text style={styles.sportsOddLabel}>X (Draw)</Text>
                            <Text style={styles.sportsOddVal}>
                              {match.odds?.draw ? match.odds.draw.toFixed(2) : '3.10'}
                            </Text>
                          </View>
                        )}
                        <View style={styles.sportsOddBox}>
                          <Text style={styles.sportsOddLabel}>
                            {selectedCategory === 'UFC & Boxing' ? '2 (Fighter 2)' : '2 (Away)'}
                          </Text>
                          <Text style={styles.sportsOddVal}>
                            {match.odds?.away ? match.odds.away.toFixed(2) : '2.10'}
                          </Text>
                        </View>
                      </View>
                    )}
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
                const isRulesExpanded = expandedRulesId === market._id;
                const yesOption = market.options?.find(
                  (o: any) => o.id?.toLowerCase() === 'yes' || o.label?.toLowerCase() === 'yes'
                );
                const noOption = market.options?.find(
                  (o: any) => o.id?.toLowerCase() === 'no' || o.label?.toLowerCase() === 'no'
                );

                const totalPool = market.poolAmount || 1000000;
                const yesStaked = yesOption?.totalStaked || totalPool * 0.52;
                const noStaked = noOption?.totalStaked || totalPool * 0.48;
                const sumStakes = yesStaked + noStaked || 1;
                const yesPercent = Math.round((yesStaked / sumStakes) * 100);
                const noPercent = 100 - yesPercent;

                return (
                  <View key={market._id} style={styles.predCard}>
                    {/* Subcategory & Closing Date */}
                    <View style={styles.predCardHeader}>
                      <View style={styles.predSubcategoryBadge}>
                        <Text style={styles.predSubcategoryText}>
                          {market.subcategory || selectedCategory}
                        </Text>
                      </View>
                      <View style={styles.closingBadge}>
                        <Clock size={11} color="#8FA2C7" style={{ marginRight: 4 }} />
                        <Text style={styles.closingBadgeText}>
                          {market.closingDate
                            ? `Closes ${new Date(market.closingDate).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}`
                            : 'Active Trading'}
                        </Text>
                      </View>
                    </View>

                    {/* Question Title */}
                    <Text style={styles.predQuestionTitle}>{market.title}</Text>

                    {/* Resolution Source & Transparency */}
                    <View style={styles.resolutionRow}>
                      <ShieldCheck size={13} color={Colors.dark.primary} style={{ marginRight: 5 }} />
                      <Text style={styles.resolutionText} numberOfLines={1}>
                        Settlement: {market.resolutionSource || 'Official Public Record'}
                      </Text>
                    </View>

                    {/* Accordion: Full Rules */}
                    {market.rules && (
                      <TouchableOpacity
                        onPress={() =>
                          setExpandedRulesId(isRulesExpanded ? null : market._id)
                        }
                        activeOpacity={0.7}
                        style={styles.rulesToggleBtn}
                      >
                        <Text style={styles.rulesToggleText}>
                          {isRulesExpanded ? 'Hide resolution rules' : 'Show resolution rules'}
                        </Text>
                        {isRulesExpanded ? (
                          <ChevronUp size={13} color="#8FA2C7" />
                        ) : (
                          <ChevronDown size={13} color="#8FA2C7" />
                        )}
                      </TouchableOpacity>
                    )}

                    {isRulesExpanded && market.rules && (
                      <View style={styles.rulesDrawer}>
                        <Text style={styles.rulesContentText}>{market.rules}</Text>
                      </View>
                    )}

                    {/* Trading Interface */}
                    {market.marketType === 'YES_NO' ? (
                      <View style={styles.yesNoContainer}>
                        {/* Probability Sentiment Bar */}
                        <View style={styles.sentimentBarContainer}>
                          <View style={styles.sentimentLabels}>
                            <Text style={styles.sentimentYesLabel}>YES {yesPercent}%</Text>
                            <Text style={styles.sentimentNoLabel}>NO {noPercent}%</Text>
                          </View>
                          <View style={styles.sentimentTrack}>
                            <View
                              style={[
                                styles.sentimentYesFill,
                                { width: `${Math.max(10, Math.min(90, yesPercent))}%` },
                              ]}
                            />
                            <View
                              style={[
                                styles.sentimentNoFill,
                                { width: `${Math.max(10, Math.min(90, noPercent))}%` },
                              ]}
                            />
                          </View>
                        </View>

                        {/* Large YES & NO Trade Buttons */}
                        <View style={styles.binaryBtnsRow}>
                          <TouchableOpacity
                            onPress={() => handleOpenTrade(market, yesOption || { label: 'Yes', odds: 1.9 })}
                            activeOpacity={0.8}
                            style={styles.btnYes}
                          >
                            <Text style={styles.btnYesLabel}>TRADE YES</Text>
                            <Text style={styles.btnOddsText}>
                              {yesOption?.odds ? `${yesOption.odds.toFixed(2)}x` : '1.85x'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleOpenTrade(market, noOption || { label: 'No', odds: 1.9 })}
                            activeOpacity={0.8}
                            style={styles.btnNo}
                          >
                            <Text style={styles.btnNoLabel}>TRADE NO</Text>
                            <Text style={styles.btnOddsText}>
                              {noOption?.odds ? `${noOption.odds.toFixed(2)}x` : '1.95x'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      /* Multiple Choice Options List */
                      <View style={styles.mcContainer}>
                        <Text style={styles.mcHeaderLabel}>Select an Outcome:</Text>
                        <View style={styles.mcList}>
                          {(market.options || []).map((opt: any) => (
                            <TouchableOpacity
                              key={opt.id || opt.label}
                              onPress={() => handleOpenTrade(market, opt)}
                              activeOpacity={0.8}
                              style={styles.mcItem}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={styles.mcItemLabel}>{opt.label}</Text>
                                {opt.totalStaked ? (
                                  <Text style={styles.mcItemVolume}>
                                    ₦{(opt.totalStaked).toLocaleString()} Staked
                                  </Text>
                                ) : null}
                              </View>
                              <View style={styles.mcItemOddsBadge}>
                                <Text style={styles.mcItemOddsText}>
                                  {opt.odds ? `${opt.odds.toFixed(2)}x` : '2.50x'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Footer Stats Row */}
                    <View style={styles.predCardFooter}>
                      <View style={styles.footerStatItem}>
                        <TrendingUp size={12} color="#00D285" style={{ marginRight: 4 }} />
                        <Text style={styles.footerStatText}>
                          {market.volume || `₦${(market.poolAmount || 850000).toLocaleString()}`} Volume
                        </Text>
                      </View>
                      <View style={styles.footerTradePrompt}>
                        <Sparkles size={11} color={Colors.dark.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.footerTradePromptText}>Verified Contract</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )
          )}
        </ScrollView>

        {/* ==================== QUICK STAKE TRADE MODAL ==================== */}
        <Modal
          visible={tradeModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setTradeModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderSubtitle}>CONFIRM PREDICTION</Text>
                  <Text style={styles.modalHeaderTitle} numberOfLines={2}>
                    {activeMarket?.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setTradeModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Selected Position Pill */}
              <View style={styles.modalSelectionBanner}>
                <View style={styles.modalSelectionLeft}>
                  <Text style={styles.modalSelectionLabel}>Your Prediction:</Text>
                  <Text style={styles.modalSelectionVal}>
                    {selectedOption?.label}
                  </Text>
                </View>
                <View style={styles.modalOddsBadge}>
                  <Text style={styles.modalOddsText}>
                    {currentOdds.toFixed(2)}x Odds
                  </Text>
                </View>
              </View>

              {/* Available Balance */}
              <View style={styles.modalBalanceRow}>
                <Text style={styles.modalBalanceLabel}>Available Wallet Balance:</Text>
                <Text style={styles.modalBalanceVal}>
                  ₦{(user?.balance || 0).toLocaleString()}
                </Text>
              </View>

              {/* Stake Amount Input */}
              <View style={styles.stakeInputContainer}>
                <Text style={styles.currencyPrefix}>₦</Text>
                <TextInput
                  style={styles.stakeInput}
                  keyboardType="numeric"
                  value={stakeAmount}
                  onChangeText={(val) => setStakeAmount(val.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  placeholderTextColor="#64748B"
                />
              </View>

              {/* Quick Stake Preset Buttons */}
              <View style={styles.presetButtonsRow}>
                {STAKE_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => setStakeAmount(preset.toString())}
                    style={[
                      styles.presetBtn,
                      stakeAmount === preset.toString() && styles.presetBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetBtnText,
                        stakeAmount === preset.toString() && styles.presetBtnTextActive,
                      ]}
                    >
                      ₦{preset >= 1000 ? `${preset / 1000}k` : preset}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setStakeAmount((user?.balance || 5000).toString())}
                  style={styles.presetBtn}
                >
                  <Text style={styles.presetBtnText}>MAX</Text>
                </TouchableOpacity>
              </View>

              {/* Live Calculations: Return & Profit */}
              <View style={styles.calculationsBox}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Total Potential Return</Text>
                  <Text style={styles.calcValueHighlight}>
                    ₦{potentialPayout.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Estimated Net Profit</Text>
                  <Text style={styles.calcProfitVal}>
                    +₦{potentialProfit.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Confirm CTA Button */}
              <TouchableOpacity
                disabled={isSubmittingBet || numericStake < 100}
                onPress={handleConfirmPrediction}
                activeOpacity={0.85}
                style={[
                  styles.confirmTradeBtn,
                  (isSubmittingBet || numericStake < 100) && styles.confirmTradeBtnDisabled,
                ]}
              >
                {isSubmittingBet ? (
                  <ActivityIndicator color="#0A1124" />
                ) : (
                  <Text style={styles.confirmTradeBtnText}>
                    Place Prediction • ₦{numericStake.toLocaleString()}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
});

