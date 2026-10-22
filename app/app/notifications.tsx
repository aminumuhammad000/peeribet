import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Alert, Platform, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Bell, BellOff, CheckCheck, Trash2, TrendingUp,
  Wallet, Shield, Zap, X, ChevronRight, Calendar
} from 'lucide-react-native';
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

const typeConfig: Record<NotificationType, { icon: any; color: string; bg: string; label: string }> = {
  bet:    { icon: TrendingUp, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  label: 'BET OUTCOME' },
  wallet: { icon: Wallet,     color: '#00D285', bg: 'rgba(0,210,133,0.12)', label: 'WALLET' },
  match:  { icon: Zap,        color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'MATCH' },
  system: { icon: Shield,     color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'SYSTEM ALERT' },
};

function timeAgo(isoDate: string) {
  const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatFullDate(isoDate: string) {
  try {
    const d = new Date(isoDate);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoDate;
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

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
      if (selectedNotification && selectedNotification._id === id) {
        setSelectedNotification(prev => prev ? { ...prev, isRead: true } : null);
      }
    } catch (err) {
      console.error('Mark as read failed:', err);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    setSelectedNotification(notification);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      if (selectedNotification) {
        setSelectedNotification(prev => prev ? { ...prev, isRead: true } : null);
      }
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  const executeDelete = async (id: string) => {
    const deleted = notifications.find(n => n._id === id);
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (deleted && !deleted.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (selectedNotification?._id === id) {
      setSelectedNotification(null);
    }
    try {
      await notificationService.delete(id);
    } catch (err) {
      console.error('Delete failed:', err);
      if (deleted) {
        setNotifications(prev => [deleted, ...prev]);
        if (!deleted.isRead) {
          setUnreadCount(prev => prev + 1);
        }
      }
    }
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Delete this notification?') : true;
      if (confirmed) {
        executeDelete(id);
      }
    } else {
      Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => executeDelete(id),
        },
      ]);
    }
  };

  const executeClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    setSelectedNotification(null);
    try {
      await notificationService.clearAll();
    } catch (err) {
      console.error('Clear all failed:', err);
      fetchNotifications();
    }
  };

  const handleClearAll = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Clear all notifications?') : true;
      if (confirmed) {
        executeClearAll();
      }
    } else {
      Alert.alert('Clear All', 'Are you sure you want to clear all notifications?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => executeClearAll(),
        },
      ]);
    }
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
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7} style={styles.headerActionBtn} accessibilityLabel="Mark all as read">
                <CheckCheck size={18} color={Colors.dark.primary} />
              </TouchableOpacity>
            )}
            {notifications.length > 0 && (
              <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7} style={styles.headerActionBtn} accessibilityLabel="Clear all">
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
            {notifications.length === 0 && <View style={{ width: 36 }} />}
          </View>
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
                    onPress={handleNotificationPress}
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
                    onPress={handleNotificationPress}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            ) : null}
          </ScrollView>
        )}

        {/* Notification Detail Modal */}
        <Modal
          visible={!!selectedNotification}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedNotification(null)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setSelectedNotification(null)}
            />
            <View style={styles.modalCard}>
              {selectedNotification && (() => {
                const cfg = typeConfig[selectedNotification.type] || typeConfig.system;
                const Icon = cfg.icon;

                return (
                  <>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                      <View style={styles.modalHeaderLeft}>
                        <View style={[styles.modalIconBox, { backgroundColor: cfg.bg }]}>
                          <Icon size={22} color={cfg.color} />
                        </View>
                        <View>
                          <View style={styles.modalCategoryRow}>
                            <Text style={[styles.modalCategoryBadge, { color: cfg.color, borderColor: cfg.color }]}>
                              {cfg.label}
                            </Text>
                            <Text style={styles.modalStatusText}>
                              {selectedNotification.isRead ? 'Read' : 'New'}
                            </Text>
                          </View>
                          <Text style={styles.modalTimeText}>
                            {timeAgo(selectedNotification.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => setSelectedNotification(null)}
                        style={styles.modalCloseBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <X size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>

                    {/* Modal Title */}
                    <Text style={styles.modalTitle}>{selectedNotification.title}</Text>

                    {/* Date metadata */}
                    <View style={styles.modalMetaRow}>
                      <Calendar size={13} color="#64748B" />
                      <Text style={styles.modalMetaText}>
                        {formatFullDate(selectedNotification.createdAt)}
                      </Text>
                    </View>

                    {/* Scrollable Message */}
                    <ScrollView style={styles.modalMessageScroll} showsVerticalScrollIndicator={false}>
                      <Text style={styles.modalMessage} selectable>
                        {selectedNotification.message}
                      </Text>
                    </ScrollView>

                    {/* Modal Action Buttons */}
                    <View style={styles.modalActions}>
                      {selectedNotification.type === 'wallet' && (
                        <TouchableOpacity
                          style={[styles.primaryActionBtn, { backgroundColor: '#00D285' }]}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelectedNotification(null);
                            router.push('/(tabs)/wallet');
                          }}
                        >
                          <Wallet size={16} color="#050811" />
                          <Text style={styles.primaryActionBtnText}>Go to Wallet</Text>
                        </TouchableOpacity>
                      )}

                      {selectedNotification.type === 'bet' && (
                        <TouchableOpacity
                          style={[styles.primaryActionBtn, { backgroundColor: '#3B82F6' }]}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelectedNotification(null);
                            router.push('/(tabs)/trades');
                          }}
                        >
                          <TrendingUp size={16} color="#FFFFFF" />
                          <Text style={[styles.primaryActionBtnText, { color: '#FFFFFF' }]}>View Trades</Text>
                        </TouchableOpacity>
                      )}

                      {selectedNotification.type === 'match' && (
                        <TouchableOpacity
                          style={[styles.primaryActionBtn, { backgroundColor: '#F59E0B' }]}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelectedNotification(null);
                            router.push('/(tabs)/market');
                          }}
                        >
                          <Zap size={16} color="#050811" />
                          <Text style={styles.primaryActionBtnText}>Browse Markets</Text>
                        </TouchableOpacity>
                      )}

                      <View style={styles.modalBottomRow}>
                        <TouchableOpacity
                          style={styles.modalDeleteBtn}
                          activeOpacity={0.7}
                          onPress={() => {
                            const id = selectedNotification._id;
                            setSelectedNotification(null);
                            handleDelete(id);
                          }}
                        >
                          <Trash2 size={15} color="#EF4444" />
                          <Text style={styles.modalDeleteText}>Delete</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.modalDismissBtn}
                          activeOpacity={0.7}
                          onPress={() => setSelectedNotification(null)}
                        >
                          <Text style={styles.modalDismissText}>Close</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function NotificationCard({
  notification,
  onPress,
  onDelete
}: {
  notification: Notification;
  onPress: (notif: Notification) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = typeConfig[notification.type] || typeConfig.system;
  const Icon = cfg.icon;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[styles.card, !notification.isRead && styles.cardUnread]}
      onPress={() => onPress(notification)}
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
        <TouchableOpacity
          onPress={(e: any) => {
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            onDelete(notification._id);
          }}
          activeOpacity={0.6}
          style={styles.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={15} color="#64748B" />
        </TouchableOpacity>
        <ChevronRight size={16} color="#475569" />
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#131C32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
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
  cardActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.primary },
  deleteBtn: { padding: 4 },

  /* Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 17, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalCategoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  modalStatusText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
  modalTimeText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 6,
    lineHeight: 23,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  modalMetaText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
  },
  modalMessageScroll: {
    maxHeight: 200,
    backgroundColor: '#0A1124',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 18,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 22,
    color: '#E2E8F0',
    fontFamily: 'Inter',
  },
  modalActions: {
    gap: 10,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#050811',
    fontFamily: 'Inter',
  },
  modalBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  modalDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
    fontFamily: 'Inter',
  },
  modalDismissBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  modalDismissText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
});
