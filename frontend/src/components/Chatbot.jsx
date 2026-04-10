import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Loader } from 'lucide-react';
import { API_BASE } from '../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Animated typing dots indicator
// ─────────────────────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="chat-message-row ai">
      <div className="chat-bubble ai-bubble" style={{ padding: '10px 14px' }}>
        <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--accent)',
                display: 'inline-block',
                animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Chatbot component
// ─────────────────────────────────────────────────────────────────────────────
export default function Chatbot({ onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: "Hello! I'm EpiChat AI — your epilepsy & EEG assistant. Ask me anything about seizure results, precautions, medications, or first aid. How can I help you today?",
    },
  ]);
  const [inputVal,  setInputVal]  = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Send message to backend proxy ──────────────────────────────────────────
  const sendToBackend = async (history) => {
    // Build conversation in the format the backend expects
    const payload = {
      messages: history.map(m => ({
        role:    m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text,
      })),
    };

    const res = await fetch(`${API_BASE}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server error ${res.status}`);
    }

    const data = await res.json();
    return data.reply;
  };

  // ── Handle submit ──────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputVal.trim();
    if (!text || isLoading) return;

    // Add user message immediately
    const userMsg = { id: Date.now(), role: 'user', text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputVal('');
    setIsLoading(true);
    inputRef.current?.focus();

    try {
      const reply = await sendToBackend(updatedHistory);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', text: reply },
      ]);
    } catch (err) {
      // Surface the real error — no hardcoded fallback
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: `⚠️ Unable to reach the AI backend.\n\n${err.message}\n\nMake sure:\n1. The backend is running on port 8000\n2. OPENAI_API_KEY is set in backend/.env`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Keyboard shortcut: Enter to send, Shift+Enter for newline ─────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="glass-panel chatbot-container">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="chatbot-header">
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#c084fc)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginRight: 10,
        }}>
          <Bot size={17} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>EpiChat AI Assistant</h3>
          <div style={{ fontSize: '0.72rem', color: isLoading ? '#f59e0b' : 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isLoading ? '#f59e0b' : 'var(--success)', display: 'inline-block', animation: isLoading ? 'pulse 1s ease infinite' : 'none' }} />
            {isLoading ? 'Thinking…' : 'Online'}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            id="chatbot-close-btn"
            aria-label="Close chat"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── MESSAGES ─────────────────────────────────────────────────────── */}
      <div className="chatbot-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message-row ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
            <div
              className={`chat-bubble ${msg.role === 'assistant' ? 'ai-bubble' : 'user-bubble'}`}
              style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator — replaces placeholder while awaiting API */}
        {isLoading && <TypingIndicator />}

        <div ref={endRef} />
      </div>

      {/* ── INPUT ─────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSend} className="chatbot-input-container">
        <input
          ref={inputRef}
          id="chatbot-input"
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? 'Waiting for response…' : 'Ask about EEG results, seizures, first aid…'}
          className="chat-input"
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          id="chatbot-send-btn"
          className="chat-send-btn"
          disabled={isLoading || !inputVal.trim()}
          aria-label="Send message"
        >
          {isLoading
            ? <Loader size={16} style={{ animation: 'chatSpin 0.8s linear infinite' }} />
            : <Send size={16} />
          }
        </button>
      </form>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0);   opacity: 0.4; }
          30%            { transform: translateY(-6px); opacity: 1;   }
        }
        @keyframes chatSpin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
