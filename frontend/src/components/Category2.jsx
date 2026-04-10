import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, UploadCloud, Loader, CheckCircle, AlertTriangle } from 'lucide-react';

import EEGMonitor from './EEGMonitor';
import ResultsCard from './ResultsCard';
import RiskTimeline from './RiskTimeline';
import BrainHeatmap from './BrainHeatmap';
import { apiJson } from '../lib/api';

// ── persist result to user history ─────────────────────────────────────────
function saveToHistory(submission) {
  try {
    const raw = localStorage.getItem('epichat_history') || '[]';
    const history = JSON.parse(raw);
    history.unshift({
      date: new Date().toISOString(),
      result_label: submission.result_label,
      confidence: submission.confidence,
      file_name: submission.file_name || 'EEG File',
      risk_score_series: submission.risk_score_series || [],
      seizure_channels: submission.seizure_channels || [],
    });
    localStorage.setItem('epichat_history', JSON.stringify(history.slice(0, 20)));
  } catch (_) {}
}

// ── clean analyzing loader ──────────────────────────────────────────────────
function AnalyzingLoader() {
  const phases = [
    { phase: 'Uploading',   label: 'Reading EDF file…' },
    { phase: 'Uploading',   label: 'Validating channel data…' },
    { phase: 'Preprocessing', label: 'Resampling to 200 Hz…' },
    { phase: 'Preprocessing', label: 'Applying bipolar montage…' },
    { phase: 'Analyzing',   label: 'Slicing into 12-second windows…' },
    { phase: 'Analyzing',   label: 'Running EEGNet feature extraction…' },
    { phase: 'Analyzing',   label: 'Running BIOT Transformer…' },
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

// ── main component ───────────────────────────────────────────────────────────
export default function Category2() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const username = localStorage.getItem('epichat_username') || '';

  const [patient, setPatient] = useState({ username, name: '', age: 20, gender: 'Male' });
  const [symptoms, setSymptoms] = useState('');
  const [file, setFile] = useState(null);

  const [status, setStatus] = useState('idle'); // idle | analyzing | result
  const [submission, setSubmission] = useState(null);
  const [playhead, setPlayhead] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);

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

  const canSubmit = useMemo(() =>
    patient.username && patient.name && patient.gender &&
    Number(patient.age) >= 0 && (file || symptoms.trim()),
  [file, patient, symptoms]);

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
    fd.append('username', patient.username);
    fd.append('name',     patient.name);
    fd.append('age',      String(patient.age));
    fd.append('gender',   patient.gender);
    if (symptoms.trim()) fd.append('symptoms_text', symptoms.trim());
    if (file)            fd.append('file', file);

    try {
      const res = await apiJson('/api/patient/submit', { method: 'POST', body: fd });
      const sub = { ...res.submission, file_name: file?.name };
      setSubmission(sub);
      saveToHistory(sub);
      setStatus('result');
      // Slight delay then fade results in
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <input className="premium-input" placeholder="Username / Email"
              value={patient.username}
              onChange={e => setPatient(p => ({ ...p, username: e.target.value }))} />
            <input className="premium-input" placeholder="Full name"
              value={patient.name}
              onChange={e => setPatient(p => ({ ...p, name: e.target.value }))} />
            <input className="premium-input" type="number" min="0" max="130" placeholder="Age"
              value={patient.age}
              onChange={e => setPatient(p => ({ ...p, age: Number(e.target.value) }))} />
            <select className="premium-input" value={patient.gender}
              onChange={e => setPatient(p => ({ ...p, gender: e.target.value }))}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>

          <textarea className="premium-input"
            style={{ marginTop: 10, minHeight: 80, resize: 'vertical' }}
            placeholder="Symptoms (optional but recommended if no EEG file): e.g., aura, staring spells, confusion, jerks…"
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)} />

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
            <input ref={inputRef} type="file" accept=".edf" style={{ display: 'none' }}
              onChange={e => onPickFile(e.target.files?.[0])} />
            <button className="btn-secondary" type="button" onClick={() => inputRef.current?.click()}>
              <UploadCloud size={16} style={{ marginRight: 8 }} />
              {file ? 'Replace EEG file' : 'Choose EEG (.edf)'}
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              {file ? `✓ ${file.name}` : 'No file selected'}
            </span>
            <div style={{ flex: 1 }} />
            <button className="btn-primary" type="button" onClick={submit}
              disabled={!canSubmit || status === 'analyzing'} id="cat2-submit-btn">
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
