import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Zap,
  CheckCircle2,
  ArrowLeftRight,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Menu,
  X,
  Clock,
  Check,
  EyeOff,
  Coins,
  GitBranch
} from 'lucide-react';
import logo from './assets/logo.png';
import './index.css';

const APP_URL = 'https://app.peeritrade.com/';

const stats = [
  { value: '₦1K = 1 Coin', label: 'Standardized Coin Matching' },
  { value: '100% Blind', label: 'Both Parties Identity-Hidden' },
  { value: '2x Return', label: 'Doubled Payout on Settlement' },
  { value: 'Pool Branch', label: 'Auto-Backup for Unmatched' },
];

const howItWorks = [
  {
    step: '01',
    title: 'Trade in Coins (₦1,000 = 1 Coin)',
    desc: 'Every ₦1k equals 1 Coin (e.g. 50 coins = ₦50,000). Standardizing trades into coins makes matching effortless instead of waiting for someone to match an exact lump sum.',
  },
  {
    step: '02',
    title: 'Blind Matching by App',
    desc: 'You just place your trade and simply wait for the app to match you. The engine pairs your coins against opposing traders. Both parties never know who they are matched with.',
  },
  {
    step: '03',
    title: '2x Double Payout & Pool Branch',
    desc: 'After the game settles, everyone gets their double (2x) based on how much they traded. Any coins that were not matched automatically branch to the Pool Trading option!',
  },
];

const features = [
  {
    icon: Coins,
    title: 'Standardized Coins (₦1,000 = 1 Coin)',
    desc: 'Every ₦1,000 equals 1 Coin. Instead of waiting for one person to stake your exact lump sum, trades match coin-by-coin across peers for lightning-fast pairing.',
  },
  {
    icon: EyeOff,
    title: 'Blind Matching (Zero Identity Exposure)',
    desc: 'Both parties never know who they are matched with. No names, phone numbers, or usernames are revealed—trading is 100% blind, confidential, and unbiased.',
  },
  {
    icon: Zap,
    title: 'Instant 2x Double Payouts',
    desc: 'When the game is settled, winners receive double their traded stake based on how many coins they placed (e.g. 50 coins ➔ ₦100,000 payout).',
  },
  {
    icon: GitBranch,
    title: 'Automatic Branch to Pool Option',
    desc: 'Never get left out. Any coins that were not matched before kickoff automatically branch into the shared Pool Trading option for a chance at the Pro-Rata Jackpot.',
  },
  {
    icon: ShieldCheck,
    title: 'Automated Escrow Engine',
    desc: 'Smart contract logic securely locks 100% of both stakes in escrow until official match completion, eliminating counterparty default.',
  },
  {
    icon: Lock,
    title: 'Institutional Vault Security',
    desc: 'Multi-layer cold reserve architectures and 256-bit encryption keep all deposited escrow funds safe 24/7/365 with instant Nigerian bank withdrawals.',
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
    odds: '2.00 (2x Double)',
    status: 'MATCHING',
  },
  {
    id: 2,
    league: 'UEFA Champions League',
    match: 'Real Madrid vs Bayern Munich',
    time: 'Tomorrow • 21:00',
    type: 'Over 2.5 Goals',
    volume: '₦28.5M',
    odds: '2.00 (2x Double)',
    status: 'ACTIVE',
  },
  {
    id: 3,
    league: 'La Liga',
    match: 'Barcelona vs Atletico Madrid',
    time: 'Sun • 19:30',
    type: 'Both Teams to Score',
    volume: '₦9.6M',
    odds: '2.00 (2x Double)',
    status: 'ACTIVE',
  },
];

