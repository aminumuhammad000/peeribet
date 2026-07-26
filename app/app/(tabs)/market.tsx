import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Landmark, Lock, Flame, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { matchService } from '../../services/apiService';
import { getSocket } from '../../services/socketService';

export default function MarketScreen() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('Football');
  const [matches, setMatches] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const normalizeSport = (value?: string) => {
    const sport = (value || 'Football').toLowerCase();
    if (['football', 'soccer'].includes(sport)) return 'Football';
    if (['basketball', 'nba'].includes(sport)) return 'Basketball';
    if (['tennis', 'table tennis'].includes(sport)) return 'Tennis';
    if (['cricket', 'crick'].includes(sport)) return 'Cricket';
    if (['esports', 'gaming', 'e-sports'].includes(sport)) return 'Esports';
    return value || 'Football';
  };

  const fetchMatches = async (sport?: string) => {
    try {
      const data = await matchService.getMatches({ sport: normalizeSport(sport || selectedSport), limit: 50 });
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error fetching matches for market:', error);
    }
  };

  useEffect(() => {
    fetchMatches(selectedSport);

    const socket = getSocket();
    socket.on('matches_updated', () => {
      console.log('Matches updated via WebSocket, fetching fresh data...');
      fetchMatches(selectedSport);
    });

    return () => {
      socket.off('matches_updated');
    };
  }, [selectedSport]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMatches(selectedSport);
    setRefreshing(false);
  };

  const sportsList = ['Football', 'Basketball', 'Tennis', 'Cricket', 'Esports'];
  const visibleMatches = matches.filter((match) => {
    const sportValue = normalizeSport(match?.sport || match?.league || 'Football');
    const selectedValue = normalizeSport(selectedSport);
    if (selectedValue === 'Football') {
      return sportValue === 'Football' || !match?.sport;
    }
    return sportValue === selectedValue;
  });

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Live Markets</Text>
            <Text style={styles.headerSubtitle}>Premium football odds</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <Landmark size={18} color={Colors.dark.primary} />
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <View style={styles.heroBadge}>
              <Sparkles size={14} color={Colors.dark.primary} />
            </View>
            <View>
              <Text style={styles.heroTitle}>Today’s top picks</Text>
              <Text style={styles.heroText}>Fresh live and upcoming markets</Text>
            </View>
          </View>
          <View style={styles.heroTag}>
            <Text style={styles.heroTagText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.sportFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sportsList.map((sport) => {
              const isSelected = selectedSport === sport;
              return (
                <TouchableOpacity
                  key={sport}
                  onPress={() => setSelectedSport(sport)}
                  activeOpacity={0.8}
                  style={[styles.sportTag, isSelected && styles.sportTagActive]}
                >
                  <Text style={[styles.sportTagText, isSelected && styles.sportTagTextActive]}>{sport}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
        >
          {visibleMatches.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>No live markets yet</Text>
              <Text style={styles.emptyStateText}>No matches are currently scheduled for {selectedSport.toLowerCase()}. Check back later!</Text>
            </View>
          ) : (
            visibleMatches.map((match) => (
              <TouchableOpacity
                key={match._id}
                disabled={match.status === 'SUSPENDED'}
                onPress={() => router.push({
                  pathname: '/match-detail',
                  params: { id: match._id, homeTeam: match.homeTeam, awayTeam: match.awayTeam },
                })}
                activeOpacity={0.8}
                style={[styles.marketCard, match.status === 'SUSPENDED' && styles.marketCardSuspended]}
              >
              <View style={styles.cardHeader}>
                <View style={styles.leagueContainer}>
                  {match.status === 'LIVE' && <Flame size={14} color="#EF4444" style={{ marginRight: 4 }} />}
                  <Text style={styles.leagueText}>{match.league || 'Football'}</Text>
                </View>
                <Text style={[styles.timeText, match.status === 'LIVE' && styles.liveTimeText]}>
                  {match.status === 'LIVE' ? 'LIVE NOW' : new Date(match.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <View style={styles.matchTeamsRow}>
                <View style={styles.teamBlock}>
                  <Text style={styles.teamsText}>{match.homeTeam}</Text>
                  <Text style={styles.teamsLabel}>Home</Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{match.scoreHome ?? 0} - {match.scoreAway ?? 0}</Text>
                </View>
                <View style={styles.teamBlockRight}>
                  <Text style={styles.teamsText}>{match.awayTeam}</Text>
                  <Text style={styles.teamsLabel}>Away</Text>
                </View>
              </View>

                {match.status === 'SUSPENDED' ? (
                  <View style={styles.suspendedContainer}>
                    <Lock size={15} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.suspendedText}>MARKET SUSPENDED</Text>
                  </View>
                ) : (
                  <View style={styles.oddsGrid}>
                    <View style={styles.oddsBox}>
                      <Text style={styles.oddsBoxLabel}>1</Text>
                      <Text style={styles.oddsBoxValue}>{match.odds?.home?.toFixed(2) || '—'}</Text>
                    </View>
                    <View style={styles.oddsBox}>
                      <Text style={styles.oddsBoxLabel}>X</Text>
                      <Text style={styles.oddsBoxValue}>{match.odds?.draw?.toFixed(2) || '—'}</Text>
                    </View>
                    <View style={styles.oddsBox}>
                      <Text style={styles.oddsBoxLabel}>2</Text>
                      <Text style={styles.oddsBoxValue}>{match.odds?.away?.toFixed(2) || '—'}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 210, 133, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(19, 28, 50, 0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  heroBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 210, 133, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  heroTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  heroText: {
    fontSize: 11,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  heroTag: {
    backgroundColor: 'rgba(0, 210, 133, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00D285',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
  },
  sportFilterContainer: {
    paddingVertical: 10,
    paddingLeft: 24,
  },
  sportTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 28, 50, 0.8)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sportTagActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  sportTagText: {
    color: '#8FA2C7',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  sportTagTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  marketCard: {
    backgroundColor: 'rgba(19, 28, 50, 0.94)',
    borderRadius: 20,
    padding: 14,
    marginVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  marketCardSuspended: {
    opacity: 0.6,
    backgroundColor: 'rgba(10, 17, 36, 0.9)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  leagueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leagueText: {
    fontSize: 10,
    color: Colors.dark.primary,
    fontWeight: '700',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 11,
    color: '#8FA2C7',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  liveTimeText: {
    color: '#EF4444',
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teamBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
  teamBlockRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  teamsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  teamsLabel: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
  },
  scoreBadge: {
    minWidth: 74,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.24)',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark.primary,
    fontFamily: 'Inter',
  },
  suspendedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  suspendedText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
  },
  oddsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  oddsBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  oddsBoxLabel: {
    fontSize: 10,
    color: '#8FA2C7',
    fontWeight: '700',
    fontFamily: 'Inter',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  oddsBoxValue: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  emptyStateCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(19, 28, 50, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 20,
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
});
