import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import Chatbot from './Chatbot';
import { useLocation } from 'react-router-dom';

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Hide entirely on the login page
  if (location.pathname === '/login' || location.pathname === '/') return null;

  return (
    <>
      {/* Floating Chat Window */}
      <div className={`floating-chat-window ${isOpen ? 'visible' : ''}`}>
        <Chatbot onClose={() => setIsOpen(false)} />
      </div>

      {/* FAB Toggle Button */}
      <button
        className={`fab-chat ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Toggle EpiChat AI Assistant"
        id="fab-chatbot-toggle"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </>
  );
}
