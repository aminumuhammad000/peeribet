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
  Layers,
  GitBranch
} from 'lucide-react';
import logo from './assets/logo.png';
import './index.css';

const APP_URL = 'https://app.peeritrade.com/';

const stats = [
  { value: '1k = 1 Share', label: 'Standardized Share Matching' },
  { value: '100% Blind', label: 'Identity-Hidden Matching' },
  { value: '2x Return', label: 'Doubled Winner Payout' },
  { value: 'Pool Branch', label: 'Auto-Backup for Unmatched' },
];

const howItWorks = [
  {
    step: '01',
    title: 'Trade in Shares (1k = 1 Share)',
    desc: 'Trades standardize into ₦1,000 share units (e.g. 50 shares = ₦50,000) for instant share-by-share matching without waiting for identical lump sums.',
  },
  {
    step: '02',
    title: 'Automated Blind Matching',
    desc: 'Choose your YES or NO prediction and let the engine pair your shares against opposing peers. Matching is 100% blind—neither party ever knows their peer.',
  },
  {
    step: '03',
    title: '2x Double Payout & Pool Backup',
    desc: 'Winners receive 2x doubled payouts upon settlement. Any unmatched shares automatically branch into the shared Pool Trading option (Pool . ₦0).',
  },
];

const features = [
  {
    icon: Layers,
    title: 'Standardized Shares (1k = 1 Share)',
    desc: 'Every ₦1,000 equals 1 Share. Positions match share-by-share across peers for rapid pairing without waiting for exact lump-sum opponents.',
  },
  {
    icon: EyeOff,
    title: '100% Blind Match Engine',
    desc: 'Both parties remain completely anonymous. Zero usernames, phone numbers, or identities are disclosed before, during, or after trading.',
  },
  {
    icon: Zap,
    title: 'Instant 2x Doubled Settlements',
    desc: 'When match results are confirmed, winners receive double their stake automatically (e.g. 50 shares ➔ ₦100,000 payout) directly to wallet.',
  },
  {
    icon: GitBranch,
    title: 'Automatic Pool Protection (Pool . ₦0)',
    desc: 'Never miss match action. Any shares not matched before kickoff automatically branch into the Pool Trading option for the jackpot.',
  },
  {
    icon: ShieldCheck,
    title: 'Automated Escrow Engine',
    desc: 'Smart contract logic securely locks 100% of both stakes in escrow until official match completion, eliminating counterparty default risk.',
  },
  {
    icon: Lock,
    title: 'Institutional Vault Security',
    desc: 'Multi-layer cold vault reserves and 256-bit encryption keep deposited funds safe 24/7 with instant Nigerian bank withdrawals.',
  },
];

