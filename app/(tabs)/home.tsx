import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Settings, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('24');

  const dates = [
    { id: '21', day: 'Sun', num: '21' },
    { id: '22', day: 'Mon', num: '22' },
    { id: '23', day: 'Tue', num: '23' },
    { id: '24', day: 'Wed', num: '24' },
    { id: '25', day: 'Thu', num: '25' },
    { id: '26', day: 'Fri', num: '26' },
    { id: '27', day: 'Sat', num: '27' },
  ];

  const promotedMatches = [
    {
      id: '1',
      homeTeam: 'Chelsea',
      awayTeam: 'Arsenal',
      time: 'LIVE IN 3HRS',
      price: '₦85,00',
      pool: '₦8,500',
    },
    {
      id: '2',
      homeTeam: 'Man City',
      awayTeam: 'Liverpool',
      time: 'LIVE IN 3HRS',
      price: '₦78,000',
      pool: '₦78,000',
    },
  ];

  const upcomingMatches = [
    {
      id: '1',
      time: '18:00',
      day: 'Tue',
      homeTeam: 'Dortmund',
      homeLogo: `https://ui-avatars.com/api/?name=DO&background=FFD700&color=000&rounded=true`,
      awayTeam: 'Girona',
      awayLogo: `https://ui-avatars.com/api/?name=GI&background=FF0000&color=fff&rounded=true`,
      odds1: '1.7',
      oddsX: '3.4',
      odds2: '1.8',
      market: '$430',
    },
    {
      id: '2',
      time: '18:00',
      day: 'Tue',
      homeTeam: 'Al itihad',
      homeLogo: `https://ui-avatars.com/api/?name=AL&background=FFD700&color=000&rounded=true`,
      awayTeam: 'AL Nassr',
      awayLogo: `https://ui-avatars.com/api/?name=AN&background=0000FF&color=fff&rounded=true`,
      odds1: '1.7',
      oddsX: '3.4',
      odds2: '1.8',
      market: '$430',
    },
    {
      id: '3',
      time: '18:00',
      day: 'Tue',
      homeTeam: 'Barcelona',
      homeLogo: `https://ui-avatars.com/api/?name=BA&background=0000FF&color=FFD700&rounded=true`,
      awayTeam: 'Madrid',
      awayLogo: `https://ui-avatars.com/api/?name=RM&background=FFFFFF&color=000&rounded=true`,
      odds1: '1.7',
      oddsX: '3.4',
      odds2: '1.8',
      market: '$430',
    },
    {
      id: '4',
      time: '18:00',
      day: 'Tue',
      homeTeam: 'Arsenal',
      homeLogo: `https://ui-avatars.com/api/?name=AR&background=FF0000&color=fff&rounded=true`,
      awayTeam: 'PSG',
      awayLogo: `https://ui-avatars.com/api/?name=PS&background=00008B&color=fff&rounded=true`,
      odds1: '1.7',
      oddsX: '3.4',
      odds2: '1.8',
      market: '$430',
    },
  ];

  return (
    <LinearGradient
      colors={['#0A1124', '#050811']}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Image source={{ uri: 'https://ui-avatars.com/api/?name=HM&background=fff&color=000&size=128&rounded=true' }} style={styles.avatar} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerGreeting}>Hey User</Text>
            <Text style={styles.headerSub}>Ready to trade?</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Settings size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={18} color="#64748B" />
            <TextInput 
              placeholder="Browse matches...." 
              placeholderTextColor="#64748B" 
              style={styles.searchInput}
            />
          </View>

          {/* Calendar row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarScroll}>
            {dates.map((item) => {
              const isSelected = selectedDate === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedDate(item.id)}
                  activeOpacity={0.8}
                  style={[styles.calendarBox, isSelected && styles.calendarBoxActive]}
                >
                  <Text style={[styles.calendarDay, isSelected && styles.calendarTextActive]}>{item.day}</Text>
                  <Text style={[styles.calendarNum, isSelected && styles.calendarTextActive]}>{item.num}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Promoted Matches */}
          <View style={styles.promotedContainer}>
            {promotedMatches.map((match) => (
              <View key={match.id} style={styles.promotedCard}>
                <View style={styles.promotedTop}>
                  <View style={styles.liveTag}>
                    <Text style={styles.liveTagText}>{match.time}</Text>
                  </View>
                  <Text style={styles.dots}>•••</Text>
                </View>
                
                <View style={styles.promotedTitleRow}>
                  <View>
                    <Text style={styles.promotedMatchTitle}>{match.homeTeam} vs {match.awayTeam}</Text>
                    <Text style={styles.promotedSub}>Market Match Outcome</Text>
                  </View>
                  <Text style={styles.promotedPrice}>{match.price}</Text>
                </View>

                <View style={styles.bulletsRow}>
                  <View style={styles.bulletItem}><View style={styles.bulletDot}/><Text style={styles.bulletText}>Match Outcome</Text></View>
                  <View style={styles.bulletItem}><View style={styles.bulletDot}/><Text style={styles.bulletText}>Over/Under</Text></View>
                  <View style={styles.bulletItem}><View style={styles.bulletDot}/><Text style={styles.bulletText}>BTS</Text></View>
                </View>

                <TouchableOpacity 
                  onPress={() => router.push({
                    pathname: '/match-detail',
                    params: { homeTeam: match.homeTeam, awayTeam: match.awayTeam },
                  })}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#00D285', '#00A368']}
                    style={styles.enterButton}
                  >
                    <Text style={styles.enterButtonText}>Enter Match</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.poolText}>Pool . <Text style={styles.poolAmount}>{match.pool}</Text></Text>
              </View>
            ))}
          </View>

          {/* Upcoming Matches Header */}
          <View style={styles.upcomingHeaderRow}>
            <Text style={styles.upcomingTitle}>Up Coming <Text style={styles.upcomingTitleLight}>Matches</Text></Text>
            <View style={styles.allFootballBtn}>
              <Text style={styles.allFootballText}>All Football</Text>
            </View>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { width: 40 }]}>Date</Text>
            <Text style={[styles.thText, { flex: 1, paddingLeft: 10 }]}>Stats</Text>
            <Text style={[styles.thText, { width: 90, textAlign: 'center' }]}>Draw</Text>
            <Text style={[styles.thText, { flex: 1 }]}></Text>
            <Text style={[styles.thText, { width: 40, textAlign: 'right' }]}>Market</Text>
          </View>

          {/* Upcoming List */}
          <View style={styles.upcomingList}>
            {upcomingMatches.map((match) => (
              <TouchableOpacity 
                key={match.id} 
                style={styles.upcomingRow}
                onPress={() => router.push({
                  pathname: '/match-detail',
                  params: { homeTeam: match.homeTeam, awayTeam: match.awayTeam },
                })}
              >
                <View style={styles.dateCol}>
                  <Text style={styles.upcomingTime}>{match.time}</Text>
                  <Text style={styles.upcomingDay}>{match.day}</Text>
                </View>

                <View style={styles.teamColLeft}>
                  <Text style={styles.teamTextLeft} numberOfLines={1}>{match.homeTeam}</Text>
                </View>
                
                <Image source={{ uri: match.homeLogo }} style={styles.rowLogo} />

                <View style={styles.oddsContainer}>
                  <View style={styles.oddsBox}><Text style={styles.oddsText}>{match.odds1}</Text></View>
                  <View style={styles.oddsBox}><Text style={styles.oddsText}>{match.oddsX}</Text></View>
                  <View style={styles.oddsBox}><Text style={styles.oddsText}>{match.odds2}</Text></View>
                </View>

                <Image source={{ uri: match.awayLogo }} style={styles.rowLogo} />
                
                <View style={styles.teamColRight}>
                  <Text style={styles.teamTextRight} numberOfLines={1}>{match.awayTeam}</Text>
                </View>

                <Text style={styles.marketText}>{match.market}</Text>
              </TouchableOpacity>
            ))}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerSub: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  iconButton: {
    marginLeft: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131C32', // slightly lighter than bg
    marginHorizontal: 20,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  calendarScroll: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  calendarBox: {
    width: 52,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  calendarBoxActive: {
    backgroundColor: '#3B82F6',
  },
  calendarDay: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  calendarNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
  calendarTextActive: {
    color: '#FFFFFF',
  },
  promotedContainer: {
    paddingHorizontal: 20,
  },
  promotedCard: {
    backgroundColor: '#1E294B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  promotedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveTag: {
    backgroundColor: 'rgba(0, 210, 133, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveTagText: {
    color: '#00D285',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  dots: {
    color: '#00D285',
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  promotedTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  promotedMatchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  promotedSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
  promotedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  bulletsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D285',
    marginRight: 6,
  },
  bulletText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontFamily: 'Inter',
  },
  enterButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  enterButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  poolText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  poolAmount: {
    color: '#00D285',
    fontWeight: 'bold',
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  upcomingTitleLight: {
    color: '#94A3B8',
    fontWeight: 'normal',
  },
  allFootballBtn: {
    backgroundColor: '#302b28', // Dark yellowish-brown for the button as seen in image
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  allFootballText: {
    fontSize: 12,
    color: '#BDB3A6',
    fontFamily: 'Inter',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2A3441', // Dark grey banner
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  thText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  upcomingList: {
    paddingHorizontal: 20,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dateCol: {
    width: 40,
  },
  upcomingTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  upcomingDay: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
  },
  teamColLeft: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  teamTextLeft: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'right',
  },
  rowLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  oddsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  oddsBox: {
    width: 28,
    height: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  oddsText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Inter',
  },
  teamColRight: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  teamTextRight: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  marketText: {
    width: 40,
    textAlign: 'right',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
});
