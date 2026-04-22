import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

// ─── Live theme hook ──────────────────────────────────────────────────────────
function useTheme() {
  const [t, setT] = React.useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
  React.useEffect(() => {
    const obs = new MutationObserver(() => setT(document.documentElement.getAttribute('data-theme') || 'dark'));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return t;
}

export default function RiskTimeline({ riskSeries = [], playhead = 0 }) {
  const theme = useTheme();
  const light = theme === 'light';

  const data = useMemo(() => {
    let arr = riskSeries;
    if (typeof arr === 'string') {
      try { arr = JSON.parse(arr); } catch(e) { arr = []; }
    }
    return (Array.isArray(arr) ? arr : []).map((v, i) => {
      let r = Number(v);
      if (isNaN(r)) r = 0;
      return { t: i, risk: r };
    });
  }, [riskSeries]);

  const hasData = data.length > 0;

  // ── Theme-aware chart colors ──────────────────────────────────────────────
  const tickColor      = light ? '#374151'              : 'rgba(200,255,255,0.65)';
  const axisColor      = light ? 'rgba(0,0,0,0.12)'    : 'rgba(0,255,255,0.15)';
  const gridColor      = light ? 'rgba(0,0,0,0.06)'    : 'rgba(255,255,255,0.04)';
  const tooltipBg      = light ? 'rgba(255,255,255,0.97)' : 'rgba(15,23,42,0.95)';
  const tooltipBorder  = light ? 'rgba(99,102,241,0.25)'  : 'rgba(255,255,255,0.15)';
  const tooltipColor   = light ? '#111827'              : '#f8fafc';
  const legendColor    = light ? '#374151'              : 'var(--text-secondary)';

  return (
    <div className="glass-panel" style={{ padding: 16, position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div className="neon-text" style={{ fontWeight: 700, fontSize: '1.05rem' }}>📈 Risk Prediction Timeline</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Continuous Monitoring</div>
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 12 }}>
        Predicted seizure probability per sliding window.
      </div>

      {/* Empty State Overlay */}
      {!hasData && (
        <div style={{
          position: 'absolute', top: 60, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: light ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)', zIndex: 10, borderRadius: 16
        }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No prediction data available yet.</div>
        </div>
      )}

      {/* Chart */}
      <div style={{ width: '100%', height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 24, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                {/* 100% to 76% (Red) */}
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="25%" stopColor="#ef4444" stopOpacity={0.5} />
                {/* 75% to 51% (Orange) */}
                <stop offset="26%" stopColor="#f97316" stopOpacity={0.5} />
                <stop offset="50%" stopColor="#f97316" stopOpacity={0.3} />
                {/* 50% to 26% (Yellow) */}
                <stop offset="51%" stopColor="#eab308" stopOpacity={0.3} />
                <stop offset="75%" stopColor="#eab308" stopOpacity={0.15} />
                {/* 25% to 0% (Green) */}
                <stop offset="76%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fill: tickColor, fontSize: 11 }}
              axisLine={{ stroke: axisColor }}
              tickLine={false}
              label={{ value: 'Time Window', position: 'insideBottomRight', offset: -5, fill: tickColor, fontSize: 10 }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: tickColor, fontSize: 11 }}
              axisLine={{ stroke: axisColor }}
              tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip
              contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, color: tooltipColor, borderRadius: 12, fontSize: 12, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
              formatter={(val) => {
                let status = 'Low';
                if (val > 75) status = 'Seizure Risk';
                else if (val > 50) status = 'High';
                else if (val > 25) status = 'Elevated';
                return [`${val.toFixed(1)}% (${status})`, 'Probability'];
              }}
              labelFormatter={(l) => `Window ${l}`}
            />
            
            {/* Risk Threshold Lines */}
            <ReferenceLine y={25} stroke="rgba(34,197,94,0.4)" strokeDasharray="4 4" label={{ value: '25%', fill: '#22c55e', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={50} stroke="rgba(234,179,8,0.4)" strokeDasharray="4 4" label={{ value: '50%', fill: '#eab308', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={75} stroke="rgba(249,115,22,0.4)" strokeDasharray="4 4" label={{ value: '75%', fill: '#f97316', fontSize: 10, position: 'right' }} />

            {/* Playhead marker */}
            {hasData && (
              <ReferenceLine
                x={Math.min(data.length - 1, Math.max(0, playhead))}
                stroke={light ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.4)'}
                strokeWidth={2}
              />
            )}
            
            <Area 
              type="linear" 
              dataKey="risk" 
              stroke={light ? '#2563eb' : '#38bdf8'} 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#riskGradient)" 
              isAnimationActive={false}
              activeDot={{ r: 6, fill: light ? '#2563eb' : '#38bdf8', stroke: light ? '#fff' : '#0f172a', strokeWidth: 2 }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', color: legendColor, fontSize: 12, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
          <span>Low (0-25)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
          <span>Elevated (26-50)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316' }} />
          <span>High (51-75)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
          <span>Seizure (76-100)</span>
        </div>
      </div>
    </div>
  );
}
