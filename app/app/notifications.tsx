import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, BellOff, CheckCheck, Trash2, TrendingUp, Wallet, Shield, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { notificationService } from '../services/apiService';

type NotificationType = 'bet' | 'wallet' | 'system' | 'match';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

const typeConfig: Record<NotificationType, { icon: any; color: string; bg: string }> = {
  bet:    { icon: TrendingUp, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  wallet: { icon: Wallet,     color: '#00D285', bg: 'rgba(0,210,133,0.12)' },
  match:  { icon: Zap,        color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  system: { icon: Shield,     color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
};

function timeAgo(isoDate: string) {
  const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getAll();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read failed:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Notification', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await notificationService.delete(id);
            const deleted = notifications.find(n => n._id === id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (deleted && !deleted.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
          } catch (err) {
            console.error('Delete failed:', err);
          }
        }
      }
    ]);
  };

  return (
    <LinearGradient colors={['#0A1124', '#050811']} style={styles.background}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 ? (
              <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
            ) : null}
          </View>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7} style={styles.markAllBtn}>
              <CheckCheck size={18} color={Colors.dark.primary} />
            </TouchableOpacity>
          ) : <View style={{ width: 36 }} />}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centered}>
            <View style={styles.emptyIcon}>
              <BellOff size={40} color="#334155" />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No notifications yet. Check back later.</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
          >
            {/* Unread section */}
            {notifications.filter(n => !n.isRead).length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>New</Text>
                {notifications.filter(n => !n.isRead).map(n => (
                  <NotificationCard
                    key={n._id}
                    notification={n}
                    onRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            ) : null}

            {/* Read section */}
            {notifications.filter(n => n.isRead).length > 0 ? (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Earlier</Text>
                {notifications.filter(n => n.isRead).map(n => (
                  <NotificationCard
                    key={n._id}
                    notification={n}
                    onRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function NotificationCard({
  notification,
  onRead,
  onDelete
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = typeConfig[notification.type] || typeConfig.system;
  const Icon = cfg.icon;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, !notification.isRead && styles.cardUnread]}
      onPress={() => { if (!notification.isRead) onRead(notification._id); }}
    >
      <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
        <Icon size={20} color={cfg.color} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitle, !notification.isRead && styles.cardTitleUnread]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.cardTime}>{timeAgo(notification.createdAt)}</Text>
        </View>
        <Text style={styles.cardMsg} numberOfLines={2}>{notification.message}</Text>
      </View>
      <View style={styles.cardActions}>
        {!notification.isRead ? <View style={styles.dot} /> : null}
        <TouchableOpacity onPress={() => onDelete(notification._id)} activeOpacity={0.7} style={styles.deleteBtn}>
          <Trash2 size={15} color="#475569" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0F1A30',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#131C32',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Inter' },
  badge: {
    backgroundColor: Colors.dark.primary, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold', fontFamily: 'Inter' },
  markAllBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#131C32', alignItems: 'center', justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#131C32', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Inter', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#64748B', fontFamily: 'Inter', textAlign: 'center' },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: 'Inter', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#131C32', borderRadius: 16,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#1E293B',
  },
  cardUnread: { borderColor: 'rgba(0,210,133,0.25)', backgroundColor: '#101D35' },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#94A3B8', fontFamily: 'Inter', flex: 1, marginRight: 8 },
  cardTitleUnread: { color: '#FFFFFF', fontWeight: '700' },
  cardTime: { fontSize: 11, color: '#475569', fontFamily: 'Inter' },
  cardMsg: { fontSize: 12, color: '#64748B', fontFamily: 'Inter', lineHeight: 18 },
  cardActions: { alignItems: 'center', marginLeft: 8, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.primary },
  deleteBtn: { padding: 4 },
});
