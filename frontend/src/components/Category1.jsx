import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  AlertTriangle,
  Activity,
  FileText,
  Pill,
  ShieldAlert,
  HeartPulse,
  Sun,
  Moon,
  Zap,
  Brain,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE, formatGlobalTime } from '../lib/api';

// ── helpers ─────────────────────────────────────────────────────────────────



function RiskBadge({ label }) {
  if (!label) return null;
  const lower = label.toLowerCase();
  if (lower.includes('seizure') || lower.includes('ictal'))
    return <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🔴 {label}</span>;
  if (lower.includes('pre-ictal') || lower.includes('epileptic'))
    return <span style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🟡 {label}</span>;
  return <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🟢 {label}</span>;
}

// ── section data ─────────────────────────────────────────────────────────────
const PRECAUTIONS = [
  { icon: Zap, label: 'Avoid Flashing Lights', desc: 'Photosensitive epilepsy can be triggered by strobes, video games, or flashing screens.' },
  { icon: Moon, label: 'Maintain Sleep Schedule', desc: 'Sleep deprivation is a common seizure trigger. Aim for 7–9 hours of consistent sleep.' },
  { icon: Pill, label: 'Medication Reminders', desc: 'Never miss a dose. Set daily alarms and use a pill organiser for adherence.' },
  { icon: HeartPulse, label: 'Stress Reduction', desc: 'Stress lowers seizure threshold. Practice mindfulness, yoga, or deep breathing daily.' },
];

const MEDICATIONS = [
  { name: 'Valproate (Depakote)', use: 'Generalised & focal epilepsy', note: 'First-line; monitor liver function.' },
  { name: 'Levetiracetam (Keppra)', use: 'Focal & generalised seizures', note: 'Well tolerated. Mood changes possible.' },
  { name: 'Carbamazepine (Tegretol)', use: 'Focal epilepsy', note: 'Effective but multiple drug interactions.' },
  { name: 'Lamotrigine (Lamictal)', use: 'Broad spectrum', note: 'Suitable for women of childbearing age.' },
  { name: 'Phenytoin (Dilantin)', use: 'Status epilepticus / tonic-clonic', note: 'Older drug; narrow therapeutic window.' },
];

const FIRST_AID = [
  'Keep calm and time the seizure',
  'Gently guide the person to the floor',
  'Place something soft under their head',
  'Turn them on their side (recovery position)',
  'Do NOT restrain or put anything in their mouth',
  'Call emergency services if seizure lasts >5 min',
];

