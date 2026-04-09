import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, LogOut, UploadCloud } from 'lucide-react';

import Chatbot from './Chatbot';
import EEGMonitor from './EEGMonitor';
import ResultsCard from './ResultsCard';
import RiskTimeline from './RiskTimeline';
import BrainHeatmap from './BrainHeatmap';
import RecommendedSpecialists from './RecommendedSpecialists';
import { apiJson } from '../lib/api';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const username = localStorage.getItem('epichat_username') || '';

  const [patient, setPatient] = useState({
    username,
    name: '',
    age: 20,
    gender: 'Male',
  });
  const [symptoms, setSymptoms] = useState('');
  const [file, setFile] = useState(null);

  const [status, setStatus] = useState('idle'); // idle | analyzing | result
  const [submission, setSubmission] = useState(null);
  const [playhead, setPlayhead] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(true);

  const riskSeries = submission?.risk_score_series || [];
  const seizureChannels = submission?.seizure_channels || [];

  useEffect(() => {
    if (status !== 'analyzing') return;
    let raf = 0;
    const tick = () => {
      setPlayhead((p) => p + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  const canSubmit = useMemo(() => {
    return patient.username && patient.name && patient.gender && Number(patient.age) >= 0 && (file || symptoms.trim());
  }, [file, patient, symptoms]);

  const onPickFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (ext !== 'edf') {
      alert('Please upload a .edf EEG file.');
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setStatus('analyzing');
    setSubmission(null);
    setPlayhead(0);

    const fd = new FormData();
    fd.append('username', patient.username);
    fd.append('name', patient.name);
    fd.append('age', String(patient.age));
    fd.append('gender', patient.gender);
    if (symptoms.trim()) fd.append('symptoms_text', symptoms.trim());
    if (file) fd.append('file', file);

    try {
      const res = await apiJson('/api/patient/submit', { method: 'POST', body: fd });
      setSubmission(res.submission);
      setStatus('result');
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

      <nav className="dashboard-nav glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={24} className="neon-icon" />
          <h1 className="title neon-text" style={{ fontSize: '1.4rem', margin: 0 }}>EpiChat — Patient Portal</h1>
        </div>
        <button className="btn-secondary nav-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>
          <LogOut size={16} style={{ marginRight: 8 }} /> Disconnect
        </button>
      </nav>

      <main className="dashboard-main" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-panel" style={{ padding: 16 }}>
            <div className="neon-text" style={{ fontWeight: 800 }}>Upload EEG / Symptoms</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 12 }}>
              <input className="premium-input" placeholder="Username" value={patient.username} onChange={(e) => setPatient((p) => ({ ...p, username: e.target.value }))} />
              <input className="premium-input" placeholder="Full name" value={patient.name} onChange={(e) => setPatient((p) => ({ ...p, name: e.target.value }))} />
              <input className="premium-input" type="number" min="0" max="130" placeholder="Age" value={patient.age} onChange={(e) => setPatient((p) => ({ ...p, age: Number(e.target.value) }))} />
              <select className="premium-input" value={patient.gender} onChange={(e) => setPatient((p) => ({ ...p, gender: e.target.value }))}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <textarea
              className="premium-input"
              style={{ marginTop: 10, minHeight: 90, resize: 'vertical' }}
              placeholder="Symptoms (optional, but recommended if no EEG file): e.g., aura, staring spells, confusion, jerks…"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              <input ref={inputRef} type="file" accept=".edf" style={{ display: 'none' }} onChange={(e) => onPickFile(e.target.files?.[0])} />
              <button className="btn-secondary" type="button" onClick={() => inputRef.current?.click()}>
                <UploadCloud size={16} style={{ marginRight: 8 }} />
                {file ? 'Replace EEG file' : 'Choose EEG (.edf)'}
              </button>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                {file ? `Selected: ${file.name}` : 'No file selected'}
              </div>
              <div style={{ flex: 1 }} />
              <button className="btn-primary" type="button" onClick={submit} disabled={!canSubmit || status === 'analyzing'}>
                {status === 'analyzing' ? 'Analyzing…' : 'Submit for Analysis'}
              </button>
            </div>
          </div>

          {(status === 'analyzing') && (
            <>
              <EEGMonitor isLive riskSeries={[10, 12, 14, 18, 24, 35, 28, 22, 18, 16]} seizureChannels={[2, 7]} height={320} />
              <RiskTimeline riskSeries={[10, 12, 14, 18, 24, 35, 28, 22, 18, 16]} playhead={playhead % 10} />
            </>
          )}

          {(status === 'result' && submission) && (
            <>
              <ResultsCard resultLabel={submission.result_label} confidence={submission.confidence} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <EEGMonitor isLive={false} riskSeries={riskSeries} seizureChannels={seizureChannels} height={320} />
                <BrainHeatmap seizureChannels={seizureChannels} />
              </div>
              <RiskTimeline riskSeries={riskSeries} playhead={Math.min(riskSeries.length - 1, playhead % Math.max(1, riskSeries.length))} />
              <RecommendedSpecialists resultLabel={submission.result_label} />
            </>
          )}
        </div>

        <div style={{ position: 'sticky', top: 16, height: 'calc(100vh - 120px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="neon-text" style={{ fontWeight: 800 }}>EpiChat</div>
            <button className="btn-secondary" type="button" onClick={() => setIsChatOpen((v) => !v)}>
              {isChatOpen ? 'Hide' : 'Show'}
            </button>
          </div>
          {isChatOpen && <Chatbot />}
        </div>
      </main>
    </div>
  );
}

