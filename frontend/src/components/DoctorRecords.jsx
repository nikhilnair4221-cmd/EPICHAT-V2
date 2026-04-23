import React, { useEffect, useState, useMemo } from 'react';
import { Search, ChevronLeft, Download, FileText, Activity, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiJson, formatGlobalTime } from '../lib/api';
import EEGMonitor from './EEGMonitor';
import RiskTimeline from './RiskTimeline';
import BrainHeatmap from './BrainHeatmap';
import ResultsCard from './ResultsCard';



function getSeverity(label) {
  if (!label) return 'Unknown';
  const l = label.toLowerCase();
  if (l.includes('seizure') || l.includes('ictal') && !l.includes('pre')) return 'High';
  if (l.includes('pre-ictal') || l.includes('epileptic')) return 'Medium';
  return 'Low';
}

function RiskBadge({ label }) {
  if (!label) return null;
  const severity = getSeverity(label);
  if (severity === 'High')
    return <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🔴 High Risk</span>;
  if (severity === 'Medium')
    return <span style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🟡 Med Risk</span>;
  return <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🟢 Low Risk</span>;
}

export default function DoctorRecords() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); // When a user is selected for detail view
  const [selectedReport, setSelectedReport] = useState(null); // When a specific report is clicked in detail view

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await apiJson('/api/doctor/patients');
      setSubs(data);
      if (selectedReport) {
        const updated = data.find((x) => x.id === selectedReport.id);
        setSelectedReport(updated || null);
      }
    } catch (e) {
      console.error(e);
      alert(`Failed to load patient submissions: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSubs = useMemo(() => {
    return subs.filter(s => 
      s.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.patient_username && s.patient_username.toLowerCase().includes(search.toLowerCase())) ||
      (s.file_name && s.file_name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [subs, search]);

  const markReviewed = async (id) => {
    try {
      const updated = await apiJson(`/api/doctor/patients/${id}/review`, { method: 'PATCH' });
      setSubs((prev) => prev.map((s) => (s.id === id ? updated : s)));
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport(updated);
      }
    } catch (e) {
      console.error(e);
      alert(`Mark reviewed failed: ${e.message}`);
    }
  };

  const downloadPDF = (e, entry) => {
    e.stopPropagation();
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(14, 165, 233); // Blue for doctor
      doc.text('EpiChat Medical Report', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${formatGlobalTime(new Date().toISOString())}`, 14, 28);
      doc.text(`Reviewed by: Dr. ${localStorage.getItem('epichat_username') || 'Doctor'}`, 14, 34);
      
      doc.setDrawColor(200);
      doc.line(14, 38, 196, 38);
    
      // Patient Info
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Patient Information', 14, 48);
      
      autoTable(doc, {
        startY: 52,
        head: [['Field', 'Details']],
        body: [
          ['Name', String(entry.patient_name || 'Unknown')],
          ['Username', String(entry.patient_username || 'N/A')],
          ['Age', String(entry.patient_age)],
          ['Gender', String(entry.patient_gender)],
          ['Upload Date', String(formatGlobalTime(entry.created_at))],
          ['File Name', String(entry.file_name || 'EEG Recording')]
        ],
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233] }
      });
    
      // Analysis Results
      const finalY = doc.lastAutoTable.finalY || 100;
      doc.setFontSize(14);
      doc.text('Analysis Results', 14, finalY + 14);
    
      const confidenceText = entry.confidence != null ? `${Number(entry.confidence).toFixed(1)}%` : 'N/A';
      const severity = getSeverity(entry.result_label);
      
      autoTable(doc, {
        startY: finalY + 18,
        head: [['Metric', 'Result']],
        body: [
          ['Risk Level', String(entry.result_label || 'Unknown')],
          ['Confidence', String(confidenceText)],
          ['Severity', String(severity)],
          ['AI Explanation', `Detected patterns corresponding to ${severity.toLowerCase()} risk. Clinical correlation required.`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233] }
      });

      let nextY = doc.lastAutoTable.finalY + 14;
      if (entry.symptoms_text) {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Reported Symptoms', 14, nextY);
        doc.setFontSize(10);
        doc.setTextColor(60);
        const splitSymptoms = doc.splitTextToSize(entry.symptoms_text, 180);
        doc.text(splitSymptoms, 14, nextY + 8);
        nextY += 8 + (splitSymptoms.length * 5);
      }

      // Disclaimer
      nextY += 10;
      doc.setFontSize(10);
      doc.setTextColor(150, 0, 0);
      const disclaimer = "DISCLAIMER: This report is generated by EpiChat AI for informational purposes only. It is not a formal medical diagnosis. Always consult a qualified neurologist or healthcare provider for medical advice.";
      const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
      doc.text(splitDisclaimer, 14, nextY);
    
      doc.save(`EpiChat_Patient_Report_${(entry.patient_name || 'Unknown').replace(/\s+/g, '_')}_${formatGlobalTime(entry.created_at).replace(/\W+/g, '')}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // ── TABLE VIEW ─────────────────────────────────────────────────────────────
  if (!selectedUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg,#3b82f6,#0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14,165,233,0.3)',
            }}>
              <User size={20} color="white" />
            </div>
            <div>
              <h2 className="title neon-text" style={{ fontSize: '1.4rem', margin: 0 }}>Patient Records</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{subs.length} total EEG submissions</div>
            </div>
          </div>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="premium-input"
              placeholder="Search patients or files..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 40, background: 'var(--glass-bg)', borderColor: 'rgba(59,130,246,0.3)' }}
            />
          </div>
        </div>

        <div className="glass-panel" style={{ overflowX: 'auto', padding: '10px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Patient</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Age/Gen</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Upload Date</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>File Name</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Risk Level</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Severity</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading patient records...</td></tr>
              ) : filteredSubs.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No records found.</td></tr>
              ) : (
                filteredSubs.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }} className="hover-row">
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{s.patient_username || 'user'}</div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.patient_age} / {s.patient_gender.charAt(0)}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{formatGlobalTime(s.created_at)}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.file_name || 'EEG Data'}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {!s.reviewed && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} title="New/Unreviewed" />}
                        <span style={{ fontWeight: 600, color: s.result_label === 'Ictal' ? '#ef4444' : s.result_label === 'Pre-ictal' ? '#f59e0b' : '#10b981' }}>
                          {s.result_label}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({s.confidence?.toFixed(1)}%)</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}><RiskBadge label={s.result_label} /></td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'linear-gradient(135deg,#3b82f6,#0ea5e9)', boxShadow: '0 2px 8px rgba(14,165,233,0.3)' }}
                          onClick={() => { setSelectedUser(s.patient_username || s.patient_name); setSelectedReport(s); }}
                        >
                          View Profile
                        </button>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={(e) => downloadPDF(e, s)}
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  // Filter all submissions by this user
  const userSubmissions = subs.filter(s => (s.patient_username || s.patient_name) === selectedUser).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const latestReport = userSubmissions[0];
  const currentReport = selectedReport || latestReport;

  // Render detail view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Detail Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button 
          className="btn-secondary" 
          onClick={() => { setSelectedUser(null); setSelectedReport(null); }}
          style={{ padding: '8px 12px' }}
        >
          <ChevronLeft size={16} /> Back to Records
        </button>
        <div style={{ width: 1, height: 24, background: 'var(--glass-border)' }} />
        <h2 className="title neon-text" style={{ fontSize: '1.3rem', margin: 0 }}>Patient Profile</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left Column: User Info & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Basic Details */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg,#3b82f6,#0ea5e9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
              }}>
                {(latestReport?.patient_name?.charAt(0) || 'U').toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{latestReport?.patient_name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>@{latestReport?.patient_username}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Age</span>
                <span style={{ fontWeight: 600 }}>{latestReport?.patient_age}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gender</span>
                <span style={{ fontWeight: 600 }}>{latestReport?.patient_gender}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Uploads</span>
                <span style={{ fontWeight: 600 }}>{userSubmissions.length}</span>
              </div>
            </div>
          </div>

          {/* Upload History List */}
          <div className="glass-panel" style={{ padding: '20px 0' }}>
            <div style={{ padding: '0 20px 12px', borderBottom: '1px solid var(--glass-border)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
              Upload History
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 400, overflowY: 'auto' }}>
              {userSubmissions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedReport(s)}
                  style={{
                    textAlign: 'left', background: currentReport?.id === s.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                    border: 'none', borderLeft: currentReport?.id === s.id ? '3px solid #3b82f6' : '3px solid transparent',
                    padding: '12px 20px', cursor: 'pointer', transition: 'background 0.2s',
                    borderBottom: '1px solid rgba(255,255,255,0.02)'
                  }}
                  className="hover-row"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{formatGlobalTime(s.created_at)}</span>
                    {!s.reviewed && <span style={{ background: '#3b82f6', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>NEW</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{s.file_name || 'EEG Data'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: s.result_label === 'Ictal' ? '#ef4444' : s.result_label === 'Pre-ictal' ? '#f59e0b' : '#10b981' }}>
                      {s.result_label}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.confidence?.toFixed(1)}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Report Detail */}
        {currentReport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Action Bar & Summary */}
            <div className="glass-panel" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800 }}>Report: {formatGlobalTime(currentReport.created_at)}</h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>File: {currentReport.file_name || 'EEG'}</div>
                {currentReport.symptoms_text && (
                  <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Reported Symptoms:</span>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>{currentReport.symptoms_text}</p>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                <RiskBadge label={currentReport.result_label} />
                <button 
                  className="btn-primary" 
                  onClick={() => markReviewed(currentReport.id)} 
                  disabled={currentReport.reviewed} 
                  style={{ background: currentReport.reviewed ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#3b82f6,#0ea5e9)', color: currentReport.reviewed ? 'var(--text-secondary)' : 'white' }}
                >
                  <CheckCircle2 size={16} style={{ marginRight: 6 }} />
                  {currentReport.reviewed ? 'Reviewed' : 'Mark Reviewed'}
                </button>
                <button className="btn-secondary" onClick={(e) => downloadPDF(e, currentReport)}>
                  <Download size={16} style={{ marginRight: 6 }} /> Download PDF
                </button>
              </div>
            </div>

            {/* Visualizations */}
            <ResultsCard resultLabel={currentReport.result_label} confidence={currentReport.confidence} />
            
            {currentReport.risk_score_series?.length > 0 ? (
              <EEGMonitor isLive={false} riskSeries={currentReport.risk_score_series} seizureChannels={currentReport.seizure_channels} height={280} />
            ) : (
              <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No EEG signal data available</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {currentReport.risk_score_series?.length > 0 ? (
                <RiskTimeline riskSeries={currentReport.risk_score_series} playhead={Math.min(currentReport.risk_score_series.length - 1, Math.floor(currentReport.risk_score_series.length * 0.7))} />
              ) : <div />}
              <BrainHeatmap seizureChannels={currentReport.seizure_channels || []} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
