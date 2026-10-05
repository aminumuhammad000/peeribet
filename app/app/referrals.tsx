import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Copy,
  Share2,
  Gift,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
} from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { referralService } from '../services/apiService';

interface ReferralInfo {
  referralCode: string;
  referralCount: number;
  referralEarnings: number;
  referralEnabled: boolean;
  referrerBonus: number;
  refereeBonus: number;
  referralDescription: string;
  referrals: Array<{
    _id: string;
    referee: { firstName: string; lastName: string; email: string };
    status: string;
    refereeBonus: number;
    referrerBonus: number;
    createdAt: string;
  }>;
}

export default function ReferralsScreen() {
  const router = useRouter();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await referralService.getMyReferrals();
      setInfo(data);
    } catch (err) {
      Alert.alert('Error', 'Unable to load referral data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleCopy = () => {
    if (!info?.referralCode) return;
    Clipboard.setString(info.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!info?.referralCode) return;
    try {
      await Share.share({
        message: `Join Peeritrade — the smart outcome trading platform! Use my referral code ${info.referralCode} when signing up and we both get ₦${(info.refereeBonus || 1000).toLocaleString()} bonus! Download the app and start trading: https://peeritrade.com`,
        title: 'Join Peeritrade with my referral code!',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]} style={styles.bg}>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Loading referral info...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]} style={styles.bg}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <ArrowLeft size={20} color="#0A1124" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Referral Program</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Banner */}
          <LinearGradient
            colors={['rgba(0, 210, 133, 0.15)', 'rgba(0, 210, 133, 0.05)']}
            style={styles.heroBanner}
          >
            <Gift size={40} color={Colors.dark.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.heroTitle}>Earn Together</Text>
            <Text style={styles.heroSub}>
              Share your code. When a friend joins using your code, you both receive a bonus!
            </Text>

            {/* Bonus Pills */}
            <View style={styles.bonusPillRow}>
              <View style={styles.bonusPill}>
                <Text style={styles.bonusPillLabel}>You Earn</Text>
                <Text style={styles.bonusPillAmount}>₦{((info?.referrerBonus) || 1000).toLocaleString()}</Text>
              </View>
              <View style={[styles.bonusPill, { borderColor: '#3B82F6' }]}>
                <Text style={[styles.bonusPillLabel, { color: '#3B82F6' }]}>Friend Earns</Text>
                <Text style={[styles.bonusPillAmount, { color: '#3B82F6' }]}>₦{((info?.refereeBonus) || 1000).toLocaleString()}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Your Referral Code */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Your Referral Code</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{info?.referralCode || '—'}</Text>
              <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.7}>
                {copied ? (
                  <CheckCircle size={18} color={Colors.dark.primary} />
                ) : (
                  <Copy size={18} color={Colors.dark.primary} />
                )}
                <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.85}>
              <Share2 size={18} color="#090d16" />
              <Text style={styles.shareBtnText}>Share Your Code</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Users size={22} color={Colors.dark.primary} style={{ marginBottom: 8 }} />
              <Text style={styles.statValue}>{info?.referralCount || 0}</Text>
              <Text style={styles.statLabel}>Total Referrals</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={22} color="#3B82F6" style={{ marginBottom: 8 }} />
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>₦{(info?.referralEarnings || 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
          </View>

          {/* How It Works */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>How It Works</Text>
            {[
              { step: '1', text: 'Copy your unique referral code above.' },
              { step: '2', text: 'Share it with friends via WhatsApp, social media, or any channel.' },
              { step: '3', text: 'When they sign up using your code, both of you instantly receive a bonus credited to your wallets.' },
            ].map((item) => (
              <View key={item.step} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{item.step}</Text>
                </View>
                <Text style={styles.stepText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Recent Referrals */}
          {(info?.referrals || []).length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Your Referrals</Text>
              {(info?.referrals || []).map((ref) => (
                <View key={ref._id} style={styles.referralRow}>
                  <View style={styles.referralAvatar}>
                    <Text style={styles.referralAvatarText}>
                      {(ref.referee?.firstName || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.referralName}>
                      {ref.referee?.firstName || ''} {ref.referee?.lastName || ''}
                    </Text>
                    <Text style={styles.referralDate}>
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.referralStatusBadge}>
                    {ref.status === 'completed' ? (
                      <CheckCircle size={14} color={Colors.dark.primary} />
                    ) : (
                      <Clock size={14} color="#F59E0B" />
                    )}
                    <Text style={[styles.referralStatusText, { color: ref.status === 'completed' ? Colors.dark.primary : '#F59E0B' }]}>
                      {ref.status === 'completed' ? '+₦' + ref.referrerBonus.toLocaleString() : 'Pending'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#94a3b8', fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  heroBanner: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.2)',
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  heroSub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  bonusPillRow: { flexDirection: 'row', gap: 12 },
  bonusPill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    padding: 12,
    alignItems: 'center',
  },
  bonusPillLabel: { fontSize: 11, color: Colors.dark.primary, fontWeight: '600', marginBottom: 4 },
  bonusPillAmount: { fontSize: 18, fontWeight: '800', color: Colors.dark.primary },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  codeText: { fontSize: 28, fontWeight: '900', color: Colors.dark.primary, letterSpacing: 4 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: Colors.dark.primary },
  shareBtn: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: '#090d16' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.dark.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepBadgeText: { fontSize: 13, fontWeight: '800', color: Colors.dark.primary },
  stepText: { flex: 1, fontSize: 13, color: '#94a3b8', lineHeight: 20, paddingTop: 4 },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  referralAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.dark.primary },
  referralName: { fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 2 },
  referralDate: { fontSize: 12, color: '#64748b' },
  referralStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  referralStatusText: { fontSize: 12, fontWeight: '700' },
});
