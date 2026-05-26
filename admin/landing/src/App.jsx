import React, { useState } from 'react';
import { Menu, Home, Star, Trophy, CircleDot, Disc, PlayCircle, X } from 'lucide-react';
import './index.css';

function App() {
  const [activeNav, setActiveNav] = useState('Sports');
  const [activeSidebar, setActiveSidebar] = useState('home');
  const [showModal, setShowModal] = useState(null); // 'login' or 'signup' or null
  const [betSlip, setBetSlip] = useState([]);

  // Handle odds selection
  const toggleBet = (matchName, selection, oddValue) => {
    const existingIndex = betSlip.findIndex(b => b.matchName === matchName && b.selection === selection);
    if (existingIndex >= 0) {
      // Remove if already selected
      setBetSlip(betSlip.filter((_, i) => i !== existingIndex));
    } else {
      // Add to bet slip
      setBetSlip([...betSlip, { id: Math.random().toString(), matchName, selection, oddValue }]);
    }
  };

  const isSelected = (matchName, selection) => {
    return betSlip.some(b => b.matchName === matchName && b.selection === selection);
  };

  const removeBet = (id) => {
    setBetSlip(betSlip.filter(b => b.id !== id));
  };

  const totalOdds = betSlip.length > 0 
    ? betSlip.reduce((acc, bet) => acc * parseFloat(bet.oddValue), 1).toFixed(2)
    : 0;

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="menu-icon">
          <Menu size={24} />
        </div>
        <div className={`sidebar-item ${activeSidebar === 'home' ? 'active' : ''}`} onClick={() => setActiveSidebar('home')}>
          <Home size={20} />
        </div>
        <div className={`sidebar-item ${activeSidebar === 'play' ? 'active' : ''}`} onClick={() => setActiveSidebar('play')}>
          <PlayCircle size={20} />
        </div>
        <div className={`sidebar-item ${activeSidebar === 'star' ? 'active' : ''}`} onClick={() => setActiveSidebar('star')}>
          <Star size={20} />
        </div>
        <div className={`sidebar-item ${activeSidebar === 'football' ? 'active' : ''}`} onClick={() => setActiveSidebar('football')}>
          <CircleDot size={20} />
        </div>
        <div className={`sidebar-item ${activeSidebar === 'basketball' ? 'active' : ''}`} onClick={() => setActiveSidebar('basketball')}>
          <Disc size={20} />
        </div>
        <div className={`sidebar-item ${activeSidebar === 'trophy' ? 'active' : ''}`} onClick={() => setActiveSidebar('trophy')}>
          <Trophy size={20} />
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="logo-section">
            <Trophy size={28} color="#3B82F6" />
            <div>
              <div className="logo-text">Peeritrade</div>
              <div className="logo-sub">TRADE • WIN • REPEAT</div>
            </div>
          </div>
          
          <div className="nav-links">
            {['Sports', 'Live', 'Promotion', 'Contact'].map(nav => (
              <a 
                key={nav}
                href="#" 
                className={`nav-link ${activeNav === nav ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveNav(nav); }}
              >
                {nav}
              </a>
            ))}
          </div>

          <div className="header-actions">
            <button className="btn btn-login" onClick={() => setShowModal('login')}>LOG IN</button>
            <button className="btn btn-signup" onClick={() => setShowModal('signup')}>SIGN UP</button>
          </div>
        </div>

        <div className="content-layout">
          <div className="left-column">
            {/* Banner */}
            <div className="banner">
              <div className="banner-content">
                <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
                  <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3B82F6'}}></div>
                  <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6366F1'}}></div>
                  <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#A5B4FC'}}></div>
                </div>
                <h1>SIGN UP AND GET</h1>
                <p>100% welcome Bonus</p>
                <button className="btn-white" onClick={() => setShowModal('signup')}>Sign Up</button>
              </div>
              <img src="/player.png" alt="Player" className="banner-image" />
            </div>

            {/* Live Matches */}
            <div className="section-header">
              <div className="section-title">Live <span>Matches</span></div>
              <button className="btn-small" onClick={() => alert("Loading all live matches...")}>ALL LIVES</button>
            </div>

            <div className="match-cards">
              {/* Match Card 1 */}
              <div className="match-card">
                <div className="live-badge">Live</div>
                <div className="teams-display">
                  <div className="team-logo">
                    <img src="https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png" alt="FCB" />
                  </div>
                  <div className="vs">VS</div>
                  <div className="team-logo">
                    <img src="https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png" alt="RMA" />
                  </div>
                </div>
                <div className="match-info">
                  <div className="match-time">2nd Half 67'</div>
                  <div className="match-league">Football/La Liga</div>
                  <div className="score-row">
                    <span>Barcelona</span>
                    <span>2</span>
                  </div>
                  <div className="score-row">
                    <span>Real Madrid</span>
                    <span>4</span>
                  </div>
                </div>
                <div className="odds-row">
                  <div 
                    className={`odd-box ${isSelected('Barcelona vs Real Madrid', '1') ? 'selected' : ''}`}
                    onClick={() => toggleBet('Barcelona vs Real Madrid', '1', '1.76')}
                  >1.76</div>
                  <div 
                    className={`odd-box ${isSelected('Barcelona vs Real Madrid', 'Draw') ? 'selected' : ''}`}
                    onClick={() => toggleBet('Barcelona vs Real Madrid', 'Draw', '1.86')}
                  >1.86</div>
                  <div 
                    className={`odd-box ${isSelected('Barcelona vs Real Madrid', '2') ? 'selected' : ''}`}
                    onClick={() => toggleBet('Barcelona vs Real Madrid', '2', '1.40')}
                  >1.40</div>
                </div>
              </div>

              {/* Match Card 2 */}
              <div className="match-card">
                <div className="live-badge">Live</div>
                <div className="teams-display">
                  <div className="team-logo">
                    <img src="https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png" alt="ARS" />
                  </div>
                  <div className="vs">VS</div>
                  <div className="team-logo">
                    <img src="https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/1200px-Manchester_United_FC_crest.svg.png" alt="MUN" />
                  </div>
                </div>
                <div className="match-info">
                  <div className="match-time">2nd Half 46'</div>
                  <div className="match-league">Football/Premier League</div>
                  <div className="score-row">
                    <span>Arsenal</span>
                    <span>3</span>
                  </div>
                  <div className="score-row">
                    <span>Man United</span>
                    <span>2</span>
                  </div>
                </div>
                <div className="odds-row">
                  <div 
                    className={`odd-box ${isSelected('Arsenal vs Man United', '1') ? 'selected' : ''}`}
                    onClick={() => toggleBet('Arsenal vs Man United', '1', '1.70')}
                  >1.70</div>
                  <div 
                    className={`odd-box ${isSelected('Arsenal vs Man United', 'Draw') ? 'selected' : ''}`}
                    onClick={() => toggleBet('Arsenal vs Man United', 'Draw', '1.50')}
                  >1.50</div>
                  <div 
                    className={`odd-box ${isSelected('Arsenal vs Man United', '2') ? 'selected' : ''}`}
                    onClick={() => toggleBet('Arsenal vs Man United', '2', '1.59')}
                  >1.59</div>
                </div>
              </div>

              {/* Match Card 3 */}
              <div className="match-card">
                <div className="live-badge">Live</div>
                <div className="teams-display">
                  <div className="team-logo">
                    <img src="https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/1200px-Paris_Saint-Germain_F.C..svg.png" alt="PSG" />
                  </div>
                  <div className="vs">VS</div>
                  <div className="team-logo" style={{backgroundColor: '#EF4444'}}>
                    <div style={{color: 'white', fontWeight: 'bold', fontSize: '10px', textAlign: 'center'}}>OJODU CITY</div>
                  </div>
                </div>
                <div className="match-info">
                  <div className="match-time">1st Half 40'</div>
                  <div className="match-league">Football/Champions League</div>
                  <div className="score-row">
                    <span>Paris Saint Germain</span>
                    <span>6</span>
                  </div>
                  <div className="score-row">
                    <span>Ojodu City</span>
                    <span>1</span>
                  </div>
                </div>
                <div className="odds-row">
                  <div 
                    className={`odd-box ${isSelected('PSG vs Ojodu City', '1') ? 'selected' : ''}`}
                    onClick={() => toggleBet('PSG vs Ojodu City', '1', '1.20')}
                  >1.20</div>
                  <div 
                    className={`odd-box ${isSelected('PSG vs Ojodu City', 'Draw') ? 'selected' : ''}`}
                    onClick={() => toggleBet('PSG vs Ojodu City', 'Draw', '1.83')}
                  >1.83</div>
                  <div 
                    className={`odd-box ${isSelected('PSG vs Ojodu City', '2') ? 'selected' : ''}`}
                    onClick={() => toggleBet('PSG vs Ojodu City', '2', '1.49')}
                  >1.49</div>
                </div>
              </div>
            </div>

            {/* Upcoming Table */}
            <div className="section-header">
              <div className="section-title">Football <span>Upcoming</span></div>
              <button className="btn-small" onClick={() => alert("Loading all upcoming football matches...")}>All Football</button>
            </div>

            <table className="upcoming-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Stats</th>
                  <th>1</th>
                  <th>Draw</th>
                  <th>2</th>
                  <th className="market-col">Market</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="time-col">16:00<br/>Today</td>
                  <td>
                    <div className="match-name">
                      <span>Dortmund</span>
                      <img className="small-logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/200px-Borussia_Dortmund_logo.svg.png" alt="BVB" />
                    </div>
                  </td>
                  <td>
                    <div 
                      className={`odd-cell ${isSelected('Dortmund vs Girona', '1') ? 'selected' : ''}`}
                      onClick={() => toggleBet('Dortmund vs Girona', '1', '1.79')}
                    >1.79</div>
                  </td>
                  <td>
                    <div 
                      className={`odd-cell ${isSelected('Dortmund vs Girona', 'Draw') ? 'selected' : ''}`}
                      onClick={() => toggleBet('Dortmund vs Girona', 'Draw', '3.44')}
                    >3.44</div>
                  </td>
                  <td>
                    <div 
                      className={`odd-cell ${isSelected('Dortmund vs Girona', '2') ? 'selected' : ''}`}
                      onClick={() => toggleBet('Dortmund vs Girona', '2', '1.85')}
                    >1.85</div>
                  </td>
                  <td className="market-col">+140</td>
                </tr>
                <tr>
                  <td className="time-col">18:00<br/>Today</td>
                  <td>
                    <div className="match-name">
                      <span>Al itihad</span>
                      <img className="small-logo" src="https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Al-Ittihad_Club_%28Jeddah%29.svg/200px-Al-Ittihad_Club_%28Jeddah%29.svg.png" alt="ITI" />
                    </div>
                  </td>
                  <td>
                    <div 
                      className={`odd-cell ${isSelected('Al itihad vs AL Nassr', '1') ? 'selected' : ''}`}
                      onClick={() => toggleBet('Al itihad vs AL Nassr', '1', '1.89')}
                    >1.89</div>
                  </td>
                  <td>
                    <div 
                      className={`odd-cell ${isSelected('Al itihad vs AL Nassr', 'Draw') ? 'selected' : ''}`}
                      onClick={() => toggleBet('Al itihad vs AL Nassr', 'Draw', '4.64')}
                    >4.64</div>
                  </td>
                  <td>
                    <div 
                      className={`odd-cell ${isSelected('Al itihad vs AL Nassr', '2') ? 'selected' : ''}`}
                      onClick={() => toggleBet('Al itihad vs AL Nassr', '2', '1.30')}
                    >1.30</div>
                  </td>
                  <td className="market-col">+190</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="right-column">
            <div className="animation-title">Live Animation</div>
            <div className="pitch-container">
              <div className="pitch-lines">
                <div className="center-line"></div>
                <div className="center-circle"></div>
                <div className="penalty-box-top"></div>
                <div className="penalty-box-bottom"></div>
              </div>
              <svg className="tactic-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Tactics Drawing */}
                <path d="M50 50 L60 30" stroke="white" strokeWidth="0.5" fill="none" strokeDasharray="1,1" />
                <polygon points="60,30 58,32 62,32" fill="white" />
                
                <path d="M50 50 L80 60" stroke="white" strokeWidth="0.5" fill="none" strokeDasharray="1,1" />
                <polygon points="80,60 78,58 78,62" fill="white" />
                
                <path d="M20 70 L40 50" stroke="white" strokeWidth="0.5" fill="none" strokeDasharray="1,1" />
                <polygon points="40,50 38,52 38,48" fill="white" />

                {/* Xs and Os */}
                <circle cx="20" cy="40" r="1.5" stroke="white" strokeWidth="0.5" fill="none" />
                <text x="40" y="40" fill="white" fontSize="3" fontFamily="sans-serif">X</text>
                
                <circle cx="80" cy="40" r="1.5" stroke="white" strokeWidth="0.5" fill="none" />
                <text x="60" y="40" fill="white" fontSize="3" fontFamily="sans-serif">X</text>
                
                <circle cx="50" cy="30" r="1.5" stroke="white" strokeWidth="0.5" fill="none" />
                
                <circle cx="20" cy="60" r="1.5" stroke="white" strokeWidth="0.5" fill="none" />
                <text x="40" y="60" fill="white" fontSize="3" fontFamily="sans-serif">X</text>
                
                <circle cx="80" cy="60" r="1.5" stroke="white" strokeWidth="0.5" fill="none" />
                <text x="60" y="60" fill="white" fontSize="3" fontFamily="sans-serif">X</text>
                
                <circle cx="50" cy="70" r="1.5" stroke="white" strokeWidth="0.5" fill="none" />
                <text x="50" y="80" fill="white" fontSize="3" fontFamily="sans-serif">X</text>
              </svg>
            </div>

            {/* Bet Slip */}
            {betSlip.length > 0 && (
              <div className="bet-slip">
                <div className="bet-slip-title">
                  <span>Bet Slip</span>
                  <span className="bet-slip-badge">{betSlip.length}</span>
                </div>
                <div className="bet-items">
                  {betSlip.map(bet => (
                    <div key={bet.id} className="bet-item">
                      <div className="bet-details">
                        <h4>{bet.matchName}</h4>
                        <p>Selection: <strong>{bet.selection}</strong></p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="bet-odd">{bet.oddValue}</span>
                        <button className="bet-remove" onClick={() => removeBet(bet.id)}><X size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bet-summary">
                  <div className="summary-row">
                    <span>Total Odds</span>
                    <strong>{totalOdds}</strong>
                  </div>
                  <button className="btn-full" onClick={() => {
                    alert('Bet placed successfully!');
                    setBetSlip([]);
                  }}>Place Bet</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(null)}>
              <X size={24} />
            </button>
            <h2 className="modal-title">
              {showModal === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              alert(`${showModal === 'login' ? 'Logged in' : 'Signed up'} successfully!`);
              setShowModal(null);
            }}>
              {showModal === 'signup' && (
                <div className="input-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="John Doe" required />
                </div>
              )}
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" placeholder="you@example.com" required />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input type="password" placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn-full">
                {showModal === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
