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
  Gift,
  Users,
  Share2,
  Settings,
  DollarSign,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { adminService, authService, showToast } from '../services/apiService';

export default function AdminMarketControlScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'MARKETS' | 'REFERRALS'>('MATCHES');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Referral Administration State
  const [referralStats, setReferralStats] = useState<any>(null);
  const [editReferralEnabled, setEditReferralEnabled] = useState(true);
  const [editReferrerBonus, setEditReferrerBonus] = useState('1000');
  const [editRefereeBonus, setEditRefereeBonus] = useState('1000');
  const [editWinShareBonus, setEditWinShareBonus] = useState('1000');
  const [editWinWeeklyLimit, setEditWinWeeklyLimit] = useState('3');
  const [editReferralDescription, setEditReferralDescription] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [userData, matchesRes, marketsRes, refData] = await Promise.all([
        authService.getMe().catch(() => null),
        adminService.getAdminMatches().catch(() => ({ matches: [] })),
        adminService.getAdminMarkets().catch(() => ({ markets: [] })),
        adminService.getAdminReferralStats().catch(() => null),
      ]);

      if (userData) setUser(userData);
      setMatches(matchesRes?.matches || []);
      setMarkets(marketsRes?.markets || []);

      if (refData) {
        setReferralStats(refData);
        if (refData.settings) {
          setEditReferralEnabled(refData.settings.referralEnabled ?? true);
          setEditReferrerBonus(String(refData.settings.referrerBonus ?? 1000));
          setEditRefereeBonus(String(refData.settings.refereeBonus ?? 1000));
          setEditWinShareBonus(String(refData.settings.winReceiptShareBonus ?? 1000));
          setEditWinWeeklyLimit(String(refData.settings.winReceiptWeeklyLimit ?? 3));
          setEditReferralDescription(refData.settings.referralDescription || '');
        }
      }
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      showToast('Failed to load admin market list', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleSaveReferralSettings = async () => {
    setIsSavingSettings(true);
    try {
      await adminService.updateAdminReferralSettings({
        referralEnabled: editReferralEnabled,
        referrerBonus: Number(editReferrerBonus) || 1000,
        refereeBonus: Number(editRefereeBonus) || 1000,
        winReceiptShareBonus: Number(editWinShareBonus) || 1000,
        winReceiptWeeklyLimit: Number(editWinWeeklyLimit) || 3,
        referralDescription: editReferralDescription,
      });
      showToast('Referral bonuses updated successfully! 🎁', 'success');
      const refreshedStats = await adminService.getAdminReferralStats().catch(() => null);
      if (refreshedStats) setReferralStats(refreshedStats);
    } catch (err: any) {
      showToast(err.message || 'Failed to update referral settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleMatchLock = async (matchId: string, currentLocked: boolean, contract?: string) => {
    setActionLoadingId(`${matchId}_${contract || 'all'}`);
    try {
      const res = await adminService.toggleMatchLock(
        matchId, 
        !currentLocked, 
        !currentLocked ? `Locked by Admin (${contract || 'Overpowered'})` : undefined,
        contract
      );
      showToast(res.message || `Fixture contract ${contract || ''} ${!currentLocked ? 'LOCKED' : 'UNLOCKED'} successfully`, 'success');
      setMatches((prev) =>
        prev.map((m) =>
          m._id === matchId
            ? {
                ...m,
                lockedContracts: res.match?.lockedContracts || (
                  contract
                    ? (!currentLocked ? [...(m.lockedContracts || []), contract.toUpperCase()] : (m.lockedContracts || []).filter((c: string) => c.toUpperCase() !== contract.toUpperCase()))
                    : m.lockedContracts
                ),
                isLocked: res.match?.isLocked ?? (!currentLocked),
                status: res.match?.status || m.status,
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

  const handleToggleMarketLock = async (marketId: string, currentLocked: boolean, contract?: string) => {
    setActionLoadingId(`${marketId}_${contract || 'all'}`);
    try {
      const res = await adminService.toggleMarketLock(
        marketId, 
        !currentLocked, 
        !currentLocked ? `Locked by Admin (${contract || 'Overpowered'})` : undefined,
        contract
      );
      showToast(res.message || `Market contract ${contract || ''} ${!currentLocked ? 'LOCKED' : 'UNLOCKED'} successfully`, 'success');
      setMarkets((prev) =>
        prev.map((m) =>
          m._id === marketId
            ? {
                ...m,
                lockedContracts: res.market?.lockedContracts || (
                  contract
                    ? (!currentLocked ? [...(m.lockedContracts || []), contract.toUpperCase()] : (m.lockedContracts || []).filter((c: string) => c.toUpperCase() !== contract.toUpperCase()))
                    : m.lockedContracts
                ),
                options: res.market?.options || m.options,
                isLocked: res.market?.isLocked ?? (!currentLocked),
                status: res.market?.status || m.status,
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

  const filteredReferrals = (referralStats?.recentReferrals || []).filter((r: any) => {
    if (!q) return true;
    const refCode = (r.referralCode || '').toLowerCase();
    const referrer = `${r.referrer?.firstName || ''} ${r.referrer?.lastName || ''} ${r.referrer?.email || ''}`.toLowerCase();
    const referee = `${r.referee?.firstName || ''} ${r.referee?.lastName || ''} ${r.referee?.email || ''}`.toLowerCase();
    return refCode.includes(q) || referrer.includes(q) || referee.includes(q);
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
            placeholder={
              activeTab === 'MATCHES'
                ? 'Search sports fixture by club or league...'
                : activeTab === 'MARKETS'
                ? 'Search prediction market title...'
                : 'Search referrals by user, code, or referee...'
            }
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
              Fixtures ({matches.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'MARKETS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('MARKETS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'MARKETS' && styles.tabBtnTextActive]}>
              Markets ({markets.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'REFERRALS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('REFERRALS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'REFERRALS' && styles.tabBtnTextActive]}>
              Referrals ({referralStats?.totalReferrals || 0})
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

                      {/* Individual Contract Safeguard Locks */}
                      <Text style={styles.contractSectionLabel}>SPECIFIC CONTRACT LOCKS:</Text>
                      <View style={styles.contractChipsRow}>
                        {[
                          { key: 'HOME', label: `1 (${m.odds?.home || 1.85})` },
                          { key: 'DRAW', label: `X (${m.odds?.draw || 3.10})` },
                          { key: 'AWAY', label: `2 (${m.odds?.away || 2.40})` },
                          { key: 'OVER_25', label: `O2.5 (${m.odds?.over25 || 1.95})` },
                          { key: 'UNDER_25', label: `U2.5 (${m.odds?.under25 || 1.85})` },
                        ].map((c) => {
                          const isContractLocked = Boolean(m.lockedContracts?.some((lc: string) => lc.toUpperCase() === c.key));
                          const isBtnLoading = actionLoadingId === `${m._id}_${c.key}`;
                          return (
                            <TouchableOpacity
                              key={c.key}
                              style={[styles.contractChip, isContractLocked ? styles.contractChipLocked : styles.contractChipActive]}
                              onPress={() => handleToggleMatchLock(m._id, isContractLocked, c.key)}
                              disabled={isBtnLoading}
                              activeOpacity={0.7}
                            >
                              {isBtnLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : isContractLocked ? (
                                <Lock size={10} color="#EF4444" />
                              ) : (
                                <Unlock size={10} color="#94A3B8" />
                              )}
                              <Text style={[styles.contractChipText, { color: isContractLocked ? '#EF4444' : '#CBD5E1' }]}>
                                {c.label} {isContractLocked ? '• Locked' : ''}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
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
            ) : activeTab === 'MARKETS' ? (
              filteredMarkets.length === 0 ? (
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

                    {/* Individual Contract / Option Safeguard Locks */}
                    <Text style={styles.contractSectionLabel}>SPECIFIC CONTRACT LOCKS:</Text>
                    <View style={styles.contractChipsRow}>
                      {(m.options || [
                        { id: 'yes', label: 'Yes', odds: 1.85 },
                        { id: 'no', label: 'No', odds: 1.95 },
                      ]).map((opt: any) => {
                        const isContractLocked = Boolean(
                          opt.isLocked ||
                          m.lockedContracts?.some((lc: string) => lc.toUpperCase() === String(opt.label).toUpperCase() || lc.toUpperCase() === String(opt.id).toUpperCase())
                        );
                        const isBtnLoading = actionLoadingId === `${m._id}_${opt.id || opt.label}`;
                        return (
                          <TouchableOpacity
                            key={opt.id || opt.label}
                            style={[styles.contractChip, isContractLocked ? styles.contractChipLocked : styles.contractChipActive]}
                            onPress={() => handleToggleMarketLock(m._id, isContractLocked, opt.id || opt.label)}
                            disabled={isBtnLoading}
                            activeOpacity={0.7}
                          >
                            {isBtnLoading ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : isContractLocked ? (
                              <Lock size={10} color="#EF4444" />
                            ) : (
                              <Unlock size={10} color="#94A3B8" />
                            )}
                            <Text style={[styles.contractChipText, { color: isContractLocked ? '#EF4444' : '#CBD5E1' }]}>
                              {opt.label} ({opt.odds?.toFixed(2) || '1.90'}) {isContractLocked ? '• Locked' : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
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
            )
          ) : (
            /* REFERRALS TAB CONTENT */
              <View style={styles.referralsTabContainer}>
                {/* 4 Metric Summary Cards */}
                <View style={styles.adminMetricsGrid}>
                  <View style={styles.adminMetricCard}>
                    <View style={styles.adminMetricIconRow}>
                      <Users size={16} color="#00D285" />
                      <Text style={styles.adminMetricTag}>All Time</Text>
                    </View>
                    <Text style={styles.adminMetricVal}>{(referralStats?.totalReferrals || 0).toLocaleString()}</Text>
                    <Text style={styles.adminMetricLabel}>Total Referrals</Text>
                  </View>

                  <View style={styles.adminMetricCard}>
                    <View style={styles.adminMetricIconRow}>
                      <DollarSign size={16} color="#3B82F6" />
                      <Text style={[styles.adminMetricTag, { color: '#3B82F6' }]}>Paid Out</Text>
                    </View>
                    <Text style={[styles.adminMetricVal, { color: '#3B82F6' }]}>
                      ₦{(referralStats?.totalBonusPaid || 0).toLocaleString()}
                    </Text>
                    <Text style={styles.adminMetricLabel}>Total Bonuses Paid</Text>
                  </View>

                  <View style={styles.adminMetricCard}>
                    <View style={styles.adminMetricIconRow}>
                      <Award size={16} color="#F59E0B" />
                      <Text style={[styles.adminMetricTag, { color: '#F59E0B' }]}>Active</Text>
                    </View>
                    <Text style={[styles.adminMetricVal, { color: '#F59E0B' }]}>
                      {(referralStats?.activeReferrersCount || 0).toLocaleString()}
                    </Text>
                    <Text style={styles.adminMetricLabel}>Active Referrers</Text>
                  </View>

                  <View style={styles.adminMetricCard}>
                    <View style={styles.adminMetricIconRow}>
                      <Share2 size={16} color="#A855F7" />
                      <Text style={[styles.adminMetricTag, { color: '#A855F7' }]}>Win Slips</Text>
                    </View>
                    <Text style={[styles.adminMetricVal, { color: '#A855F7' }]}>
                      {(referralStats?.totalWinShares || 0).toLocaleString()}
                    </Text>
                    <Text style={styles.adminMetricLabel}>Win Receipts Rewarded</Text>
                  </View>
                </View>

                {/* Edit Referral Bonuses & Settings Card */}
                <View style={styles.adminSettingsCard}>
                  <View style={styles.adminSettingsHeader}>
                    <Settings size={18} color="#00D285" />
                    <Text style={styles.adminSettingsTitle}>Referral Bonus Configuration</Text>
                  </View>

                  {/* Program Status Toggle */}
                  <View style={styles.toggleRowWrap}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.toggleTitle}>Referral Program Status</Text>
                      <Text style={styles.toggleSub}>Enable or pause user referral bonuses and win sharing</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.statusToggleBtn, editReferralEnabled ? styles.statusToggleBtnActive : styles.statusToggleBtnInactive]}
                      onPress={() => setEditReferralEnabled(!editReferralEnabled)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.statusToggleBtnText, editReferralEnabled ? { color: '#00D285' } : { color: '#EF4444' }]}>
                        {editReferralEnabled ? 'ENABLED ✓' : 'PAUSED ✕'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Referrer Bonus Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>REFERRER BONUS (₦)</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="numeric"
                      value={editReferrerBonus}
                      onChangeText={setEditReferrerBonus}
                      placeholder="1000"
                      placeholderTextColor="#64748B"
                    />
                    <Text style={styles.inputHint}>Bonus credited to the user who invites a friend</Text>
                  </View>

                  {/* Referee / New Member Bonus Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>NEW MEMBER WELCOME BONUS (₦)</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="numeric"
                      value={editRefereeBonus}
                      onChangeText={setEditRefereeBonus}
                      placeholder="1000"
                      placeholderTextColor="#64748B"
                    />
                    <Text style={styles.inputHint}>Bonus credited to the new user when joining with a referral code</Text>
                  </View>

                  {/* Win Receipt Share Bonus Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>WIN RECEIPT SHARE BONUS (₦)</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="numeric"
                      value={editWinShareBonus}
                      onChangeText={setEditWinShareBonus}
                      placeholder="1000"
                      placeholderTextColor="#64748B"
                    />
                    <Text style={styles.inputHint}>Bonus credited to trader for sharing their verified winning receipt</Text>
                  </View>

                  {/* Weekly Limit Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>MAX WIN SHARES PER WEEK (LIMIT)</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="numeric"
                      value={editWinWeeklyLimit}
                      onChangeText={setEditWinWeeklyLimit}
                      placeholder="3"
                      placeholderTextColor="#64748B"
                    />
                    <Text style={styles.inputHint}>Anti-abuse limit: maximum winning receipts rewarded per user each week</Text>
                  </View>

                  {/* Description Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PROGRAM PROMO DESCRIPTION</Text>
                    <TextInput
                      style={[styles.numberInput, { minHeight: 60, textAlignVertical: 'top' }]}
                      multiline
                      value={editReferralDescription}
                      onChangeText={setEditReferralDescription}
                      placeholder="Invite friends and both receive ₦1,000 bonus!"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={styles.saveSettingsBtn}
                    onPress={handleSaveReferralSettings}
                    disabled={isSavingSettings}
                    activeOpacity={0.8}
                  >
                    {isSavingSettings ? (
                      <ActivityIndicator size="small" color="#050811" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={16} color="#050811" />
                        <Text style={styles.saveSettingsBtnText}>Update Referral Bonuses</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Top Referrers Leaderboard */}
                {(referralStats?.topReferrers || []).length > 0 && (
                  <View style={styles.adminSectionCard}>
                    <View style={styles.adminSettingsHeader}>
                      <Award size={18} color="#F59E0B" />
                      <Text style={styles.adminSettingsTitle}>Top Referrers Leaderboard</Text>
                    </View>
                    {(referralStats.topReferrers || []).map((tr: any, idx: number) => (
                      <View key={tr._id || idx} style={styles.leaderboardRow}>
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.leaderboardName}>{tr.firstName} {tr.lastName}</Text>
                          <Text style={styles.leaderboardSub}>Code: {tr.referralCode} • {tr.email}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.leaderboardCount}>{tr.referralCount} Referrals</Text>
                          <Text style={styles.leaderboardEarnings}>₦{(tr.referralEarnings || 0).toLocaleString()}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Recent Referrals Activity Ledger */}
                <View style={styles.adminSectionCard}>
                  <View style={styles.adminSettingsHeader}>
                    <Clock size={18} color="#3B82F6" />
                    <Text style={styles.adminSettingsTitle}>Recent Referral Registrations ({filteredReferrals.length})</Text>
                  </View>
                  {filteredReferrals.length === 0 ? (
                    <Text style={styles.emptyCardText}>No referral registrations recorded yet.</Text>
                  ) : (
                    filteredReferrals.map((r: any) => (
                      <View key={r._id} style={styles.activityRow}>
                        <View style={styles.activityAvatar}>
                          <Text style={styles.activityAvatarText}>
                            {(r.referee?.firstName || '?').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activityTitle}>
                            {r.referee?.firstName || 'New User'} {r.referee?.lastName || ''}
                          </Text>
                          <Text style={styles.activitySub}>
                            Referred by {r.referrer?.firstName || 'User'} ({r.referralCode}) • {new Date(r.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.activityBonus}>+₦{(r.referrerBonus || 1000).toLocaleString()}</Text>
                          <Text style={styles.activityStatus}>{r.status || 'rewarded'}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                {/* Recent Win Receipt Shares Activity */}
                {(referralStats?.recentWinShares || []).length > 0 && (
                  <View style={styles.adminSectionCard}>
                    <View style={styles.adminSettingsHeader}>
                      <Share2 size={18} color="#A855F7" />
                      <Text style={styles.adminSettingsTitle}>Recent Win Receipt Shares</Text>
                    </View>
                    {(referralStats.recentWinShares || []).map((ws: any) => (
                      <View key={ws._id} style={styles.activityRow}>
                        <View style={[styles.activityAvatar, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                          <Sparkles size={16} color="#A855F7" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activityTitle}>
                            {ws.user?.firstName || 'Trader'} {ws.user?.lastName || ''}
                          </Text>
                          <Text style={styles.activitySub}>
                            {(ws.platform || 'social_share').toUpperCase()} • Trade #{ws.tradeId?.slice(-6) || ''} • {new Date(ws.sharedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.activityBonus, { color: '#00D285' }]}>+₦{(ws.bonusAmount || 1000).toLocaleString()}</Text>
                          <Text style={[styles.activityStatus, { color: '#00D285' }]}>Rewarded</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
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
  contractSectionLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8FA2C7',
    marginTop: 6,
    marginBottom: 6,
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  contractChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  contractChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  contractChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  contractChipLocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  contractChipText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  referralsTabContainer: {
    paddingBottom: 24,
  },
  adminMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  adminMetricCard: {
    width: '48%',
    backgroundColor: '#0F1A30',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  adminMetricIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  adminMetricTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00D285',
    textTransform: 'uppercase',
  },
  adminMetricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  adminMetricLabel: {
    fontSize: 10,
    color: '#8FA2C7',
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  adminSettingsCard: {
    backgroundColor: '#0F1A30',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.3)',
  },
  adminSettingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  adminSettingsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  toggleRowWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  toggleSub: {
    fontSize: 10,
    color: '#8FA2C7',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  statusToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusToggleBtnActive: {
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    borderColor: '#00D285',
  },
  statusToggleBtnInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  statusToggleBtnText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8FA2C7',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  numberInput: {
    backgroundColor: '#090F1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  inputHint: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 3,
    fontFamily: 'Inter',
  },
  saveSettingsBtn: {
    backgroundColor: '#00D285',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveSettingsBtnText: {
    color: '#050811',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  adminSectionCard: {
    backgroundColor: '#0F1A30',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    fontFamily: 'Inter',
  },
  leaderboardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  leaderboardSub: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Inter',
  },
  leaderboardCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  leaderboardEarnings: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    fontFamily: 'Inter',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  activityAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00D285',
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  activitySub: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Inter',
  },
  activityBonus: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00D285',
    fontFamily: 'Inter',
  },
  activityStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8FA2C7',
    fontFamily: 'Inter',
  },
  emptyCardText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
