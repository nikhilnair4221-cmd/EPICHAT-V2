import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowLeft, UploadCloud, Loader, CheckCircle,
  AlertTriangle, User, Mail, AtSign, ShieldCheck,
} from 'lucide-react';

import EEGMonitor from './EEGMonitor';
import ResultsCard from './ResultsCard';
import RiskTimeline from './RiskTimeline';
import Brain3D from './Brain3D';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiJson, formatGlobalTime } from '../lib/api';

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
            User Profile
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

  const role = localStorage.getItem('epichat_role') || 'user';
  const isDoctor = role === 'doctor';

  // ── Session data (read-only, from login) ────────────────────────────────
  const sessionUsername = localStorage.getItem('epichat_username') || '';
  const sessionEmail    = localStorage.getItem('epichat_email')    || '';
  const sessionFullName = (() => {
    try {
      const all = JSON.parse(localStorage.getItem('epichat_users') || '{}');
      return all[sessionUsername]?.fullName || all[sessionUsername]?.name || '';
    } catch (_) { return ''; }
  })();

  // ── Editable fields ──────────────────────────────────────────────────────
  const [patientUsername, setPatientUsername] = useState(isDoctor ? '' : sessionUsername);
  const [patientName, setPatientName] = useState(isDoctor ? '' : sessionFullName || sessionUsername);
  
  const [age,    setAge]    = useState(20);
  const [gender, setGender] = useState('Male');
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

  // canSubmit: username/name required + EDF file
  const canSubmit = useMemo(() =>
    patientUsername && patientName && gender && Number(age) >= 0 && file,
  [age, gender, file, patientUsername, patientName]);

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
    fd.append('username', patientUsername);
    fd.append('name',     patientName);
    fd.append('age',      String(age));
    fd.append('gender',   gender);
    fd.append('file', file);

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
      alert('Unable to process file. Please retry.');
      setStatus('idle');
    }
  };

  const downloadPDF = () => {
    if (!submission) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(isDoctor ? 14 : 79, isDoctor ? 165 : 70, isDoctor ? 233 : 229);
      doc.text('EpiChat Medical Report', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${formatGlobalTime(new Date().toISOString())}`, 14, 28);
      doc.setDrawColor(200);
      doc.line(14, 32, 196, 32);

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Patient Information', 14, 42);
      autoTable(doc, {
        startY: 46,
        head: [['Field', 'Details']],
        body: [
          ['Name', String(patientName)],
          ['Username', String(patientUsername)],
          ['Age', String(age)],
          ['Gender', String(gender)],
          ['Upload Date', String(formatGlobalTime(submission.created_at || new Date().toISOString()))],
          ['File Name', String(submission.file_name || 'EEG Recording')]
        ],
        theme: 'grid',
        headStyles: { fillColor: isDoctor ? [14, 165, 233] : [79, 70, 229] }
      });

      const finalY = doc.lastAutoTable.finalY || 80;
      doc.setFontSize(14);
      doc.text('Analysis Results', 14, finalY + 14);

      const severity = submission.result_label === 'Ictal' ? 'High' : submission.result_label === 'Pre-ictal' ? 'Medium' : 'Low';
      autoTable(doc, {
        startY: finalY + 18,
        head: [['Metric', 'Result']],
        body: [
          ['Risk Level', String(submission.result_label || 'Unknown')],
          ['Confidence', `${Number(submission.confidence || 0).toFixed(1)}%`],
          ['Severity', String(severity)],
          ['AI Explanation', `Detected patterns corresponding to ${severity.toLowerCase()} risk. Regular monitoring is advised.`]
        ],
        theme: 'grid',
        headStyles: { fillColor: isDoctor ? [14, 165, 233] : [79, 70, 229] }
      });

      const disclaimerY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.setTextColor(150, 0, 0);
      const disclaimer = "DISCLAIMER: This report is generated by EpiChat AI for informational purposes only. It is not a formal medical diagnosis. Always consult a qualified neurologist or healthcare provider for medical advice.";
      const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
      doc.text(splitDisclaimer, 14, disclaimerY);

      doc.save(`EpiChat_Report_${patientName.replace(/\s+/g, '_')}_${formatGlobalTime(submission.created_at || new Date().toISOString()).replace(/\W+/g, '')}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF.");
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
        <button className="btn-secondary nav-btn" id="cat2-back-btn" onClick={() => navigate(isDoctor ? '/doctor-dashboard' : '/dashboard')}>
          <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back to Dashboard
        </button>
      </nav>

      <main className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── UPLOAD FORM ─────────────────────────────────────────────── */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div className="neon-text" style={{ fontWeight: 800, marginBottom: 14, fontSize: '1.1rem' }}>
            📋 {isDoctor ? 'Patient Details' : 'User Input'}
          </div>

          {/* ── PATIENT PROFILE / INPUTS ───────────────────────────────── */}
          {isDoctor ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 14 }}>
              <input
                className="premium-input"
                type="text"
                placeholder="Patient Full Name"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
              />
              <input
                className="premium-input"
                type="text"
                placeholder="Patient ID / Username"
                value={patientUsername}
                onChange={e => setPatientUsername(e.target.value)}
              />
            </div>
          ) : (
            <PatientProfileCard
              username={sessionUsername}
              email={sessionEmail}
              fullName={sessionFullName}
            />
          )}

          {/* ── AGE/GENDER ────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: isDoctor ? 0 : 14 }}>
            <input
              className="premium-input"
              type="number"
              min="1"
              max="120"
              inputMode="numeric"
              pattern="[0-9]*"
              onWheel={(e) => e.target.blur()}
              placeholder="Age"
              value={age}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                setAge(val ? Number(val) : '');
              }}
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

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
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
              style={isDoctor ? { background: 'linear-gradient(135deg,#3b82f6,#0ea5e9)', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' } : {}}
            >
              {status === 'analyzing' ? 'Analyzing…' : 'Submit for Analysis'}
            </button>
          </div>
        </div>

        {/* ── ANALYZING ──────────────────────────────────────────────── */}
        {status === 'analyzing' && <AnalyzingLoader />}

        {/* ── RESULTS — only rendered once API returns data ─────────── */}
        {status === 'result' && submission && (
          <div
            style={{
              opacity: fadeIn ? 1 : 0,
              transition: 'opacity 0.55s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Classification card */}
            <ResultsCard
              resultLabel={submission.result_label || 'Unknown'}
              confidence={submission.confidence ?? 0}
            />

            {/* EEG monitor + 3D brain — responsive two-col */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {riskSeries.length > 0 ? (
                <EEGMonitor
                  isLive={false}
                  riskSeries={riskSeries}
                  seizureChannels={seizureChannels}
                  height={300}
                />
              ) : (
                <div className="glass-panel" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: 'var(--text-secondary)', fontSize: '0.88rem', flexDirection: 'column', gap: 10 }}>
                  <Activity size={28} style={{ opacity: 0.4 }} />
                  No EEG signal data available
                </div>
              )}
              <Brain3D seizureChannels={seizureChannels} />
            </div>

            {/* Risk timeline */}
            {riskSeries.length > 0 ? (
              <RiskTimeline
                riskSeries={riskSeries}
                playhead={Math.min(riskSeries.length - 1, playhead % Math.max(1, riskSeries.length))}
              />
            ) : (
              <div className="glass-panel" style={{ padding: 16, color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
                📈 Risk timeline not available for this recording
              </div>
            )}

            {/* Actions */}
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <p style={{ color: 'var(--success)', marginBottom: 12, fontSize: '0.9rem' }}>
                ✓ Results saved to {isDoctor ? 'patient' : 'your'} history
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => { setStatus('idle'); setSubmission(null); setFile(null); }}>
                  Run Another Analysis
                </button>
                <button className="btn-primary" onClick={downloadPDF} style={isDoctor ? { background: 'linear-gradient(135deg,#3b82f6,#0ea5e9)', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' } : {}}>
                  Download PDF Report
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
              color: 'var(--text-secondary)', fontSize: '0.78rem', textAlign: 'center',
            }}>
              <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span>AI-assisted tool for informational purposes only. This is{' '}
                <strong style={{ color: 'var(--text-primary)' }}>not a medical diagnosis</strong>.
                Always consult a qualified neurologist.
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
