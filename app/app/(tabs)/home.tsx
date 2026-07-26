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
  const [selectedDateNum, setSelectedDateNum] = useState<number | null>(null);

  // Generate 7 days starting from today
  const generateDates = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayNum = date.getDate();
      const dayName = date.toLocaleDateString([], { weekday: 'short' });
      days.push({
        id: dayNum.toString(),
        day: dayName,
        num: dayNum.toString(),
        fullDate: new Date(date.getFullYear(), date.getMonth(), dayNum),
      });
    }
    return days;
  };

  const dates = generateDates();

  // Set initial selected date to today
  useEffect(() => {
    if (selectedDateNum === null) {
      setSelectedDateNum(new Date().getDate());
    }
  }, []);

  const fetchData = async () => {
    try {
      const [userData, allMatchesData, notifData] = await Promise.all([
        authService.getMe(),
        matchService.getMatches({ limit: 50 }),
        notificationService.getAll().catch(() => ({ unreadCount: 0 })),
      ]);
      setUser(userData);
      setAllMatches(allMatchesData?.matches || []);
      setUnreadNotifications(notifData.unreadCount || 0);
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
        return homeTeam.includes(searchLower) || awayTeam.includes(searchLower);
      });
    }

    // Filter by date - show matches from selected date onwards, within a week
    if (selectedDateNum !== null && filtered.length > 0) {
      // Find the minimum date number (could wrap around month)
      const minDate = selectedDateNum;
      const maxDate = selectedDateNum + 6; // Show up to 6 days ahead

      return filtered.filter((match) => {
        const matchDate = new Date(match.startTime);
        const matchDateNum = matchDate.getDate();
        // Show matches from selected date onwards
        return matchDateNum >= minDate && matchDateNum <= maxDate;
      });
    }

    return filtered;
  };

  const promotedMatches = filterMatches(allMatches).filter((m) => m.isPromoted && (m.status === 'LIVE' || m.status === 'UPCOMING'));
  const upcomingMatches = filterMatches(allMatches).filter((m) => m.status === 'UPCOMING' && !m.isPromoted);

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

          <View style={styles.calendarRow}>
            {dates.map((item) => {
              const isSelected = selectedDateNum === parseInt(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedDateNum(parseInt(item.id))}
                  activeOpacity={0.8}
                  style={[styles.calendarBox, isSelected && styles.calendarBoxActive]}
                >
                  <Text style={[styles.calendarDay, isSelected && styles.calendarTextActive]}>{item.day}</Text>
                  <Text style={[styles.calendarNum, isSelected && styles.calendarTextActive]}>{item.num}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.featuredSection}>
            {promotedMatches.length > 0 ? promotedMatches.slice(0, 1).map((match) => (
              <TouchableOpacity
                key={match._id}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/match-detail', params: { id: match._id, homeTeam: match.homeTeam, awayTeam: match.awayTeam } })}
              >
                <LinearGradient
                  colors={[Colors.dark.cardBackground, '#08111F']}
                  style={styles.featuredCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.featuredTopRow}>
                    <View style={styles.liveTag}>
                      <Text style={styles.liveTagText}>{match.status === 'LIVE' ? 'LIVE NOW' : `START ${formatMatchTime(match.startTime)}`}</Text>
                    </View>
                    <Text style={styles.venueText}>{(match.leagueName || match.competition || 'PREMIUM MATCH').toUpperCase()}</Text>
                  </View>

                  <View style={styles.featuredTeamsRow}>
                    <View style={styles.featuredTeamColumn}>
                      <View style={styles.teamBadge}>
                        <Text style={styles.teamBadgeText}>{(match.homeTeam || 'H').slice(0, 2).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.featuredTeamName}>{match.homeTeam}</Text>
                      <Text style={styles.featuredTeamLabel}>HOME</Text>
                    </View>

                    <View style={styles.featuredCenterBadge}>
                      <Text style={styles.centerBadgeText}>VS</Text>
                      <Text style={styles.centerBadgeLabel}>ODDS</Text>
                    </View>

                    <View style={styles.featuredTeamColumn}>
                      <View style={styles.teamBadge}>
                        <Text style={styles.teamBadgeText}>{(match.awayTeam || 'A').slice(0, 2).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.featuredTeamName}>{match.awayTeam}</Text>
                      <Text style={styles.featuredTeamLabel}>AWAY</Text>
                    </View>
                  </View>

                  <View style={styles.oddsRow}>
                    <View style={styles.oddsPill}><Text style={styles.oddsLabel}>HOME</Text><Text style={styles.oddsValue}>{formatOddsValue(match.odds?.home)}</Text></View>
                    <View style={styles.oddsPill}><Text style={styles.oddsLabel}>DRAW</Text><Text style={styles.oddsValue}>{formatOddsValue(match.odds?.draw)}</Text></View>
                    <View style={styles.oddsPill}><Text style={styles.oddsLabel}>AWAY</Text><Text style={styles.oddsValue}>{formatOddsValue(match.odds?.away)}</Text></View>
                  </View>

                  <View style={styles.featuredFooter}>
                    <View>
                      <Text style={styles.footerLabel}>POOL</Text>
                      <Text style={styles.footerValue}>₦{(match.poolAmount || 0).toLocaleString()}</Text>
                    </View>
                    <LinearGradient colors={[Colors.dark.primary, Colors.dark.electricBlue]} style={styles.enterButton}>
                      <Text style={styles.enterButtonText}>ENTER</Text>
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No featured match yet</Text>
                <Text style={styles.emptyStateText}>Live football cards will appear here when the feed is ready.</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Matches</Text>
            <Text style={styles.sectionChip}>Today</Text>
          </View>

          <View style={styles.upcomingList}>
            {upcomingMatches.map((match) => (
              <TouchableOpacity 
                key={match._id} 
                style={styles.upcomingRow}
                onPress={() => router.push({
                  pathname: '/match-detail',
                  params: { id: match._id, homeTeam: match.homeTeam, awayTeam: match.awayTeam },
                })}
              >
                <View style={styles.dateCol}>
                  <Text style={styles.upcomingTime}>{formatMatchTime(match.startTime)}</Text>
                  <Text style={styles.upcomingDay}>{new Date(match.startTime).toLocaleDateString([], { weekday: 'short' })}</Text>
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
            ))}
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
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  calendarBox: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(19, 28, 50, 0.8)',
  },
  calendarBoxActive: {
    backgroundColor: Colors.dark.electricBlue,
    borderColor: Colors.dark.primary,
  },
  calendarDay: {
    fontSize: 11,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  calendarNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  calendarTextActive: {
    color: '#FFFFFF',
  },
  featuredSection: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  featuredCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.32)',
    shadowColor: '#000',
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
    backgroundColor: 'rgba(19, 28, 50, 0.96)',
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveTag: {
    backgroundColor: 'rgba(0, 210, 133, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.25)',
  },
  liveTagText: {
    color: '#00D285',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
  },
  venueText: {
    color: '#8FA2C7',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  featuredTeamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredTeamColumn: {
    flex: 1,
    alignItems: 'center',
  },
  teamBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  teamBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  featuredTeamName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 3,
  },
  featuredTeamLabel: {
    fontSize: 11,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  featuredCenterBadge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.36)',
    backgroundColor: 'rgba(0, 210, 133, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  centerBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  centerBadgeLabel: {
    fontSize: 9,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  oddsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  oddsPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    marginHorizontal: 3,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  oddsLabel: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  oddsValue: {
    fontSize: 14,
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
    fontSize: 11,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  footerValue: {
    color: '#00D285',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  enterButton: {
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  enterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(19, 28, 50, 0.92)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  dateCol: {
    width: 48,
  },
  upcomingTime: {
    fontSize: 11,
    color: '#00D285',
    fontFamily: 'Inter',
    marginBottom: 2,
    fontWeight: '700',
  },
  upcomingDay: {
    fontSize: 11,
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  teamsCompact: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  teamTextLeft: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  teamTextRight: {
    fontSize: 13,
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
    width: 32,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  oddsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Inter',
  },
  marketText: {
    width: 56,
    textAlign: 'right',
    fontSize: 12,
    color: '#00D285',
    fontWeight: '700',
    fontFamily: 'Inter',
  },
});