const matchesData = [
  {
    id: 'barca-rm',
    league: 'La Liga • El Clásico',
    match: 'Barcelona vs Real Madrid',
    homeTeam: 'Barcelona',
    awayTeam: 'Real Madrid',
    time: 'Starts in 3hrs • 20:00',
    poolAmount: '₦0',
    outcomeContracts: [
      {
        id: 'barca',
        name: 'Barcelona',
        sub: 'Barcelona to Win',
        shares: '18,400 Shares (₦18.4M)',
        yesLabel: 'YES',
        noLabel: 'NO',
      },
      {
        id: 'rm',
        name: 'Real Madrid',
        sub: 'Real Madrid to Win',
        shares: '22,100 Shares (₦22.1M)',
        yesLabel: 'YES',
        noLabel: 'NO',
      },
      {
        id: 'draw',
        name: 'Draw',
        sub: 'Draw outcome contract',
        shares: '8,500 Shares (₦8.5M)',
        yesLabel: 'YES',
        noLabel: 'NO',
      },
    ],
    overUnder: {
      title: 'Over/Under 2.5',
      sub: 'Total Match Goals',
      overLabel: 'Over 2.5',
      underLabel: 'Under 2.5',
      shares: '15,800 Shares (₦15.8M)',
      poolText: 'Pool . ₦0',
    },
    btts: {
      title: 'BTTS (Both Teams to Score)',
      sub: 'Both teams score at least 1 goal',
      yesLabel: 'YES',
      noLabel: 'NO',
      shares: '11,200 Shares (₦11.2M)',
    },
  },
  {
    id: 'ars-che',
    league: 'Premier League • London Derby',
    match: 'Arsenal vs Chelsea',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    time: 'Today • 20:00',
    poolAmount: '₦0',
    outcomeContracts: [
      {
        id: 'ars',
        name: 'Arsenal',
        sub: 'Arsenal to Win',
        shares: '24,600 Shares (₦24.6M)',
        yesLabel: 'YES',
        noLabel: 'NO',
      },
      {
        id: 'che',
        name: 'Chelsea',
        sub: 'Chelsea to Win',
        shares: '17,800 Shares (₦17.8M)',
        yesLabel: 'YES',
        noLabel: 'NO',
      },
      {
        id: 'draw-ars',
        name: 'Draw',
        sub: 'Draw outcome contract',
        shares: '9,100 Shares (₦9.1M)',
        yesLabel: 'YES',
        noLabel: 'NO',
      },
    ],
    overUnder: {
      title: 'Over/Under 2.5',
      sub: 'Total Match Goals',
      overLabel: 'Over 2.5',
      underLabel: 'Under 2.5',
      shares: '19,200 Shares (₦19.2M)',
      poolText: 'Pool . ₦0',
    },
    btts: {
      title: 'BTTS (Both Teams to Score)',
      sub: 'Both teams score at least 1 goal',
      yesLabel: 'YES',
      noLabel: 'NO',
      shares: '14,500 Shares (₦14.5M)',
    },
  },
  {
    id: 'mci-liv',
    league: 'Premier League • Title Clash',
    match: 'Man City vs Liverpool',
    homeTeam: 'Man City',
    awayTeam: 'Liverpool',
    time: 'Sun • 17:30',
    poolAmount: '₦0',
    outcomeContracts: [
      {
        id: 'mci',
        name: 'Man City',
        sub: 'Man City to Win',
        shares: '31,200 Shares (₦31.2M)',
        yesLabel: 'YES',
        noLabel: 'NO',
      },
      {
        id: 'liv',
        name: 'Liverpool',
        sub: 'Liverpool to Win',
        shares: '26,400 Shares (₦26.4M)',
        yesLabel: 'YES',
        noLabel: 'NO',
      },
      {
        id: 'draw-mci',
        name: 'Draw',
        sub: 'Draw outcome contract',
        shares: '11,300 Shares (₦11.3M)',
        yesLabel: 'YES',
        noLabel: 'NO',
      },
    ],
    overUnder: {
      title: 'Over/Under 2.5',
      sub: 'Total Match Goals',
      overLabel: 'Over 2.5',
      underLabel: 'Under 2.5',
      shares: '22,400 Shares (₦22.4M)',
      poolText: 'Pool . ₦0',
    },
    btts: {
      title: 'BTTS (Both Teams to Score)',
      sub: 'Both teams score at least 1 goal',
      yesLabel: 'YES',
      noLabel: 'NO',
      shares: '18,900 Shares (₦18.9M)',
    },
  },
];

