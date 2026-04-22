import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('epichat_theme', dark ? 'dark' : 'light');
}

// ─── Shared toggle UI (inline, no positioning) ────────────────────────────────
export function ThemeToggleSwitch() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('epichat_theme');
    const dark = stored !== 'light';
    setIsDark(dark);
    applyTheme(dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
  };

  return (
    <button
      id="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px 5px 8px',
        borderRadius: 99,
        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(99,102,241,0.22)',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        cursor: 'pointer',
        boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.35)' : '0 2px 10px rgba(99,102,241,0.12)',
        transition: 'all 0.3s ease',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <Moon size={13} style={{ color: isDark ? '#818cf8' : 'rgba(99,102,241,0.4)', transition: 'color 0.3s' }} />

      {/* Pill track */}
      <div style={{
        position: 'relative', width: 34, height: 18, borderRadius: 9,
        background: isDark ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#f59e0b,#fbbf24)',
        transition: 'background 0.35s ease', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 2, left: isDark ? 2 : 18,
          width: 14, height: 14, borderRadius: '50%',
          background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>

      <Sun size={13} style={{ color: isDark ? 'rgba(251,191,36,0.4)' : '#f59e0b', transition: 'color 0.3s' }} />
    </button>
  );
}

// ─── Fixed floating version — used ONLY on public pages (homepage, login) ─────
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('epichat_theme');
    const dark = stored !== 'light';
    setIsDark(dark);
    applyTheme(dark);

    // Keep in sync if another instance changes the theme
    const obs = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme');
      setIsDark(t !== 'light');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
  };

  return null; // Public pages handle toggle in their own nav
}
