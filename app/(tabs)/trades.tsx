import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TradesScreen() {
  const router = useRouter();
  const homeTeam = 'Chelsea';
  const awayTeam = 'Arsenal';

  const handleSelectOutcome = (marketName: string, outcomeName: string, oddsVal: number) => {
    router.push({
      pathname: '/enter-amount',
      params: {
        matchTitle: `${homeTeam} vs ${awayTeam}`,
        marketName,
        outcome: outcomeName,
        odds: oddsVal,
        startTime: 'Start in 3hrs'
      }
    });
  };

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
                  onPress={() => handleSelectOutcome('Match Outcome', `${homeTeam} (Long)`, 1.85)}
                >
                  <LinearGradient colors={['#00D285', '#009B62']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>{homeTeam}</Text>
                    <Text style={styles.buttonSub}>(Long)</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.85} 
                  style={styles.buttonWrapper}
                  onPress={() => handleSelectOutcome('Match Outcome', `${awayTeam} (Short)`, 2.15)}
                >
                  <LinearGradient colors={['#31426B', '#1C2742']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>{awayTeam}</Text>
                    <Text style={styles.buttonSub}>(Short)</Text>
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
                  onPress={() => handleSelectOutcome('Over 2.5 Goals', 'Over 2.5 (Long)', 1.95)}
                >
                  <LinearGradient colors={['#00D285', '#009B62']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>Over</Text>
                    <Text style={styles.buttonSub}>(Long)</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.85} 
                  style={styles.buttonWrapper}
                  onPress={() => handleSelectOutcome('Over 2.5 Goals', 'Under 2.5 (Short)', 1.80)}
                >
                  <LinearGradient colors={['#31426B', '#1C2742']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>Under 2.5</Text>
                    <Text style={styles.buttonSub}>(Short)</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>Pool . <Text style={styles.footerHighlight}>₦85,00</Text></Text>
            </View>
          </View>

          {/* Card 3: BTTS */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>BTTS(Both Teams to Score)</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  activeOpacity={0.85} 
                  style={styles.buttonWrapper}
                  onPress={() => handleSelectOutcome('Both Teams to Score', 'BTTS Yes (Long)', 1.75)}
                >
                  <LinearGradient colors={['#00D285', '#009B62']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>Yes</Text>
                    <Text style={styles.buttonSub}>(Long)</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.9} style={styles.buttonWrapper}>
                  <LinearGradient colors={['#24304D', '#151D33']} style={[styles.buttonInner, { opacity: 0.8 }]}>
                    <View style={styles.lockedRow}>
                      <Lock size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.buttonTitle}>No</Text>
                        <Text style={styles.buttonSub}>(Short)</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.footerTextLocked}>Temporarily Locked (High imbalance)</Text>
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
