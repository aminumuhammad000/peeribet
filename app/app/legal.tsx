import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Scale,
  ShieldAlert,
  Eye,
  Gavel,
  ChevronDown,
  ChevronUp,
  FileText,
  Mail,
  HeartHandshake
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';

interface PolicySection {
  id: string;
  category: 'terms' | 'privacy' | 'escrow';
  title: string;
  icon: React.ReactNode;
  content: string[];
}

export default function LegalScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<'all' | 'terms' | 'privacy' | 'escrow'>('all');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const policySections: PolicySection[] = [
    {
      id: 'terms1',
      category: 'terms',
      title: '1. Acceptance of Terms',
      icon: <Scale size={18} color={Colors.dark.primary} />,
      content: [
        'By creating an account on Peeritrade, you agree to be bound by these Terms of Service, all applicable laws, and local financial regulations in Nigeria.',
        'If you do not agree with any of these terms, you are prohibited from using or accessing our peer-to-peer escrow services.',
        'We reserve the right to revise these terms at any time. Changes will be posted here and notified via the dashboard.'
      ]
    },
    {
      id: 'terms2',
      category: 'terms',
      title: '2. User Eligibility & Account Security',
      icon: <Gavel size={18} color={Colors.dark.primary} />,
      content: [
        'You must be at least 18 years of age to register and participate in football escrow contracts.',
        'You are solely responsible for safeguarding your login password and transaction PIN.',
        'Peeritrade will never ask for your password or PIN via email or WhatsApp. Any suspicious activity should be reported immediately.'
      ]
    },
    {
      id: 'terms3',
      category: 'terms',
      title: '3. Prohibited Activities',
      icon: <ShieldAlert size={18} color={Colors.dark.primary} />,
      content: [
        'Users are strictly prohibited from utilizing the platform for money laundering, transfer of illicit funds, or coordinate collusive fraud.',
        'Any attempt to exploit match result verification or spoof system data will result in immediate account termination and forfeiture of escrow funds.'
      ]
    },
    {
      id: 'privacy1',
      category: 'privacy',
      title: '1. Information We Collect',
      icon: <Eye size={18} color="#3B82F6" />,
      content: [
        'Personal Details: When you register, we collect your name, email address, and phone number.',
        'KYC Identification: To verify your identity, we collect scans of government-issued IDs (NIN, Driver License, Passport) and confirmation selfies. These files are encrypted at rest.',
        'Financial Logs: We log deposit references, payout accounts, and escrow transaction histories to authorize settlements.'
      ]
    },
    {
      id: 'privacy2',
      category: 'privacy',
      title: '2. Data Security & Storage',
      icon: <FileText size={18} color="#3B82F6" />,
      content: [
        'All sensitive files (identity scans) and user data transfers are secured using AES-256 block encryption and TLS 1.3 protocol channels.',
        'We strictly comply with the Nigeria Data Protection Regulation (NDPR) guidelines regarding document storage and user data privacy.',
        'We do not sell, rent, or distribute personal information or transaction history logs to third-party advertisers.'
      ]
    },
    {
      id: 'escrow1',
      category: 'escrow',
      title: '1. Escrow Mechanics & Protection',
      icon: <HeartHandshake size={18} color="#F59E0B" />,
      content: [
        'Funds initiated into a football contract are locked instantly in Peeritrade’s secure escrow. Neither party can withdraw locked funds unilaterally once a trade begins.',
        'Payouts are released automatically upon official match verification or mutual trade resolution.'
      ]
    },
    {
      id: 'escrow2',
      category: 'escrow',
      title: '2. Platform Trading Fees',
      icon: <Scale size={18} color="#F59E0B" />,
      content: [
        'Peeritrade charges a flat fee of 1.5% on successful contract resolutions (charged to the winner of the escrow trade).',
        'Deposit funding operations are free. Outbound bank transfers carry standard NIP processing fees of ₦20.'
      ]
    },
    {
      id: 'escrow3',
      category: 'escrow',
      title: '3. Dispute Arbitration',
      icon: <Gavel size={18} color="#F59E0B" />,
      content: [
        'In the event of matches being canceled, abandoned, or suspected of collusion, Peeritrade escrow handlers reserve full rights to arbitrate.',
        'Disputed escrows will be frozen until verified official match logs are audited. Funds will be refunded to respective wallets if match validity is compromised.'
      ]
    }
  ];

  const filteredSections = policySections.filter(
    (sec) => activeCategory === 'all' || sec.category === activeCategory
  );

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const handleContactLegal = () => {
    Linking.openURL('mailto:uuhashim0918@gmail.com?subject=Peeritrade%20Legal%20Inquiry');
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
            <Text style={styles.headerTitle}>Legal & Privacy Policy</Text>
            <Text style={styles.headerSubtitle}>Peeritrade rules, terms & data guidelines</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Top Intro Shield */}
          <View style={styles.legalIntroCard}>
            <Scale size={28} color={Colors.dark.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.introTitle}>Regulatory Compliance</Text>
            <Text style={styles.introDesc}>
              Peeritrade operates an escrow clearinghouse service. We ensure safe P2P football contract trades by enforcing compliance, fraud prevention, and strict data privacy.
            </Text>
          </View>

          {/* Category Selector Chips */}
          <View style={styles.chipRow}>
            {[
              { key: 'all', label: 'All Documents' },
              { key: 'terms', label: 'Terms of Service' },
              { key: 'privacy', label: 'Privacy Policy' },
              { key: 'escrow', label: 'Escrow Rules' },
            ].map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.chip,
                  activeCategory === cat.key && styles.chipActive,
                ]}
                onPress={() => {
                  setActiveCategory(cat.key as any);
                  setExpandedSection(null); // Close any expanded section on filter change
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeCategory === cat.key && styles.chipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Accordion Sections */}
          <View style={styles.accordionContainer}>
            {filteredSections.map((section) => {
              const isExpanded = expandedSection === section.id;
              return (
                <View key={section.id} style={styles.policyCard}>
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => toggleSection(section.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.headerTitleContainer}>
                      {section.icon}
                      <Text style={styles.cardTitle}>{section.title}</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={16} color="#64748B" />
                    ) : (
                      <ChevronDown size={16} color="#64748B" />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.cardBody}>
                      {section.content.map((paragraph, index) => (
                        <Text key={index} style={styles.bodyParagraph}>
                          {paragraph}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Quick Support / Contact Card */}
          <View style={styles.legalSupportCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportTitle}>Questions about our rules?</Text>
              <Text style={styles.supportDesc}>
                Contact our compliance handler at uuhashim0918@gmail.com for clarifications.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.supportBtn}
              onPress={handleContactLegal}
              activeOpacity={0.8}
            >
              <Mail size={16} color="#000000" style={{ marginRight: 6 }} />
              <Text style={styles.supportBtnText}>Email</Text>
            </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  legalIntroCard: {
    backgroundColor: 'rgba(0, 210, 133, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 133, 0.15)',
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  introDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    fontFamily: 'Inter',
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#131C32',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 8,
  },
  chipActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(0, 210, 133, 0.05)',
  },
  chipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  chipTextActive: {
    color: Colors.dark.primary,
  },
  accordionContainer: {
    marginTop: 6,
  },
  policyCard: {
    backgroundColor: '#131C32',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginLeft: 10,
  },
  cardBody: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0E1629',
  },
  bodyParagraph: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  legalSupportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131C32',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
  },
  supportTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  supportDesc: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 2,
    lineHeight: 14,
    paddingRight: 6,
  },
  supportBtn: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
});
