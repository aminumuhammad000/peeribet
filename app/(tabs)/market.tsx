import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Landmark, Lock, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

export default function MarketScreen() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('Football');

  const sportsList = ['Football', 'Basketball', 'Tennis', 'Cricket', 'Esports'];

  const marketMatches = [
    {
      id: '1',
      homeTeam: 'Chelsea',
      awayTeam: 'Arsenal',
      time: "LIVE 65'",
      score: '2 - 1',
      league: 'English Premier League',
      oddsHome: '1.45',
      oddsDraw: '3.10',
      oddsAway: '4.80',
      isLive: true,
      suspended: false,
    },
    {
      id: '2',
      homeTeam: 'Man City',
      awayTeam: 'Liverpool',
      time: 'Today, 20:00',
      score: '0 - 0',
      league: 'English Premier League',
      oddsHome: '1.95',
      oddsDraw: '2.50',
      oddsAway: '2.10',
      isLive: false,
      suspended: false,
    },
    {
      id: '3',
      homeTeam: 'Lazio',
      awayTeam: 'Roma',
      time: "LIVE 88'",
      score: '1 - 0',
      league: 'Serie A',
      oddsHome: '--',
      oddsDraw: '--',
      oddsAway: '--',
      isLive: true,
      suspended: true,
    },
    {
      id: '4',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      time: 'Tomorrow, 21:00',
      score: '0 - 0',
      league: 'La Liga',
      oddsHome: '2.20',
      oddsDraw: '3.40',
      oddsAway: '2.80',
      isLive: false,
      suspended: false,
    },
  ];

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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {marketMatches.map((match) => (
            <TouchableOpacity
              key={match.id}
              disabled={match.suspended}
              onPress={() => router.push({
                pathname: '/match-detail',
                params: { homeTeam: match.homeTeam, awayTeam: match.awayTeam },
              })}
              activeOpacity={0.8}
              style={[styles.marketCard, match.suspended && styles.marketCardSuspended]}
            >
              {/* Card Meta header */}
              <View style={styles.cardHeader}>
                <View style={styles.leagueContainer}>
                  {match.isLive && <Flame size={14} color="#EF4444" style={{ marginRight: 4 }} />}
                  <Text style={styles.leagueText}>{match.league}</Text>
                </View>
                <Text style={[styles.timeText, match.isLive && styles.liveTimeText]}>{match.time}</Text>
              </View>

              {/* Match Teams/Scores */}
              <View style={styles.matchTeamsRow}>
                <Text style={styles.teamsText}>{match.homeTeam} vs {match.awayTeam}</Text>
                <Text style={styles.scoreText}>{match.score}</Text>
              </View>

              {/* Odds grid matching high fidelity mockups */}
              {match.suspended ? (
                <View style={styles.suspendedContainer}>
                  <Lock size={15} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.suspendedText}>MARKET SUSPENDED</Text>
                </View>
              ) : (
                <View style={styles.oddsGrid}>
                  <View style={styles.oddsBox}>
                    <Text style={styles.oddsBoxLabel}>1 (Home)</Text>
                    <Text style={styles.oddsBoxValue}>{match.oddsHome}</Text>
                  </View>
                  <View style={styles.oddsBox}>
                    <Text style={styles.oddsBoxLabel}>X (Draw)</Text>
                    <Text style={styles.oddsBoxValue}>{match.oddsDraw}</Text>
                  </View>
                  <View style={styles.oddsBox}>
                    <Text style={styles.oddsBoxLabel}>2 (Away)</Text>
                    <Text style={styles.oddsBoxValue}>{match.oddsAway}</Text>
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
