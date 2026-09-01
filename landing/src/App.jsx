import { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Zap,
  Users,
  CheckCircle2,
  Activity,
  ArrowLeftRight,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Menu,
  X,
  Clock,
  Award,
  Check
} from 'lucide-react';
import logo from './assets/logo.png';
import './index.css';

const stats = [
  { value: '₦4.8B+', label: 'Escrow Volume Settled' },
  { value: '120K+', label: 'Verified Traders' },
  { value: '< 2.5s', label: 'Automated Settlement' },
  { value: '99.99%', label: 'Dispute-Free Rate' },
];

const howItWorks = [
  {
    step: '01',
    title: 'Match & Agree',
    desc: 'Select upcoming football matches, set your trade terms, or accept an existing peer offer from the order book.',
  },
  {
    step: '02',
    title: 'Escrow Lock',
    desc: 'Both parties lock trade stakes in a transparent automated escrow vault before kickoff. No IOUs or trust required.',
  },
  {
    step: '03',
    title: 'Instant Payout',
    desc: 'Official match results automatically trigger the escrow release. Funds credit immediately to your bank or wallet.',
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Automated Escrow Engine',
    desc: 'Smart contract logic securely holds 100% of trade funds until official match completion, eliminating counterparty default.',
  },
  {
    icon: Zap,
    title: 'Sub-Second Settlement',
    desc: 'Automated sports data oracles confirm results in real time, executing instant payouts directly to winning balances.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Direct Peer Liquidity',
    desc: 'Trade directly against other users at your chosen odds. Enjoy zero broker spreads and complete pricing transparency.',
  },
  {
    icon: Lock,
    title: 'Institutional Vault Security',
    desc: 'Multi-layer cold reserve architectures and 256-bit encryption keep all deposited funds safe 24/7/365.',
  },
  {
    icon: Users,
    title: 'Verified Trader Reputation',
    desc: 'Comprehensive KYC verification and on-chain trust scores ensure every trade counterparty is authentic.',
  },
  {
    icon: Activity,
    title: 'Live Real-Time Auditing',
    desc: 'Every trade, escrow lock, and settlement is logged with cryptographic hashes for complete accountability.',
  },
];

const liveMarkets = [
  {
    id: 1,
    league: 'Premier League',
    match: 'Arsenal vs Chelsea',
    time: 'Today • 20:00',
    type: 'Match Winner: Arsenal',
    volume: '₦14.2M',
    odds: '2.10',
    status: 'MATCHING',
  },
  {
    id: 2,
    league: 'UEFA Champions League',
    match: 'Real Madrid vs Bayern Munich',
    time: 'Tomorrow • 21:00',
    type: 'Over 2.5 Goals',
    volume: '₦28.5M',
    odds: '1.85',
    status: 'ACTIVE',
  },
  {
    id: 3,
    league: 'La Liga',
    match: 'Barcelona vs Atletico Madrid',
    time: 'Sun • 19:30',
    type: 'Both Teams to Score',
    volume: '₦9.6M',
    odds: '1.92',
    status: 'ACTIVE',
  },
];

