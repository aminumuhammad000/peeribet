import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Settings, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { authService, matchService, notificationService } from '../../services/apiService';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('24');
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [promotedMatches, setPromotedMatches] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchData = async () => {
    try {
      const [userData, promoted, upcoming, notifData] = await Promise.all([
        authService.getMe(),
        matchService.getMatches({ isPromoted: true }),
        matchService.getMatches({ status: 'UPCOMING' }),
        notificationService.getAll().catch(() => ({ unreadCount: 0 })),
      ]);
      setUser(userData);
      setPromotedMatches(promoted);
      setUpcomingMatches(upcoming);
      setUnreadNotifications(notifData.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching data for home:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const dates = [
    { id: '21', day: 'Sun', num: '21' },
    { id: '22', day: 'Mon', num: '22' },
    { id: '23', day: 'Tue', num: '23' },
    { id: '24', day: 'Wed', num: '24' },
    { id: '25', day: 'Thu', num: '25' },
    { id: '26', day: 'Fri', num: '26' },
    { id: '27', day: 'Sat', num: '27' },
  ];

  return (
    <LinearGradient
      colors={['#0A1124', '#050811']}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Image source={{ uri: `https://ui-avatars.com/api/?name=${user?.firstName || 'User'}&background=fff&color=000&size=128&rounded=true` }} style={styles.avatar} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerGreeting}>Hey {user?.firstName || 'User'}</Text>
            <Text style={styles.headerSub}>Ready to trade?</Text>
          </View>
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
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/security')}>
            <Settings size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
        >
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={18} color="#64748B" />
            <TextInput 
              placeholder="Browse matches...." 
              placeholderTextColor="#64748B" 
              style={styles.searchInput}
            />
          </View>

          {/* Calendar row - fits all 7 days without scroll */}
          <View style={styles.calendarRow}>
            {dates.map((item) => {
              const isSelected = selectedDate === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedDate(item.id)}
                  activeOpacity={0.8}
                  style={[styles.calendarBox, isSelected && styles.calendarBoxActive]}
                >
                  <Text style={[styles.calendarDay, isSelected && styles.calendarTextActive]}>{item.day}</Text>
                  <Text style={[styles.calendarNum, isSelected && styles.calendarTextActive]}>{item.num}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Promoted Matches */}
          <View style={styles.promotedContainer}>
            {promotedMatches.map((match) => (
              <View key={match._id} style={styles.promotedCard}>
                <View style={styles.promotedTop}>
                  <View style={styles.liveTag}>
                    <Text style={styles.liveTagText}>{match.status === 'LIVE' ? 'LIVE NOW' : `LIVE @ ${new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</Text>
                  </View>
                  <Text style={styles.dots}>•••</Text>
                </View>
                
                <View style={styles.promotedTitleRow}>
                  <View>
                    <Text style={styles.promotedMatchTitle}>{match.homeTeam} vs {match.awayTeam}</Text>
                    <Text style={styles.promotedSub}>Market Match Outcome</Text>
                  </View>
                  <Text style={styles.promotedPrice}>{match.odds.home.toFixed(2)}x</Text>
                </View>

                <View style={styles.bulletsRow}>
                  <View style={styles.bulletItem}><View style={styles.bulletDot}/><Text style={styles.bulletText}>Match Outcome</Text></View>
                  <View style={styles.bulletItem}><View style={styles.bulletDot}/><Text style={styles.bulletText}>Over/Under</Text></View>
                  <View style={styles.bulletItem}><View style={styles.bulletDot}/><Text style={styles.bulletText}>BTS</Text></View>
                </View>

                <TouchableOpacity 
                  onPress={() => router.push({
                    pathname: '/match-detail',
                    params: { id: match._id, homeTeam: match.homeTeam, awayTeam: match.awayTeam },
                  })}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#00D285', '#00A368']}
                    style={styles.enterButton}
                  >
                    <Text style={styles.enterButtonText}>Enter Match</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.poolText}>Pool . <Text style={styles.poolAmount}>₦{(match.poolAmount || 0).toLocaleString()}</Text></Text>
              </View>
            ))}
          </View>

          {/* Upcoming Matches Header */}
          <View style={styles.upcomingHeaderRow}>
            <Text style={styles.upcomingTitle}>Up Coming <Text style={styles.upcomingTitleLight}>Matches</Text></Text>
            <View style={styles.allFootballBtn}>
              <Text style={styles.allFootballText}>All Football</Text>
            </View>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { width: 40 }]}>Date</Text>
            <Text style={[styles.thText, { flex: 1, paddingLeft: 10 }]}>Stats</Text>
            <Text style={[styles.thText, { width: 90, textAlign: 'center' }]}>Draw</Text>
            <Text style={[styles.thText, { flex: 1 }]}></Text>
            <Text style={[styles.thText, { width: 40, textAlign: 'right' }]}>Market</Text>
          </View>

          {/* Upcoming List */}
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
                  <Text style={styles.upcomingTime}>{new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
                  <Text style={styles.upcomingDay}>{new Date(match.startTime).toLocaleDateString([], { weekday: 'short' })}</Text>
                </View>

                <View style={styles.teamColLeft}>
                  <Text style={styles.teamTextLeft} numberOfLines={1}>{match.homeTeam}</Text>
                </View>
                
                <Image source={{ uri: match.homeLogo || `https://ui-avatars.com/api/?name=${match.homeTeam}&background=random` }} style={styles.rowLogo} />

                <View style={styles.oddsContainer}>
                  <View style={styles.oddsBox}><Text style={styles.oddsText}>{match.odds.home.toFixed(1)}</Text></View>
                  <View style={styles.oddsBox}><Text style={styles.oddsText}>{match.odds.draw.toFixed(1)}</Text></View>
                  <View style={styles.oddsBox}><Text style={styles.oddsText}>{match.odds.away.toFixed(1)}</Text></View>
                </View>

                <Image source={{ uri: match.awayLogo || `https://ui-avatars.com/api/?name=${match.awayTeam}&background=random` }} style={styles.rowLogo} />
                
                <View style={styles.teamColRight}>
                  <Text style={styles.teamTextRight} numberOfLines={1}>{match.awayTeam}</Text>
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
    paddingBottom: 16,
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
    backgroundColor: '#131C32', // slightly lighter than bg
    marginHorizontal: 20,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 20,
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
    marginBottom: 24,
  },
  calendarBox: {
    flex: 1,
    height: 54,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  calendarBoxActive: {
    backgroundColor: '#3B82F6',
  },
  calendarDay: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  calendarNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
  calendarTextActive: {
    color: '#FFFFFF',
  },
  promotedContainer: {
    paddingHorizontal: 20,
  },
  promotedCard: {
    backgroundColor: '#1E294B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2E3F6B',
  },
  promotedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveTag: {
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveTagText: {
    color: '#00D285',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  dots: {
    color: '#00D285',
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  promotedTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  promotedMatchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  promotedSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
  promotedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  bulletsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D285',
    marginRight: 6,
  },
  bulletText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontFamily: 'Inter',
  },
  enterButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  enterButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  poolText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  poolAmount: {
    color: '#00D285',
    fontWeight: 'bold',
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  upcomingTitleLight: {
    color: '#94A3B8',
    fontWeight: 'normal',
  },
  allFootballBtn: {
    backgroundColor: '#302b28', // Dark yellowish-brown for the button as seen in image
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  allFootballText: {
    fontSize: 12,
    color: '#BDB3A6',
    fontFamily: 'Inter',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2A3441', // Dark grey banner
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  thText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  upcomingList: {
    paddingHorizontal: 20,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#131C32',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  dateCol: {
    width: 40,
  },
  upcomingTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  upcomingDay: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
  teamColLeft: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  teamTextLeft: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'right',
  },
  rowLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  oddsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  oddsBox: {
    width: 28,
    height: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  oddsText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Inter',
  },
  teamColRight: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  teamTextRight: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  marketText: {
    width: 40,
    textAlign: 'right',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
});
