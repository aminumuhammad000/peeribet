import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Mail,
  Ticket,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  HelpCircle,
  AlertCircle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { supportService } from '../services/apiService';

// Type definitions
interface FAQItem {
  id: string;
  category: 'general' | 'security' | 'wallet' | 'escrow';
  question: string;
  answer: string;
}

interface SupportTicket {
  _id: string;
  subject: string;
  category: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  createdAt: string;
}

export default function HelpdeskScreen() {
  const router = useRouter();
  
  // Navigation & Tabs state (AI tab removed)
  const [activeTab, setActiveTab] = useState<'faq' | 'support'>('faq');

  // FAQ Tab States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // Support Tickets States
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Deposit');
  const [ticketDetails, setTicketDetails] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

  React.useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const data = await supportService.getTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // FAQ Database
  const faqs: FAQItem[] = [
    {
      id: 'faq1',
      category: 'general',
      question: 'What is Peeritrade?',
      answer: 'Peeritrade is a secure escrow-based peer-to-peer football trading platform where you can safely lock, trade, and withdraw funds with zero-risk escrow protection.',
    },
    {
      id: 'faq2',
      category: 'escrow',
      question: 'How does the Escrow process work?',
      answer: "When a trade is initiated, the funds are held securely in Peeritrade's smart escrow. Once the trade conditions are met (e.g., match results are verified), the funds are automatically released to the winner. This prevents scams and guarantees payouts.",
    },
    {
      id: 'faq3',
      category: 'wallet',
      question: 'How do I deposit funds into my wallet?',
      answer: 'Go to the Wallet tab, click "Fund Wallet", enter the amount, and choose your preferred payment method (Bank Transfer, Card, or USSD). Transactions are credited instantly in most cases.',
    },
    {
      id: 'faq4',
      category: 'wallet',
      question: 'Why is my deposit pending?',
      answer: "Bank transfers can sometimes experience delays due to network congestion. If your deposit is not credited within 30 minutes, please contact support via WhatsApp (09044922410 or 09137148568) with your transaction receipt for manual funding.",
    },
    {
      id: 'faq5',
      category: 'wallet',
      question: 'How do I withdraw my earnings?',
      answer: 'Navigate to the Wallet page, click "Withdraw", enter the amount and your bank details. Withdrawals are processed instantly and usually arrive in your bank account within minutes.',
    },
    {
      id: 'faq6',
      category: 'security',
      question: 'How do I verify my account (KYC)?',
      answer: "Click 'Identity Verification' on your Profile page. Upload a valid government-issued ID (NIN, Driver's License, or Passport) in the identity verification panel.",
    },
    {
      id: 'faq7',
      category: 'security',
      question: 'Are my funds and personal data secure?',
      answer: 'Absolutely. We use bank-grade AES-256 encryption to protect your data and all funds are secured using multi-sig escrow contracts.',
    },
    {
      id: 'faq8',
      category: 'escrow',
      question: 'What are the charges/fees per trade?',
      answer: 'Peeritrade charges a flat 1.5% fee on completed escrow trades. There are no fees for deposits, and standard bank transfer charges apply for withdrawals.',
    },
  ];

  // Filtering FAQs based on Search & Category
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Toggle FAQ expansion
  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  // WhatsApp Linking
  const openWhatsApp = (phone: string) => {
    let formatted = phone.replace(/[^0-9]/g, '');
    if (formatted.startsWith('0')) {
      formatted = '234' + formatted.substring(1);
    }
    const url = `https://wa.me/${formatted}?text=Hello%20Peeritrade%20Support,%20I%20need%20help%20with...`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${formatted}`);
    });
  };

  // Email Linking
  const openEmail = () => {
    Linking.openURL('mailto:uuhashim0918@gmail.com?subject=Peeritrade%20Support%20Request');
  };

  // Submit Support Ticket
  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketDetails.trim()) return;

    try {
      const response = await supportService.createTicket({
        subject: ticketSubject,
        category: ticketCategory,
        description: ticketDetails
      });

      setTickets((prev) => [response, ...prev]);
      setTicketSubject('');
      setTicketDetails('');
      setTicketSuccess(true);

      // Auto clear success message after 4 seconds
      setTimeout(() => setTicketSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to submit ticket', err);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundGradStart, Colors.dark.backgroundGradEnd]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>FAQ & Helpdesk</Text>
            <Text style={styles.headerSubtitle}>We are online to support you 24/7</Text>
          </View>
          <View style={styles.badgeOnline}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>

        {/* Tab Selection (AI tab removed) */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'faq' && styles.activeTabButton]}
            onPress={() => { setActiveTab('faq'); Keyboard.dismiss(); }}
            activeOpacity={0.8}
          >
            <HelpCircle size={16} color={activeTab === 'faq' ? '#FFFFFF' : '#64748B'} style={styles.tabIcon} />
            <Text style={[styles.tabText, activeTab === 'faq' && styles.activeTabText]}>FAQ Guide</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'support' && styles.activeTabButton]}
            onPress={() => { setActiveTab('support'); Keyboard.dismiss(); }}
            activeOpacity={0.8}
          >
            <MessageSquare size={16} color={activeTab === 'support' ? '#FFFFFF' : '#64748B'} style={styles.tabIcon} />
            <Text style={[styles.tabText, activeTab === 'support' && styles.activeTabText]}>Live Support</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ TAB */}
        {activeTab === 'faq' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContentScroll}>
            {/* Search Bar */}
            <View style={styles.searchBox}>
              <Search size={18} color="#64748B" style={styles.searchIcon} />
              <TextInput
                placeholder="Search queries, escrow, deposits..."
                placeholderTextColor="#64748B"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Category Pills */}
            <View style={styles.categoryContainer}>
              {[
                { key: 'all', label: 'All FAQs' },
                { key: 'general', label: 'General' },
                { key: 'escrow', label: 'Escrow' },
                { key: 'wallet', label: 'Wallet' },
                { key: 'security', label: 'Security' },
              ].map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryPill,
                    selectedCategory === cat.key && styles.activeCategoryPill,
                  ]}
                  onPress={() => setSelectedCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat.key && styles.activeCategoryText,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* FAQ List */}
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedFAQ === faq.id;
                return (
                  <TouchableOpacity
                    key={faq.id}
                    style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
                    onPress={() => toggleFAQ(faq.id)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.faqHeader}>
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                      {isExpanded ? (
                        <ChevronUp size={18} color={Colors.dark.primary} />
                      ) : (
                        <ChevronDown size={18} color="#64748B" />
                      )}
                    </View>
                    {isExpanded && (
                      <View style={styles.faqAnswerContainer}>
                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <AlertCircle size={40} color="#64748B" />
                <Text style={styles.emptyText}>No matching FAQ found.</Text>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  <Text style={styles.resetButtonText}>Reset Filters</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        )}

        {/* LIVE SUPPORT TAB */}
        {activeTab === 'support' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContentScroll}>
            {/* WhatsApp & Email Direct Links */}
            <Text style={styles.supportSectionTitle}>Direct Contact Channels</Text>
            <Text style={styles.supportSectionSub}>Tap to start an instant discussion with our official handlers</Text>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => openWhatsApp('09044922410')}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIconBg, { backgroundColor: '#128C7E' }]}>
                <MessageCircle size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.contactMethod}>WhatsApp Support 1</Text>
                <Text style={styles.contactValue}>09044922410</Text>
                <Text style={styles.contactAvailability}>Avg. reply: under 2 mins</Text>
              </View>
              <ExternalLink size={18} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => openWhatsApp('09137148568')}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIconBg, { backgroundColor: '#128C7E' }]}>
                <MessageCircle size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.contactMethod}>WhatsApp Support 2</Text>
                <Text style={styles.contactValue}>09137148568</Text>
                <Text style={styles.contactAvailability}>Backup active support channel</Text>
              </View>
              <ExternalLink size={18} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={openEmail}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIconBg, { backgroundColor: Colors.dark.electricBlue }]}>
                <Mail size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.contactMethod}>Official Support Email</Text>
                <Text style={styles.contactValue}>uuhashim0918@gmail.com</Text>
                <Text style={styles.contactAvailability}>Responses within 4 hours</Text>
              </View>
              <ExternalLink size={18} color="#64748B" />
            </TouchableOpacity>

            {/* Create Support Ticket */}
            <View style={styles.ticketFormContainer}>
              <View style={styles.ticketFormHeader}>
                <Ticket size={20} color={Colors.dark.primary} style={{ marginRight: 8 }} />
                <Text style={styles.ticketFormTitle}>Log a Support Ticket</Text>
              </View>
              <Text style={styles.ticketFormDesc}>
                If you have complex issues, log a ticket below. Our developers and admins will track this directly.
              </Text>

              {ticketSuccess && (
                <View style={styles.ticketAlertSuccess}>
                  <CheckCircle2 size={16} color={Colors.dark.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.ticketAlertText}>Ticket logged successfully! Checked in history below.</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Issue Category</Text>
              <View style={styles.ticketCategoryRow}>
                {['Deposit', 'Withdrawal', 'Trade', 'KYC Verification'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.ticketCatPill,
                      ticketCategory === cat && styles.ticketCatPillActive,
                    ]}
                    onPress={() => setTicketCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.ticketCatText,
                        ticketCategory === cat && styles.ticketCatTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Subject / Headline</Text>
              <TextInput
                placeholder="Brief summary of the issue..."
                placeholderTextColor="#64748B"
                style={styles.ticketInput}
                value={ticketSubject}
                onChangeText={setTicketSubject}
              />

              <Text style={styles.inputLabel}>Detailed Description</Text>
              <TextInput
                placeholder="Explain what happened. Include dates, transaction IDs, or match details if applicable..."
                placeholderTextColor="#64748B"
                style={[styles.ticketInput, styles.ticketInputArea]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={ticketDetails}
                onChangeText={setTicketDetails}
              />

              <TouchableOpacity
                style={[
                  styles.ticketSubmitBtn,
                  (!ticketSubject.trim() || !ticketDetails.trim()) && styles.ticketSubmitBtnDisabled,
                ]}
                onPress={handleSubmitTicket}
                disabled={!ticketSubject.trim() || !ticketDetails.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.ticketSubmitBtnText}>Submit Support Ticket</Text>
              </TouchableOpacity>
            </View>

            {/* Ticket History */}
            <Text style={[styles.supportSectionTitle, { marginTop: 24 }]}>Your Ticket Logs</Text>
            <Text style={styles.supportSectionSub}>Track and check state of all your logged tickets</Text>

            {tickets.map((tkt) => (
              <View key={tkt._id} style={styles.ticketLogCard}>
                <View style={styles.tktHeader}>
                  <View>
                    <Text style={styles.tktId}>TKT-{tkt._id.substring(tkt._id.length - 4).toUpperCase()}</Text>
                    <Text style={styles.tktSubject}>{tkt.subject}</Text>
                  </View>
                  <View
                    style={[
                      styles.tktBadge,
                      tkt.status === 'Resolved'
                        ? styles.tktBadgeResolved
                        : tkt.status === 'In Progress'
                        ? styles.tktBadgeProgress
                        : styles.tktBadgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tktBadgeText,
                        tkt.status === 'Resolved'
                          ? styles.tktBadgeTextResolved
                          : tkt.status === 'In Progress'
                          ? styles.tktBadgeTextProgress
                          : styles.tktBadgeTextPending,
                      ]}
                    >
                      {tkt.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.tktDivider} />

                <Text style={styles.tktDesc}>{tkt.description}</Text>

                <View style={styles.tktFooter}>
                  <Text style={styles.tktMeta}>Category: <Text style={{ color: '#FFFFFF' }}>{tkt.category}</Text></Text>
                  <Text style={styles.tktMeta}>Date: <Text style={{ color: '#FFFFFF' }}>{new Date(tkt.createdAt).toLocaleDateString()}</Text></Text>
                </View>
              </View>
            ))}
          </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#131C32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  badgeOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 133, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.primary,
    marginRight: 5,
  },
  onlineText: {
    fontSize: 10,
    color: Colors.dark.primary,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#070C1B',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: '#131C32',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContentScroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131C32',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    height: 44,
    marginTop: 18,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: '#131C32',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 8,
  },
  activeCategoryPill: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(0, 210, 133, 0.05)',
  },
  categoryText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  activeCategoryText: {
    color: Colors.dark.primary,
  },
  faqCard: {
    backgroundColor: '#131C32',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 8,
  },
  faqCardExpanded: {
    borderColor: '#334155',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    flex: 1,
    paddingRight: 10,
  },
  faqAnswerContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  faqAnswer: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    fontFamily: 'Inter',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'Inter',
    marginTop: 10,
    marginBottom: 14,
  },
  resetButton: {
    backgroundColor: '#1E294B',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  contactShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 133, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.15)',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    marginBottom: 10,
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  supportSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginTop: 18,
  },
  supportSectionSub: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 3,
    marginBottom: 14,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131C32',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  contactIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactMethod: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  contactValue: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  contactAvailability: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 1,
  },
  ticketFormContainer: {
    backgroundColor: '#131C32',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginTop: 14,
  },
  ticketFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketFormTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  ticketFormDesc: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    fontFamily: 'Inter',
    marginBottom: 14,
  },
  ticketAlertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 133, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  ticketAlertText: {
    color: Colors.dark.primary,
    fontSize: 11,
    fontFamily: 'Inter',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 6,
    fontFamily: 'Inter',
    marginTop: 10,
  },
  ticketCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  ticketCatPill: {
    backgroundColor: '#0A1124',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  ticketCatPillActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(0, 210, 133, 0.05)',
  },
  ticketCatText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  ticketCatTextActive: {
    color: Colors.dark.primary,
  },
  ticketInput: {
    backgroundColor: '#0A1124',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 10,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  ticketInputArea: {
    height: 72,
    paddingVertical: 8,
  },
  ticketSubmitBtn: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ticketSubmitBtnDisabled: {
    backgroundColor: '#1E293B',
    opacity: 0.5,
  },
  ticketSubmitBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  ticketLogCard: {
    backgroundColor: '#131C32',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 8,
  },
  tktHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tktId: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  tktSubject: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  tktBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  tktBadgeResolved: {
    backgroundColor: 'rgba(0, 210, 133, 0.08)',
    borderColor: 'rgba(0, 210, 133, 0.2)',
  },
  tktBadgeProgress: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  tktBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  tktBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Inter',
  },
  tktBadgeTextResolved: {
    color: Colors.dark.primary,
  },
  tktBadgeTextProgress: {
    color: '#3B82F6',
  },
  tktBadgeTextPending: {
    color: '#F59E0B',
  },
  tktDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 10,
  },
  tktDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
    fontFamily: 'Inter',
  },
  tktFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  tktMeta: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: 'Inter',
  },
});
