import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import DashboardHub from './components/DashboardHub';
import DoctorDashboardHub from './components/DoctorDashboardHub';
import DoctorRecords from './components/DoctorRecords';
import Category1 from './components/Category1';
import Category2 from './components/Category2';
import Category3 from './components/Category3';
import HomePage from './components/HomePage';
import AppLayout from './components/AppLayout';
import SettingsPanel from './components/SettingsPanel';

function RouteMeta() {
  const location = useLocation();
  
  useEffect(() => {
    const titles = {
      '/': 'EpiChat | Home',
      '/login': 'EpiChat | Login',
      '/dashboard': 'EpiChat | Dashboard',
      '/doctor-dashboard': 'EpiChat | Doctor Dashboard',
      '/category2': 'EpiChat | EEG Detection',
      '/doctor-eeg': 'EpiChat | EEG Detection',
      '/category1': 'EpiChat | User History',
      '/category3': 'EpiChat | Nearby Doctors',
      '/doctor-records': 'EpiChat | User Records',
      '/settings': 'EpiChat | Settings'
    };
    document.title = titles[location.pathname] || 'EpiChat';
  }, [location]);
  
  return null;
}

function App() {
  // Apply stored theme on every cold mount
  useEffect(() => {
    const theme = localStorage.getItem('epichat_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <Router>
      <RouteMeta />
      <Routes>
        {/* Public routes — theme toggle is embedded in HomePage/Login navbars */}
        <Route path="/"      element={<HomePage />} />
        <Route path="/login" element={<Login />} />

        {/* Authenticated routes — AppLayout provides sidebar + header with toggle */}
        <Route path="/dashboard" element={<AppLayout><DashboardHub /></AppLayout>} />
        <Route path="/doctor-dashboard" element={<AppLayout><DoctorDashboardHub /></AppLayout>} />
        <Route path="/doctor-records" element={<AppLayout><DoctorRecords /></AppLayout>} />
        <Route path="/doctor-eeg" element={<AppLayout><Category2 /></AppLayout>} />
        
        <Route path="/category1" element={<AppLayout><Category1 /></AppLayout>} />
        <Route path="/category2" element={<AppLayout><Category2 /></AppLayout>} />
        <Route path="/category3" element={<AppLayout><Category3 /></AppLayout>} />
        <Route path="/settings"  element={<AppLayout><SettingsPanel /></AppLayout>} />

        {/* Redirects */}
        <Route path="/patient" element={<Navigate to="/dashboard" replace />} />
        <Route path="/doctor"  element={<Navigate to="/doctor-dashboard" replace />} />
        <Route path="/home"    element={<Navigate to="/"          replace />} />
        <Route path="*"        element={<Navigate to="/"          replace />} />
      </Routes>
    </Router>
  );
}

export default App;
