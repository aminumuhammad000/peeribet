import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Lock, TrendingUp, TrendingDown, PlayCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { betService, matchService } from '../../services/apiService';

export default function TradesScreen() {
  const router = useRouter();
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [betError, setBetError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'ONGOING' | 'LIVE'>('ALL');
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCurrentMatch = async () => {
    try {
      const data = await matchService.getMatches();
      const matches = Array.isArray(data) ? data.filter((item: any) => item?.status === 'LIVE' || item?.status === 'UPCOMING') : [];

      const sortedMatches = [...matches].sort((a: any, b: any) => {
        const aTime = new Date(a?.startTime || 0).getTime();
        const bTime = new Date(b?.startTime || 0).getTime();
        return aTime - bTime;
      });

      const liveMatch = sortedMatches.find((item: any) => item?.status === 'LIVE');
      const fallbackMatch = sortedMatches[0] || null;
      setCurrentMatch(liveMatch || fallbackMatch);
    } catch (error) {
      console.error('Error loading current match for trades:', error);
    }
  };

  const loadMyBets = async () => {
    setLoadingBets(true);
    setBetError('');
    try {
      const data = await betService.getMyBets();
      setMyBets(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setBetError(error.response?.data?.message || 'Failed to load trade history.');
    } finally {
      setLoadingBets(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCurrentMatch();
    loadMyBets();

    const interval = setInterval(() => {
      loadCurrentMatch();
      loadMyBets();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyBets();
  };

  const handleSelectOutcome = (marketName: string, outcomeName: string, oddsVal: number) => {
    if (!currentMatch?._id) {
      setBetError('No market is available right now. Please try again later.');
      return;
    }

    router.push({
      pathname: '/enter-amount',
      params: {
        matchId: currentMatch._id,
        matchTitle: `${currentMatch.homeTeam} vs ${currentMatch.awayTeam}`,
        marketName,
        outcome: outcomeName,
        odds: oddsVal,
        startTime: currentMatch.startTime ? new Date(currentMatch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Upcoming'
      }
    });
  };

  const formatSelection = (selection: string) => {
    switch (selection) {
      case 'HOME':
        return 'Home';
      case 'DRAW':
        return 'Draw';
      case 'AWAY':
        return 'Away';
      case 'OVER_25':
        return 'Over 2.5';
      case 'UNDER_25':
        return 'Under 2.5';
      case 'BTTS_YES':
        return 'BTTS Yes';
      case 'BTTS_NO':
        return 'BTTS No';
      default:
        return selection;
    }
  };

  const getBetStatusMeta = (bet: any) => {
    const matchStatus = bet.match?.status;
    if (bet.status === 'WON') return { label: 'Win', color: '#00D285' };
    if (bet.status === 'LOST') return { label: 'Loss', color: '#F87171' };
    if (matchStatus === 'LIVE') return { label: 'Live', color: '#3B82F6' };
    if (bet.status === 'PENDING') return { label: 'Ongoing', color: '#FBBF24' };
    return { label: bet.status, color: '#94A3B8' };
  };

  const getMatchStatusText = () => {
    if (currentMatch?.status === 'LIVE') return 'Live now';
    if (currentMatch?.status === 'FINISHED') return 'Match finished';
    if (currentMatch?.startTime) {
      return `Starts ${new Date(currentMatch.startTime).toLocaleString()}`;
    }
    return 'Live market available';
  };

  const filteredBets = myBets.filter((bet) => {
    const statusMeta = getBetStatusMeta(bet);
    switch (filter) {
      case 'WIN':
        return bet.status === 'WON';
      case 'LOSS':
        return bet.status === 'LOST';
      case 'ONGOING':
        return bet.status === 'PENDING' && bet.match?.status !== 'LIVE';
      case 'LIVE':
        return bet.match?.status === 'LIVE' || statusMeta.label === 'Live';
      default:
        return true;
    }
  });

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
          <Text style={styles.headerTitle}>{currentMatch?.homeTeam || 'Live Match'} vs {currentMatch?.awayTeam || 'Live Match'}</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
        >
          {/* Subheader Status */}
          <View style={styles.statusRow}>
            <CheckCircle size={14} color="#00D285" />
            <Text style={styles.statusText}>{getMatchStatusText()}</Text>
          </View>

          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>My Trade History</Text>
              {loadingBets ? (
                <ActivityIndicator size="small" color="#00D285" />
              ) : null}
            </View>

            <View style={styles.filterRow}>
              {(['ALL','WIN','LOSS','ONGOING','LIVE'] as const).map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[styles.filterChip, filter === item && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>{item === 'ALL' ? 'All' : item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {betError ? <Text style={styles.errorText}>{betError}</Text> : null}

            {filteredBets.length === 0 && !loadingBets && !betError ? (
              <Text style={styles.emptyText}>No trades for this view yet.</Text>
            ) : null}

            {filteredBets.map((bet) => {
              const statusMeta = getBetStatusMeta(bet);
              return (
                <TouchableOpacity key={bet._id} style={styles.betRow} onPress={() => setSelectedBet(bet)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.betMatch}>{bet.match?.homeTeam} vs {bet.match?.awayTeam}</Text>
                    <Text style={styles.betMeta}>{formatSelection(bet.selection)} • ₦{Number(bet.amount).toLocaleString()}</Text>
                  </View>
                  <View style={styles.betRight}>
                    <Text style={[styles.betStatus, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                    <Text style={styles.betOdds}>Odds {Number(bet.odds).toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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
                  onPress={() => handleSelectOutcome('Match Outcome', `${currentMatch?.homeTeam || 'Home'} (Long)`, Number(currentMatch?.odds?.home || 1.85))}
                >
                  <LinearGradient colors={['#00D285', '#009B62']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>{currentMatch?.homeTeam || 'Home'}</Text>
                    <Text style={styles.buttonSub}>(Long)</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.85} 
                  style={styles.buttonWrapper}
                  onPress={() => handleSelectOutcome('Match Outcome', `${currentMatch?.awayTeam || 'Away'} (Short)`, Number(currentMatch?.odds?.away || 2.15))}
                >
                  <LinearGradient colors={['#31426B', '#1C2742']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>{currentMatch?.awayTeam || 'Away'}</Text>
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
                  onPress={() => handleSelectOutcome('Over 2.5 Goals', 'Over 2.5 (Long)', Number(currentMatch?.odds?.over25 || 1.95))}
                >
                  <LinearGradient colors={['#00D285', '#009B62']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>Over</Text>
                    <Text style={styles.buttonSub}>(Long)</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.85} 
                  style={styles.buttonWrapper}
                  onPress={() => handleSelectOutcome('Over 2.5 Goals', 'Under 2.5 (Short)', Number(currentMatch?.odds?.under25 || 1.80))}
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
                  onPress={() => handleSelectOutcome('Both Teams to Score', 'BTTS Yes (Long)', Number(currentMatch?.odds?.bttsYes || 1.75))}
                >
                  <LinearGradient colors={['#00D285', '#009B62']} style={styles.buttonInner}>
                    <Text style={styles.buttonTitle}>Yes</Text>
                    <Text style={styles.buttonSub}>(Long)</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.9} style={styles.buttonWrapper} onPress={() => handleSelectOutcome('Both Teams to Score', 'BTTS No (Short)', Number(currentMatch?.odds?.bttsNo || 1.70))}>
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
        <Modal
          visible={Boolean(selectedBet)}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedBet(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Trade Details</Text>
                <TouchableOpacity onPress={() => setSelectedBet(null)}>
                  <Text style={styles.modalClose}>Close</Text>
                </TouchableOpacity>
              </View>

              {selectedBet ? (
                <ScrollView style={{ maxHeight: 420 }}>
                  <View style={[styles.resultBanner, selectedBet.status === 'WON' ? styles.resultBannerWin : selectedBet.status === 'LOST' ? styles.resultBannerLoss : styles.resultBannerPending]}>
                    <Text style={styles.resultBannerText}>{getBetStatusMeta(selectedBet).label.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.modalMatch}>{selectedBet.match?.homeTeam} vs {selectedBet.match?.awayTeam}</Text>
                  <Text style={styles.modalMeta}>Market: {selectedBet.match?.league || 'Match Outcome'}</Text>
                  <Text style={styles.modalMeta}>Selection: {formatSelection(selectedBet.selection)}</Text>
                  <Text style={styles.modalMeta}>Stake: ₦{Number(selectedBet.amount).toLocaleString()}</Text>
                  <Text style={styles.modalMeta}>Odds: {Number(selectedBet.odds).toFixed(2)}</Text>
                  <Text style={styles.modalMeta}>Potential payout: ₦{Number(selectedBet.potentialPayout).toLocaleString()}</Text>
                  {selectedBet.status === 'WON' ? (
                    <Text style={styles.modalMeta}>Settled payout: ₦{Number(selectedBet.potentialPayout).toLocaleString()}</Text>
                  ) : null}
                  <Text style={styles.modalMeta}>Status: {getBetStatusMeta(selectedBet).label}</Text>
                  <Text style={styles.modalMeta}>Match status: {selectedBet.match?.status || 'Unknown'}</Text>
                  <Text style={styles.modalMeta}>Placed: {new Date(selectedBet.createdAt).toLocaleString()}</Text>
                </ScrollView>
              ) : null}
            </View>
          </View>
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
  historyCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 16,
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  betRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  betMatch: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  betMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Inter',
  },
  betRight: {
    alignItems: 'flex-end',
  },
  betStatus: {
    color: '#00D285',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  betOdds: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Inter',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    fontFamily: 'Inter',
    paddingVertical: 8,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  filterChipActive: {
    backgroundColor: '#00D285',
    borderColor: '#00D285',
  },
  filterChipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#0A1124',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  modalClose: {
    color: '#00D285',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  modalMatch: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  modalMeta: {
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: 6,
    fontFamily: 'Inter',
  },
  resultBanner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  resultBannerWin: {
    backgroundColor: 'rgba(0, 210, 133, 0.16)',
  },
  resultBannerLoss: {
    backgroundColor: 'rgba(248, 113, 113, 0.16)',
  },
  resultBannerPending: {
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
  },
  resultBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
});
