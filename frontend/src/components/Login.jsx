import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

// ── local helper removed dynamically ──────────────────────
import { API_BASE } from '../lib/api';

function validateEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

export default function Login() {
  const [username, setUsername]   = useState('');
  const [email,    setEmail]      = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd,  setShowPwd]    = useState(false);
  const [errors,   setErrors]     = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!username.trim())             errs.username = 'Username is required';
    if (!validateEmail(email))        errs.email    = 'Enter a valid email address';
    if (password.length < 6)          errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const user = username.trim().toLowerCase();

    try {
      const btn = document.getElementById('login-submit');
      if (btn) btn.innerHTML = 'Connecting...';
      
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user,
          email: email.trim().toLowerCase(),
          password: password
        })
      });

      if (!res.ok) {
        let msg = 'Unable to load user data';
        try { const j = await res.json(); if (j.detail) msg = j.detail; } catch (e) {}
        throw new Error(msg);
      }

      const data = await res.json();
      localStorage.setItem('epichat_token', data.access_token);
      localStorage.setItem('epichat_username', data.username);
      localStorage.setItem('epichat_email', email.trim().toLowerCase());
      localStorage.setItem('epichat_role', 'patient');
      navigate('/dashboard');
      
    } catch (err) {
      setErrors({ password: err.message });
      const btn = document.getElementById('login-submit');
      if (btn) btn.innerHTML = 'Enter EpiChat Portal';
    }
  };

  return (
    <div className="app-canvas flex-center">
      <div className="orb orb-pink" />
      <div className="orb orb-blue" />

      <div className="glass-panel login-card slide-up">
        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6366f1,#c084fc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: '0 0 32px rgba(192,132,252,0.45)',
          }}>
            <Brain size={36} color="white" />
          </div>
          <h1 className="title neon-text" style={{ fontSize: '2.6rem', margin: 0 }}>EpiChat</h1>
          <p style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '0.8rem', marginTop: 6 }}>
            Neural Net OS · EpiChat Portal
          </p>
        </div>

        <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* USERNAME */}
          <div>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                id="login-username"
                type="text"
                className="premium-input"
                placeholder="Username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setErrors(p => ({ ...p, username: '' })); }}
                style={{ paddingLeft: 44 }}
              />
            </div>
            {errors.username && <ErrMsg msg={errors.username} />}
          </div>

          {/* EMAIL */}
          <div>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                id="login-email"
                type="email"
                className="premium-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                style={{ paddingLeft: 44 }}
              />
            </div>
            {errors.email && <ErrMsg msg={errors.email} />}
          </div>

          {/* PASSWORD */}
          <div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                className="premium-input"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                style={{ paddingLeft: 44, paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <ErrMsg msg={errors.password} />}
          </div>

          <button type="submit" className="btn-primary login-submit-btn" id="login-submit" style={{ marginTop: 8 }}>
            Enter EpiChat Portal <ArrowRight size={18} style={{ marginLeft: 8 }} />
          </button>
        </form>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', textAlign: 'center', marginTop: '1.5rem', lineHeight: 1.6 }}>
          By signing in you agree to EpiChat's terms of service.
          <br />This portal is for authorized patients only.
        </p>
      </div>
    </div>
  );
}

function ErrMsg({ msg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: '#ef4444', fontSize: '0.8rem' }}>
      <AlertCircle size={13} /> {msg}
    </div>
  );
}
