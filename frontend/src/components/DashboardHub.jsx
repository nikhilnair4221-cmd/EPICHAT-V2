import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  LogOut,
  ClipboardList,
  BrainCircuit,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

const NAV_CARDS = [
  {
    id: 'cat1',
    route: '/category1',
    icon: ClipboardList,
    label: 'User History',
    sub: 'Medical info, past EEGs & reports',
    color: '#818cf8',
    glow: 'rgba(129,140,248,0.35)',
    gradient: 'linear-gradient(135deg,#4f46e5,#818cf8)',
  },
  {
    id: 'cat2',
    route: '/category2',
    icon: BrainCircuit,
    label: 'EEG Detection',
    sub: 'Upload & analyze brain activity',
    color: '#c084fc',
    glow: 'rgba(192,132,252,0.35)',
    gradient: 'linear-gradient(135deg,#7c3aed,#c084fc)',
  },
  {
    id: 'cat3',
    route: '/category3',
    icon: MapPin,
    label: 'Nearby Doctors',
    sub: 'Neurologists & epilepsy specialists',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.35)',
    gradient: 'linear-gradient(135deg,#059669,#34d399)',
  },
];

export default function DashboardHub() {
  const navigate = useNavigate();
  const username = localStorage.getItem('epichat_username') || 'User';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="app-canvas flex-col">
      <div className="orb orb-pink" style={{ top: '-10%', left: '-10%' }} />
      <div className="orb orb-blue" style={{ bottom: '-10%', right: '-5%' }} />
      <div className="orb orb-accent" style={{ top: '35%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.15 }} />

      {/* NAV */}
      <nav className="dashboard-nav glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={26} className="neon-icon" />
          <h1 className="title neon-text" style={{ fontSize: '1.5rem', margin: 0 }}>EpiChat Portal</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Logged in as <strong style={{ color: 'var(--text-primary)' }}>{username}</strong>
          </span>
        </div>
        <button className="btn-secondary nav-btn" onClick={handleLogout}>
          <LogOut size={16} style={{ marginRight: 8 }} /> Logout
        </button>
      </nav>

      {/* HERO */}
      <div style={{ textAlign: 'center', padding: '3rem 2rem 1rem', animation: 'slideUp 0.6s ease forwards' }}>
        <h2 className="title neon-text" style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
          Welcome back, <span className="gradient-animate">{username}</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Select a module to get started with your EpiChat Portal.
        </p>
      </div>

      {/* CATEGORY CARDS */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          gap: 28,
          flexWrap: 'wrap',
        }}
      >
        {NAV_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              id={`dashboard-btn-${card.id}`}
              onClick={() => navigate(card.route)}
              style={{
                background: 'var(--glass-bg)',
                border: `1px solid ${card.color}33`,
                borderRadius: 28,
                padding: '2.5rem 2rem',
                cursor: 'pointer',
                color: 'white',
                width: 280,
                minHeight: 240,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                backdropFilter: 'blur(25px)',
                boxShadow: `0 8px 32px ${card.glow}`,
                transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
                animation: `slideUp 0.6s ${i * 0.12}s ease both`,
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)';
                e.currentTarget.style.boxShadow = `0 20px 48px ${card.glow}`;
                e.currentTarget.style.borderColor = card.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = `0 8px 32px ${card.glow}`;
                e.currentTarget.style.borderColor = `${card.color}33`;
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 24px ${card.glow}`,
                  marginBottom: 4,
                }}
              >
                <Icon size={32} color="white" />
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>{card.label}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', lineHeight: 1.5 }}>
                {card.sub}
              </div>
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 20px',
                  borderRadius: 20,
                  background: card.gradient,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  boxShadow: `0 4px 12px ${card.glow}`,
                }}
              >
                Open →
              </div>
            </button>
          );
        })}
      </main>

      {/* FOOTER NOTE */}
      <div style={{ textAlign: 'center', padding: '1rem 2rem 2rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        EpiChat Portal · v2.0 · AI-powered epilepsy management · Use the chat widget (bottom right) for instant guidance
      </div>
    </div>
  );
}
