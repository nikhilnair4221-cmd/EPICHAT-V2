import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowLeft, UploadCloud, Loader, CheckCircle,
  AlertTriangle, User, Mail, AtSign, ShieldCheck,
} from 'lucide-react';

import EEGMonitor from './EEGMonitor';
import ResultsCard from './ResultsCard';
import RiskTimeline from './RiskTimeline';
import BrainHeatmap from './BrainHeatmap';
import { apiJson } from '../lib/api';

// ── server handles history now ──────────────────────────────────────────────

// ── clean analyzing loader ──────────────────────────────────────────────────
function AnalyzingLoader() {
  const phases = [
    { phase: 'Uploading',        label: 'Reading EDF file…' },
    { phase: 'Uploading',        label: 'Validating channel data…' },
    { phase: 'Preprocessing',    label: 'Resampling to 200 Hz…' },
    { phase: 'Preprocessing',    label: 'Applying bipolar montage…' },
    { phase: 'Analyzing',        label: 'Slicing into 12-second windows…' },
    { phase: 'Analyzing',        label: 'Running EEGNet feature extraction…' },
    { phase: 'Analyzing',        label: 'Running BIOT Transformer…' },
    { phase: 'Generating Results', label: 'Computing seizure probability…' },
  ];
  const steps = phases.map(p => p.label);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
      {/* Spinner ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.8rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.08)',
          borderTop: '3px solid var(--primary)',
          animation: 'spinRing 1s linear infinite',
        }} />
      </div>

      <h2 className="title neon-text" style={{ fontSize: '1.4rem', marginBottom: '0.6rem' }}>
        Analyzing EEG…
      </h2>
      {/* Phase badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 20, padding: '4px 14px', fontSize: '0.78rem',
        color: '#818cf8', fontWeight: 600, marginBottom: '0.8rem',
      }}>
        <Loader size={11} style={{ animation: 'spinRing 1s linear infinite' }} />
        Phase: {phases[step]?.phase || 'Processing'}
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', minHeight: 22 }}>
        {steps[step]}
      </p>

      {/* Progress steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380, margin: '0 auto', textAlign: 'left' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.5s',
            }}>
              {i < step && <CheckCircle size={12} color="white" />}
              {i === step && <Loader size={10} color="white" style={{ animation: 'spinRing 1s linear infinite' }} />}
            </div>
            <span style={{
              fontSize: '0.82rem',
              color: i <= step ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'color 0.5s',
            }}>{s}</span>
          </div>
        ))}
      </div>

      <style>{`@keyframes spinRing { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── read-only Patient Profile card ──────────────────────────────────────────
function PatientProfileCard({ username, email, fullName }) {
  const avatar = (username || 'P').charAt(0).toUpperCase();

  const rows = [
    { Icon: User,    label: 'Name',     value: fullName  || username },
    { Icon: Mail,    label: 'Email',    value: email     || '—' },
    { Icon: AtSign,  label: 'Username', value: username  || '—' },
  ];

  return (
    <div style={{
      background: 'rgba(99,102,241,0.06)',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: 16,
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
    }}>
      {/* Avatar */}
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'linear-gradient(135deg,#4f46e5,#c084fc)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, fontWeight: 800, color: 'white', flexShrink: 0,
        boxShadow: '0 0 20px rgba(192,132,252,0.35)',
      }}>
        {avatar}
      </div>

      {/* Info rows */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <ShieldCheck size={14} style={{ color: '#818cf8' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Patient Profile
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {rows.map(({ Icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.87rem' }}>
              <Icon size={13} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)', minWidth: 64 }}>{label}:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Read-only badge */}
      <div style={{
        fontSize: '0.72rem', fontWeight: 700, color: '#34d399',
        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
        borderRadius: 20, padding: '4px 10px', whiteSpace: 'nowrap', alignSelf: 'flex-start',
      }}>
        🔒 Read-only
      </div>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────
export default function Category2() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // ── Session data (read-only, from login) ────────────────────────────────
  const sessionUsername = localStorage.getItem('epichat_username') || '';
  const sessionEmail    = localStorage.getItem('epichat_email')    || '';
  // Full name stored under the users map (username → { email, ... })
  const sessionFullName = (() => {
    try {
      const all = JSON.parse(localStorage.getItem('epichat_users') || '{}');
      return all[sessionUsername]?.fullName || all[sessionUsername]?.name || '';
    } catch (_) { return ''; }
  })();

  // ── Editable fields only ─────────────────────────────────────────────────
  const [age,     setAge]     = useState(20);
  const [gender,  setGender]  = useState('Male');
  const [symptoms, setSymptoms] = useState('');
  const [file, setFile] = useState(null);

  const [status, setStatus]       = useState('idle'); // idle | analyzing | result
  const [submission, setSubmission] = useState(null);
  const [playhead,   setPlayhead]  = useState(0);
  const [fadeIn,     setFadeIn]    = useState(false);

  const riskSeries      = submission?.risk_score_series || [];
  const seizureChannels = submission?.seizure_channels  || [];

  // Playhead tick only while showing result graph
  useEffect(() => {
    if (status !== 'result') return;
    let raf = 0;
    const tick = () => { setPlayhead(p => p + 1); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  // canSubmit: session username required + (file OR symptoms)
  const canSubmit = useMemo(() =>
    sessionUsername && gender && Number(age) >= 0 && (file || symptoms.trim()),
  [age, gender, file, symptoms, sessionUsername]);

  const onPickFile = (f) => {
    if (!f) return;
    if (f.name.split('.').pop().toLowerCase() !== 'edf') {
      alert('Please upload a .edf EEG file.'); return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setStatus('analyzing');
    setSubmission(null);
    setPlayhead(0);
    setFadeIn(false);

    const fd = new FormData();
    fd.append('username', sessionUsername);
    fd.append('name',     sessionFullName || sessionUsername);
    fd.append('age',      String(age));
    fd.append('gender',   gender);
    if (symptoms.trim()) fd.append('symptoms_text', symptoms.trim());
    if (file)            fd.append('file', file);

    try {
      const token = localStorage.getItem('epichat_token');
      const res = await apiJson('/api/patient/submit', { 
        method: 'POST', 
        body: fd,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sub = { ...res.submission, file_name: file?.name };
      setSubmission(sub);
      setStatus('result');
      setTimeout(() => setFadeIn(true), 80);
    } catch (e) {
      console.error(e);
      alert(`Submit failed: ${e.message}`);
      setStatus('idle');
    }
  };

  return (
    <div className="app-canvas flex-col">
      <div className="orb orb-pink" style={{ top: '-10%', left: '-10%' }} />
      <div className="orb orb-blue" style={{ bottom: '-10%', right: '-5%' }} />

      {/* NAV */}
      <nav className="dashboard-nav glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={24} className="neon-icon" />
          <h1 className="title neon-text" style={{ fontSize: '1.4rem', margin: 0 }}>EEG Detection</h1>
        </div>
        <button className="btn-secondary nav-btn" id="cat2-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back to Dashboard
        </button>
      </nav>

      <main className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── UPLOAD FORM ─────────────────────────────────────────────── */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div className="neon-text" style={{ fontWeight: 800, marginBottom: 14, fontSize: '1.1rem' }}>
            📋 Patient Input
          </div>

          {/* ── READ-ONLY PATIENT PROFILE ──────────────────────────────── */}
          <PatientProfileCard
            username={sessionUsername}
            email={sessionEmail}
            fullName={sessionFullName}
          />

          {/* ── EDITABLE FIELDS ────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
            <input
              className="premium-input"
              type="number"
              min="0"
              max="130"
              placeholder="Age"
              value={age}
              onChange={e => setAge(Number(e.target.value))}
            />
            <select
              className="premium-input"
              value={gender}
              onChange={e => setGender(e.target.value)}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <textarea
            className="premium-input"
            style={{ marginTop: 10, minHeight: 80, resize: 'vertical' }}
            placeholder="Symptoms (optional but recommended if no EEG file): e.g., aura, staring spells, confusion, jerks…"
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
            <input
              ref={inputRef}
              type="file"
              accept=".edf"
              style={{ display: 'none' }}
              onChange={e => onPickFile(e.target.files?.[0])}
            />
            <button className="btn-secondary" type="button" onClick={() => inputRef.current?.click()}>
              <UploadCloud size={16} style={{ marginRight: 8 }} />
              {file ? 'Replace EEG file' : 'Choose EEG (.edf)'}
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              {file ? `✓ ${file.name}` : 'No file selected'}
            </span>
            <div style={{ flex: 1 }} />
            <button
              className="btn-primary"
              type="button"
              onClick={submit}
              disabled={!canSubmit || status === 'analyzing'}
              id="cat2-submit-btn"
            >
              {status === 'analyzing' ? 'Analyzing…' : 'Submit for Analysis'}
            </button>
          </div>
        </div>

        {/* ── ANALYZING STATE ──────────────────────────────────────────── */}
        {status === 'analyzing' && <AnalyzingLoader />}

        {/* ── RESULT STATE ─────────────────────────────────────────────── */}
        {status === 'result' && submission && (
          <div style={{ opacity: fadeIn ? 1 : 0, transition: 'opacity 0.5s ease', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ResultsCard resultLabel={submission.result_label} confidence={submission.confidence} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <EEGMonitor isLive={false} riskSeries={riskSeries} seizureChannels={seizureChannels} height={320} />
              <BrainHeatmap seizureChannels={seizureChannels} />
            </div>
            <RiskTimeline
              riskSeries={riskSeries}
              playhead={Math.min(riskSeries.length - 1, playhead % Math.max(1, riskSeries.length))} />
            <div style={{ textAlign: 'center', padding: '1rem 0 0.5rem' }}>
              <p style={{ color: 'var(--success)', marginBottom: 12, fontSize: '0.9rem' }}>
                ✓ Results saved to your history (Category 1)
              </p>
              <button className="btn-secondary" onClick={() => { setStatus('idle'); setSubmission(null); }}>
                Run Another Analysis
              </button>
            </div>

            {/* ── DISCLAIMER FOOTER ──────────────────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
              color: 'var(--text-secondary)', fontSize: '0.78rem', textAlign: 'center',
            }}>
              <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span>AI-assisted tool for informational purposes only. This is <strong style={{ color: 'var(--text-primary)' }}>not a medical diagnosis</strong>. Always consult a qualified neurologist for clinical interpretation and treatment decisions.</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
