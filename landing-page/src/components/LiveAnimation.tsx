import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export const LiveAnimation = () => {
  const [tacticsActive, setTacticsActive] = useState(true);

  return (
    <div 
      className="glassmorphic rounded-2xl p-4 flex flex-col gap-3 relative transition-all duration-300 w-full"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider text-slate-300 font-header uppercase">
          Live Animation
        </h3>
        
        {/* Tactics reset toggle */}
        <button 
          onClick={() => setTacticsActive(!tacticsActive)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          title="Reset Tactics Layout"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chalkboard Tactic field container */}
      <div 
        className="relative overflow-hidden rounded-xl select-none shadow-inner"
        style={{
          height: '420px',
          backgroundColor: '#115d3b',
          backgroundImage: 'radial-gradient(circle, #136a44 0%, #0d4a2f 100%)',
          border: '1px solid #093320'
        }}
      >
        
        {/* SVG Tactical Field - matching mockup screenshot exactly */}
        <svg viewBox="0 0 240 360" className="w-full h-full stroke-white/40 stroke-[1.2] fill-none">
          {defsBlock()}

          {/* Outer Boundary */}
          <rect x="10" y="10" width="220" height="340" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
          
          {/* Halfway Line */}
          <line x1="10" y1="180" x2="230" y2="180" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
          
          {/* Center Circle */}
          <circle cx="120" cy="180" r="32" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
          <circle cx="120" cy="180" r="1.5" fill="rgba(255, 255, 255, 0.5)" />

          {/* Top Penalty Area */}
          <rect x="50" y="10" width="140" height="52" stroke="rgba(255, 255, 255, 0.4)" />
          {/* Top Goal Area */}
          <rect x="85" y="10" width="70" height="18" stroke="rgba(255, 255, 255, 0.4)" />
          {/* Top D-Arc */}
          <path d="M96 62 A24 24 0 0 0 144 62" stroke="rgba(255, 255, 255, 0.4)" />
          
          {/* Bottom Penalty Area */}
          <rect x="50" y="298" width="140" height="52" stroke="rgba(255, 255, 255, 0.4)" />
          {/* Bottom Goal Area */}
          <rect x="85" y="332" width="70" height="18" stroke="rgba(255, 255, 255, 0.4)" />
          {/* Bottom D-Arc */}
          <path d="M96 298 A24 24 0 0 1 144 298" stroke="rgba(255, 255, 255, 0.4)" />

          {/* Penalty Spots */}
          <circle cx="120" cy="48" r="1" fill="rgba(255, 255, 255, 0.5)" />
          <circle cx="120" cy="312" r="1" fill="rgba(255, 255, 255, 0.5)" />

          {/* Corner Arcs */}
          <path d="M10 20 A10 10 0 0 0 20 10" stroke="rgba(255, 255, 255, 0.3)" />
          <path d="M220 10 A10 10 0 0 0 230 20" stroke="rgba(255, 255, 255, 0.3)" />
          <path d="M20 350 A10 10 0 0 0 10 340" stroke="rgba(255, 255, 255, 0.3)" />
          <path d="M230 340 A10 10 0 0 0 220 350" stroke="rgba(255, 255, 255, 0.3)" />

          {/* ======================================================== */}
          {/* TACTICAL CHALK DRAWINGS FROM SCREENSHOT - EXACT POSITIONS */}
          {/* ======================================================== */}
          {tacticsActive && (
            <g className="transition-opacity duration-300">
              
              {/* --- TOP HALF PLAYS --- */}
              {/* O on the far left side, arrow pointing up-left */}
              <circle cx="35" cy="140" r="4.5" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M35 130 Q 30 115 15 105" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="3 2" markerEnd="url(#arrow)" />

              {/* O at the center-left circle, arrow going up-right towards X */}
              <circle cx="75" cy="170" r="4.5" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M80 162 L 105 142" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="3 2" markerEnd="url(#arrow)" />

              {/* X in the center-top-left path */}
              <path d="M110 135 L 118 143 M 118 135 L 110 143" stroke="#ffffff" strokeWidth="1.2" />

              {/* O on the left center circle margin */}
              <circle cx="120" cy="170" r="4.5" stroke="#ffffff" strokeWidth="1.2" />
              {/* Ball next to center O */}
              <circle cx="120" cy="178" r="1.8" fill="#ffffff" stroke="none" />
              {/* Arrow from center circle pointing up-left */}
              <path d="M120 162 L 105 135" stroke="#ffffff" strokeWidth="1.2" markerEnd="url(#arrow)" />

              {/* O on the far right center, arrow running up-right */}
              <circle cx="195" cy="140" r="4.5" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M195 130 Q 200 115 210 100" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="3 2" markerEnd="url(#arrow)" />

              {/* X mark on right center */}
              <path d="M165 140 L 173 148 M 173 140 L 165 148" stroke="#ffffff" strokeWidth="1.2" />

              {/* O in the penalty area center-right, arrow shooting at goal */}
              <circle cx="150" cy="85" r="4.5" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M142 80 L 125 50" stroke="#ffffff" strokeWidth="1.2" markerEnd="url(#arrow)" />

              {/* X defender in penalty area */}
              <path d="M116 75 L 124 83 M 124 75 L 116 83" stroke="#ffffff" strokeWidth="1.2" />

              {/* --- BOTTOM HALF PLAYS --- */}
              {/* O on far left bottom side, arrow curving down-left */}
              <circle cx="35" cy="220" r="4.5" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M35 230 Q 30 250 15 265" stroke="#ffffff" strokeWidth="1.2" markerEnd="url(#arrow)" />

              {/* O on far bottom left, arrow running down-right */}
              <circle cx="50" cy="285" r="4.5" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M55 292 L 75 315" stroke="#ffffff" strokeWidth="1.2" markerEnd="url(#arrow)" />

              {/* O on the center-right bottom side */}
              <circle cx="170" cy="225" r="4.5" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M175 233 L 195 255" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="3 2" markerEnd="url(#arrow)" />

              {/* X in bottom penalty area with square netting overlay */}
              <path d="M116 332 L 124 340 M 124 332 L 116 340" stroke="#ffffff" strokeWidth="1.2" />
              <rect x="110" y="327" width="20" height="18" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" />

              {/* Defensive Os and Xs at bottom center */}
              <circle cx="120" cy="260" r="4.5" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M120 252 L 120 230" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2 2" markerEnd="url(#arrow)" />

              <circle cx="195" cy="220" r="4.5" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M195 230 Q 200 250 215 270" stroke="#ffffff" strokeWidth="1.2" markerEnd="url(#arrow)" />

              <path d="M165 220 L 173 228 M 173 220 L 165 228" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M110 220 L 118 228 M 118 220 L 110 228" stroke="#ffffff" strokeWidth="1.2" />

            </g>
          )}
        </svg>

        {/* Tactical board label overlay */}
        <div className="absolute bottom-2.5 left-3 text-[10px] text-white/30 font-mono tracking-wider">
          PEERITRADE BOARD v1.0
        </div>
      </div>

      {/* Chalkboard Legend matching screenshot */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-white/5 pt-2 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-white inline-block"></span>
          <span>Attack (O)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white font-bold inline-block text-[11px] leading-none">✕</span>
          <span>Defense (X)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
          <span>Match Ball</span>
        </div>
      </div>
    </div>
  );
};

const defsBlock = () => (
  <defs>
    {/* Arrow Marker Definition */}
    <marker
      id="arrow"
      viewBox="0 0 10 10"
      refX="6"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M 0 2.5 L 7 5 L 0 7.5 z" fill="rgba(255, 255, 255, 0.75)" stroke="none" />
    </marker>
  </defs>
);
