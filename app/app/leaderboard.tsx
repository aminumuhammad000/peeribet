import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
  Percent,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/apiService';
import { Colors } from '../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LeaderboardUser {
  _id: string;
  rank: number;
  firstName: string;
  lastName: string;
  username: string;
  profileImage?: string;
  balance: number;
  seasonProfit: number;
  winRate: string;
  tradesCount: number;
  tier: string;
  prize: number;
  isCurrentUser?: boolean;
}

interface LeaderboardData {
  seasonName: string;
  totalPrizePool: number;
  endsInDays: number;
  endsInHours: number;
  leaderboard: LeaderboardUser[];
  currentUser?: LeaderboardUser;
}

type TimeframeType = 'SEASON' | 'WEEK' | 'ALL_TIME';

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeType>('SEASON');

  const cleanTier = (tierStr: string) => {
    if (!tierStr) return 'Trader';
    // Remove trailing emoji if desired, or keep as a clean short tag
    return tierStr.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  };

  const formatCompactCurrency = (num: number) => {
    if (!num) return '₦0';
    if (num >= 1000000) {
      const formatted = (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1);
      return `₦${formatted}M`;
    }
    if (num >= 1000) {
      const formatted = (num / 1000).toFixed(num % 1000 === 0 ? 0 : 0);
      return `₦${formatted}K`;
    }
    return `₦${num.toLocaleString()}`;
  };

  const fetchLeaderboard = useCallback(async (selectedTimeframe?: TimeframeType) => {
    try {
      const tf = (selectedTimeframe || timeframe).toLowerCase();
      const res = await authService.getLeaderboard(tf);

      if (res && res.leaderboard) {
        setData(res);
      } else if (Array.isArray(res)) {
        const TIERS = ['Diamond Whale', 'Grandmaster', 'Master Trader', 'Alpha Scalper'];
        const mapped: LeaderboardUser[] = res.map((u: any, idx: number) => ({
          _id: u._id || `user_${idx}`,
          rank: idx + 1,
          firstName: u.firstName || 'Trader',
          lastName: u.lastName || '',
          username: u.username || `trader_${idx + 1}`,
          profileImage: u.profileImage,
          balance: u.balance || 0,
          seasonProfit: u.seasonProfit || 0,
          winRate: u.winRate || '0%',
          tradesCount: u.tradesCount || 0,
          tier: u.tier || (idx === 0 ? 'Grand Champion' : idx === 1 ? 'Diamond Elite' : idx === 2 ? 'Master Trader' : TIERS[idx % TIERS.length]),
          prize: u.prize || (idx === 0 ? 1000000 : idx === 1 ? 500000 : idx === 2 ? 250000 : idx < 10 ? 50000 : 10000),
          isCurrentUser: Boolean(u.isCurrentUser),
        }));

        setData({
          seasonName: 'Season Tournament',
          totalPrizePool: 2500000,
          endsInDays: 4,
          endsInHours: 12,
          leaderboard: mapped,
          currentUser: mapped.find((u) => u.isCurrentUser) || undefined,
        });
      } else {
        setData({
          seasonName: 'Season Tournament',
          totalPrizePool: 2500000,
          endsInDays: 4,
          endsInHours: 12,
          leaderboard: [],
          currentUser: undefined,
        });
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setData({
        seasonName: 'Season Tournament',
        totalPrizePool: 2500000,
        endsInDays: 4,
        endsInHours: 12,
        leaderboard: [],
        currentUser: undefined,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleTimeframeChange = (tf: TimeframeType) => {
    setTimeframe(tf);
    setLoading(true);
    fetchLeaderboard(tf);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getInitials = (firstName: string, lastName?: string) => {
    const f = (firstName || 'T').charAt(0);
    const l = (lastName || '').charAt(0);
    return `${f}${l}`.toUpperCase();
  };

  const users = data?.leaderboard || [];
  const top1 = users[0];
  const top2 = users[1];
  const top3 = users[2];
  const restUsers = users.slice(3);

  // Render Podium (Ranks 1, 2, 3)
  const renderPodium = () => {
    if (users.length === 0) return null;

    return (
      <View style={styles.podiumSection}>
        {/* Modern Minimalist Hero Prize Card */}
        <LinearGradient
          colors={['#111C33', '#0C1427']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroTournamentBadge}>
              <Trophy size={13} color={Colors.dark.primary} />
              <Text style={styles.heroTournamentText}>
                {data?.seasonName ? data.seasonName.toUpperCase() : 'SEASON 4 CHAMPIONSHIP'}
              </Text>
            </View>
            <View style={styles.heroCountdownBadge}>
              <Clock size={11} color={Colors.dark.textMuted} />
              <Text style={styles.heroCountdownText}>
                {data?.endsInDays || 4}d {data?.endsInHours || 12}h left
              </Text>
            </View>
          </View>

          <View style={styles.heroCenterBlock}>
            <Text style={styles.heroPrizeLabel}>TOTAL TOURNAMENT PRIZE POOL</Text>
            <Text style={styles.heroPrizeAmount}>
              ₦{(data?.totalPrizePool || 2500000).toLocaleString()}
            </Text>
          </View>

          {/* Equal 3-Column Prize Tier Bar */}
          <View style={styles.prizeStrip}>
            <View style={[styles.prizeStripCol, styles.prizeStripColGold]}>
              <View style={styles.prizeStripHeader}>
                <View style={[styles.prizeDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.prizeStripRank}>1st Place</Text>
              </View>
              <Text style={styles.prizeStripAmountGold}>₦1,000,000</Text>
            </View>

            <View style={styles.prizeStripDivider} />

            <View style={[styles.prizeStripCol, styles.prizeStripColSilver]}>
              <View style={styles.prizeStripHeader}>
                <View style={[styles.prizeDot, { backgroundColor: '#CBD5E1' }]} />
                <Text style={styles.prizeStripRank}>2nd Place</Text>
              </View>
              <Text style={styles.prizeStripAmountSilver}>₦500,000</Text>
            </View>

            <View style={styles.prizeStripDivider} />

            <View style={[styles.prizeStripCol, styles.prizeStripColBronze]}>
              <View style={styles.prizeStripHeader}>
                <View style={[styles.prizeDot, { backgroundColor: '#F97316' }]} />
                <Text style={styles.prizeStripRank}>3rd Place</Text>
              </View>
              <Text style={styles.prizeStripAmountBronze}>₦250,000</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Minimalist Segmented Timeframe Switcher */}
        <View style={styles.segmentContainer}>
          {[
            { id: 'SEASON', label: 'Season 4' },
            { id: 'WEEK', label: 'This Week' },
            { id: 'ALL_TIME', label: 'All-Time' },
          ].map((tab) => {
            const isActive = timeframe === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                onPress={() => handleTimeframeChange(tab.id as TimeframeType)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentBtnText, isActive && styles.segmentBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3-Column Modern Minimalist Podium */}
        <View style={styles.podiumGrid}>
          {/* #2 Silver (Left) */}
          {top2 && (
            <View style={[styles.podiumCard, styles.podiumCardSilver]}>
              <View style={styles.podiumAvatarWrap}>
                <View style={[styles.avatarRing, { borderColor: '#94A3B8' }]}>
                  {top2.profileImage ? (
                    <Image source={{ uri: top2.profileImage }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>
                        {getInitials(top2.firstName, top2.lastName)}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[styles.rankPill, { backgroundColor: '#64748B' }]}>
                  <Text style={styles.rankPillText}>2</Text>
                </View>
              </View>

              <Text style={styles.podiumUsername} numberOfLines={1}>
                @{top2.username}
              </Text>
              <Text style={styles.podiumProfit}>
                +₦{top2.seasonProfit.toLocaleString()}
              </Text>

              <View style={styles.podiumRewardPill}>
                <Text style={styles.podiumRewardText}>₦500k Drop</Text>
              </View>

              <View style={styles.podiumMetaBox}>
                <Text style={styles.podiumMetaValue}>{top2.winRate}</Text>
                <Text style={styles.podiumMetaLabel}>{top2.tradesCount} trades</Text>
              </View>
            </View>
          )}

          {/* #1 Gold Champion (Center, Elevated) */}
          {top1 && (
            <View style={[styles.podiumCard, styles.podiumCardGold]}>
              <View style={styles.crownRow}>
                <Trophy size={18} color="#F59E0B" />
              </View>

              <View style={styles.podiumAvatarWrap}>
                <View style={[styles.avatarRing, styles.avatarRingGold]}>
                  {top1.profileImage ? (
                    <Image source={{ uri: top1.profileImage }} style={styles.avatarImg} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: '#1E2D4A' }]}>
                      <Text style={[styles.avatarFallbackText, { color: '#F59E0B' }]}>
                        {getInitials(top1.firstName, top1.lastName)}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[styles.rankPill, { backgroundColor: '#F59E0B' }]}>
                  <Text style={[styles.rankPillText, { color: '#0A1124' }]}>1</Text>
                </View>
              </View>

              <Text style={[styles.podiumUsername, styles.podiumUsernameGold]} numberOfLines={1}>
                @{top1.username}
              </Text>
              <Text style={[styles.podiumProfit, styles.podiumProfitGold]}>
                +₦{top1.seasonProfit.toLocaleString()}
              </Text>

              <View style={styles.podiumRewardPillGold}>
                <Text style={styles.podiumRewardTextGold}>₦1,000,000</Text>
              </View>

              <View style={[styles.podiumMetaBox, styles.podiumMetaBoxGold]}>
                <Text style={[styles.podiumMetaValue, { color: '#FFFFFF' }]}>{top1.winRate}</Text>
                <Text style={styles.podiumMetaLabel}>{top1.tradesCount} trades</Text>
              </View>
            </View>
          )}

          {/* #3 Bronze (Right) */}
          {top3 && (
            <View style={[styles.podiumCard, styles.podiumCardBronze]}>
              <View style={styles.podiumAvatarWrap}>
                <View style={[styles.avatarRing, { borderColor: '#D97706' }]}>
                  {top3.profileImage ? (
                    <Image source={{ uri: top3.profileImage }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>
                        {getInitials(top3.firstName, top3.lastName)}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[styles.rankPill, { backgroundColor: '#D97706' }]}>
                  <Text style={styles.rankPillText}>3</Text>
                </View>
              </View>

              <Text style={styles.podiumUsername} numberOfLines={1}>
                @{top3.username}
              </Text>
              <Text style={styles.podiumProfit}>
                +₦{top3.seasonProfit.toLocaleString()}
              </Text>

              <View style={styles.podiumRewardPill}>
                <Text style={styles.podiumRewardText}>₦250k Drop</Text>
              </View>

              <View style={styles.podiumMetaBox}>
                <Text style={styles.podiumMetaValue}>{top3.winRate}</Text>
                <Text style={styles.podiumMetaLabel}>{top3.tradesCount} trades</Text>
              </View>
            </View>
          )}
        </View>

        {/* Unified Table Header - Matches Item Row Widths 100% */}
        <View style={styles.tableHeaderRow}>
          <View style={styles.colTrader}>
            <Text style={styles.tableHeaderLabel}>TRADER</Text>
          </View>
          <View style={styles.colWinRate}>
            <Text style={[styles.tableHeaderLabel, { textAlign: 'center' }]}>WIN RATE</Text>
          </View>
          <View style={styles.colProfit}>
            <Text style={[styles.tableHeaderLabel, { textAlign: 'right' }]}>PROFIT</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render individual trader row
  const renderItem = ({ item }: { item: LeaderboardUser }) => {
    const isTop10 = item.rank <= 10;
    const cleanTierName = cleanTier(item.tier);

    return (
      <View style={[styles.traderRow, item.isCurrentUser && styles.currentUserRow]}>
        {/* Column 1: Trader (Rank + Avatar + Name & Subtitle) */}
        <View style={styles.colTrader}>
          <View style={styles.traderLead}>
            <View style={[styles.rankBox, isTop10 && styles.rankBoxTop10]}>
              <Text style={[styles.rankBoxNum, isTop10 && styles.rankBoxNumTop10]}>
                {item.rank}
              </Text>
            </View>

            <View style={styles.avatarWrap}>
              {item.profileImage ? (
                <Image source={{ uri: item.profileImage }} style={styles.traderAvatar} />
              ) : (
                <View style={styles.traderAvatarFallback}>
                  <Text style={styles.traderAvatarInitials}>
                    {getInitials(item.firstName, item.lastName)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.nameDetails}>
              <View style={styles.nameLine}>
                <Text style={styles.traderDisplayName} numberOfLines={1}>
                  {item.firstName} {item.lastName ? item.lastName.charAt(0) + '.' : ''}
                </Text>
                {item.isCurrentUser && (
                  <View style={styles.youPill}>
                    <Text style={styles.youPillText}>YOU</Text>
                  </View>
                )}
              </View>
              <Text style={styles.traderMetaSub} numberOfLines={1}>
                {cleanTierName} • {item.tradesCount} trades
              </Text>
            </View>
          </View>
        </View>

        {/* Column 2: Win Rate (Fixed Width 70px) */}
        <View style={styles.colWinRate}>
          <View style={styles.winRateBadge}>
            <Text style={styles.winRateValue}>{item.winRate}</Text>
          </View>
        </View>

        {/* Column 3: Profit (Fixed Width 105px) */}
        <View style={styles.colProfit}>
          <Text style={styles.profitNum} numberOfLines={1}>
            +₦{item.seasonProfit.toLocaleString()}
          </Text>
          <Text style={styles.prizeSub} numberOfLines={1}>
            {isTop10 ? `+${formatCompactCurrency(item.prize || 50000)} prize` : `Top ${Math.min(99, item.rank * 3)}%`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0A1124', '#050811']} style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <Text style={styles.headerSubtitle}>TOURNAMENT RANKINGS</Text>
          </View>

          <View style={styles.liveBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Loading tournament standings...</Text>
          </View>
        ) : (
          <FlatList
            data={restUsers}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderPodium}
            ListEmptyComponent={
              users.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Trophy size={36} color="#64748B" style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyTitle}>No Rankings Yet</Text>
                  <Text style={styles.emptySubtitle}>Be the first to trade and claim the #1 spot on the leaderboard!</Text>
                </View>
              ) : null
            }
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom + 90, 110) },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.dark.primary}
              />
            }
          />
        )}

        {/* Sticky Floating User Standing Footer */}
        {data?.currentUser && (
          <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.stickyCard}>
              <View style={styles.stickyRankBadge}>
                <Text style={styles.stickyRankNum}>#{data.currentUser.rank}</Text>
              </View>

              <View style={styles.stickyUserInfo}>
                <Text style={styles.stickyUserTitle}>Your Standing</Text>
                <Text style={styles.stickyUserProfit} numberOfLines={1}>
                  +₦{data.currentUser.seasonProfit.toLocaleString()} • {data.currentUser.winRate} win rate
                </Text>
              </View>

              <TouchableOpacity
                style={styles.tradeButton}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/market')}
              >
                <LinearGradient
                  colors={['#00D285', '#00A86B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tradeButtonGradient}
                >
                  <Text style={styles.tradeButtonText}>Trade & Climb</Text>
                  <ArrowRight size={13} color="#050811" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
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

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 133, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.25)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.primary,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.dark.primary,
    letterSpacing: 0.5,
  },

  /* Loading */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    marginTop: 12,
  },

  /* List Container */
  listContent: {
    paddingBottom: 110,
  },
  podiumSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  /* Hero Prize Card */
  heroCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroTournamentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.2)',
  },
  heroTournamentText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.dark.primary,
    letterSpacing: 0.4,
  },
  heroCountdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  heroCountdownText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.dark.textMuted,
  },
  heroCenterBlock: {
    alignItems: 'center',
    marginVertical: 4,
  },
  heroPrizeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroPrizeAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  /* 3-Part Prize Strip */
  prizeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  prizeStripCol: {
    flex: 1,
    alignItems: 'center',
  },
  prizeStripColGold: {},
  prizeStripColSilver: {},
  prizeStripColBronze: {},
  prizeStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  prizeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  prizeStripRank: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.dark.textMuted,
  },
  prizeStripAmountGold: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
  },
  prizeStripAmountSilver: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  prizeStripAmountBronze: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F97316',
  },
  prizeStripDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  /* Segmented Timeframe Switcher */
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#0C1427',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#17233D',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.35)',
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.textMuted,
  },
  segmentBtnTextActive: {
    color: Colors.dark.primary,
    fontWeight: '700',
  },

  /* 3-Column Modern Minimalist Podium */
  podiumGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  podiumCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  podiumCardSilver: {
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  podiumCardGold: {
    backgroundColor: '#131F38',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingVertical: 14,
    elevation: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  podiumCardBronze: {
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  crownRow: {
    marginBottom: 4,
  },
  podiumAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#94A3B8',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingGold: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: '#F59E0B',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#182235',
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  rankPill: {
    position: 'absolute',
    bottom: -4,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  rankPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  podiumUsername: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    textAlign: 'center',
    maxWidth: '100%',
  },
  podiumUsernameGold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  podiumProfit: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dark.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  podiumProfitGold: {
    fontSize: 12,
  },
  podiumRewardPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  podiumRewardText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.dark.textMuted,
  },
  podiumRewardPillGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  podiumRewardTextGold: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
  },
  podiumMetaBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  podiumMetaBoxGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  podiumMetaValue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  podiumMetaLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: Colors.dark.placeholder,
    marginTop: 1,
  },

  /* Unified Table Columns (Exact match between Header and Rows) */
  colTrader: {
    flex: 1,
    justifyContent: 'center',
  },
  colWinRate: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colProfit: {
    width: 104,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  /* Table Header */
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    borderRadius: 8,
    marginBottom: 4,
  },
  tableHeaderLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.dark.placeholder,
    letterSpacing: 0.6,
  },

  /* Trader Row */
  traderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  currentUserRow: {
    backgroundColor: 'rgba(0, 210, 133, 0.06)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.primary,
  },
  traderLead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rankBoxTop10: {
    backgroundColor: 'rgba(0, 210, 133, 0.1)',
  },
  rankBoxNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.placeholder,
  },
  rankBoxNumTop10: {
    color: Colors.dark.primary,
    fontWeight: '800',
  },
  avatarWrap: {
    marginRight: 9,
  },
  traderAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  traderAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#152136',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  traderAvatarInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  nameDetails: {
    flex: 1,
    paddingRight: 6,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  traderDisplayName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  youPill: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youPillText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#050811',
  },
  traderMetaSub: {
    fontSize: 9.5,
    color: Colors.dark.textMuted,
    marginTop: 1,
  },

  /* Win Rate */
  winRateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  winRateValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },

  /* Profit */
  profitNum: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Colors.dark.primary,
  },
  prizeSub: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.dark.placeholder,
    marginTop: 1,
  },

  /* Floating Bottom Bar */
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(10, 17, 36, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 210, 133, 0.22)',
  },
  stickyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1A30',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stickyRankBadge: {
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.3)',
  },
  stickyRankNum: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.dark.primary,
  },
  stickyUserInfo: {
    flex: 1,
    marginRight: 8,
  },
  stickyUserTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stickyUserProfit: {
    fontSize: 9.5,
    fontWeight: '600',
    color: Colors.dark.textMuted,
    marginTop: 1,
  },
  tradeButton: {
    borderRadius: 9,
    overflow: 'hidden',
  },
  tradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  tradeButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#050811',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
