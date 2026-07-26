import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trophy, Medal, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/apiService';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await authService.getLeaderboard();
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getInitials = (firstName: string, lastName: string) => {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  };

  const renderTopThree = () => {
    if (users.length === 0) return null;
    
    return (
      <View style={styles.topThreeContainer}>
        {/* Second Place */}
        {users.length > 1 ? (
          <View style={[styles.topAvatarWrapper, { marginTop: 30 }]}>
            <Text style={styles.topRankText}>2</Text>
            <View style={[styles.avatarCircle, { borderColor: '#C0C0C0', borderWidth: 3 }]}>
              {users[1].profileImage ? (
                <Image source={{ uri: users[1].profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(users[1].firstName, users[1].lastName)}</Text>
              )}
            </View>
            <Text style={styles.topName} numberOfLines={1}>@{users[1].username}</Text>
            <Text style={styles.topScore}>₦{users[1].balance.toLocaleString()}</Text>
          </View>
        ) : <View style={styles.topAvatarWrapper} />}

        {/* First Place */}
        {users.length > 0 ? (
          <View style={styles.topAvatarWrapper}>
            <Trophy size={24} color="#FFD700" style={{ marginBottom: 4 }} />
            <View style={[styles.avatarCircle, { borderColor: '#FFD700', borderWidth: 4, width: 80, height: 80 }]}>
              {users[0].profileImage ? (
                <Image source={{ uri: users[0].profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarInitials, { fontSize: 24 }]}>{getInitials(users[0].firstName, users[0].lastName)}</Text>
              )}
            </View>
            <Text style={[styles.topName, { fontSize: 16, marginTop: 8 }]} numberOfLines={1}>@{users[0].username}</Text>
            <Text style={[styles.topScore, { fontSize: 14 }]}>₦{users[0].balance.toLocaleString()}</Text>
          </View>
        ) : null}

        {/* Third Place */}
        {users.length > 2 ? (
          <View style={[styles.topAvatarWrapper, { marginTop: 40 }]}>
            <Text style={styles.topRankText}>3</Text>
            <View style={[styles.avatarCircle, { borderColor: '#CD7F32', borderWidth: 3 }]}>
              {users[2].profileImage ? (
                <Image source={{ uri: users[2].profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(users[2].firstName, users[2].lastName)}</Text>
              )}
            </View>
            <Text style={styles.topName} numberOfLines={1}>@{users[2].username}</Text>
            <Text style={styles.topScore}>₦{users[2].balance.toLocaleString()}</Text>
          </View>
        ) : <View style={styles.topAvatarWrapper} />}
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    // Skip top 3 since they are rendered in the header
    if (index < 3) return null;

    return (
      <View style={styles.rankRow}>
        <Text style={styles.rankNumber}>{index + 1}</Text>
        <View style={[styles.avatarCircle, { width: 40, height: 40 }]}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarInitials, { fontSize: 14 }]}>{getInitials(item.firstName, item.lastName)}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
        </View>
        <Text style={styles.userBalance}>₦{item.balance.toLocaleString()}</Text>
      </View>
    );
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
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D285" />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderTopThree}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingVertical: 30,
    paddingHorizontal: 10,
    backgroundColor: '#111827',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  topAvatarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  topRankText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  topName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    marginTop: 10,
  },
  topScore: {
    color: '#00D285',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  rankNumber: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    width: 30,
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  userUsername: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  userBalance: {
    color: '#00D285',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  }
});
