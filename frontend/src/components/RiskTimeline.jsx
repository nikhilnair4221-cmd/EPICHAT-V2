import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function RiskTimeline({ riskSeries = [], playhead = 0 }) {
  const data = useMemo(() => {
    return (riskSeries || []).map((v, i) => ({ t: i, risk: v }));
  }, [riskSeries]);

  return (
    <div className="glass-panel" style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="neon-text" style={{ fontWeight: 700 }}>📈 Risk Prediction Timeline</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Low → Elevated → High → Seizure</div>
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 4, lineHeight: 1.5 }}>
        Shows predicted seizure probability over time. Each point represents a 12-second EEG window analyzed by the BIOT + EEGNet model.
      </div>
      <div style={{ width: '100%', height: 180, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="t" tick={{ fill: 'rgba(200,255,255,0.6)', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,255,255,0.15)' }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'rgba(200,255,255,0.6)', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,255,255,0.15)' }} tickLine={false} />
            <Tooltip contentStyle={{ background: 'rgba(3,7,18,0.9)', border: '1px solid rgba(0,255,255,0.2)', color: '#eaffff' }} />
            <ReferenceLine y={20} stroke="rgba(234,179,8,0.35)" strokeDasharray="4 4" />
            <ReferenceLine y={50} stroke="rgba(255,42,42,0.35)" strokeDasharray="4 4" />
            {data.length > 0 && (
              <ReferenceLine
                x={Math.min(data.length - 1, Math.max(0, playhead))}
                stroke="rgba(255,255,255,0.2)"
              />
            )}
            <Line type="monotone" dataKey="risk" stroke="#00F5FF" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Threshold legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 2, background: 'rgba(234,179,8,0.6)', display: 'inline-block', borderRadius: 1 }} />
          <span>20% Pre-ictal threshold</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 2, background: 'rgba(255,42,42,0.6)', display: 'inline-block', borderRadius: 1 }} />
          <span>50% Seizure threshold</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 2, background: '#00F5FF', display: 'inline-block', borderRadius: 1 }} />
          <span>Risk score</span>
        </div>
      </div>
    </div>
  );
}

