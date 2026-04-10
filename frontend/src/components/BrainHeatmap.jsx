import React from 'react';

// Simple 10-20-ish top view (visual-only schematic)
const ELECTRODES = [
  { id: 0, label: 'Fp1', x: 40, y: 18 },
  { id: 1, label: 'Fp2', x: 60, y: 18 },
  { id: 2, label: 'F7', x: 28, y: 30 },
  { id: 3, label: 'F8', x: 72, y: 30 },
  { id: 4, label: 'F3', x: 44, y: 34 },
  { id: 5, label: 'F4', x: 56, y: 34 },
  { id: 6, label: 'T7', x: 22, y: 50 },
  { id: 7, label: 'T8', x: 78, y: 50 },
  { id: 8, label: 'C3', x: 46, y: 52 },
  { id: 9, label: 'C4', x: 54, y: 52 },
  { id: 10, label: 'P7', x: 28, y: 68 },
  { id: 11, label: 'P8', x: 72, y: 68 },
  { id: 12, label: 'P3', x: 45, y: 70 },
  { id: 13, label: 'P4', x: 55, y: 70 },
  { id: 14, label: 'O1', x: 43, y: 84 },
  { id: 15, label: 'O2', x: 57, y: 84 },
];

export default function BrainHeatmap({ seizureChannels = [] }) {
  // Map 18 EEG channels -> electrode dots (rough visual mapping).
  const hotSet = new Set((seizureChannels || []).map((i) => i % ELECTRODES.length));

  return (
    <div className="glass-panel" style={{ padding: 12 }}>
      <div className="neon-text" style={{ fontWeight: 700 }}>🧩 Electrode Activity Map</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>Topographic preview (schematic)</div>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: 180, marginTop: 10 }}>
        <defs>
          <radialGradient id="cool" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(0,245,255,0.35)" />
            <stop offset="100%" stopColor="rgba(0,245,255,0.05)" />
          </radialGradient>
          <radialGradient id="hot" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(255,42,42,0.8)" />
            <stop offset="100%" stopColor="rgba(255,42,42,0.08)" />
          </radialGradient>
        </defs>

        {/* Head outline */}
        <ellipse cx="50" cy="52" rx="34" ry="40" fill="rgba(3,7,18,0.6)" stroke="rgba(0,255,255,0.18)" strokeWidth="1.5" />
        <path d="M45 12 Q50 6 55 12" fill="none" stroke="rgba(0,255,255,0.18)" strokeWidth="1.5" />

        {ELECTRODES.map((e) => {
          const hot = hotSet.has(e.id);
          return (
            <g key={e.id}>
              <circle cx={e.x} cy={e.y} r="4.2" fill={hot ? 'url(#hot)' : 'url(#cool)'} stroke={hot ? 'rgba(255,42,42,0.9)' : 'rgba(0,245,255,0.5)'} strokeWidth="1.2" />
              <text x={e.x} y={e.y + 10} fontSize="4.6" textAnchor="middle" fill="rgba(200,255,255,0.75)">
                {e.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

