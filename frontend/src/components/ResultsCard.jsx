import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Activity, Info, X } from 'lucide-react';

function useTheme() {
  const [t, setT] = React.useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
  React.useEffect(() => {
    const obs = new MutationObserver(() => setT(document.documentElement.getAttribute('data-theme') || 'dark'));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return t;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

// ── Classification info tooltip ─────────────────────────────────────────────
const CLASSIFICATION_INFO = [
  { label: 'Normal',     color: '#22c55e', desc: 'No abnormal epileptiform discharges detected. Brain activity appears within typical parameters.' },
  { label: 'Pre-ictal',  color: '#eab308', desc: 'Subtle abnormal patterns detected that may precede a seizure. Increased monitoring recommended.' },
  { label: 'Ictal',      color: '#ff2a2a', desc: 'Active seizure patterns detected in the EEG recording. Immediate neurological evaluation advised.' },
  { label: 'Post-ictal', color: '#f97316', desc: 'Patterns consistent with the recovery period after a seizure. Brain activity is returning to baseline.' },
];

function ClassificationInfoPanel({ onClose }) {
  const theme = useTheme();
  const light = theme === 'light';
  return (
    <div style={{
      background: light ? 'rgba(255,255,255,0.98)' : 'rgba(3,7,18,0.95)',
      border: light ? '1px solid rgba(99,102,241,0.20)' : '1px solid rgba(0,255,255,0.15)',
      borderRadius: 14, padding: '16px 18px', marginTop: 12, position: 'relative',
      boxShadow: light ? '0 4px 20px rgba(99,102,241,0.12)' : 'none',
    }}>
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
      >
        <X size={14} />
      </button>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--text-primary)' }}>
        Classification Stages
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CLASSIFICATION_INFO.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: c.color,
              marginTop: 5, flexShrink: 0, boxShadow: `0 0 6px ${c.color}44`,
            }} />
            <div>
              <span style={{ fontWeight: 700, color: c.color, fontSize: '0.82rem' }}>{c.label}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginLeft: 6 }}>— {c.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── What This Means explainer ──────────────────────────────────────────────
function WhatThisMeans({ resultLabel, confidence }) {
  const theme = useTheme();
  const light = theme === 'light';
  const conf = Number.isFinite(confidence) ? confidence : 0;
  const explanations = {
    'Normal': `Your EEG recording shows normal brain wave patterns. The AI model is ${conf.toFixed(0)}% confident in this classification. No epileptiform discharges were detected in the analyzed channels.`,
    'Pre-ictal': `Your EEG shows subtle irregularities that may indicate an elevated seizure risk. The model detected pre-ictal patterns with ${conf.toFixed(0)}% confidence. Consult your neurologist for a detailed review.`,
    'Ictal': `The AI model has detected active seizure patterns in your EEG recording with ${conf.toFixed(0)}% confidence. This is a high-priority finding. Please share these results with your neurologist immediately.`,
    'Post-ictal': `Your EEG shows patterns consistent with the post-seizure recovery phase. The model is ${conf.toFixed(0)}% confident. Brain activity is transitioning back toward baseline.`,
  };
  const text = explanations[resultLabel] || `Classification: ${resultLabel} with ${conf.toFixed(0)}% confidence. Please discuss these results with your healthcare provider.`;

  return (
    <div style={{
      background: light ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.03)',
      borderRadius: 10, padding: '10px 14px', marginTop: 12, fontSize: '0.82rem',
      color: light ? '#374151' : 'var(--text-secondary)', lineHeight: 1.6,
      borderLeft: '3px solid var(--accent)',
      border: light ? '1px solid rgba(99,102,241,0.15)' : undefined,
      borderLeftWidth: 3,
    }}>
      <span style={{ fontWeight: 700, color: light ? '#111827' : 'var(--text-primary)', marginRight: 6 }}>💡 What this means:</span>
      {text}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ResultsCard({ resultLabel, confidence }) {
  const theme = useTheme();
  const light = theme === 'light';
  const [animated, setAnimated] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const conf = Number.isFinite(confidence) ? confidence : 0;

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = animated;
    const to = conf;
    const dur = 900;
    const tick = (now) => {
      const p = clamp((now - start) / dur, 0, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimated(from + (to - from) * ease);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conf, resultLabel]);

  const meta = useMemo(() => {
    if (resultLabel === 'Ictal') return { color: '#ff2a2a', badge: 'High', riskLevel: 'Critical', icon: AlertTriangle, ring: 'rgba(255,42,42,0.18)' };
    if (resultLabel === 'Pre-ictal') return { color: '#eab308', badge: 'Elevated', riskLevel: 'Moderate', icon: Activity, ring: 'rgba(234,179,8,0.16)' };
    if (resultLabel === 'Post-ictal') return { color: '#f97316', badge: 'Recovering', riskLevel: 'Low-Moderate', icon: Activity, ring: 'rgba(249,115,22,0.16)' };
    return { color: '#22c55e', badge: 'Low', riskLevel: 'Minimal', icon: CheckCircle, ring: 'rgba(34,197,94,0.16)' };
  }, [resultLabel]);

  const Icon = meta.icon;

  return (
    <div className="glass-panel" style={{ padding: 16, border: `1px solid ${meta.ring}` }}>

      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div className="neon-text" style={{ fontWeight: 700, fontSize: '1rem' }}>🧠 Seizure Classification</div>
        <button
          onClick={() => setShowInfo(v => !v)}
          style={{
            background: 'none', border: '1px solid rgba(0,255,255,0.15)', borderRadius: 8,
            padding: '4px 10px', cursor: 'pointer', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem',
            fontFamily: 'inherit', transition: 'border-color 0.2s',
          }}
          aria-label="Show classification info"
        >
          <Info size={13} /> What do these stages mean?
        </button>
      </div>

      {/* Info panel (toggleable) */}
      {showInfo && <ClassificationInfoPanel onClose={() => setShowInfo(false)} />}

      {/* Result display */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 14 }}>
        <div
          style={{
            width: 64, height: 64, borderRadius: 999,
            display: 'grid', placeItems: 'center',
            border: `2px solid ${meta.color}`,
            boxShadow: `0 0 26px ${meta.ring}`,
            background: 'rgba(3,7,18,0.55)',
          }}
        >
          <Icon size={34} style={{ color: meta.color }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 34, fontWeight: 900, color: light ? '#0f172a' : '#eaffff', lineHeight: 1.1 }}>
            {animated.toFixed(1)}% <span style={{ color: meta.color }}>— {resultLabel}</span>
          </div>

          {/* Risk Level + Confidence fields */}
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Risk Level: </span>
              <span style={{ color: meta.color, fontWeight: 800 }}>{meta.riskLevel}</span>
            </div>
            <div style={{ fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Confidence: </span>
              <span style={{ color: light ? '#0f172a' : 'var(--text-primary)', fontWeight: 800 }}>{conf.toFixed(1)}%</span>
            </div>
            <div style={{ fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Severity: </span>
              <span style={{ color: meta.color, fontWeight: 800 }}>{meta.badge}</span>
            </div>
          </div>
        </div>
      </div>

      {/* What this means */}
      <WhatThisMeans resultLabel={resultLabel} confidence={confidence} />
    </div>
  );
}
