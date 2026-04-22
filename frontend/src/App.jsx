import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import DashboardHub from './components/DashboardHub';
import Category1 from './components/Category1';
import Category2 from './components/Category2';
import Category3 from './components/Category3';
import HomePage from './components/HomePage';
import AppLayout from './components/AppLayout';

function App() {
  // Apply stored theme on every cold mount
  useEffect(() => {
    const theme = localStorage.getItem('epichat_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes — theme toggle is embedded in HomePage/Login navbars */}
        <Route path="/"      element={<HomePage />} />
        <Route path="/login" element={<Login />} />

        {/* Authenticated routes — AppLayout provides sidebar + header with toggle */}
        <Route path="/dashboard" element={<AppLayout><DashboardHub /></AppLayout>} />
        <Route path="/category1" element={<AppLayout><Category1 /></AppLayout>} />
        <Route path="/category2" element={<AppLayout><Category2 /></AppLayout>} />
        <Route path="/category3" element={<AppLayout><Category3 /></AppLayout>} />

        {/* Redirects */}
        <Route path="/patient" element={<Navigate to="/dashboard" replace />} />
        <Route path="/doctor"  element={<Navigate to="/login"     replace />} />
        <Route path="/home"    element={<Navigate to="/"          replace />} />
        <Route path="*"        element={<Navigate to="/"          replace />} />
      </Routes>
    </Router>
  );
}

export default App;