const faqs = [
  {
    q: 'How does the Peeritrade escrow mechanism work?',
    a: 'When you create or join a trade, both participants deposit their stakes into an automated, tamper-proof escrow vault. The funds remain locked until official match data is verified, at which point the entire pool is automatically distributed to the winner.',
  },
  {
    q: 'Is there any counterparty default risk?',
    a: 'None. Because trades require 100% upfront collateral locked in escrow before a match begins, you never have to worry about a losing party failing to pay out.',
  },
  {
    q: 'How fast can I withdraw my winnings?',
    a: 'Settlements occur automatically within seconds of final whistle confirmation. You can withdraw your balance directly to your linked Nigerian bank account with instant settlement processing.',
  },
  {
    q: 'What fees are charged on trades?',
    a: 'Peeritrade charges a minimal flat platform fee (typically 1.5%) only on settled winning payouts. Listing trades, browsing markets, and deposits are 100% free.',
  },
];

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="landing-app">
      {/* Background ambient lighting effects matching Admin */}
      <div className="ambient-glow glow-top-left" />
      <div className="ambient-glow glow-center-right" />
      <div className="grid-overlay" />

      {/* Header / Navbar */}
      <header className="navbar-container">
        <nav className="navbar">
          <a href="#" className="brand-link">
            <div className="brand-logo-box">
              <img src={logo} alt="Peeritrade Logo" className="brand-logo-img" />
            </div>
            <div className="brand-text-wrap">
              <span className="brand-title">Peeritrade</span>
              <span className="brand-subtitle">Escrow Trading</span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <div className="nav-menu">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#markets" className="nav-link">Live Markets</a>
            <a href="#security" className="nav-link">Security</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>

          {/* Nav Actions */}
          <div className="nav-actions">
            <a href="/admin" className="btn-ghost">
              Admin Portal
            </a>
            <a href="#cta" className="btn-primary">
              <span>Start Trading</span>
              <ArrowRight size={15} />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-menu-dropdown">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
            <a href="#markets" onClick={() => setMobileMenuOpen(false)}>Live Markets</a>
            <a href="#security" onClick={() => setMobileMenuOpen(false)}>Security</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <div className="mobile-nav-buttons">
              <a href="/admin" className="btn-ghost w-full">Admin Portal</a>
              <a href="#cta" className="btn-primary w-full" onClick={() => setMobileMenuOpen(false)}>
                Start Trading <ArrowRight size={15} />
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot" />
              <ShieldCheck size={14} className="badge-icon" />
              <span>Next-Gen Peer-to-Peer Escrow Platform</span>
            </div>

            <h1 className="hero-headline">
              Trade Football Markets With <span className="gradient-text">Zero Counterparty Risk.</span>
            </h1>

            <p className="hero-subtext">
              The minimalist, secure escrow network where peer-to-peer sports traders lock collateral, agree on odds, and receive instant automated payouts.
            </p>

            <div className="hero-cta-row">
              <a href="#cta" className="btn-primary btn-large">
                <span>Open Escrow Account</span>
                <ArrowRight size={18} />
              </a>
              <a href="#how-it-works" className="btn-secondary btn-large">
                <span>See How It Works</span>
              </a>
            </div>

            <div className="hero-trust-bar">
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" />
                <span>100% Locked Collateral</span>
              </div>
              <div className="trust-item">
                <Zap size={16} className="trust-icon" />
                <span>Instant Bank Payouts</span>
              </div>
              <div className="trust-item">
                <Lock size={16} className="trust-icon" />
                <span>Non-Custodial Escrow</span>
              </div>
            </div>
          </div>

          {/* Hero Live Mockup Visual Card */}
          <div className="hero-visual-wrapper">
            <div className="escrow-card-glass">
              {/* Card Header */}
              <div className="escrow-card-header">
                <div className="escrow-card-badge">
                  <span className="pulsing-green-dot" />
                  <span>ESCROW ACTIVE • #TRD-8842</span>
                </div>
                <span className="escrow-league-tag">Premier League</span>
              </div>

              {/* Match Header */}
              <div className="escrow-match-title">
                <h3>Arsenal vs Chelsea</h3>
                <p className="escrow-market-tag">Market: Arsenal to Win (Full Time)</p>
              </div>

              {/* Parties VS Row */}
              <div className="escrow-parties-row">
                <div className="party-box initiator">
                  <div className="party-avatar">IM</div>
                  <div className="party-details">
                    <span className="party-role">Initiator</span>
                    <strong className="party-name">Ibrahim M.</strong>
                    <span className="party-pick text-primary">Arsenal Win (2.05x)</span>
                  </div>
                  <span className="party-stake">₦50,000</span>
                </div>

                <div className="parties-vs-divider">
                  <div className="vs-circle">
                    <ArrowLeftRight size={14} />
                  </div>
                </div>

                <div className="party-box responder">
                  <div className="party-avatar blue">CO</div>
                  <div className="party-details">
                    <span className="party-role">Counterparty</span>
                    <strong className="party-name">Chukwuemeka O.</strong>
                    <span className="party-pick text-blue">Chelsea or Draw</span>
                  </div>
                  <span className="party-stake">₦50,000</span>
                </div>
              </div>

              {/* Escrow Pool Status Indicator */}
              <div className="escrow-status-box">
                <div className="escrow-status-top">
                  <div className="escrow-status-label">
                    <Lock size={14} className="text-primary" />
                    <span>Total Vault Reserve Locked</span>
                  </div>
                  <strong className="escrow-status-val">₦100,000.00</strong>
                </div>
                <div className="escrow-progress-bar">
                  <div className="escrow-progress-fill" />
                </div>
                <div className="escrow-status-meta">
                  <span>Vault: 0x8a92...4b31</span>
                  <span className="text-primary">Status: Secured in Escrow</span>
                </div>
              </div>

              {/* Card Footer Features */}
              <div className="escrow-card-footer">
                <div className="footer-feature">
                  <Award size={14} className="text-primary" />
                  <span>Oracle Automated</span>
                </div>
                <div className="footer-feature">
                  <Clock size={14} className="text-primary" />
                  <span>Auto-Settles in &lt; 2s</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="stats-section">
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card">
                <strong className="stat-value">{stat.value}</strong>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="section-container">
          <div className="section-header-center">
            <span className="section-pill">Frictionless Flow</span>
            <h2 className="section-title">How Peeritrade Escrow Works</h2>
            <p className="section-subtitle">
              Three transparent steps to trade securely without middlemen or counterparty default risk.
            </p>
          </div>

          <div className="steps-grid">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="step-card">
                <div className="step-number">{item.step}</div>
                <h3 className="step-title">{item.title}</h3>
                <p className="step-desc">{item.desc}</p>
                <div className="step-line" />
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid Section */}
        <section id="features" className="section-container">
          <div className="section-header-center">
            <span className="section-pill">Platform Highlights</span>
            <h2 className="section-title">Engineered for Transparency & Speed</h2>
            <p className="section-subtitle">
              Every detail is designed to deliver minimal friction, maximum security, and rapid settlements.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="feature-box">
                  <div className="feature-icon-wrapper">
                    <Icon size={22} className="feature-icon" />
                  </div>
                  <h3 className="feature-box-title">{feature.title}</h3>
                  <p className="feature-box-desc">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Markets Section */}
        <section id="markets" className="section-container">
          <div className="section-header-row">
            <div>
              <span className="section-pill">Live Liquidity</span>
              <h2 className="section-title">Active Market Contracts</h2>
              <p className="section-subtitle">
                Explore real-time peer-to-peer match markets ready for immediate escrow matching.
              </p>
            </div>
            <a href="#cta" className="btn-secondary btn-sm">
              <span>View All Markets</span>
              <ChevronRight size={16} />
            </a>
          </div>

          <div className="markets-table-container">
            <div className="markets-table-header">
              <span>Match & League</span>
              <span>Market Contract</span>
              <span>Matched Odds</span>
              <span>Escrow Volume</span>
              <span className="text-right">Action</span>
            </div>

            {liveMarkets.map((m) => (
              <div key={m.id} className="market-table-row">
                <div className="market-cell-match">
                  <span className="market-league-tag">{m.league}</span>
                  <strong className="market-fixture-name">{m.match}</strong>
                  <span className="market-time-text">{m.time}</span>
                </div>

                <div className="market-cell-type">
                  <span className="type-badge">{m.type}</span>
                </div>

                <div className="market-cell-odds">
                  <span className="odds-value">{m.odds}</span>
                </div>

                <div className="market-cell-vol">
                  <strong className="vol-text">{m.volume}</strong>
                  <span className="vol-sub">locked</span>
                </div>

                <div className="market-cell-action text-right">
                  <a href="#cta" className="btn-take-order">
                    <span>Join Trade</span>
                    <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Security & Vault Architecture Section */}
        <section id="security" className="section-container">
          <div className="security-banner-card">
            <div className="security-content">
              <span className="section-pill">Institutional Grade</span>
              <h2 className="security-title">Institutional Protection for Every Stake</h2>
              <p className="security-desc">
                Your capital is protected with multi-signature cold vault reserves, automated smart settlement contracts, and continuous cryptographic security verification.
              </p>

              <div className="security-checklist">
                <div className="checklist-item">
                  <div className="check-icon-circle"><Check size={14} /></div>
                  <span>100% Pre-funded escrow guarantees immediate payout execution</span>
                </div>
                <div className="checklist-item">
                  <div className="check-icon-circle"><Check size={14} /></div>
                  <span>Official sports oracle integrations for zero-dispute outcome verification</span>
                </div>
                <div className="checklist-item">
                  <div className="check-icon-circle"><Check size={14} /></div>
                  <span>End-to-end 256-bit encryption with continuous administrative audit trails</span>
                </div>
              </div>
            </div>

            <div className="security-graphic-panel">
              <div className="vault-visual-box">
                <div className="vault-visual-icon">
                  <ShieldCheck size={48} className="text-primary" />
                </div>
                <strong className="vault-title">Escrow Vault Engine</strong>
                <span className="vault-sub">Automated & Audited 24/7</span>
                <div className="vault-indicator">
                  <span className="pulsing-green-dot" />
                  <span>Zero Default Risk Architecture</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="section-container">
          <div className="section-header-center">
            <span className="section-pill">Got Questions?</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Clear, straightforward answers about our peer-to-peer escrow infrastructure.
            </p>
          </div>

          <div className="faq-container">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item ${activeFaq === idx ? 'open' : ''}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`faq-chevron ${activeFaq === idx ? 'rotated' : ''}`}
                  />
                </div>
                {activeFaq === idx && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Banner */}
        <section id="cta" className="cta-section">
          <div className="cta-card">
            <div className="cta-content">
              <span className="section-pill">Get Started Today</span>
              <h2 className="cta-heading">Ready for Zero Counterparty Risk?</h2>
              <p className="cta-subheading">
                Join thousands of verified sports traders on Nigeria's premier peer-to-peer escrow network.
              </p>
              <div className="cta-buttons-row">
                <a href="#cta" className="btn-primary btn-large">
                  <span>Create Free Account</span>
                  <ArrowRight size={18} />
                </a>
                <a href="/admin" className="btn-ghost btn-large">
                  <span>Admin Terminal</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Minimalist Footer */}
      <footer className="footer-container">
        <div className="footer-top">
          <div className="footer-brand-col">
            <a href="#" className="brand-link">
              <div className="brand-logo-box">
                <img src={logo} alt="Peeritrade Logo" className="brand-logo-img" />
              </div>
              <div className="brand-text-wrap">
                <span className="brand-title">Peeritrade</span>
                <span className="brand-subtitle">Escrow Trading</span>
              </div>
            </a>
            <p className="footer-brand-desc">
              The premier peer-to-peer escrow football trading platform. Transparent, automated, and instant.
            </p>
          </div>

          <div className="footer-nav-grid">
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#markets">Live Markets</a>
              <a href="#security">Vault Security</a>
            </div>

            <div className="footer-col">
              <h4>Resources</h4>
              <a href="#faq">FAQ</a>
              <a href="/admin">Admin Access</a>
              <a href="#security">Audit Reports</a>
              <a href="#how-it-works">Escrow Rules</a>
            </div>

            <div className="footer-col">
              <h4>Legal & Compliance</h4>
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">KYC Verification</a>
              <a href="#">Responsible Trading</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Peeritrade. All rights reserved.</p>
          <div className="footer-status-tag">
            <span className="pulsing-green-dot" />
            <span>All Systems Operational • Escrow Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
