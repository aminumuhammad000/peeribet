import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Settings, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { authService, matchService, notificationService } from '../../services/apiService';
import { getSocket } from '../../services/socketService';

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [selectedDateId, setSelectedDateId] = useState<string>('');

  // Generate 7 days starting from today
  const generateDates = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayNum = date.getDate();
      const dayName = i === 0 ? 'Today' : date.toLocaleDateString([], { weekday: 'short' });
      days.push({
        id: `${date.getFullYear()}-${date.getMonth()}-${dayNum}`,
        day: dayName,
        num: dayNum.toString(),
        fullDate: date,
      });
    }
    return days;
  };

  const dates = generateDates();
  const [loadingDate, setLoadingDate] = useState(false);

  // Set initial selected date to today
  useEffect(() => {
    if (!selectedDateId && dates.length > 0) {
      setSelectedDateId(dates[0].id);
    }
  }, []);

  const handleSelectDate = async (item: typeof dates[0]) => {
    setSelectedDateId(item.id);
    const dateString = item.fullDate.toISOString().split('T')[0];
    setLoadingDate(true);
    try {
      const data = await matchService.getMatches({ date: dateString, limit: 100 });
      if (data?.matches && data.matches.length > 0) {
        setAllMatches((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const fresh = data.matches.filter((m: any) => !existingIds.has(m._id));
          return [...prev, ...fresh];
        });
      }
    } catch (e) {
      console.warn('Failed to fetch matches for date:', dateString, e);
    } finally {
      setLoadingDate(false);
    }
  };

  const fetchData = async () => {
    try {
      const [userData, allMatchesData, notifData] = await Promise.all([
        authService.getMe().catch(() => null),
        matchService.getMatches({ limit: 100 }).catch(() => ({ matches: [] })),
        notificationService.getAll().catch(() => ({ unreadCount: 0 })),
      ]);
      setUser(userData);
      setAllMatches(allMatchesData?.matches || []);
      setUnreadNotifications(notifData?.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching data for home:', error);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = getSocket();
    socket.on('matches_updated', () => {
      console.log('Matches updated via WebSocket, fetching fresh data...');
      fetchData();
    });

    return () => {
      socket.off('matches_updated');
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatOddsValue = (value: number | undefined | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '—';
    return value.toFixed(1);
  };

  const formatMatchTime = (value: string | Date) => {
    const date = new Date(value);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Filter matches by date and search
  const filterMatches = (matches: any[]) => {
    let filtered = matches;

    // Filter by search text first
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((match) => {
        const homeTeam = match.homeTeam?.toLowerCase() || '';
        const awayTeam = match.awayTeam?.toLowerCase() || '';
        const league = (match.leagueName || match.league || '').toLowerCase();
        return homeTeam.includes(searchLower) || awayTeam.includes(searchLower) || league.includes(searchLower);
      });
    }

    // Filter strictly by selected date
    if (selectedDateId) {
      const selectedItem = dates.find((d) => d.id === selectedDateId);
      if (selectedItem) {
        const targetYear = selectedItem.fullDate.getFullYear();
        const targetMonth = selectedItem.fullDate.getMonth();
        const targetDay = selectedItem.fullDate.getDate();

        const onDateMatches = filtered.filter((match) => {
          const matchDate = new Date(match.startTime);
          return (
            matchDate.getFullYear() === targetYear &&
            matchDate.getMonth() === targetMonth &&
            matchDate.getDate() === targetDay
          );
        });

        // Strictly return matches on the selected date (e.g. Monday)
        return onDateMatches;
      }
    }

    return filtered;
  };

  const filtered = filterMatches(allMatches);

  // Best match to feature:
  // 1. Promoted match (LIVE or UPCOMING) from filtered
  // 2. LIVE match from filtered
  // 3. UPCOMING match from filtered
  // 4. Any match from filtered
  // 5. Fallback: Promoted, LIVE, UPCOMING, or any match from allMatches
  const featuredMatch: any =
    filtered.find((m) => m.isPromoted && (m.status === 'LIVE' || m.status === 'UPCOMING')) ||
    filtered.find((m) => m.status === 'LIVE') ||
    filtered.find((m) => m.status === 'UPCOMING') ||
    filtered[0] ||
    allMatches.find((m) => m.isPromoted && (m.status === 'LIVE' || m.status === 'UPCOMING')) ||
    allMatches.find((m) => m.status === 'LIVE') ||
    allMatches.find((m) => m.status === 'UPCOMING') ||
    allMatches[0] ||
    null;

  // Upcoming matches list: all other matches from filtered (excluding the featured match)
  const upcomingMatches = filtered.filter((m) => m._id !== featuredMatch?._id);

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} 
            onPress={() => router.push('/profile')} 
            activeOpacity={0.8}
          >
            <Image 
              source={{ uri: user?.profileImage || `https://ui-avatars.com/api/?name=${user?.firstName || 'User'}&background=fff&color=000&size=128&rounded=true` }} 
              style={styles.avatar} 
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerGreeting}>Hey {user?.firstName || 'User'}</Text>
              <Text style={styles.headerSub}>Ready to trade?</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')} activeOpacity={0.7}>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.secondary} />
          }
        >
          <View style={styles.searchContainer}>
            <Search size={18} color={Colors.dark.placeholder} />
            <TextInput
              placeholder="Search match"
              placeholderTextColor={Colors.dark.placeholder}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <View style={styles.calendarWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calendarScrollContent}
            >
              {dates.map((item) => {
                const isSelected = selectedDateId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleSelectDate(item)}
                    activeOpacity={0.8}
                    style={[styles.calendarBox, isSelected && styles.calendarBoxActive]}
                  >
                    <Text style={[styles.calendarDay, isSelected && styles.calendarTextActive]}>{item.day}</Text>
                    <Text style={[styles.calendarNum, isSelected && styles.calendarTextActive]}>{item.num}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.featuredSection}>
            {featuredMatch ? (
              <TouchableOpacity
                key={featuredMatch._id}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/match-detail', params: { id: featuredMatch._id, homeTeam: featuredMatch.homeTeam, awayTeam: featuredMatch.awayTeam } })}
              >
                <LinearGradient
                  colors={[Colors.dark.cardBackground, '#08111F']}
                  style={styles.featuredCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.featuredTopRow}>
                    <View style={[styles.liveTag, featuredMatch.status === 'LIVE' && { backgroundColor: '#EF4444' }]}>
                      <Text style={styles.liveTagText}>{featuredMatch.status === 'LIVE' ? '● LIVE NOW' : `START ${formatMatchTime(featuredMatch.startTime)}`}</Text>
                    </View>
                    <Text style={styles.venueText}>{(featuredMatch.leagueName || featuredMatch.league || featuredMatch.competition || 'PREMIUM MATCH').toUpperCase()}</Text>
                  </View>

                  <View style={styles.featuredTeamsRow}>
                    <View style={styles.featuredTeamColumn}>
                      <View style={styles.teamBadge}>
                        <Text style={styles.teamBadgeText}>{(featuredMatch.homeTeam || 'H').slice(0, 2).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.featuredTeamName} numberOfLines={1}>{featuredMatch.homeTeam}</Text>
                      <Text style={styles.featuredTeamLabel}>HOME</Text>
                    </View>

                    <View style={styles.featuredCenterBadge}>
                      <Text style={styles.centerBadgeText}>VS</Text>
                      <Text style={styles.centerBadgeLabel}>ODDS</Text>
                    </View>

                    <View style={styles.featuredTeamColumn}>
                      <View style={styles.teamBadge}>
                        <Text style={styles.teamBadgeText}>{(featuredMatch.awayTeam || 'A').slice(0, 2).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.featuredTeamName} numberOfLines={1}>{featuredMatch.awayTeam}</Text>
                      <Text style={styles.featuredTeamLabel}>AWAY</Text>
                    </View>
                  </View>

                  <View style={styles.oddsRow}>
                    <View style={styles.oddsPill}><Text style={styles.oddsLabel}>HOME</Text><Text style={styles.oddsValue}>{formatOddsValue(featuredMatch.odds?.home)}</Text></View>
                    <View style={styles.oddsPill}><Text style={styles.oddsLabel}>DRAW</Text><Text style={styles.oddsValue}>{formatOddsValue(featuredMatch.odds?.draw)}</Text></View>
                    <View style={styles.oddsPill}><Text style={styles.oddsLabel}>AWAY</Text><Text style={styles.oddsValue}>{formatOddsValue(featuredMatch.odds?.away)}</Text></View>
                  </View>

                  <View style={styles.featuredFooter}>
                    <View>
                      <Text style={styles.footerLabel}>POOL</Text>
                      <Text style={styles.footerValue}>₦{(featuredMatch.poolAmount || 0).toLocaleString()}</Text>
                    </View>
                    <LinearGradient colors={[Colors.dark.primary, Colors.dark.electricBlue]} style={styles.enterButton}>
                      <Text style={styles.enterButtonText}>ENTER</Text>
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No featured match</Text>
                <Text style={styles.emptyStateText}>
                  {loadingDate ? 'Fetching match details...' : 'Live football cards will appear here when the feed is ready.'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Matches</Text>
            <Text style={styles.sectionChip}>{upcomingMatches.length > 0 ? `${upcomingMatches.length} Matches` : (dates.find(d => d.id === selectedDateId)?.day || 'Today')}</Text>
          </View>

          <View style={styles.upcomingList}>
            {upcomingMatches.length > 0 ? (
              upcomingMatches.map((match) => (
                <TouchableOpacity 
                  key={match._id} 
                  style={styles.upcomingRow}
                  onPress={() => router.push({
                    pathname: '/match-detail',
                    params: { id: match._id, homeTeam: match.homeTeam, awayTeam: match.awayTeam },
                  })}
                >
                  <View style={styles.dateCol}>
                    <Text style={[styles.upcomingTime, match.status === 'LIVE' && { color: '#EF4444', fontWeight: 'bold' }]}>
                      {match.status === 'LIVE' ? 'LIVE' : formatMatchTime(match.startTime)}
                    </Text>
                    <Text style={styles.upcomingDay}>
                      {match.status === 'LIVE' ? 'NOW' : new Date(match.startTime).toLocaleDateString([], { weekday: 'short' })}
                    </Text>
                  </View>

                  <View style={styles.teamsCompact}>
                    <Text style={styles.teamTextLeft} numberOfLines={1}>{match.homeTeam}</Text>
                    <Text style={styles.teamTextRight} numberOfLines={1}>{match.awayTeam}</Text>
                  </View>

                  <View style={styles.oddsContainer}>
                    <View style={styles.oddsBox}><Text style={styles.oddsText}>{formatOddsValue(match.odds?.home)}</Text></View>
                    <View style={styles.oddsBox}><Text style={styles.oddsText}>{formatOddsValue(match.odds?.draw)}</Text></View>
                    <View style={styles.oddsBox}><Text style={styles.oddsText}>{formatOddsValue(match.odds?.away)}</Text></View>
                  </View>

                  <Text style={styles.marketText}>₦{(match.poolAmount || 0).toLocaleString()}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>
                  No matches for {dates.find(d => d.id === selectedDateId)?.day || 'this date'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {loadingDate ? 'Fetching fixtures...' : 'There are no scheduled fixtures recorded for this day.'}
                </Text>
                {selectedDateId !== dates[0]?.id && (
                  <TouchableOpacity
                    onPress={() => dates[0] && handleSelectDate(dates[0])}
                    style={styles.resetDateBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.resetDateBtnText}>View Today's Matches</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

        </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerSub: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  iconButton: {
    marginLeft: 16,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
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
    fontFamily: 'Inter',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 28, 50, 0.95)',
    marginHorizontal: 20,
    height: 50,
    borderRadius: 999,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  calendarWrapper: {
    marginBottom: 18,
  },
  calendarScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarBox: {
    width: 54,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(19, 28, 50, 0.85)',
  },
  calendarBoxActive: {
    backgroundColor: '#00D285',
    borderColor: '#00D285',
    shadowColor: '#00D285',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarDay: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  calendarNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  calendarTextActive: {
    color: '#050811',
  },
  featuredSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  featuredCard: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.28)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    backgroundColor: 'rgba(19, 28, 50, 0.96)',
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveTag: {
    backgroundColor: 'rgba(0, 210, 133, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.25)',
  },
  liveTagText: {
    color: '#00D285',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
  },
  venueText: {
    color: '#8FA2C7',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  featuredTeamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredTeamColumn: {
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
    borderColor: 'rgba(255,255,255,0.14)',
  },
  teamBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  featuredTeamName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 2,
  },
  featuredTeamLabel: {
    fontSize: 9,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  featuredCenterBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.36)',
    backgroundColor: 'rgba(0, 210, 133, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  centerBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  centerBadgeLabel: {
    fontSize: 8,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  oddsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  oddsPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 4,
    marginHorizontal: 3,
    alignItems: 'center',
    minHeight: 42,
    justifyContent: 'center',
  },
  oddsLabel: {
    fontSize: 9,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  oddsValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontSize: 9,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  footerValue: {
    color: '#00D285',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  enterButton: {
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  enterButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
  },
  emptyState: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(19, 28, 50, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  emptyStateText: {
    color: '#8FA2C7',
    fontSize: 12,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  sectionChip: {
    backgroundColor: 'rgba(0, 210, 133, 0.14)',
    color: '#00D285',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
  },
  upcomingList: {
    paddingHorizontal: 20,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 7,
    backgroundColor: 'rgba(19, 28, 50, 0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  dateCol: {
    width: 44,
  },
  upcomingTime: {
    fontSize: 10,
    color: '#00D285',
    fontFamily: 'Inter',
    marginBottom: 2,
    fontWeight: '700',
  },
  upcomingDay: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  teamsCompact: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  teamTextLeft: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  teamTextRight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  oddsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  oddsBox: {
    width: 30,
    height: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  oddsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Inter',
  },
  marketText: {
    width: 52,
    textAlign: 'right',
    fontSize: 11,
    color: '#00D285',
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  resetDateBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.35)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  resetDateBtnText: {
    color: '#00D285',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
});
