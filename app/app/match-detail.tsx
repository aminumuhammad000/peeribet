import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { matchService } from '../services/apiService';

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const homeTeam = params.homeTeam || 'Home';
  const awayTeam = params.awayTeam || 'Away';
  const matchId = params.id as string;

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) return;
      try {
        const data = await matchService.getMatchById(matchId);
        setMatch(data);
      } catch (err: any) {
        console.error('Error fetching match detail:', err);
        setError(err.response?.data?.message || 'Something went wrong while fetching details. Try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  const handleSelectOutcome = (marketName: string, outcomeName: string, oddsVal: number) => {
    router.push({
      pathname: '/enter-amount',
      params: {
        matchId: matchId,
        matchTitle: `${homeTeam} vs ${awayTeam}`,
        marketName,
        outcome: outcomeName,
        odds: oddsVal,
        startTime: match?.startTime ? new Date(match.startTime).toLocaleTimeString() : 'Upcoming'
      }
    });
  };

  if (loading) {
    return (
      <View style={[styles.background, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.background, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: '#EF4444', textAlign: 'center', marginBottom: 20 }}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: '#1E293B', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#FFFFFF' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0A1124', '#050811']}
      style={styles.background}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{homeTeam} vs {awayTeam}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Subheader Status */}
          <View style={styles.statusRow}>
            <CheckCircle size={14} color="#00D285" />
            <Text style={styles.statusText}>Start in 3hrs</Text>
          </View>

          {/* Card 1: Match Outcome */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Match Outcome</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  activeOpacity={0.85} 
                  style={styles.buttonWrapper}
                  onPress={() => handleSelectOutcome('Match Outcome', `${homeTeam} (Long)`, match?.odds?.home || 1.0)}
                >
                  <LinearGradient colors={['#00D285', '#009B62']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>{homeTeam}</Text>
                    <Text style={styles.buttonSub}>{match?.odds?.home ? match.odds.home.toFixed(2) : '(Long)'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.85} 
                  style={styles.buttonWrapper}
                  onPress={() => handleSelectOutcome('Match Outcome', `${awayTeam} (Short)`, match?.odds?.away || 1.0)}
                >
                  <LinearGradient colors={['#31426B', '#1C2742']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>{awayTeam}</Text>
                    <Text style={styles.buttonSub}>{match?.odds?.away ? match.odds.away.toFixed(2) : '(Short)'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Card 2: Over/Under 2.5 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Over/Under 2.5</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  activeOpacity={0.85} 
                  style={styles.buttonWrapper}
                  onPress={() => handleSelectOutcome('Over 2.5 Goals', 'Over 2.5 (Long)', match?.odds?.over25 || 1.0)}
                >
                  <LinearGradient colors={['#00D285', '#009B62']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>Over</Text>
                    <Text style={styles.buttonSub}>{match?.odds?.over25 ? match.odds.over25.toFixed(2) : '(Long)'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.85} 
                  style={styles.buttonWrapper}
                  onPress={() => handleSelectOutcome('Over 2.5 Goals', 'Under 2.5 (Short)', match?.odds?.under25 || 1.0)}
                >
                  <LinearGradient colors={['#31426B', '#1C2742']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>Under 2.5</Text>
                    <Text style={styles.buttonSub}>{match?.odds?.under25 ? match.odds.under25.toFixed(2) : '(Short)'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>Pool . <Text style={styles.footerHighlight}>₦{(match?.poolAmount || 0).toLocaleString()}</Text></Text>
            </View>
          </View>

          {/* Card 3: BTTS */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>BTTS (Both Teams to Score)</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  activeOpacity={0.85} 
                  style={styles.buttonWrapper}
                  onPress={() => handleSelectOutcome('Both Teams to Score', 'BTTS Yes (Long)', match?.odds?.bttsYes || 1.0)}
                >
                  <LinearGradient colors={['#00D285', '#009B62']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>Yes</Text>
                    <Text style={styles.buttonSub}>{match?.odds?.bttsYes ? match.odds.bttsYes.toFixed(2) : '(Long)'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.85} 
                  style={styles.buttonWrapper}
                  onPress={() => handleSelectOutcome('Both Teams to Score', 'BTTS No (Short)', match?.odds?.bttsNo || 1.0)}
                >
                  <LinearGradient colors={['#31426B', '#1C2742']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>No</Text>
                    <Text style={styles.buttonSub}>{match?.odds?.bttsNo ? match.odds.bttsNo.toFixed(2) : '(Short)'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#151E32',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  statusText: {
    marginLeft: 6,
    color: '#00D285',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#111827', // very dark gray/blue
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 24,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  cardBody: {
    padding: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonWrapper: {
    flex: 1,
    height: 72,
    marginHorizontal: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  buttonSub: {
    fontSize: 11,
    color: '#E2E8F0',
    fontFamily: 'Inter',
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
  footerHighlight: {
    color: '#00D285',
    fontWeight: 'bold',
  },
  footerTextLocked: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
  },
});