const faqs = [
  {
    q: 'How does the Share system work (1k = 1 Share)?',
    a: 'Every ₦1,000 equals 1 Share (e.g. ₦50,000 = 50 Shares). Standardizing into shares allows the platform to pair trades share-by-share across opposing peers much faster, without waiting for one opponent with your exact lump sum.',
  },
  {
    q: 'Will either party know who they are matched with?',
    a: 'No. Matching is 100% blind and anonymous. Names, phone numbers, and account identities are never revealed before, during, or after match settlement.',
  },
  {
    q: 'How does the payout work after the game settles?',
    a: 'Once the match is settled, the winner receives double their stake (2x return) based on their share volume. 50 shares (₦50,000) returns ₦100,000 directly to your balance.',
  },
  {
    q: 'What happens if my shares are not matched before kickoff?',
    a: 'Any shares not matched by kickoff automatically branch into the Pool Trading option (Pool . ₦0), where your liquidity participates in the shared Pro-Rata Jackpot pool.',
  },
  {
    q: 'How does the Peeritrade escrow mechanism work?',
    a: 'Both traders have 100% collateral locked into automated escrow vaults upfront. When official match results confirm, verified sports data triggers the instant release to the winner.',
  },
  {
    q: 'How fast can I withdraw my winnings to my bank?',
    a: 'Settlements occur within seconds of full-time confirmation. You can withdraw directly to your linked Nigerian bank account with instant automated processing.',
  },
];

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState('barca-rm');
  const selectedMatch = matchesData.find((m) => m.id === selectedMatchId) || matchesData[0];

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
              <ShieldCheck size={13} className="badge-icon" />
              <span>Next-Gen Peer-to-Peer Escrow Platform</span>
            </div>

            <h1 className="hero-headline">
              Trade Football Prediction Contracts With <span className="gradient-text">Zero Counterparty Risk.</span>
            </h1>

            <p className="hero-subtext">
              Standardized share matching (1k = 1 Share) enables fast, anonymous peer trades with 2x payouts on settlement—and automatic pool protection (Pool . ₦0) if unmatched.
            </p>

            <div className="hero-cta-row">
              <a href={APP_URL} className="btn-primary btn-large">
                <span>Start Trading / Register</span>
                <ArrowRight size={15} />
              </a>
              <a href={APP_URL} className="btn-secondary btn-large">
                <span>Login to Dashboard</span>
              </a>
            </div>

            <div className="hero-trust-bar">
              <div className="trust-item">
                <Layers size={14} className="trust-icon" />
                <span>1k = 1 Share</span>
              </div>
              <div className="trust-item">
                <EyeOff size={14} className="trust-icon" />
                <span>100% Blind Matching</span>
              </div>
              <div className="trust-item">
                <Zap size={14} className="trust-icon" />
                <span>2x Doubled Payouts</span>
              </div>
              <div className="trust-item">
                <GitBranch size={14} className="trust-icon" />
                <span>Pool . ₦0 Protection</span>
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
                  <span>BLIND SHARE MATCH • #TRD-8842</span>
                </div>
                <span className="escrow-league-tag">La Liga</span>
              </div>

              {/* Match Header */}
              <div className="escrow-match-title">
                <h3>Barcelona vs Real Madrid</h3>
                <p className="escrow-market-tag">Contract: Barcelona to Win • 1k = 1 Share</p>
              </div>

              {/* Automated App Matching Banner */}
              <div className="escrow-matching-banner">
                <EyeOff size={12} className="text-primary" />
                <span>100% Blind Match • Neither party knows their peer</span>
              </div>

              {/* Parties VS Row */}
              <div className="escrow-parties-row">
                <div className="party-box initiator">
                  <div className="party-avatar">
                    <Layers size={13} />
                  </div>
                  <div className="party-details">
                    <span className="party-role">Anonymous Peer</span>
                    <strong className="party-name">50 Shares (₦50,000)</strong>
                    <span className="party-pick text-primary">Barcelona — YES</span>
                  </div>
                  <span className="party-stake">Wins ₦100,000 (2x)</span>
                </div>

                <div className="parties-vs-divider">
                  <div className="vs-circle">
                    <ArrowLeftRight size={13} />
                  </div>
                </div>

                <div className="party-box responder">
                  <div className="party-avatar blue">
                    <Layers size={13} />
                  </div>
                  <div className="party-details">
                    <span className="party-role">Anonymous Peer</span>
                    <strong className="party-name">50 Shares (₦50,000)</strong>
                    <span className="party-pick text-blue">Barcelona — NO</span>
                  </div>
                  <span className="party-stake">Wins ₦100,000 (2x)</span>
                </div>
              </div>

              {/* Escrow Pool Status Indicator */}
              <div className="escrow-status-box">
                <div className="escrow-status-top">
                  <div className="escrow-status-label">
                    <Lock size={13} className="text-primary" />
                    <span>Total Vault Reserve (100 Shares)</span>
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
                  <GitBranch size={13} className="text-primary" />
                  <span>Pool . ₦0 Auto-Branch</span>
                </div>
                <div className="footer-feature">
                  <Clock size={13} className="text-primary" />
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
              Every 1k = 1 Share for fast, easy matching. Place your trade and let the app blindly pair your shares with anonymous peers.
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
                <Layers size={13} className="text-primary" />
                <span>SHARE-BASED BLIND MATCHING (1k = 1 SHARE)</span>
              </div>
              <span className="flow-explainer-sub">
                Share-by-share pairing • 100% blind anonymity • 2x settlement return
              </span>
            </div>

            <div className="flow-steps-visual">
              {/* Person A */}
              <div className="flow-party-item">
                <div className="flow-party-avatar">
                  <Layers size={16} />
                </div>
                <div className="flow-party-meta">
                  <span className="flow-anon-tag">
                    <EyeOff size={10} />
                    <span>Identity Hidden</span>
                  </span>
                  <h4 className="flow-party-title">Person A</h4>
                  <p className="flow-party-choice">Backs Barcelona — YES</p>
                  <span className="flow-party-trade">50 Shares (₦50,000)</span>
                  <span className="flow-party-payout">2x Payout: ₦100,000</span>
                </div>
              </div>

              {/* Center Connector / Engine */}
              <div className="flow-connector-box">
                <div className="flow-connector-pulse">
                  <ArrowLeftRight size={16} />
                </div>
                <span className="flow-engine-badge">Automated Matching Engine</span>
                <p className="flow-engine-text">
                  App pairs shares seamlessly. Counterparties remain hidden with zero identity exposure.
                </p>
                <div className="flow-pool-pill">
                  <Lock size={11} className="text-primary" />
                  <span>100 Shares (₦100k) Escrow</span>
                </div>
              </div>

              {/* Person B */}
              <div className="flow-party-item">
                <div className="flow-party-avatar blue">
                  <Layers size={16} />
                </div>
                <div className="flow-party-meta">
                  <span className="flow-anon-tag">
                    <EyeOff size={10} />
                    <span>Identity Hidden</span>
                  </span>
                  <h4 className="flow-party-title">Person B</h4>
                  <p className="flow-party-choice">Backs Barcelona — NO</p>
                  <span className="flow-party-trade">50 Shares (₦50,000)</span>
                  <span className="flow-party-payout">2x Payout: ₦100,000</span>
                </div>
              </div>
            </div>

            {/* Unmatched Branching to Pool Banner */}
            <div className="flow-branch-banner">
              <div className="flow-branch-icon">
                <GitBranch size={16} className="text-primary" />
              </div>
              <div className="flow-branch-text">
                <strong>Unmatched Share Protection:</strong>
                <span>
                  {' '}Any shares not matched before kickoff automatically branch into the <strong>Pool Trading option (Pool . ₦0)</strong> so your funds continue participating in the match jackpot.
                </span>
              </div>
            </div>

            <div className="flow-explainer-footer">
              <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
              <span>
                <strong>Instant 2x Doubled Settlement:</strong> When the game settles, the winner receives double their stake (e.g. 50 shares ➔ ₦100,000) credited directly to wallet.
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
                    <Icon size={18} className="feature-icon" />
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
              <span className="section-pill">Peer-to-Peer Prediction Contracts</span>
              <h2 className="section-title">Live Prediction Markets</h2>
              <p className="section-subtitle">
                Trade YES or NO shares on transparent match outcomes. Standardized at 1k = 1 Share with zero counterparty risk.
              </p>
            </div>
            <a href={APP_URL} className="btn-secondary btn-sm">
              <span>View All Markets</span>
              <ChevronRight size={14} />
            </a>
          </div>

          {/* Match Switcher Tabs */}
          <div className="match-tabs-bar">
            {matchesData.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`match-tab-pill ${selectedMatch.id === m.id ? 'active' : ''}`}
                onClick={() => setSelectedMatchId(m.id)}
              >
                <span className="tab-league-hint">{m.league.split('•')[0].trim()}</span>
                <span className="tab-match-title">{m.match}</span>
              </button>
            ))}
          </div>

          {/* Active Match Showcase Container */}
          <div className="market-showcase-container">
            {/* Top Match Bar */}
            <div className="showcase-match-bar">
              <div className="showcase-bar-left">
                <span className="showcase-league-pill">{selectedMatch.league}</span>
                <h3 className="showcase-fixture-title">{selectedMatch.match}</h3>
                <div className="showcase-timing-badge">
                  <Clock size={12} className="text-primary" />
                  <span>{selectedMatch.time}</span>
                </div>
              </div>
              <div className="showcase-bar-right">
                <div className="rate-badge">
                  <Layers size={13} className="text-primary" />
                  <span>1k = 1 Share</span>
                </div>
                <div className="escrow-badge">
                  <ShieldCheck size={13} className="text-primary" />
                  <span>100% Escrow Collateralized</span>
                </div>
              </div>
            </div>

            {/* Prediction Contracts Grid */}
            <div className="contracts-showcase-grid">
              {/* Card 1: Team & Match Outcome Contracts (Barcelona Yes/No, Real Madrid Yes/No, Draw Yes/No) */}
              <div className="prediction-contract-card primary-card">
                <div className="prediction-card-header">
                  <div>
                    <div className="card-header-badge-row">
                      <h4 className="prediction-card-title">Match Contracts</h4>
                      <span className="tag-pill-sm">Yes / No</span>
                    </div>
                    <p className="prediction-card-sub">Individual binary contracts for each team and draw</p>
                  </div>
                  <span className="shares-rate-pill">1k = 1 Share</span>
                </div>

                <div className="contracts-rows-list">
                  {selectedMatch.outcomeContracts.map((outcome) => (
                    <div key={outcome.id} className="contract-outcome-row">
                      <div className="contract-info-block">
                        <strong className="contract-entity-name">{outcome.name}</strong>
                        <span className="contract-sub-label">{outcome.sub}</span>
                        <span className="contract-shares-count">{outcome.shares}</span>
                      </div>

                      <div className="contract-actions-block">
                        <a href={APP_URL} className="btn-prediction-yes">
                          <span className="predict-label">{outcome.yesLabel}</span>
                          <span className="predict-rate">1k / share</span>
                        </a>
                        <a href={APP_URL} className="btn-prediction-no">
                          <span className="predict-label">{outcome.noLabel}</span>
                          <span className="predict-rate">1k / share</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="prediction-card-footer">
                  <div className="footer-status-pill">
                    <span className="pulsing-green-dot" />
                    <span>100% Blind Matching • Winner gets 2x payout</span>
                  </div>
                  <a href={APP_URL} className="btn-card-action">
                    <span>Trade Contracts</span>
                    <ArrowRight size={13} />
                  </a>
                </div>
              </div>

              {/* Column 2: Over/Under 2.5 & BTTS */}
              <div className="contracts-secondary-col">
                {/* Card 2: Over/Under 2.5 */}
                <div className="prediction-contract-card">
                  <div className="prediction-card-header">
                    <div>
                      <div className="card-header-badge-row">
                        <h4 className="prediction-card-title">{selectedMatch.overUnder.title}</h4>
                        <span className="tag-pill-sm">Goals Line</span>
                      </div>
                      <p className="prediction-card-sub">{selectedMatch.overUnder.sub}</p>
                    </div>
                    <span className="contract-shares-count">{selectedMatch.overUnder.shares}</span>
                  </div>

                  <div className="overunder-buttons-grid">
                    <a href={APP_URL} className="btn-predict-block-yes">
                      <span className="predict-block-label">{selectedMatch.overUnder.overLabel}</span>
                      <span className="predict-block-sub">YES • 1k / share</span>
                    </a>
                    <a href={APP_URL} className="btn-predict-block-no">
                      <span className="predict-block-label">{selectedMatch.overUnder.underLabel}</span>
                      <span className="predict-block-sub">NO • 1k / share</span>
                    </a>
                  </div>

                  <div className="prediction-card-footer pool-highlight-footer">
                    <div className="pool-indicator-wrap">
                      <span className="pool-lead-text">
                        Pool . <strong className="pool-green-val">{selectedMatch.poolAmount}</strong>
                      </span>
                      <span className="pool-sub-text">Unmatched shares auto-branch into shared pool</span>
                    </div>
                    <a href={APP_URL} className="btn-card-action">
                      <span>Trade Over/Under</span>
                      <ArrowRight size={13} />
                    </a>
                  </div>
                </div>

                {/* Card 3: BTTS (Both Teams to Score) */}
                <div className="prediction-contract-card">
                  <div className="prediction-card-header">
                    <div>
                      <div className="card-header-badge-row">
                        <h4 className="prediction-card-title">{selectedMatch.btts.title}</h4>
                        <span className="tag-pill-sm">Both Score</span>
                      </div>
                      <p className="prediction-card-sub">{selectedMatch.btts.sub}</p>
                    </div>
                    <span className="contract-shares-count">{selectedMatch.btts.shares}</span>
                  </div>

                  <div className="btts-buttons-grid">
                    <a href={APP_URL} className="btn-predict-block-yes">
                      <span className="predict-block-label">YES</span>
                      <span className="predict-block-sub">Both Teams Score • 1k / share</span>
                    </a>
                    <a href={APP_URL} className="btn-predict-block-no">
                      <span className="predict-block-label">NO</span>
                      <span className="predict-block-sub">At Least One Zero • 1k / share</span>
                    </a>
                  </div>

                  <div className="prediction-card-footer">
                    <div className="footer-status-pill">
                      <span className="pulsing-green-dot" />
                      <span>Instant 2x Doubled Settlement</span>
                    </div>
                    <a href={APP_URL} className="btn-card-action">
                      <span>Trade BTTS</span>
                      <ArrowRight size={13} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Vault Architecture Section */}
        <section id="security" className="section-container">
          <div className="security-banner-card">
            <div className="security-content">
              <span className="section-pill">Institutional Grade</span>
              <h2 className="security-title">Institutional Protection for Every Stake</h2>
              <p className="security-desc">
                Your collateral is protected with multi-signature cold vault reserves, automated smart settlement contracts, and continuous cryptographic security verification.
              </p>

              <div className="security-checklist">
                <div className="checklist-item">
                  <div className="check-icon-circle"><Check size={13} /></div>
                  <span>100% Pre-funded escrow guarantees immediate payout execution</span>
                </div>
                <div className="checklist-item">
                  <div className="check-icon-circle"><Check size={13} /></div>
                  <span>Official sports oracle integrations for zero-dispute outcome verification</span>
                </div>
                <div className="checklist-item">
                  <div className="check-icon-circle"><Check size={13} /></div>
                  <span>End-to-end 256-bit encryption with continuous administrative audit trails</span>
                </div>
              </div>
            </div>

            <div className="security-graphic-panel">
              <div className="vault-visual-box">
                <div className="vault-visual-icon">
                  <ShieldCheck size={38} className="text-primary" />
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
                    size={16}
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
                Join verified sports traders on Nigeria's premier peer-to-peer escrow network.
              </p>
              <div className="cta-buttons-row">
                <a href={APP_URL} className="btn-primary btn-large">
                  <span>Create Free Account</span>
                  <ArrowRight size={15} />
                </a>
                <a href={APP_URL} className="btn-ghost btn-large">
                  <span>Login to Platform</span>
                  <ExternalLink size={14} />
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
          {/* Hidden SEO link: invisible to human visitors, fully indexable and crawlable by search engines */}
          <a
            href="https://www.ameetechnology.com.ng"
            className="seo-hidden-link"
            rel="noopener"
            tabIndex={-1}
            aria-hidden="true"
          >
            Amee Technology - www.ameetechnology.com.ng
          </a>
        </div>
      </footer>
    </div>
  );
}
