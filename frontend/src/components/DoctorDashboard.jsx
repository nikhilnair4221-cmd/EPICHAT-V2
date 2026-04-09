import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, LogOut, Bell, CheckCircle2 } from 'lucide-react';

import DoctorProfiles from './DoctorProfiles';
import EEGMonitor from './EEGMonitor';
import RiskTimeline from './RiskTimeline';
import BrainHeatmap from './BrainHeatmap';
import { apiJson } from '../lib/api';

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const unreviewedCount = useMemo(() => subs.filter((s) => !s.reviewed).length, [subs]);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await apiJson('/api/doctor/patients');
      setSubs(data);
      if (selected) {
        const updated = data.find((x) => x.id === selected.id);
        setSelected(updated || null);
      }
    } catch (e) {
      console.error(e);
      alert(`Failed to load patient submissions: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markReviewed = async (id) => {
    try {
      const updated = await apiJson(`/api/doctor/patients/${id}/review`, { method: 'PATCH' });
      setSubs((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setSelected(updated);
    } catch (e) {
      console.error(e);
      alert(`Mark reviewed failed: ${e.message}`);
    }
  };

  return (
    <div className="app-canvas flex-col">
      <div className="orb orb-pink" style={{ top: '-10%', left: '-10%' }} />
      <div className="orb orb-blue" style={{ bottom: '-10%', right: '-5%' }} />

      <nav className="dashboard-nav glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={24} className="neon-icon" />
          <h1 className="title neon-text" style={{ fontSize: '1.4rem', margin: 0 }}>EpiChat — Doctor Portal</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="glass-panel" style={{ padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Bell size={16} />
            <div style={{ fontWeight: 800 }}>{unreviewedCount}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>unreviewed</div>
          </div>
          <button className="btn-secondary nav-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>
            <LogOut size={16} style={{ marginRight: 8 }} /> Disconnect
          </button>
        </div>
      </nav>

      <main className="dashboard-main" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DoctorProfiles />

          <div className="glass-panel" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <div className="neon-text" style={{ fontWeight: 800 }}>New Submissions</div>
              <button className="btn-secondary" type="button" onClick={refresh} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {subs.length === 0 && (
                <div style={{ color: 'var(--text-secondary)' }}>
                  No patient submissions yet. Once a patient uploads EEG/symptoms, it will appear here (persisted in SQLite).
                </div>
              )}
              {subs.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="glass-panel"
                  onClick={() => setSelected(s)}
                  style={{
                    padding: 12,
                    textAlign: 'left',
                    border: selected?.id === s.id ? '1px solid rgba(0,245,255,0.35)' : '1px solid rgba(0,255,255,0.10)',
                    background: selected?.id === s.id ? 'rgba(0,245,255,0.06)' : undefined,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#eaffff' }}>{s.patient_name} <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>({s.patient_age}, {s.patient_gender})</span></div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {!s.reviewed && <span style={{ color: '#00F5FF', fontSize: 12, fontWeight: 800 }}>NEW</span>}
                      <span style={{ color: s.result_label === 'Ictal' ? '#ff2a2a' : s.result_label === 'Pre-ictal' ? '#eab308' : '#22c55e', fontWeight: 900 }}>
                        {s.confidence.toFixed(1)}% — {s.result_label}
                      </span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 12 }}>
                    {fmtDate(s.created_at)} • EEG: {s.eeg_uploaded ? 'Yes' : 'No'} • Reviewed: {s.reviewed ? 'Yes' : 'No'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!selected && (
            <div className="glass-panel" style={{ padding: 16, color: 'var(--text-secondary)' }}>
              Select a patient submission to view the full report (EEG monitor, risk timeline, and electrode map).
            </div>
          )}

          {selected && (
            <>
              <div className="glass-panel" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div className="neon-text" style={{ fontWeight: 900, fontSize: '1.1rem' }}>{selected.patient_name}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {selected.patient_age} • {selected.patient_gender} • @{selected.patient_username}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 12 }}>{fmtDate(selected.created_at)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, color: selected.result_label === 'Ictal' ? '#ff2a2a' : selected.result_label === 'Pre-ictal' ? '#eab308' : '#22c55e' }}>
                      {selected.confidence.toFixed(1)}% — {selected.result_label}
                    </div>
                    <button className="btn-primary" type="button" onClick={() => markReviewed(selected.id)} disabled={selected.reviewed} style={{ marginTop: 10 }}>
                      <CheckCircle2 size={16} style={{ marginRight: 8 }} />
                      {selected.reviewed ? 'Reviewed' : 'Mark Reviewed'}
                    </button>
                  </div>
                </div>
                {selected.symptoms_text && (
                  <div style={{ marginTop: 12, color: 'var(--text-secondary)' }}>
                    <div style={{ fontWeight: 800, color: '#eaffff' }}>Symptoms</div>
                    <div style={{ marginTop: 6 }}>{selected.symptoms_text}</div>
                  </div>
                )}
              </div>

              <EEGMonitor isLive={false} riskSeries={selected.risk_score_series} seizureChannels={selected.seizure_channels} height={320} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <RiskTimeline riskSeries={selected.risk_score_series} playhead={Math.min(selected.risk_score_series.length - 1, Math.floor(selected.risk_score_series.length * 0.7))} />
                <BrainHeatmap seizureChannels={selected.seizure_channels} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