const faqs = [
  {
    q: 'How does the Coin system work (₦1,000 = 1 Coin)?',
    a: 'Every ₦1,000 equals 1 Coin. For example, trading ₦50,000 is 50 Coins. Standardizing into coins allows the app to match your trades coin-by-coin across opposing peers much easier, without needing a single opponent to match your exact lump sum.',
  },
  {
    q: 'Will either party know who they are matched with?',
    a: 'No. Both parties never know who they are matched with. All matching is 100% blind and anonymous. Names, phone numbers, and profile identities are never revealed before, during, or after the match.',
  },
  {
    q: 'How does the payout work after the game settles?',
    a: 'Once the game is officially settled, the winner receives double their stake (2x return) depending on how many coins they traded. If you traded 50 coins (₦50,000), you receive ₦100,000 directly to your wallet.',
  },
  {
    q: 'What happens if my coins are not matched before kickoff?',
    a: 'You never miss out on match action. Any coins that were not matched by kickoff countdown automatically branch into the Pool Trading option, where your liquidity participates in the match’s shared Pro-Rata Jackpot pool.',
  },
  {
    q: 'How does the Peeritrade escrow mechanism work?',
    a: 'Both matched traders have 100% of their collateral locked into the automated escrow vault upfront before the match starts. When the final whistle blows, verified match data triggers the escrow release directly to the winner.',
  },
  {
    q: 'How fast can I withdraw my winnings to my bank?',
    a: 'Settlements occur automatically within seconds of final whistle confirmation. You can withdraw your balance directly to your linked Nigerian bank account with instant settlement processing.',
  },
];

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="landing-app">
      {/* Background ambient lighting effects matching Admin */}
      <div className="ambient-glow glow-top-left" />
      <div className="ambient-glow glow-center-right" />
      <div className="grid-overlay" />

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-backdrop" 
          onClick={() => setMobileMenuOpen(false)} 
          aria-hidden="true" 
        />
      )}

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
            <a href={APP_URL} className="btn-ghost">
              Login
            </a>
            <a href={APP_URL} className="btn-primary">
              <span>Register</span>
              <ArrowRight size={15} />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
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
              <a href={APP_URL} className="btn-ghost w-full" onClick={() => setMobileMenuOpen(false)}>Login</a>
              <a href={APP_URL} className="btn-primary w-full" onClick={() => setMobileMenuOpen(false)}>
                Register / Start Trading <ArrowRight size={15} />
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
              Every ₦1,000 equals 1 Coin for effortless matching. Simply place your trade, let the app blindly pair your coins with anonymous peers, and win double on settlement—with automatic branching to Pool Trading if unmatched.
            </p>

            <div className="hero-cta-row">
              <a href={APP_URL} className="btn-primary btn-large">
                <span>Start Trading / Register</span>
                <ArrowRight size={18} />
              </a>
              <a href={APP_URL} className="btn-secondary btn-large">
                <span>Login to Dashboard</span>
              </a>
            </div>

            <div className="hero-trust-bar">
              <div className="trust-item">
                <Coins size={16} className="trust-icon" />
                <span>₦1,000 = 1 Coin</span>
              </div>
              <div className="trust-item">
                <EyeOff size={16} className="trust-icon" />
                <span>Neither Party Knows Counterparty</span>
              </div>
              <div className="trust-item">
                <Zap size={16} className="trust-icon" />
                <span>2x Double Payouts</span>
              </div>
              <div className="trust-item">
                <GitBranch size={16} className="trust-icon" />
                <span>Unmatched Branch to Pool</span>
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
                  <span>BLIND COIN MATCH • #TRD-8842</span>
                </div>
                <span className="escrow-league-tag">Premier League</span>
              </div>

              {/* Match Header */}
              <div className="escrow-match-title">
                <h3>Arsenal vs Chelsea</h3>
                <p className="escrow-market-tag">Market: Full Time Outcome • ₦1,000 = 1 Coin</p>
              </div>

              {/* Automated App Matching Banner */}
              <div className="escrow-matching-banner">
                <EyeOff size={13} className="text-primary" />
                <span>Blind Match • Neither party knows who they are matched with</span>
              </div>

              {/* Parties VS Row */}
              <div className="escrow-parties-row">
                <div className="party-box initiator">
                  <div className="party-avatar">
                    <Coins size={14} />
                  </div>
                  <div className="party-details">
                    <span className="party-role">Anonymous Peer</span>
                    <strong className="party-name">50 Coins (₦50,000)</strong>
                    <span className="party-pick text-primary">Backs Arsenal Win</span>
                  </div>
                  <span className="party-stake">Wins ₦100,000 (2x)</span>
                </div>

                <div className="parties-vs-divider">
                  <div className="vs-circle">
                    <ArrowLeftRight size={14} />
                  </div>
                </div>

                <div className="party-box responder">
                  <div className="party-avatar blue">
                    <Coins size={14} />
                  </div>
                  <div className="party-details">
                    <span className="party-role">Anonymous Peer</span>
                    <strong className="party-name">50 Coins (₦50,000)</strong>
                    <span className="party-pick text-blue">Backs Chelsea / Draw</span>
                  </div>
                  <span className="party-stake">Wins ₦100,000 (2x)</span>
                </div>
              </div>

              {/* Escrow Pool Status Indicator */}
              <div className="escrow-status-box">
                <div className="escrow-status-top">
                  <div className="escrow-status-label">
                    <Lock size={14} className="text-primary" />
                    <span>Total Vault Reserve (100 Coins)</span>
                  </div>
                  <strong className="escrow-status-val">₦100,000.00</strong>
                </div>
                <div className="escrow-progress-bar">
                  <div className="escrow-progress-fill" />
                </div>
                <div className="escrow-status-meta">
                  <span>Settlement: Winner Gets 2x Double</span>
                  <span className="text-primary">Status: Secured in Escrow</span>
                </div>
              </div>

              {/* Card Footer Features */}
              <div className="escrow-card-footer">
                <div className="footer-feature">
                  <GitBranch size={14} className="text-primary" />
                  <span>Unmatched Branch to Pool</span>
                </div>
                <div className="footer-feature">
                  <Clock size={14} className="text-primary" />
                  <span>Instant 2s Payout</span>
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
              Every ₦1,000 = 1 Coin for fast, easy matching. Simply place your trade and the app pairs you blindly—neither party ever knows who they are matched with.
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

          {/* Visual Matching Flow Explainer */}
          <div className="flow-explainer-card">
            <div className="flow-explainer-header">
              <div className="flow-explainer-badge">
                <Coins size={14} className="text-primary" />
                <span>COIN-BASED BLIND MATCHING (₦1,000 = 1 COIN)</span>
              </div>
              <span className="flow-explainer-sub">
                No waiting for exact lump sums • Easy coin-by-coin pairing • Double payout on win
              </span>
            </div>

            <div className="flow-steps-visual">
              {/* Person A */}
              <div className="flow-party-item">
                <div className="flow-party-avatar">
                  <Coins size={20} />
                </div>
                <div className="flow-party-meta">
                  <span className="flow-anon-tag">
                    <EyeOff size={11} />
                    <span>Identity 100% Unknown to Peer</span>
                  </span>
                  <h4 className="flow-party-title">Person A (Anonymous)</h4>
                  <p className="flow-party-choice">Backs Arsenal to Win</p>
                  <span className="flow-party-trade">Trades 50 Coins (₦50,000)</span>
                  <span className="flow-party-payout">Win Return: ₦100,000 (2x Double)</span>
                </div>
              </div>

              {/* Center Connector / Engine */}
              <div className="flow-connector-box">
                <div className="flow-connector-pulse">
                  <ArrowLeftRight size={20} />
                </div>
                <span className="flow-engine-badge">App Pairs Coins Seamlessly</span>
                <p className="flow-engine-text">
                  Neither party knows who they are matched with. App matches coins automatically instead of waiting for a single lump-sum opponent.
                </p>
                <div className="flow-pool-pill">
                  <Lock size={12} className="text-primary" />
                  <span>100 Coins (₦100k) in Escrow</span>
                </div>
              </div>

              {/* Person B */}
              <div className="flow-party-item">
                <div className="flow-party-avatar blue">
                  <Coins size={20} />
                </div>
                <div className="flow-party-meta">
                  <span className="flow-anon-tag">
                    <EyeOff size={11} />
                    <span>Identity 100% Unknown to Peer</span>
                  </span>
                  <h4 className="flow-party-title">Person B (Anonymous)</h4>
                  <p className="flow-party-choice">Backs Chelsea / Draw</p>
                  <span className="flow-party-trade">Trades 50 Coins (₦50,000)</span>
                  <span className="flow-party-payout">Win Return: ₦100,000 (2x Double)</span>
                </div>
              </div>
            </div>

            {/* Unmatched Branching to Pool Banner */}
            <div className="flow-branch-banner">
              <div className="flow-branch-icon">
                <GitBranch size={18} className="text-primary" />
              </div>
              <div className="flow-branch-text">
                <strong>Unmatched Coin Protection (Branch to Pool):</strong>
                <span>
                  {' '}If any of your coins are not matched before kickoff, you don't miss out. The app automatically branches your unmatched coins to the <strong>Pool Trading option</strong> so you participate in the Pro-Rata Jackpot!
                </span>
              </div>
            </div>

            <div className="flow-explainer-footer">
              <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
              <span>
                <strong>Instant 2x Double on Settlement:</strong> After the game settles, the winning party gets double their stake (e.g. 50 coins ➔ ₦100,000) credited directly to their wallet.
              </span>
            </div>
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
            <a href={APP_URL} className="btn-secondary btn-sm">
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
                  <a href={APP_URL} className="btn-take-order">
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
                <a href={APP_URL} className="btn-primary btn-large">
                  <span>Create Free Account</span>
                  <ArrowRight size={18} />
                </a>
                <a href={APP_URL} className="btn-ghost btn-large">
                  <span>Login to Platform</span>
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
              <a href={APP_URL}>Register Account</a>
              <a href={APP_URL}>Login / Sign In</a>
              <a href={APP_URL}>Live Markets</a>
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
