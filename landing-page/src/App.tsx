import { useState } from 'react';
import { 
  Search, 
  Bell, 
  ArrowUpRight
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { LiveAnimation } from './components/LiveAnimation';

export default function App() {
  const [activeSport, setActiveSport] = useState('football');
  const [activeTab, setActiveTab] = useState('sports');
  const [selectedOdds, setSelectedOdds] = useState<Record<string, string>>({});
  const [promoSlide, setPromoSlide] = useState(0);

  // Toggle odds selection
  const handleOddsClick = (matchId: string, oddType: string, value: string) => {
    const key = `${matchId}-${oddType}`;
    setSelectedOdds(prev => {
      if (prev[key] === value) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: value };
    });
  };

  const isOddSelected = (matchId: string, oddType: string, value: string) => {
    return selectedOdds[`${matchId}-${oddType}`] === value;
  };

  const promoBanners = [
    {
      title: "SIGN UP AND GET",
      bonus: "100% welcome Bonus",
      buttonText: "Sing Up" // Exact spelling from mockup
    },
    {
      title: "PEERITRADE BOOST",
      bonus: "20% Extra Odds Reward",
      buttonText: "Sing Up"
    }
  ];

  return (
    <div className="app-container">
      {/* Sidebar Component */}
      <Sidebar activeSport={activeSport} setActiveSport={setActiveSport} />
      
      {/* Spacer to shift content right of the fixed sidebar */}
      <div className="sidebar-spacer"></div>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Header Section */}
        <header 
          className="flex items-center justify-between py-2 border-b border-white/5"
          style={{ height: 'var(--header-height)' }}
        >
          {/* Logo and Brand Name */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-white" strokeWidth="2.5">
                <path d="M4 18l6-6 4 4 6-8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="20" cy="6" r="2.5" fill="#10b981" stroke="none" />
                <path d="M13 6h7v7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            
            <div className="flex flex-col">
              <span className="font-header text-lg font-bold tracking-tight text-white flex items-center">
                Peeri<span className="text-[#12d28a]">trade</span>
              </span>
              <span className="text-[7.5px] text-slate-400 font-semibold tracking-[0.22em] uppercase" style={{ marginTop: '-2px' }}>
                TRADE • WIN • REPEAT
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { id: 'sports', label: 'Sports' },
              { id: 'live', label: 'Live' },
              { id: 'promotion', label: 'Promotion' },
              { id: 'contact', label: 'Contact' }
            ].map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`text-sm font-semibold tracking-wide font-header transition-all duration-300 relative py-1 ${
                    isActive ? 'text-white active-bar-indicator' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400"></span>
            </button>

            <button 
              className="text-slate-300 hover:text-white text-xs font-bold tracking-widest font-header uppercase px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all hover:bg-white/5 active:scale-95 ml-2"
              id="login-button"
            >
              Log In
            </button>

            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-widest font-header uppercase px-5 py-2.5 rounded-xl transition-all glow-btn active:scale-95"
              id="signup-button"
            >
              Sign Up
            </button>
          </div>
        </header>

        {/* Hero Section (Promotional Banner) */}
        <section 
          className="relative rounded-3xl overflow-hidden flex items-center p-8 md:p-10 shadow-2xl"
          style={{
            background: 'linear-gradient(90deg, #4ea3e6 0%, #305896 100%)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            minHeight: '230px'
          }}
        >
          {/* Decorative gradients */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-400/20 blur-[80px] pointer-events-none"></div>
          
          {/* Banner Contents */}
          <div className="flex-1 z-10 flex flex-col items-start gap-4">
            
            {/* Carousel dots indicators */}
            <div className="flex items-center gap-2 mb-1">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => setPromoSlide(i % promoBanners.length)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    promoSlide === (i % promoBanners.length) ? 'bg-purple-600 px-2' : 'bg-slate-400/60'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                ></button>
              ))}
            </div>

            {/* Heading text */}
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-bold tracking-[0.25em] text-white/80 uppercase font-header">
                {promoBanners[promoSlide].title}
              </h2>
              <p className="text-3xl md:text-4xl font-extrabold text-white leading-tight font-header">
                {promoBanners[promoSlide].bonus}
              </p>
            </div>

            {/* Call to action button - Spelled exactly "Sing Up" as in mockup */}
            <button 
              className="mt-2 bg-white text-slate-950 hover:bg-slate-100 font-bold px-8 py-3 rounded-xl text-sm font-header tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/25"
              id="promo-cta-button"
            >
              {promoBanners[promoSlide].buttonText}
            </button>
          </div>

          {/* Right side graphic - Ojodu City FC Watermark & Footballer Athlete */}
          <div className="hidden lg:flex w-80 h-48 relative justify-end items-end z-10">
            
            {/* Ojodu City FC Shield Crest in the background */}
            <div className="absolute left-4 top-4 w-40 h-40 opacity-25 pointer-events-none">
              <svg viewBox="0 0 120 120" className="w-full h-full stroke-white stroke-[1.2] fill-none">
                <circle cx="60" cy="60" r="48" />
                <circle cx="60" cy="60" r="44" strokeDasharray="3 3" />
                <path d="M40 38 L80 38 L60 78 Z" />
                <text x="32" y="63" fontSize="8" fill="#ffffff" fontWeight="bold">20</text>
                <text x="80" y="63" fontSize="8" fill="#ffffff" fontWeight="bold">22</text>
                {/* Tiger silhouette outline */}
                <path d="M52 48 Q60 55 68 48 L65 58 Q60 54 55 58 Z" fill="#ffffff" />
                <text x="60" y="93" textAnchor="middle" fontSize="6.5" fill="#ffffff" fontWeight="bold" letterSpacing="1">OJODU CITY FC</text>
              </svg>
            </div>

            {/* High-fidelity Vector Athlete Graphic in red jersey matching screenshot player pose exactly */}
            <svg viewBox="0 0 200 220" className="w-56 h-56 drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]">
              <defs>
                <linearGradient id="kit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#b91c1c" />
                  <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
                <linearGradient id="skin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2a140d" />
                  <stop offset="100%" stopColor="#1a0b07" />
                </linearGradient>
                <linearGradient id="collar-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>

              {/* Player Body structure */}
              <g transform="translate(30, 20)">
                
                {/* Jersey Torso & Arms Crossed */}
                <path d="M70 120 C70 95, 52 80, 40 85 C28 90, 25 105, 25 125 L25 190 L115 190 L115 125 Z" fill="url(#kit-grad)" />
                
                {/* Arm cuffs details - crossed arms */}
                <path d="M30 135 C38 155, 102 155, 110 135" fill="url(#kit-grad)" stroke="#7f1d1d" strokeWidth="2.5" />
                <path d="M30 135 C38 165, 102 165, 110 135" fill="none" stroke="url(#collar-gold)" strokeWidth="1.8" />
                
                {/* Gold collar */}
                <path d="M52 85 Q70 95 88 85" fill="none" stroke="url(#collar-gold)" strokeWidth="3" />

                {/* Ojodu Logo on chest */}
                <rect x="64" y="102" width="12" height="12" rx="2" fill="url(#collar-gold)" />
                <text x="70" y="111" textAnchor="middle" fontSize="6.5" fill="#000000" fontWeight="bold">OJ</text>

                {/* Athlete Neck */}
                <path d="M60 85 L60 72 L80 72 L80 85 Z" fill="url(#skin-grad)" />

                {/* Face & Head */}
                <path d="M55 72 C55 72, 50 72, 52 68 C54 60, 54 44, 52 40 C50 36, 56 30, 70 30 C84 30, 90 36, 88 40 C86 44, 86 60, 88 68 C90 72, 85 72, 85 72 Z" fill="url(#skin-grad)" />
                
                {/* Smiling Mouth and Facial Highlights */}
                <path d="M63 56 Q70 61 77 56" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                
                {/* Eyes and brows */}
                <ellipse cx="61" cy="46" rx="2.5" ry="1.5" fill="#ffffff" />
                <circle cx="61" cy="46" r="1" fill="#000000" />
                <path d="M57 42 Q61 40 65 42" fill="none" stroke="#000000" strokeWidth="1.2" />

                <ellipse cx="79" cy="46" rx="2.5" ry="1.5" fill="#ffffff" />
                <circle cx="79" cy="46" r="1" fill="#000000" />
                <path d="M75 42 Q79 40 83 42" fill="none" stroke="#000000" strokeWidth="1.2" />
                
                {/* Athletic Short Hair Cut */}
                <path d="M53 38 C53 30, 87 30, 87 38 L89 33 C89 27, 51 27, 51 33 Z" fill="#0c0604" />
                
                {/* Ears */}
                <ellipse cx="50" cy="55" rx="2.5" ry="4" fill="url(#skin-grad)" />
                <ellipse cx="90" cy="55" rx="2.5" ry="4" fill="url(#skin-grad)" />

              </g>
            </svg>

          </div>
        </section>

        {/* Live Matches Grid Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white font-header flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-red inline-block"></span>
              Live Matches
            </h2>
            <button 
              className="text-xs font-bold font-header tracking-wider uppercase bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg transition-colors border border-white/5 hover:border-white/10 active:scale-95"
              id="all-lives-button"
            >
              All Lives
            </button>
          </div>

          {/* Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* MATCH CARD 1 */}
            <div 
              className="glassmorphic rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:shadow-xl hover:shadow-blue-500/5 group"
              style={{ minHeight: '190px' }}
            >
              <div className="flex justify-between items-center text-[10px] tracking-wide font-bold uppercase text-slate-400">
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                  Live
                </span>
                <span className="font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded">2nd Half 67'</span>
              </div>

              {/* Teams & Logos */}
              <div className="flex justify-between items-center px-2 py-1">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-11 h-11 rounded-full bg-[#0d1c3a] flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform duration-300">
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <path d="M12 2 C12 2, 2 3, 2 11 C2 17, 10 22, 12 22 C14 22, 22 17, 22 11 C2 3, 12 2, 12 2 Z" fill="#9c1c3c" />
                      <path d="M12 22 C12 22, 7 18, 7 12 C7 7, 12 2, 12 2 Z" fill="#004d98" />
                      <line x1="2" y1="11" x2="22" y2="11" stroke="#f59e0b" strokeWidth="1.5" />
                      <text x="12" y="15" textAnchor="middle" fontSize="6" fill="#ffffff" fontWeight="extrabold">FCB</text>
                    </svg>
                  </div>
                  <span className="text-[12px] font-bold font-header text-slate-200">Barcelona</span>
                </div>

                <div className="text-[11px] font-bold font-header tracking-wider text-slate-400 px-3">VS</div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-11 h-11 rounded-full bg-[#0d1c3a] flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform duration-300">
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <circle cx="12" cy="13" r="8.5" fill="#f5f7fa" stroke="#f59e0b" strokeWidth="1.5" />
                      <path d="M7 6.5 L17 6.5 L12 2 Z" fill="#f59e0b" />
                      <line x1="8" y1="13" x2="16" y2="13" stroke="#3b82f6" strokeWidth="1" />
                      <text x="12" y="16" textAnchor="middle" fontSize="6" fill="#1e3a8a" fontWeight="extrabold">RMA</text>
                    </svg>
                  </div>
                  <span className="text-[12px] font-bold font-header text-slate-200">Real Madrid</span>
                </div>
              </div>

              {/* Liga and Scores */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-b border-white/5 py-1.5 px-1 font-semibold">
                <span>football/La Liga</span>
                <span className="text-slate-200 font-bold font-header text-xs">2 - 4</span>
              </div>

              {/* Odds buttons - Solid white with black text matching mockup */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { label: '1', odd: '1.76' },
                  { label: 'X', odd: '1.86' },
                  { label: '2', odd: '1.40' }
                ].map((item, i) => {
                  const isSel = isOddSelected('bar-rma', item.label, item.odd);
                  return (
                    <button
                      key={i}
                      onClick={() => handleOddsClick('bar-rma', item.label, item.odd)}
                      className={`py-2 rounded-lg text-[11px] font-extrabold font-mono transition-all duration-250 active:scale-95 flex flex-col items-center justify-center ${
                        isSel 
                          ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-105 border border-blue-400' 
                          : 'bg-white text-slate-950 hover:bg-slate-100 hover:scale-[1.02]'
                      }`}
                    >
                      <span className={`text-[8px] font-bold ${isSel ? 'text-blue-200' : 'text-slate-500'} uppercase mb-0.5`}>{item.label}</span>
                      <span>{item.odd}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MATCH CARD 2 */}
            <div 
              className="glassmorphic rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:shadow-xl hover:shadow-blue-500/5 group"
              style={{ minHeight: '190px' }}
            >
              <div className="flex justify-between items-center text-[10px] tracking-wide font-bold uppercase text-slate-400">
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                  Live
                </span>
                <span className="font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded">2nd Half 46'</span>
              </div>

              {/* Teams & Logos */}
              <div className="flex justify-between items-center px-2 py-1">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-11 h-11 rounded-full bg-[#0d1c3a] flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform duration-300">
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <path d="M12 2 L2 6 L12 22 L22 6 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                      <circle cx="12" cy="11" r="4" fill="#ffffff" />
                      <line x1="8" y1="11" x2="16" y2="11" stroke="#f59e0b" strokeWidth="2.5" />
                      <text x="12" y="18" textAnchor="middle" fontSize="4.5" fill="#ffffff" fontWeight="extrabold">ARS</text>
                    </svg>
                  </div>
                  <span className="text-[12px] font-bold font-header text-slate-200">Arsenal</span>
                </div>

                <div className="text-[11px] font-bold font-header tracking-wider text-slate-400 px-3">VS</div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-11 h-11 rounded-full bg-[#0d1c3a] flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform duration-300">
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <polygon points="12,2 22,7 18,20 12,22 6,20 2,7" fill="#dc2626" />
                      <polygon points="12,4 19,8 16,18 12,20 8,18 5,8" fill="#f59e0b" />
                      <path d="M12 8 L14 12 L10 12 Z" fill="#dc2626" />
                      <text x="12" y="16" textAnchor="middle" fontSize="5.5" fill="#ffffff" fontWeight="extrabold">MUN</text>
                    </svg>
                  </div>
                  <span className="text-[12px] font-bold font-header text-slate-200">Man United</span>
                </div>
              </div>

              {/* Liga and Scores */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-b border-white/5 py-1.5 px-1 font-semibold">
                <span>Football/Premier League</span>
                <span className="text-slate-200 font-bold font-header text-xs">3 - 2</span>
              </div>

              {/* Odds buttons - Solid white with black text */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { label: '1', odd: '1.70' },
                  { label: 'X', odd: '1.50' },
                  { label: '2', odd: '1.59' }
                ].map((item, i) => {
                  const isSel = isOddSelected('ars-mun', item.label, item.odd);
                  return (
                    <button
                      key={i}
                      onClick={() => handleOddsClick('ars-mun', item.label, item.odd)}
                      className={`py-2 rounded-lg text-[11px] font-extrabold font-mono transition-all duration-250 active:scale-95 flex flex-col items-center justify-center ${
                        isSel 
                          ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-105 border border-blue-400' 
                          : 'bg-white text-slate-950 hover:bg-slate-100 hover:scale-[1.02]'
                      }`}
                    >
                      <span className={`text-[8px] font-bold ${isSel ? 'text-blue-200' : 'text-slate-500'} uppercase mb-0.5`}>{item.label}</span>
                      <span>{item.odd}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MATCH CARD 3 */}
            <div 
              className="glassmorphic rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:shadow-xl hover:shadow-blue-500/5 group"
              style={{ minHeight: '190px' }}
            >
              <div className="flex justify-between items-center text-[10px] tracking-wide font-bold uppercase text-slate-400">
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                  Live
                </span>
                <span className="font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded">1st Half 40'</span>
              </div>

              {/* Teams & Logos */}
              <div className="flex justify-between items-center px-2 py-1">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-11 h-11 rounded-full bg-[#0d1c3a] flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform duration-300">
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <circle cx="12" cy="12" r="10" fill="#001c3f" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M12 4 L10 16 L14 16 Z" fill="#ef4444" />
                      <line x1="8" y1="16" x2="16" y2="16" stroke="#ef4444" strokeWidth="1" />
                      <text x="12" y="19" textAnchor="middle" fontSize="4.5" fill="#ffffff" fontWeight="extrabold">PSG</text>
                    </svg>
                  </div>
                  <span className="text-[12px] font-bold font-header text-slate-200">Paris SG</span>
                </div>

                <div className="text-[11px] font-bold font-header tracking-wider text-slate-400 px-3">VS</div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-11 h-11 rounded-full bg-[#0d1c3a] flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform duration-300">
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <polygon points="12,2 22,10 18,22 6,22 2,10" fill="#11224d" stroke="#ef4444" strokeWidth="1.5" />
                      <path d="M9 10 Q12 16 15 10 L12 8 Z" fill="#ef4444" />
                      <circle cx="10" cy="10" r="1" fill="#f59e0b" />
                      <circle cx="14" cy="10" r="1" fill="#f59e0b" />
                      <text x="12" y="19" textAnchor="middle" fontSize="4" fill="#ffffff" fontWeight="bold">OJODU</text>
                    </svg>
                  </div>
                  <span className="text-[12px] font-bold font-header text-slate-200">Ojodu City</span>
                </div>
              </div>

              {/* Liga and Scores */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-b border-white/5 py-1.5 px-1 font-semibold">
                <span>Football/Champions League</span>
                <span className="text-slate-200 font-bold font-header text-xs">6 - 1</span>
              </div>

              {/* Odds buttons - Solid white with black text */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { label: '1', odd: '1.20' },
                  { label: 'X', odd: '1.83' },
                  { label: '2', odd: '1.49' }
                ].map((item, i) => {
                  const isSel = isOddSelected('psg-ojo', item.label, item.odd);
                  return (
                    <button
                      key={i}
                      onClick={() => handleOddsClick('psg-ojo', item.label, item.odd)}
                      className={`py-2 rounded-lg text-[11px] font-extrabold font-mono transition-all duration-250 active:scale-95 flex flex-col items-center justify-center ${
                        isSel 
                          ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-105 border border-blue-400' 
                          : 'bg-white text-slate-950 hover:bg-slate-100 hover:scale-[1.02]'
                      }`}
                    >
                      <span className={`text-[8px] font-bold ${isSel ? 'text-blue-200' : 'text-slate-500'} uppercase mb-0.5`}>{item.label}</span>
                      <span>{item.odd}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* Football Upcoming Table Section - Redesigned Columns structure to match mockup screenshot exactly */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            
            {/* Section tabs accent lines */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-1 rounded bg-blue-600"></span>
                <span className="w-2.5 h-1 rounded bg-slate-700"></span>
                <span className="w-2.5 h-1 rounded bg-slate-700"></span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white font-header flex items-center gap-2">
                Football Upcoming
              </h2>
            </div>
            
            <button 
              className="text-xs font-bold font-header tracking-wider uppercase bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg transition-colors border border-white/5 hover:border-white/10 active:scale-95"
              id="all-football-button"
            >
              All Football
            </button>
          </div>

          {/* Table Container */}
          <div className="glassmorphic rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider bg-white/[0.02]">
                    <th className="py-4.5 px-6 w-[12%]">Date</th>
                    <th className="py-4.5 px-4 w-[8%]">Stats</th>
                    <th className="py-4.5 px-4 text-right w-[20%]">Home Team</th>
                    <th className="py-4.5 px-2 text-center w-[9%] font-mono">1</th>
                    <th className="py-4.5 px-2 text-center w-[9%] font-mono">Draw</th>
                    <th className="py-4.5 px-2 text-center w-[9%] font-mono">2</th>
                    <th className="py-4.5 px-4 text-left w-[20%]">Away Team</th>
                    <th className="py-4.5 px-6 text-center w-[13%]">Market</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200 text-xs font-semibold">
                  
                  {/* TABLE ROW 1 - Dortmund vs Girona */}
                  <tr className="hover:bg-white/[0.02] transition-colors duration-150">
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white text-xs">16:00</span>
                        <span className="text-slate-400 text-[10px]">Today</span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-slate-400">
                      <div className="hover:text-blue-400 cursor-pointer w-fit p-1 bg-white/5 rounded">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                          <path d="M18 20V10M12 20V4M6 20v-6" />
                        </svg>
                      </div>
                    </td>
                    
                    {/* Home Team & Logo Column */}
                    <td className="py-5 px-4 text-right">
                      <div className="flex items-center gap-2.5 justify-end">
                        <span className="text-slate-200 text-xs font-bold">Dortmund</span>
                        <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center border border-white/5">
                          <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <circle cx="12" cy="12" r="10" fill="#f59e0b" />
                            <circle cx="12" cy="12" r="8" fill="#000000" />
                            <text x="12" y="15" textAnchor="middle" fontSize="8" fill="#f59e0b" fontWeight="extrabold">BVB</text>
                          </svg>
                        </div>
                      </div>
                    </td>

                    {/* Odds Button 1 - Solid white with black text */}
                    <td className="py-5 px-2">
                      <button 
                        onClick={() => handleOddsClick('dor-gir', '1', '1.79')}
                        className={`w-full py-2 rounded-lg text-center font-mono font-extrabold transition-all duration-200 ${
                          isOddSelected('dor-gir', '1', '1.79')
                            ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)] border border-blue-400'
                            : 'bg-white hover:bg-slate-100 text-slate-950 border border-transparent'
                        }`}
                      >
                        1.79
                      </button>
                    </td>

                    {/* Odds Button Draw - Solid white with black text */}
                    <td className="py-5 px-2">
                      <button 
                        onClick={() => handleOddsClick('dor-gir', 'Draw', '3.44')}
                        className={`w-full py-2 rounded-lg text-center font-mono font-extrabold transition-all duration-200 ${
                          isOddSelected('dor-gir', 'Draw', '3.44')
                            ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)] border border-blue-400'
                            : 'bg-white hover:bg-slate-100 text-slate-950 border border-transparent'
                        }`}
                      >
                        3.44
                      </button>
                    </td>

                    {/* Odds Button 2 - Solid white with black text */}
                    <td className="py-5 px-2">
                      <button 
                        onClick={() => handleOddsClick('dor-gir', '2', '1.85')}
                        className={`w-full py-2 rounded-lg text-center font-mono font-extrabold transition-all duration-200 ${
                          isOddSelected('dor-gir', '2', '1.85')
                            ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)] border border-blue-400'
                            : 'bg-white hover:bg-slate-100 text-slate-950 border border-transparent'
                        }`}
                      >
                        1.85
                      </button>
                    </td>

                    {/* Away Team & Logo Column */}
                    <td className="py-5 px-4 text-left">
                      <div className="flex items-center gap-2.5 justify-start">
                        <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center border border-white/5">
                          <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <polygon points="12,2 22,8 22,18 12,22 2,18 2,8" fill="#dc2626" />
                            <circle cx="12" cy="12" r="6" fill="#ffffff" />
                            <path d="M12 9 L15 12 L12 15 L9 12 Z" fill="#dc2626" />
                          </svg>
                        </div>
                        <span className="text-slate-200 text-xs font-bold">Girona</span>
                      </div>
                    </td>

                    {/* Table Market */}
                    <td className="py-5 px-6 text-center">
                      <button className="bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-[11px] font-bold px-4 py-2.5 rounded-lg border border-white/5 transition-all flex items-center justify-center gap-1.5 mx-auto active:scale-95">
                        <span>+140</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                  {/* TABLE ROW 2 - Al ittihad vs AL Nassr (exact spellings: Al ittihad and AL Nassr) */}
                  <tr className="hover:bg-white/[0.02] transition-colors duration-150">
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white text-xs">18:00</span>
                        <span className="text-slate-400 text-[10px]">Today</span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-slate-400">
                      <div className="hover:text-blue-400 cursor-pointer w-fit p-1 bg-white/5 rounded">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                          <path d="M18 20V10M12 20V4M6 20v-6" />
                        </svg>
                      </div>
                    </td>
                    
                    {/* Home Team & Logo Column */}
                    <td className="py-5 px-4 text-right">
                      <div className="flex items-center gap-2.5 justify-end">
                        <span className="text-slate-200 text-xs font-bold">Al ittihad</span>
                        <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center border border-white/5">
                          <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <polygon points="12,2 22,7 18,20 12,22 6,20 2,7" fill="#000000" />
                            <path d="M6 10 L18 10 L12 22 Z" fill="#eab308" />
                            <text x="12" y="16" textAnchor="middle" fontSize="6.5" fill="#ffffff" fontWeight="extrabold">ITH</text>
                          </svg>
                        </div>
                      </div>
                    </td>

                    {/* Odds Button 1 - Solid white with black text */}
                    <td className="py-5 px-2">
                      <button 
                        onClick={() => handleOddsClick('ith-nsr', '1', '1.89')}
                        className={`w-full py-2 rounded-lg text-center font-mono font-extrabold transition-all duration-200 ${
                          isOddSelected('ith-nsr', '1', '1.89')
                            ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)] border border-blue-400'
                            : 'bg-white hover:bg-slate-100 text-slate-950 border border-transparent'
                        }`}
                      >
                        1.89
                      </button>
                    </td>

                    {/* Odds Button Draw - Solid white with black text */}
                    <td className="py-5 px-2">
                      <button 
                        onClick={() => handleOddsClick('ith-nsr', 'Draw', '4.64')}
                        className={`w-full py-2 rounded-lg text-center font-mono font-extrabold transition-all duration-200 ${
                          isOddSelected('ith-nsr', 'Draw', '4.64')
                            ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)] border border-blue-400'
                            : 'bg-white hover:bg-slate-100 text-slate-950 border border-transparent'
                        }`}
                      >
                        4.64
                      </button>
                    </td>

                    {/* Odds Button 2 - Solid white with black text */}
                    <td className="py-5 px-2">
                      <button 
                        onClick={() => handleOddsClick('ith-nsr', '2', '1.30')}
                        className={`w-full py-2 rounded-lg text-center font-mono font-extrabold transition-all duration-200 ${
                          isOddSelected('ith-nsr', '2', '1.30')
                            ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)] border border-blue-400'
                            : 'bg-white hover:bg-slate-100 text-slate-950 border border-transparent'
                        }`}
                      >
                        1.30
                      </button>
                    </td>

                    {/* Away Team & Logo Column */}
                    <td className="py-5 px-4 text-left">
                      <div className="flex items-center gap-2.5 justify-start">
                        <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center border border-white/5">
                          <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <polygon points="12,2 20,8 17,19 12,22 7,19 4,8" fill="#eab308" />
                            <circle cx="12" cy="13" r="6" fill="#1e3a8a" />
                            <text x="12" y="16" textAnchor="middle" fontSize="6" fill="#ffffff" fontWeight="bold">NSR</text>
                          </svg>
                        </div>
                        <span className="text-slate-200 text-xs font-bold">AL Nassr</span>
                      </div>
                    </td>

                    {/* Table Market */}
                    <td className="py-5 px-6 text-center">
                      <button className="bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-[11px] font-bold px-4 py-2.5 rounded-lg border border-white/5 transition-all flex items-center justify-center gap-1.5 mx-auto active:scale-95">
                        <span>+190</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      {/* Right Sidebar Interactive Panel */}
      <section 
        className="fixed top-0 right-0 bottom-0 py-6 px-4 z-40 hidden xl:flex flex-col gap-6"
        style={{
          width: 'var(--right-panel-width)',
          backgroundColor: '#070d19',
          borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: 'calc(var(--header-height) + 24px)',
          overflowY: 'auto'
        }}
      >
        {/* Exact Tactic Chalkboard Drawing */}
        <LiveAnimation />

        {/* Betslip teaser panel */}
        <div 
          className="glassmorphic rounded-2xl p-4 flex flex-col gap-4 border border-white/5"
          style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}
        >
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold font-header tracking-wider uppercase text-slate-300">
              Quick Betslip
            </h4>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-blue-600/25 border border-blue-500/20 text-blue-400 rounded-full">
              {Object.keys(selectedOdds).length} Selected
            </span>
          </div>

          {Object.keys(selectedOdds).length === 0 ? (
            <div className="py-6 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold max-w-[180px]">
                Click on any decimal odd to add matches to your quick betslip
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* List selected bets */}
              <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                {Object.entries(selectedOdds).map(([key, oddVal]) => {
                  const [matchId, oddType] = key.split('-');
                  let matchTitle = '';
                  if (matchId === 'bar-rma') matchTitle = 'Barcelona vs Real Madrid';
                  else if (matchId === 'ars-mun') matchTitle = 'Arsenal vs Man United';
                  else if (matchId === 'psg-ojo') matchTitle = 'PSG vs Ojodu City';
                  else if (matchId === 'dor-gir') matchTitle = 'Dortmund vs Girona';
                  else if (matchId === 'ith-nsr') matchTitle = 'Al ittihad vs AL Nassr';

                  return (
                    <div key={key} className="flex justify-between items-center text-[10px] bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-bold max-w-[130px] truncate">{matchTitle}</span>
                        <span className="text-slate-400 text-[8px] uppercase">Market: Outcome ({oddType})</span>
                      </div>
                      <span className="font-mono text-cyan-400 font-extrabold text-xs">{oddVal}</span>
                    </div>
                  );
                })}
              </div>

              {/* Betslip calculations */}
              <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-medium">Estimated Return:</span>
                  <span className="text-white font-extrabold font-mono text-xs">
                    {(Object.values(selectedOdds).reduce((acc, val) => acc * parseFloat(val), 10) * 10).toFixed(2)} USD
                  </span>
                </div>
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold font-header text-xs tracking-wider uppercase py-2.5 rounded-xl transition-all glow-btn active:scale-95"
                  onClick={() => alert('Bet Slip Placed Successfully! (Simulation)')}
                >
                  Place Bet (10 USD)
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Spacer to push content from overlay quick-panel on large desktops */}
      <div className="right-panel-spacer" style={{ width: 'var(--right-panel-width)', flexShrink: 0 }}></div>
    </div>
  );
}
