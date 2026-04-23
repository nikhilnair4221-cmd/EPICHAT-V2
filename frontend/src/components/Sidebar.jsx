import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, ClipboardList, BrainCircuit, MapPin,
  MessageSquare, LogOut, ChevronLeft, ChevronRight, Brain,
  Menu, X, Activity, Settings,
} from 'lucide-react';

const USER_NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard',      icon: Home,          route: '/dashboard' },
      { id: 'eeg',       label: 'EEG Detection',  icon: BrainCircuit,  route: '/category2' },
      { id: 'history',   label: 'User History',   icon: ClipboardList, route: '/category1' },
      { id: 'doctors',   label: 'Nearby Doctors', icon: MapPin,        route: '/category3' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'chat',    label: 'AI Assistant',    icon: MessageSquare, route: null, action: 'chat' },
    ],
  },
];

const DOCTOR_NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { id: 'doctor-dashboard', label: 'Dashboard Home',  icon: Home,          route: '/doctor-dashboard' },
      { id: 'doctor-eeg',       label: 'EEG Detection',   icon: BrainCircuit,  route: '/doctor-eeg' },
      { id: 'doctor-records',   label: 'User Records',    icon: ClipboardList, route: '/doctor-records' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'chat',    label: 'AI Assistant',    icon: MessageSquare, route: null, action: 'chat' },
    ],
  },
];

function NavItem({ item, isActive, collapsed, onNavigate, activeGradient, activeBorderColor, activeTextColor }) {
  const [hov, setHov] = useState(false);
  const Icon = item.icon;
  const active = isActive && item.route;

  return (
    <button
      id={`sidebar-nav-${item.id}`}
      onClick={() => onNavigate(item)}
      title={collapsed ? item.label : ''}
      style={{
        display: 'flex', alignItems: 'center',
        gap: 12,
        padding: collapsed ? '10px 0' : '10px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: active
          ? activeGradient
          : hov ? 'rgba(255,255,255,0.045)' : 'transparent',
        border: 'none',
        borderLeft: active ? `3px solid ${activeBorderColor}` : '3px solid transparent',
        borderRadius: '0 10px 10px 0',
        color: active ? activeTextColor : hov ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '0.875rem',
        fontWeight: active ? 700 : 500,
        transition: 'all 0.18s ease',
        whiteSpace: 'nowrap',
        width: '100%',
        marginBottom: 2,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <Icon size={18} style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }} />
      {!collapsed && <span style={{ letterSpacing: '0.01em' }}>{item.label}</span>}
    </button>
  );
}

export default function Sidebar() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = localStorage.getItem('epichat_role') || 'user';
  const isDoctor = role === 'doctor';
  const NAV_SECTIONS = isDoctor ? DOCTOR_NAV_SECTIONS : USER_NAV_SECTIONS;

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const onNavigate = (item) => {
    setMobileOpen(false);
    if (item.action === 'chat') {
      document.getElementById('fab-chatbot-toggle')?.click();
      return;
    }
    if (item.route) navigate(item.route);
  };

  const primaryGradient = isDoctor ? 'linear-gradient(135deg,#3b82f6,#0ea5e9)' : 'linear-gradient(135deg,#6366f1,#c084fc)';
  const shadowColor = isDoctor ? 'rgba(14,165,233,0.4)' : 'rgba(99,102,241,0.4)';
  const activeGradient = isDoctor ? 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(14,165,233,0.09))' : 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(192,132,252,0.09))';
  const activeBorderColor = isDoctor ? '#3b82f6' : '#818cf8';
  const activeTextColor = isDoctor ? '#38bdf8' : 'var(--accent)';

  const w = collapsed ? 68 : 248;

  const sidebarContent = (
    <div style={{
      width: w,
      minHeight: '100vh',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--glass-border)',
      backdropFilter: 'blur(24px)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      flexShrink: 0,
      zIndex: 50,
    }}>

      {/* ── Brand ────────────────────────────────────────────────── */}
      <div style={{
        padding: collapsed ? '18px 0' : '18px 16px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 64, gap: 8,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: primaryGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${shadowColor}`,
            }}>
              {isDoctor ? <Activity size={18} color="white" /> : <Brain size={18} color="white" />}
            </div>
            <div>
              <div className="title" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>EpiChat</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>
                {isDoctor ? 'Doctor Portal' : 'Neural Diagnostics'}
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: primaryGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${shadowColor}`,
          }}>
            {isDoctor ? <Activity size={18} color="white" /> : <Brain size={18} color="white" />}
          </div>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
            borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer',
            padding: 5, display: 'flex', flexShrink: 0, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '12px 8px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 8 }}>
            {!collapsed && (
              <div style={{
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--text-secondary)',
                padding: '8px 12px 4px', opacity: 0.6,
              }}>
                {section.label}
              </div>
            )}
            {section.items.map(item => (
              <NavItem
                key={item.id}
                item={item}
                isActive={location.pathname === item.route}
                collapsed={collapsed}
                onNavigate={onNavigate}
                activeGradient={activeGradient}
                activeBorderColor={activeBorderColor}
                activeTextColor={activeTextColor}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* ── Bottom: Settings + Logout ─────────────────────────────── */}
      <div style={{ padding: '8px 8px 12px', borderTop: '1px solid var(--glass-border)' }}>
        {/* Settings */}
        <button
          id="sidebar-settings"
          title={collapsed ? 'Settings' : ''}
          onClick={() => navigate('/settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: collapsed ? '10px 0' : '10px 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'transparent', border: 'none', borderLeft: '3px solid transparent',
            borderRadius: '0 10px 10px 0',
            color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.18s', width: '100%', marginBottom: 2,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Settings size={18} style={{ flexShrink: 0, opacity: 0.75 }} />
          {!collapsed && <span>Settings</span>}
        </button>

        {/* Logout */}
        <button
          id="sidebar-logout"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : ''}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: collapsed ? '10px 0' : '10px 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'transparent', border: 'none', borderLeft: '3px solid transparent',
            borderRadius: '0 10px 10px 0',
            color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.18s', width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="sidebar-desktop" style={{ display: 'flex', flexShrink: 0 }}>
        {sidebarContent}
      </div>

      {/* Mobile hamburger */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Toggle menu"
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 300,
          width: 40, height: 40, borderRadius: 10,
          background: 'rgba(7,9,18,0.9)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--glass-border)',
          color: 'white', cursor: 'pointer',
          display: 'none', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div style={{
        position: 'fixed', top: 0, left: mobileOpen ? 0 : -260, zIndex: 250,
        height: '100vh', transition: 'left 0.28s ease',
        className: 'sidebar-mobile-drawer',
      }}>
        {sidebarContent}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
}
