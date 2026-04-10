import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import DashboardHub from './components/DashboardHub';
import Category1 from './components/Category1';
import Category2 from './components/Category2';
import Category3 from './components/Category3';
import FloatingChatbot from './components/FloatingChatbot';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/"          element={<Navigate to="/login" replace />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/dashboard" element={<DashboardHub />} />
          <Route path="/category1" element={<Category1 />} />
          <Route path="/category2" element={<Category2 />} />
          <Route path="/category3" element={<Category3 />} />
          {/* All legacy patient/doctor routes redirect to new structure */}
          <Route path="/patient"   element={<Navigate to="/dashboard" replace />} />
          <Route path="/doctor"    element={<Navigate to="/login"     replace />} />
          <Route path="*"          element={<Navigate to="/login"     replace />} />
        </Routes>
        {/* Global Floating AI Chatbot – visible on all pages except /login */}
        <FloatingChatbot />
      </div>
    </Router>
  );
}

export default App;
