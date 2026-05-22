import React, { useState } from 'react';
import { Menu, Home, Play, Star } from 'lucide-react';

interface SidebarProps {
  activeSport: string;
  setActiveSport: (sport: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSport, setActiveSport }) => {
  const [activeTab, setActiveTab] = useState('home');

  const mainNavItems = [
    { id: 'home', icon: <Home className="w-6 h-6" /> },
    { id: 'video', icon: <Play className="w-6 h-6" /> },
    { id: 'star', icon: <Star className="w-6 h-6" /> },
  ];

  const sportsNav = [
    {
      id: 'football',
      label: 'Football',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current" strokeWidth="2">
          {/* Soccer ball with premium hexagon details */}
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 0-3 1.5M7 6l3 2 1.5-2.5L9 3M12 22a10 10 0 0 0 3-1.5M17 18l-3-2-1.5 2.5 2.5 2.5" />
          <path d="M2.5 9.5L5 12l-2.5 2.5M21.5 9.5L19 12l2.5 2.5M12 7.5L8.5 10v4l3.5 2.5 3.5-2.5v-4z" />
          <path d="M5 12h3.5M19 12h-3.5M8.5 10L7 6M15.5 10l1.5-4M8.5 14l-1.5 4M15.5 14l1.5 4" />
        </svg>
      )
    },
    {
      id: 'basketball',
      label: 'Basketball',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current" strokeWidth="2">
          {/* Basketball rib lines */}
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v20M2 12h20M5 5.5c2 2 2 11 0 13M19 5.5c-2 2-2 11 0 13" />
        </svg>
      )
    },
    {
      id: 'rugby',
      label: 'Rugby',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current" strokeWidth="2">
          {/* Rugby laces and oval shape */}
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" className="opacity-0" />
          <path d="M2.5 12C2.5 5.65 6.75 2 12 2s9.5 3.65 9.5 10-4.25 10-9.5 10S2.5 18.35 2.5 12z" />
          <path d="M12 2v20M9 8h6M9 12h6M9 16h6" />
        </svg>
      )
    },
    {
      id: 'volleyball',
      label: 'Volleyball',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current" strokeWidth="2">
          {/* Volleyball curved swirl panels */}
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2c3 3 3 8 0 10-3-2-3-7 0-10z" />
          <path d="M12 22c3-3 3-8 0-10-3 2-3 7 0 10z" />
          <path d="M2 12c3 3 8 3 10 0-2-3-7-3-10 0z" />
          <path d="M22 12c-3 3-8 3-10 0 2-3 7-3 10 0z" />
        </svg>
      )
    }
  ];

  return (
    <aside 
      className="fixed top-0 left-0 bottom-0 flex flex-col items-center py-6 z-50 transition-all duration-300"
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: '#132247',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Menu / Hamburger Icon */}
      <button 
        className="text-white hover:text-blue-400 p-3 rounded-xl transition-all duration-200 mb-8 hover:bg-white/5 active:scale-95"
        aria-label="Toggle Menu"
      >
        <Menu className="w-6 h-6 text-slate-300" />
      </button>

      {/* Main Tab Links */}
      <nav className="flex flex-col gap-5 w-full items-center">
        {mainNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative p-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'text-white bg-blue-600/25 border-l-4 border-blue-500' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={{
                borderRadius: isActive ? '12px' : '16px',
                borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent',
                paddingLeft: isActive ? '10px' : '14px',
              }}
            >
              <div className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'drop-shadow-[0_0_8px_#3b82f6]' : ''}`}>
                {item.icon}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-grow my-8 border-b border-white/5 w-8"></div>

      {/* Sports Categories Navigation */}
      <nav className="flex flex-col gap-6 w-full items-center mb-8">
        {sportsNav.map((sport) => {
          const isActive = activeSport === sport.id;
          return (
            <button
              key={sport.id}
              onClick={() => setActiveSport(sport.id)}
              className={`p-3.5 rounded-full transition-all duration-300 group ${
                isActive 
                  ? 'text-blue-400 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.15)] scale-110 border border-blue-500/30' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
              }`}
              title={sport.label}
            >
              <div className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105">
                {sport.icon}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
