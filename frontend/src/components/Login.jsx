import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, Activity } from 'lucide-react';

import { API_BASE } from '../lib/api';

function validateEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

export default function Login() {
  const [role, setRole]           = useState('user'); // 'user' or 'doctor'
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
          password: password,
          role: role
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
      localStorage.setItem('epichat_role', data.role || role);
      
      if (data.role === 'doctor' || role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/dashboard');
      }
      
    } catch (err) {
      setErrors({ password: err.message });
      const btn = document.getElementById('login-submit');
      if (btn) btn.innerHTML = role === 'doctor' ? 'Enter Doctor Portal' : 'Enter Patient Portal';
    }
  };

  const isDoctor = role === 'doctor';
  const primaryGradient = isDoctor ? 'linear-gradient(135deg,#3b82f6,#0ea5e9)' : 'linear-gradient(135deg,#6366f1,#c084fc)';
  const shadowColor = isDoctor ? 'rgba(14,165,233,0.45)' : 'rgba(192,132,252,0.45)';

  return (
    <div className="app-canvas flex-center" style={{ '--primary-glow': shadowColor, transition: 'all 0.3s' }}>
      <div className={`orb ${isDoctor ? 'orb-blue' : 'orb-pink'}`} />
      <div className="orb orb-blue" style={{ bottom: '-10%', right: '-5%' }} />

      <div className="glass-panel login-card slide-up" style={{ 
        boxShadow: isDoctor ? '0 10px 40px rgba(14,165,233,0.1)' : '0 10px 40px rgba(192,132,252,0.1)',
        border: isDoctor ? '1px solid rgba(14,165,233,0.2)' : '1px solid rgba(192,132,252,0.2)'
      }}>
        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: primaryGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: `0 0 32px ${shadowColor}`,
            transition: 'all 0.3s'
          }}>
            {isDoctor ? <Activity size={36} color="white" /> : <Brain size={36} color="white" />}
          </div>
          <h1 className="title neon-text" style={{ fontSize: '2.4rem', margin: 0, textShadow: isDoctor ? '0 0 10px rgba(14,165,233,0.5)' : undefined }}>EpiChat</h1>
          <p style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '3px', fontSize: '0.75rem', marginTop: 6 }}>
            Neural Net OS · {isDoctor ? 'Doctor Portal' : 'Patient Portal'}
          </p>
        </div>

        {/* ROLE TABS */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 20 }}>
          <button 
            type="button"
            onClick={() => { setRole('user'); setErrors({}); }}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: !isDoctor ? primaryGradient : 'transparent', color: !isDoctor ? 'white' : 'var(--text-secondary)', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
          >
            Patient
          </button>
          <button 
            type="button"
            onClick={() => { setRole('doctor'); setErrors({}); }}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: isDoctor ? primaryGradient : 'transparent', color: isDoctor ? 'white' : 'var(--text-secondary)', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
          >
            Doctor
          </button>
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
                placeholder={isDoctor ? "Doctor ID / Username" : "Username"}
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
                placeholder={isDoctor ? "Professional Email" : "Email address"}
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
                placeholder={isDoctor ? "Secure Password" : "Password (min. 6 characters)"}
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

          <button 
            type="submit" 
            className="btn-primary login-submit-btn" 
            id="login-submit" 
            style={{ 
              marginTop: 8, 
              background: primaryGradient,
              boxShadow: `0 4px 14px ${shadowColor}`
            }}
          >
            {isDoctor ? 'Enter Doctor Portal' : 'Enter Patient Portal'} <ArrowRight size={18} style={{ marginLeft: 8 }} />
          </button>
        </form>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', textAlign: 'center', marginTop: '1.5rem', lineHeight: 1.6 }}>
          {isDoctor ? 'Authorized medical personnel only.' : 'By signing in you agree to EpiChat\'s terms of service.'}
          <br />This portal is for authorized {isDoctor ? 'providers' : 'patients'} only.
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
