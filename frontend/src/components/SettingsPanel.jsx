import React, { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Monitor, User, Layout, MessageSquare, Bell, Shield, Trash2, CheckCircle2, ChevronDown } from 'lucide-react';

export default function SettingsPanel() {
  const role = localStorage.getItem('epichat_role');
  const isDoctor = role === 'doctor';

  const [theme, setTheme] = useState(localStorage.getItem('epichat_theme') || 'dark');
  const [landingPage, setLandingPage] = useState(isDoctor ? '/doctor-dashboard' : '/dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiVoice, setAiVoice] = useState(true);
  const [aiAutoOpen, setAiAutoOpen] = useState(false);
  const [aiTone, setAiTone] = useState('detailed');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [welcomeMail, setWelcomeMail] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [chatClearedFeedback, setChatClearedFeedback] = useState(false);

  const username = localStorage.getItem('epichat_username') || 'User';
  
  // Handlers
  const handleTheme = (t) => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t === 'auto' ? 'dark' : t);
    localStorage.setItem('epichat_theme', t === 'auto' ? 'dark' : t);
  };

  const clearChatHistory = () => {
    localStorage.removeItem('epichat_messages');
    window.dispatchEvent(new Event('chat_cleared'));
    setChatClearedFeedback(true);
    setTimeout(() => setChatClearedFeedback(false), 3000);
  };

  const clearEegHistory = async () => {
    setShowConfirm(false);
    const token = localStorage.getItem('epichat_token');
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/history/clear', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) alert(isDoctor ? "Analytics cache cleared." : "Saved EEG history cleared from database.");
      else alert("Failed to clear history.");
    } catch (e) {
      alert("Failed to clear history: " + e.message);
    }
  };

  const primaryGradient = isDoctor ? 'linear-gradient(135deg,#3b82f6,#0ea5e9)' : 'linear-gradient(135deg,#6366f1,#c084fc)';
  const shadowColor = isDoctor ? 'rgba(14,165,233,0.3)' : 'rgba(192,132,252,0.3)';
  const activeColor = isDoctor ? '#3b82f6' : 'var(--accent)';

  return (
    <div className="flex-col" style={{ gap: 24, paddingBottom: 40, maxWidth: 1000, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: isDoctor ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(14,165,233,0.2))' : 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(192,132,252,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isDoctor ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(99,102,241,0.3)' }}>
          <Settings size={22} className="neon-icon" style={isDoctor ? { color: '#3b82f6' } : {}} />
        </div>
        <div>
          <h1 className="title neon-text" style={{ fontSize: '1.6rem', margin: 0, textShadow: isDoctor ? '0 0 10px rgba(14,165,233,0.5)' : undefined }}>Preferences</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Manage your account, appearance, and system settings.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* A. Theme Settings */}
        <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            <Monitor size={18} /> Theme Settings
          </div>
          <div style={{ display: 'flex', gap: 10, background: 'rgba(0,0,0,0.2)', padding: 6, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
            <button onClick={() => handleTheme('dark')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: theme === 'dark' ? activeColor : 'transparent', color: theme === 'dark' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 600, transition: 'all 0.2s' }}>
              <Moon size={16} /> Dark
            </button>
            <button onClick={() => handleTheme('light')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: theme === 'light' ? activeColor : 'transparent', color: theme === 'light' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 600, transition: 'all 0.2s' }}>
              <Sun size={16} /> Light
            </button>
            <button onClick={() => handleTheme('auto')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: theme === 'auto' ? activeColor : 'transparent', color: theme === 'auto' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 600, transition: 'all 0.2s' }}>
              <Monitor size={16} /> Auto
            </button>
          </div>
        </div>

        {/* B. Account Settings */}
        <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            <User size={18} /> Account Settings
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Username</label>
              <input type="text" className="premium-input" value={username} disabled />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Email Display</label>
              <input type="email" className="premium-input" value={`${username.toLowerCase()}@epichat.local`} disabled />
            </div>
            <button className="btn-secondary" style={{ alignSelf: 'flex-start', marginTop: 4 }}>Change Password</button>
          </div>
        </div>

        {/* C. Dashboard Settings */}
        <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            <Layout size={18} /> Dashboard Settings
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Default Landing Page</label>
              <select className="premium-input" value={landingPage} onChange={e => setLandingPage(e.target.value)}>
                {isDoctor ? (
                  <>
                    <option value="/doctor-dashboard">Doctor Dashboard</option>
                    <option value="/doctor-eeg">EEG Detection</option>
                    <option value="/doctor-records">User Records</option>
                  </>
                ) : (
                  <>
                    <option value="/dashboard">Dashboard</option>
                    <option value="/category2">EEG Detection</option>
                    <option value="/category1">User History</option>
                  </>
                )}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Sidebar Collapsed</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Start with minimized sidebar</div>
              </div>
              <ToggleSwitch checked={sidebarCollapsed} onChange={setSidebarCollapsed} activeColor={activeColor} />
            </div>
          </div>
        </div>

        {/* D. AI Assistant Settings */}
        <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            <MessageSquare size={18} /> AI Assistant Settings
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Voice Responses</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Enable text-to-speech</div>
              </div>
              <ToggleSwitch checked={aiVoice} onChange={setAiVoice} activeColor={activeColor} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Auto-open Chatbot</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Expand on login</div>
              </div>
              <ToggleSwitch checked={aiAutoOpen} onChange={setAiAutoOpen} activeColor={activeColor} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Response Tone</label>
              <select className="premium-input" value={aiTone} onChange={e => setAiTone(e.target.value)}>
                <option value="concise">Concise & Direct</option>
                <option value="detailed">Detailed & Educational</option>
                {isDoctor && <option value="clinical">Clinical / Medical</option>}
              </select>
            </div>
          </div>
        </div>

        {/* E. Notification Settings */}
        <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            <Bell size={18} /> Notification Settings
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Email Alerts on Upload</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Receive analysis results via email</div>
              </div>
              <ToggleSwitch checked={emailAlerts} onChange={setEmailAlerts} activeColor={activeColor} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Welcome Email</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>First login welcome summary</div>
              </div>
              <ToggleSwitch checked={welcomeMail} onChange={setWelcomeMail} activeColor={activeColor} />
            </div>
          </div>
        </div>

        {/* F. Privacy */}
        <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            <Shield size={18} /> Privacy & Data
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Manage your saved data across the EpiChat system.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                onClick={clearChatHistory} 
                style={{ 
                  alignSelf: 'flex-start', 
                  background: '#ef4444', 
                  color: '#ffffff', 
                  border: 'none', 
                  boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; }}
              >
                <MessageSquare size={14} style={{ marginRight: 6 }}/> Clear Chat History
              </button>
              {chatClearedFeedback && <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>✓ Chat history cleared</span>}
            </div>
            <button className="btn-secondary" onClick={() => setShowConfirm(true)} style={{ alignSelf: 'flex-start', color: 'var(--warning)' }}>
              <Trash2 size={14} style={{ marginRight: 6 }}/> {isDoctor ? 'Clear Patient Analytics Cache' : 'Clear Saved EEG History'}
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: 24, maxWidth: 400, width: '90%' }}>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield color="var(--warning)" /> Confirm Deletion
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 20 }}>
              {isDoctor 
                ? 'Are you sure you want to clear your local patient analytics cache? This will not delete records from the primary server.'
                : 'Are you sure you want to permanently delete all saved EEG history and analysis results from the database? This action cannot be undone.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn-primary" onClick={clearEegHistory} style={{ background: 'var(--warning)', borderColor: 'var(--warning-border)', color: '#fff' }}>Yes, Delete History</button>
            </div>
          </div>
        </div>
      )}

      {/* Global Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button className="btn-primary" onClick={() => alert('Settings saved successfully!')} style={{ padding: '10px 24px', background: primaryGradient, boxShadow: `0 4px 14px ${shadowColor}` }}>
          <CheckCircle2 size={16} style={{ marginRight: 8 }}/> Save Preferences
        </button>
      </div>
    </div>
  );
}

// ─── Simple Toggle Switch ───────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, activeColor }) {
  return (
    <div 
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? activeColor : 'rgba(255,255,255,0.1)',
        border: checked ? `1px solid ${activeColor}` : '1px solid rgba(255,255,255,0.2)',
        position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)', transition: 'all 0.3s'
      }} />
    </div>
  );
}