export default function Category1() {
  const navigate = useNavigate();
  const username = localStorage.getItem('epichat_username') || 'User';
  const token = localStorage.getItem('epichat_token');
  const [history, setHistory] = React.useState([]);
  const [activeTab, setActiveTab] = useState('history');

  React.useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (data.history) setHistory(data.history.reverse());
    })
    .catch(console.error);
  }, [token]);

  const tabs = [
    { id: 'history', label: 'EEG History', icon: ClipboardList },
    { id: 'precautions', label: 'Precautions', icon: ShieldAlert },
    { id: 'medications', label: 'Medications & First Aid', icon: Pill },
  ];

  const downloadPDF = (entry) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Indigo 600
      doc.text('EpiChat Medical Report', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${formatGlobalTime(new Date().toISOString())}`, 14, 28);
      
      doc.setDrawColor(200);
      doc.line(14, 32, 196, 32);
    
      // Patient Info
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Patient Information', 14, 42);
      
      autoTable(doc, {
        startY: 46,
        head: [['Field', 'Details']],
        body: [
          ['Name', username],
          ['Email', localStorage.getItem('epichat_email') || 'N/A'],
          ['Upload Date', String(formatGlobalTime(entry.upload_time || entry.date))],
          ['File Name', String(entry.file_name || 'EEG Recording')]
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
      });
    
      // Analysis Results
      const finalY = doc.lastAutoTable.finalY || 80;
      doc.setFontSize(14);
      doc.text('Analysis Results', 14, finalY + 14);
    
      const confidenceText = entry.confidence != null ? `${Number(entry.confidence).toFixed(1)}%` : 'N/A';
      const severity = entry.classification_result === 'Ictal' || entry.result_label === 'Ictal' ? 'High' : 
                       entry.classification_result === 'Pre-ictal' || entry.result_label === 'Pre-ictal' ? 'Medium' : 'Low';
      
      autoTable(doc, {
        startY: finalY + 18,
        head: [['Metric', 'Result']],
        body: [
          ['Risk Level', String(entry.classification_result || entry.result_label || 'Unknown')],
          ['Confidence', String(confidenceText)],
          ['Severity', String(severity)],
          ['AI Explanation', `Detected patterns corresponding to ${severity.toLowerCase()} risk. Regular monitoring is advised.`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
      });
    
      // Disclaimer
      const disclaimerY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.setTextColor(150, 0, 0);
      const disclaimer = "DISCLAIMER: This report is generated by EpiChat AI for informational purposes only. It is not a formal medical diagnosis. Always consult a qualified neurologist or healthcare provider for medical advice.";
      const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
      doc.text(splitDisclaimer, 14, disclaimerY);
    
      doc.save(`EpiChat_Report_${username.replace(/\s+/g, '_')}_${formatGlobalTime(entry.upload_time || entry.date).replace(/\W+/g, '')}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="app-canvas flex-col">
      <div className="orb orb-pink" style={{ top: '-10%', left: '-10%' }} />
      <div className="orb orb-blue" style={{ bottom: '-10%', right: '-5%' }} />

      {/* NAV */}
      <nav className="dashboard-nav glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ClipboardList size={24} className="neon-icon" />
          <h1 className="title neon-text" style={{ fontSize: '1.4rem', margin: 0 }}>User History & Medical Info</h1>
        </div>
        <button className="btn-secondary nav-btn" id="cat1-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back to Dashboard
        </button>
      </nav>

      <main className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* USER CARD */}
        <div className="glass-panel" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg,#4f46e5,#c084fc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700, boxShadow: '0 0 24px rgba(192,132,252,0.4)',
          }}>
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="neon-text" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{username}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
              Epilepsy User Portal · {history.length} EEG record{history.length !== 1 ? 's' : ''} saved
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                id={`cat1-tab-${t.id}`}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: activeTab === t.id ? 'linear-gradient(135deg,#4f46e5,#818cf8)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${activeTab === t.id ? '#818cf8' : 'var(--glass-border)'}`,
                  color: activeTab === t.id ? 'white' : 'var(--text-primary)', borderRadius: 14, padding: '10px 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                  fontWeight: 600, fontSize: '0.9rem',
                  transition: 'all 0.25s', boxShadow: activeTab === t.id ? '0 4px 16px rgba(129,140,248,0.3)' : 'none',
                }}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB: HISTORY ─────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.length === 0 ? (
              <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
                <Brain size={48} style={{ color: 'var(--text-secondary)', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  No EEG records yet. Go to <strong>EEG Detection</strong> to submit your first analysis.
                </p>
                <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/category2')}>
                  Start EEG Analysis →
                </button>
              </div>
            ) : (
              history.map((entry, idx) => (
                <div
                  key={idx}
                  className="glass-panel"
                  style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: 'rgba(129,140,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={20} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{entry.file_name || 'EEG Recording'}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} /> {formatGlobalTime(entry.upload_time || entry.date)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <RiskBadge label={entry.classification_result || entry.result_label} />
                    {entry.confidence != null && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginRight: 10 }}>
                        {Number(entry.confidence).toFixed(1)}% confidence
                      </span>
                    )}
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => downloadPDF(entry)}>
                      <Download size={14} style={{ marginRight: 6 }} /> PDF
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TAB: PRECAUTIONS ─────────────────────────────────────────── */}
        {activeTab === 'precautions' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {PRECAUTIONS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="glass-panel" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'linear-gradient(135deg,#4f46e5,#818cf8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={22} color="white" />
                    </div>
                    <strong style={{ fontSize: '1rem' }}>{item.label}</strong>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9rem' }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB: MEDICATIONS ─────────────────────────────────────────── */}
        {activeTab === 'medications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Disclaimer */}
            <div className="glass-panel" style={{ padding: 16, borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f59e0b', fontWeight: 600 }}>
                <AlertTriangle size={18} /> Medical Disclaimer
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 8, lineHeight: 1.6 }}>
                This information is for educational purposes only. Always consult a qualified neurologist before starting, stopping, or changing any medication.
              </p>
            </div>

            {/* Drug Table */}
            <div className="glass-panel" style={{ padding: 20 }}>
              <div className="neon-text" style={{ fontWeight: 700, marginBottom: 14, fontSize: '1rem' }}>
                <Pill size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Common Epilepsy Medications
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MEDICATIONS.map((med, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                    borderRadius: 14, padding: '14px 18px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, alignItems: 'center',
                  }}>
                    <strong style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>{med.name}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{med.use}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontStyle: 'italic' }}>{med.note}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* First Aid */}
            <div className="glass-panel" style={{ padding: 20 }}>
              <div className="neon-text" style={{ fontWeight: 700, marginBottom: 14, fontSize: '1rem' }}>
                <HeartPulse size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                First Aid During a Seizure
              </div>
              <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FIRST_AID.map((step, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9rem' }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
