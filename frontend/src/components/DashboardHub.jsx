import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, BrainCircuit, MapPin, TrendingUp, AlertCircle, Activity } from 'lucide-react';

const NAV_CARDS = [
  {
    id: 'cat1', route: '/category1', icon: ClipboardList,
    label: 'User History', sub: 'Medical info, past EEGs & reports',
    color: '#818cf8', glow: 'rgba(129,140,248,0.30)',
    gradient: 'linear-gradient(135deg,#4f46e5,#818cf8)',
  },
  {
    id: 'cat2', route: '/category2', icon: BrainCircuit,
    label: 'EEG Detection', sub: 'Upload & analyze brain activity',
    color: '#c084fc', glow: 'rgba(192,132,252,0.30)',
    gradient: 'linear-gradient(135deg,#7c3aed,#c084fc)',
  },
  {
    id: 'cat3', route: '/category3', icon: MapPin,
    label: 'Nearby Doctors', sub: 'Neurologists & epilepsy specialists',
    color: '#34d399', glow: 'rgba(52,211,153,0.30)',
    gradient: 'linear-gradient(135deg,#059669,#34d399)',
  },
];

const STAT_ITEMS = [
  { label: 'Risk Level',    value: 'Low',    icon: TrendingUp,  color: '#34d399', sub: 'Last EEG analysis' },
  { label: 'Seizure Risk',  value: '12%',    icon: AlertCircle, color: '#f59e0b', sub: 'Confidence score'  },
  { label: 'EEG Sessions',  value: '—',      icon: Activity,    color: '#818cf8', sub: 'Total uploads'      },
];

export default function DashboardHub() {
  const navigate = useNavigate();
  const username = localStorage.getItem('epichat_username') || 'User';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Welcome banner ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(192,132,252,0.10) 100%)',
        border: '1px solid rgba(129,140,248,0.18)',
        borderRadius: 20, padding: '24px 28px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h2 className="title" style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Welcome back, <span className="gradient-animate">{username}</span> 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.95rem' }}>
            Your neural diagnostics platform is ready. Select a module to begin.
          </p>
        </div>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#c084fc)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
          fontSize: '1.5rem',
        }}>
          🧠
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
                id={`dashboard-btn-${card.id}`}
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

      {/* ── Footer note ───────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', paddingTop: 24, color: 'var(--text-secondary)', fontSize: '0.78rem', opacity: 0.7 }}>
        EpiChat Portal · v2.0 · AI-powered epilepsy management · Use the chat widget (bottom right) for instant guidance
      </div>
    </div>
  );
}
