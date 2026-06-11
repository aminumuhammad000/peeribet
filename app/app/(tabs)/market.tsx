import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Landmark, Lock, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { matchService } from '../../services/apiService';

export default function MarketScreen() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('Football');
  const [matches, setMatches] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = async () => {
    try {
      const data = await matchService.getMatches();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches for market:', error);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  };

  const sportsList = ['Football', 'Basketball', 'Tennis', 'Cricket', 'Esports'];

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>P2P Trade Market</Text>
          <Landmark size={22} color={Colors.dark.primary} />
        </View>

        {/* Sports horizontal scroll */}
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
          {matches.map((match) => (
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
              {/* Card Meta header */}
              <View style={styles.cardHeader}>
                <View style={styles.leagueContainer}>
                  {match.status === 'LIVE' && <Flame size={14} color="#EF4444" style={{ marginRight: 4 }} />}
                  <Text style={styles.leagueText}>{match.league}</Text>
                </View>
                <Text style={[styles.timeText, match.status === 'LIVE' && styles.liveTimeText]}>
                  {match.status === 'LIVE' ? 'LIVE NOW' : new Date(match.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              {/* Match Teams/Scores */}
              <View style={styles.matchTeamsRow}>
                <Text style={styles.teamsText}>{match.homeTeam} vs {match.awayTeam}</Text>
                <Text style={styles.scoreText}>{match.scoreHome} - {match.scoreAway}</Text>
              </View>

              {/* Odds grid matching high fidelity mockups */}
              {match.status === 'SUSPENDED' ? (
                <View style={styles.suspendedContainer}>
                  <Lock size={15} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.suspendedText}>MARKET SUSPENDED</Text>
                </View>
              ) : (
                <View style={styles.oddsGrid}>
                  <View style={styles.oddsBox}>
                    <Text style={styles.oddsBoxLabel}>1 (Home)</Text>
                    <Text style={styles.oddsBoxValue}>{match.odds.home.toFixed(2)}</Text>
                  </View>
                  <View style={styles.oddsBox}>
                    <Text style={styles.oddsBoxLabel}>X (Draw)</Text>
                    <Text style={styles.oddsBoxValue}>{match.odds.draw.toFixed(2)}</Text>
                  </View>
                  <View style={styles.oddsBox}>
                    <Text style={styles.oddsBoxLabel}>2 (Away)</Text>
                    <Text style={styles.oddsBoxValue}>{match.odds.away.toFixed(2)}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
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
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  sportFilterContainer: {
    paddingVertical: 12,
    paddingLeft: 24,
  },
  sportTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#131C32',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sportTagActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  sportTagText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: 'bold',
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
    backgroundColor: '#131C32',
    borderRadius: 18,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  marketCardSuspended: {
    opacity: 0.6,
    backgroundColor: '#0F172A',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leagueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leagueText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
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
    marginBottom: 16,
  },
  teamsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    flex: 1,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginLeft: 12,
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
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  oddsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  oddsBox: {
    flex: 1,
    backgroundColor: '#0A1124',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  oddsBoxLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'bold',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  oddsBoxValue: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
});
