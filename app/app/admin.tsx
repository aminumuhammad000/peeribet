import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { adminService, authService, showToast } from '../services/apiService';

export default function AdminMarketControlScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'MARKETS'>('MATCHES');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [userData, matchesRes, marketsRes] = await Promise.all([
        authService.getMe().catch(() => null),
        adminService.getAdminMatches().catch(() => ({ matches: [] })),
        adminService.getAdminMarkets().catch(() => ({ markets: [] })),
      ]);

      if (userData) setUser(userData);
      setMatches(matchesRes?.matches || []);
      setMarkets(marketsRes?.markets || []);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      showToast('Failed to load admin market list', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleMatchLock = async (matchId: string, currentLocked: boolean) => {
    setActionLoadingId(matchId);
    try {
      await adminService.toggleMatchLock(matchId, !currentLocked, !currentLocked ? 'Locked by Admin (Overpowered)' : undefined);
      showToast(`Fixture ${!currentLocked ? 'LOCKED' : 'UNLOCKED'} successfully`, 'success');
      setMatches((prev) =>
        prev.map((m) =>
          m._id === matchId
            ? {
                ...m,
                isLocked: !currentLocked,
                isOverpowered: !currentLocked,
                status: !currentLocked ? 'SUSPENDED' : 'ACTIVE',
              }
            : m
        )
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle fixture lock', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleMarketLock = async (marketId: string, currentLocked: boolean) => {
    setActionLoadingId(marketId);
    try {
      await adminService.toggleMarketLock(marketId, !currentLocked, !currentLocked ? 'Locked by Admin (Overpowered)' : undefined);
      showToast(`Market ${!currentLocked ? 'LOCKED' : 'UNLOCKED'} successfully`, 'success');
      setMarkets((prev) =>
        prev.map((m) =>
          m._id === marketId
            ? {
                ...m,
                isLocked: !currentLocked,
                isOverpowered: !currentLocked,
                status: !currentLocked ? 'SUSPENDED' : 'ACTIVE',
              }
            : m
        )
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle market lock', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered lists by search
  const q = searchQuery.trim().toLowerCase();
  const filteredMatches = matches.filter((m) => {
    if (!q) return true;
    return (
      (m.homeTeam || '').toLowerCase().includes(q) ||
      (m.awayTeam || '').toLowerCase().includes(q) ||
      (m.league || '').toLowerCase().includes(q) ||
      (m.sport || '').toLowerCase().includes(q)
    );
  });

  const filteredMarkets = markets.filter((m) => {
    if (!q) return true;
    return (
      (m.title || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q) ||
      (m.subcategory || '').toLowerCase().includes(q)
    );
  });

  return (
    <LinearGradient colors={['#0A1124', '#050811']} style={styles.background}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <View style={styles.headerTitleRow}>
              <ShieldAlert size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.headerTitle}>Admin Market Controls</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Manual & 70% Automatic Overpower Protection
            </Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshIconBtn} activeOpacity={0.8}>
            <RefreshCw size={16} color="#8FA2C7" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <Search size={16} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'MATCHES' ? 'Search sports fixture by club or league...' : 'Search prediction market title...'}
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'MATCHES' && styles.tabBtnActive]}
            onPress={() => setActiveTab('MATCHES')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'MATCHES' && styles.tabBtnTextActive]}>
              Sports Fixtures ({matches.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'MARKETS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('MARKETS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'MARKETS' && styles.tabBtnTextActive]}>
              Prediction Markets ({markets.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content List */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#00D285" />
            <Text style={styles.loadingText}>Loading Admin Markets...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D285" />}
          >
            {activeTab === 'MATCHES' ? (
              filteredMatches.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No fixtures found matching your query.</Text>
                </View>
              ) : (
                filteredMatches.map((m) => {
                  const isLocked = Boolean(m.isLocked || m.isOverpowered || m.status === 'SUSPENDED');
                  const homeOdds = m.odds?.home || 1.85;
                  const awayOdds = m.odds?.away || 2.40;
                  const isAutoOverpowered = homeOdds <= 1.43 || awayOdds <= 1.43;
                  const isLoading = actionLoadingId === m._id;

                  return (
                    <View key={m._id} style={[styles.itemCard, isLocked && styles.itemCardLocked]}>
                      <View style={styles.itemTopRow}>
                        <View style={styles.itemTagWrap}>
                          <Text style={styles.itemSportTag}>{(m.sport || 'FOOTBALL').toUpperCase()}</Text>
                          <Text style={styles.itemLeagueText} numberOfLines={1}>
                            {m.league || 'League Match'}
                          </Text>
                        </View>
                        <View style={[styles.lockStatusPill, isLocked ? styles.pillLocked : styles.pillActive]}>
                          <Text style={[styles.lockStatusPillText, isLocked ? styles.textLocked : styles.textActive]}>
                            {isLocked ? 'LOCKED / SUSPENDED' : 'TRADING ACTIVE'}
                          </Text>
                        </View>
                      </View>

                      {/* Teams Row */}
                      <Text style={styles.itemTitleText}>
                        {m.homeTeam} vs {m.awayTeam}
                      </Text>

                      {/* Overpower Info Row */}
                      <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Pool Volume:</Text>
                          <Text style={styles.infoVal}>₦{(m.poolAmount || 0).toLocaleString()}</Text>
                        </View>
                        {isAutoOverpowered && (
                          <View style={styles.overpowerWarningBadge}>
                            <AlertTriangle size={12} color="#F59E0B" />
                            <Text style={styles.overpowerWarningText}>70%+ Crowd / Odds Overpower Triggered</Text>
                          </View>
                        )}
                      </View>

                      {/* Action Button */}
                      <TouchableOpacity
                        onPress={() => handleToggleMatchLock(m._id, isLocked)}
                        disabled={isLoading}
                        style={[styles.actionBtn, isLocked ? styles.actionBtnUnlock : styles.actionBtnLock]}
                        activeOpacity={0.8}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : isLocked ? (
                          <View style={styles.btnInnerRow}>
                            <Unlock size={14} color="#00D285" style={{ marginRight: 6 }} />
                            <Text style={[styles.actionBtnText, { color: '#00D285' }]}>Unlock Fixture for Trading</Text>
                          </View>
                        ) : (
                          <View style={styles.btnInnerRow}>
                            <Lock size={14} color="#EF4444" style={{ marginRight: 6 }} />
                            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Lock Fixture (Overpowered)</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })
              )
            ) : filteredMarkets.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No prediction markets found matching your query.</Text>
              </View>
            ) : (
              filteredMarkets.map((m) => {
                const isLocked = Boolean(m.isLocked || m.isOverpowered || m.status === 'SUSPENDED');
                const totalPot = m.pool?.totalPot || m.poolAmount || 0;
                const optA = m.options?.[0]?.totalStaked || 0;
                const optB = m.options?.[1]?.totalStaked || 0;
                const isAutoOverpowered = totalPot > 0 && (optA / totalPot >= 0.70 || optB / totalPot >= 0.70);
                const isLoading = actionLoadingId === m._id;

                return (
                  <View key={m._id} style={[styles.itemCard, isLocked && styles.itemCardLocked]}>
                    <View style={styles.itemTopRow}>
                      <View style={styles.itemTagWrap}>
                        <Text style={styles.itemSportTag}>{(m.category || 'PREDICTION').toUpperCase()}</Text>
                        <Text style={styles.itemLeagueText} numberOfLines={1}>
                          {m.subcategory || 'Market'}
                        </Text>
                      </View>
                      <View style={[styles.lockStatusPill, isLocked ? styles.pillLocked : styles.pillActive]}>
                        <Text style={[styles.lockStatusPillText, isLocked ? styles.textLocked : styles.textActive]}>
                          {isLocked ? 'LOCKED / SUSPENDED' : 'TRADING ACTIVE'}
                        </Text>
                      </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.itemTitleText}>{m.title}</Text>

                    {/* Pool Info */}
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Pool Volume:</Text>
                        <Text style={styles.infoVal}>₦{(totalPot || 0).toLocaleString()}</Text>
                      </View>
                      {isAutoOverpowered && (
                        <View style={styles.overpowerWarningBadge}>
                          <AlertTriangle size={12} color="#F59E0B" />
                          <Text style={styles.overpowerWarningText}>70%+ Crowd Stake Concentration</Text>
                        </View>
                      )}
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                      onPress={() => handleToggleMarketLock(m._id, isLocked)}
                      disabled={isLoading}
                      style={[styles.actionBtn, isLocked ? styles.actionBtnUnlock : styles.actionBtnLock]}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : isLocked ? (
                        <View style={styles.btnInnerRow}>
                          <Unlock size={14} color="#00D285" style={{ marginRight: 6 }} />
                          <Text style={[styles.actionBtnText, { color: '#00D285' }]}>Unlock Market for Trading</Text>
                        </View>
                      ) : (
                        <View style={styles.btnInnerRow}>
                          <Lock size={14} color="#EF4444" style={{ marginRight: 6 }} />
                          <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Lock Market (Overpowered)</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleWrap: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: '#0F1A30',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#0F1A30',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#1E293B',
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  tabBtnTextActive: {
    color: '#00D285',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
    fontFamily: 'Inter',
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: '#0F1A30',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  itemCardLocked: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  itemSportTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00D285',
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'Inter',
  },
  itemLeagueText: {
    color: '#8FA2C7',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter',
    flex: 1,
  },
  lockStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillActive: {
    backgroundColor: 'rgba(0, 210, 133, 0.12)',
  },
  pillLocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  lockStatusPillText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  textActive: { color: '#00D285' },
  textLocked: { color: '#EF4444' },
  itemTitleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Inter',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: 'Inter',
  },
  infoVal: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  overpowerWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  overpowerWarningText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLock: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionBtnUnlock: {
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    borderWidth: 1,
    borderColor: '#00D285',
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
});
