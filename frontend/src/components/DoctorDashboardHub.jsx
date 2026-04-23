import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, BrainCircuit, Users, AlertCircle, Activity } from 'lucide-react';
import { API_BASE } from '../lib/api';

const NAV_CARDS = [
  {
    id: 'doc-eeg', route: '/doctor-eeg', icon: BrainCircuit,
    label: 'EEG Detection', sub: 'Upload & analyze patient EEG data',
    color: '#0ea5e9', glow: 'rgba(14,165,233,0.30)',
    gradient: 'linear-gradient(135deg,#3b82f6,#0ea5e9)',
  },
  {
    id: 'doc-records', route: '/doctor-records', icon: Users,
    label: 'User Records', sub: 'View patient profiles and reports',
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.30)',
    gradient: 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
  },
];

export default function DoctorDashboardHub() {
  const navigate = useNavigate();
  const username = localStorage.getItem('epichat_username') || 'Doctor';
  
  const [stats, setStats] = useState({
    pending: '—',
    total: '—',
  });

  useEffect(() => {
    const token = localStorage.getItem('epichat_token');
    if (!token) return;
    fetch(`${API_BASE}/api/doctor/patients`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        const pending = data.filter(s => !s.reviewed).length;
        const total = new Set(data.map(s => s.patient_username || s.patient_name)).size;
        setStats({
          pending,
          total
        });
      }
    })
    .catch(console.error);
  }, []);

  const STAT_ITEMS = [
    { label: 'Pending Reviews',  value: stats.pending, icon: AlertCircle, color: '#f59e0b', sub: 'Awaiting your analysis'  },
    { label: 'Total Patients',   value: stats.total,   icon: Users,       color: '#3b82f6', sub: 'Registered users'      },
    { label: 'System Status',    value: 'Online',      icon: Activity,    color: '#10b981', sub: 'All systems go'      },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Welcome banner ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(14,165,233,0.10) 100%)',
        border: '1px solid rgba(59,130,246,0.18)',
        borderRadius: 20, padding: '24px 28px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h2 className="title" style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Welcome back, Dr. <span className="gradient-animate" style={{ backgroundImage: 'linear-gradient(135deg,#3b82f6,#0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{username}</span> 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.95rem' }}>
            Your neural diagnostics portal is ready. Select a module to begin reviewing patient records.
          </p>
        </div>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg,#3b82f6,#0ea5e9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
          fontSize: '1.5rem',
        }}>
          🩺
        </div>
      </div>

      {/* ── Quick stats row ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
        {STAT_ITEMS.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="glass-panel" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: `${color}18`, border: `1px solid ${color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 5 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Module cards ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <h3 className="title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, opacity: 0.8 }}>
          Modules
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {NAV_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                id={`doc-dashboard-btn-${card.id}`}
                onClick={() => navigate(card.route)}
                className="dashboard-card"
                style={{
                  background: 'var(--glass-bg)',
                  border: `1px solid ${card.color}33`,
                  borderRadius: 20,
                  padding: '28px 24px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  backdropFilter: 'blur(20px)',
                  boxShadow: `0 6px 24px ${card.glow}`,
                  transition: 'transform 0.22s, box-shadow 0.22s, border-color 0.22s',
                  animation: `slideUp 0.5s ${i * 0.1}s ease both`,
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 18px 40px ${card.glow}`;
                  e.currentTarget.style.borderColor = `${card.color}66`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = `0 6px 24px ${card.glow}`;
                  e.currentTarget.style.borderColor = `${card.color}33`;
                }}
              >
                {/* Icon + open button row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: card.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 6px 16px ${card.glow}`,
                  }}>
                    <Icon size={26} color="white" />
                  </div>
                  <div style={{
                    fontSize: '0.78rem', fontWeight: 600, color: 'white',
                    background: card.gradient, padding: '5px 12px', borderRadius: 20,
                    boxShadow: `0 3px 10px ${card.glow}`,
                  }}>
                    Open →
                  </div>
                </div>

                {/* Text */}
                <div>
                  <div className="dashboard-card-title" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>
                    {card.label}
                  </div>
                  <div className="dashboard-card-sub" style={{ fontSize: '0.85rem', lineHeight: 1.55 }}>
                    {card.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
