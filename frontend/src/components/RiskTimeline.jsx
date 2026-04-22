import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

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
    return (Array.isArray(arr) ? arr : []).map((v, i) => ({ t: i, risk: v }));
  }, [riskSeries]);

  // ── Theme-aware chart colors ──────────────────────────────────────────────
  const tickColor      = light ? '#374151'              : 'rgba(200,255,255,0.65)';
  const axisColor      = light ? 'rgba(0,0,0,0.12)'    : 'rgba(0,255,255,0.15)';
  const gridColor      = light ? 'rgba(0,0,0,0.06)'    : 'rgba(255,255,255,0.04)';
  const tooltipBg      = light ? 'rgba(255,255,255,0.97)' : 'rgba(3,7,18,0.92)';
  const tooltipBorder  = light ? 'rgba(99,102,241,0.25)'  : 'rgba(0,255,255,0.2)';
  const tooltipColor   = light ? '#111827'              : '#eaffff';
  const lineColor      = light ? '#6366f1'              : '#00F5FF';
  const legendColor    = light ? '#374151'              : 'var(--text-secondary)';

  return (
    <div className="glass-panel" style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div className="neon-text" style={{ fontWeight: 700 }}>📈 Risk Prediction Timeline</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Low → Elevated → High → Seizure</div>
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: 10, lineHeight: 1.5 }}>
        Predicted seizure probability per 12-second EEG window. Analyzed by BIOT + EEGNet model.
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 185 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fill: tickColor, fontSize: 11 }}
              axisLine={{ stroke: axisColor }}
              tickLine={false}
              label={{ value: 'Window', position: 'insideBottomRight', offset: -4, fill: tickColor, fontSize: 10 }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: tickColor, fontSize: 11 }}
              axisLine={{ stroke: axisColor }}
              tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip
              contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, color: tooltipColor, borderRadius: 10, fontSize: 12 }}
              formatter={(val) => [`${val.toFixed(1)}%`, 'Risk']}
              labelFormatter={(l) => `Window ${l}`}
            />
            <ReferenceLine y={20} stroke="rgba(234,179,8,0.5)"  strokeDasharray="5 4" label={{ value: '20%', fill: '#eab308', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={50} stroke="rgba(255,42,42,0.5)"  strokeDasharray="5 4" label={{ value: '50%', fill: '#ef4444', fontSize: 10, position: 'right' }} />
            {data.length > 0 && (
              <ReferenceLine
                x={Math.min(data.length - 1, Math.max(0, playhead))}
                stroke={light ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.25)'}
                strokeWidth={2}
              />
            )}
            <Line type="monotone" dataKey="risk" stroke={lineColor} strokeWidth={2.5} dot={false}
              activeDot={{ r: 5, fill: lineColor, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, marginTop: 8, flexWrap: 'wrap', color: legendColor, fontSize: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 2, background: 'rgba(234,179,8,0.7)', display: 'inline-block', borderRadius: 1 }} />
          <span>20% Pre-ictal threshold</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 2, background: 'rgba(255,42,42,0.7)', display: 'inline-block', borderRadius: 1 }} />
          <span>50% Seizure threshold</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 2, background: lineColor, display: 'inline-block', borderRadius: 1 }} />
          <span>Risk score</span>
        </div>
      </div>
    </div>
  );
}
