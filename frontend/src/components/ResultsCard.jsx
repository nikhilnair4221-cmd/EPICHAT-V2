import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Activity } from 'lucide-react';

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function ResultsCard({ resultLabel, confidence }) {
  const [animated, setAnimated] = useState(0);
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
    if (resultLabel === 'Ictal') return { color: '#ff2a2a', badge: 'High', icon: AlertTriangle, ring: 'rgba(255,42,42,0.18)' };
    if (resultLabel === 'Pre-ictal') return { color: '#eab308', badge: 'Elevated', icon: Activity, ring: 'rgba(234,179,8,0.16)' };
    return { color: '#22c55e', badge: 'Low', icon: CheckCircle, ring: 'rgba(34,197,94,0.16)' };
  }, [resultLabel]);

  const Icon = meta.icon;

  return (
    <div className="glass-panel" style={{ padding: 16, border: `1px solid ${meta.ring}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
        <div className="neon-text" style={{ fontWeight: 700 }}>Classification Result</div>
        <div style={{ color: meta.color, fontWeight: 800, letterSpacing: 1 }}>{meta.badge} severity</div>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 14 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            border: `2px solid ${meta.color}`,
            boxShadow: `0 0 26px ${meta.ring}`,
            background: 'rgba(3,7,18,0.55)',
          }}
        >
          <Icon size={34} style={{ color: meta.color }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 34, fontWeight: 900, color: '#eaffff', lineHeight: 1.1 }}>
            {animated.toFixed(1)}% <span style={{ color: meta.color }}>— {resultLabel}</span>
          </div>
          <div style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
            Green = Normal, Yellow = Pre-ictal, Red = Ictal
          </div>
        </div>
      </div>
    </div>
  );
}

