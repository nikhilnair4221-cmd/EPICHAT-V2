import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ThemeToggleSwitch } from './ThemeToggle';
import FloatingChatbot from './FloatingChatbot';
import { Brain, User } from 'lucide-react';

// Map route → display title
const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/category1': 'User History',
  '/category2': 'EEG Detection',
  '/category3': 'Nearby Doctors',
};

// ─── Top Header ───────────────────────────────────────────────────────────────
function TopHeader() {
  const location = useLocation();
  const title    = PAGE_TITLES[location.pathname] || 'EpiChat';
  const username = localStorage.getItem('epichat_username') || 'User';
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 80,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: 64,
      background: 'var(--header-bg, rgba(7,9,18,0.92))',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--glass-border)',
      transition: 'background 0.35s ease, border-color 0.35s ease',
      flexShrink: 0,
    }}>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 8, height: 28, borderRadius: 4,
          background: 'linear-gradient(180deg,#6366f1,#c084fc)',
        }} />
        <h1 className="title" style={{
          fontSize: '1.25rem', fontWeight: 700,
          color: 'var(--text-primary)', margin: 0,
        }}>{title}</h1>
      </div>

      {/* Right actions: toggle + profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Theme toggle pill */}
        <ThemeToggleSwitch />

        {/* User profile chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '5px 12px 5px 6px',
          borderRadius: 99,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6366f1,#c084fc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.72rem', fontWeight: 800, color: 'white',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{username}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>Patient</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Main layout ──────────────────────────────────────────────────────────────
export default function AppLayout({ children }) {
  // Apply stored theme on mount
  useEffect(() => {
    const t = localStorage.getItem('epichat_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden',
      background: 'var(--bg-dark)',
      backgroundImage: 'var(--bg-gradient)',
      backgroundAttachment: 'fixed',
      transition: 'background 0.35s ease',
      boxSizing: 'border-box',
    }}>
      {/* Left sidebar — fixed width, full height */}
      <Sidebar />

      {/* Right: flex column — header on top, content below */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <TopHeader />

        {/* Scrollable main content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px',
          boxSizing: 'border-box',
        }}>
          {children}
        </main>
      </div>

      {/* Floating chatbot (not part of layout flow) */}
      <FloatingChatbot />
    </div>
  );
}
