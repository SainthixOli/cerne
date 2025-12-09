import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ChangePassword from './pages/auth/ChangePassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminLayout from './layouts/AdminLayout';
import AdminHome from './pages/admin/AdminHome';
import AdminAffiliates from './pages/admin/AdminAffiliates';
import AdminReports from './pages/admin/AdminReports';
import AdminAudit from './pages/admin/AdminAudit';
import AdminUsers from './pages/admin/AdminUsers';
import ProfessorLayout from './layouts/ProfessorLayout';
import ProfessorHome from './pages/professor/ProfessorHome';
import ProfessorProfile from './pages/professor/ProfessorProfile';
import ProfessorDocuments from './pages/professor/ProfessorDocuments';
import ProfessorSettings from './pages/professor/ProfessorSettings';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

import ForgotPassword from './pages/auth/ForgotPassword';

import CheckStatus from './pages/public/CheckStatus';

import SystemDashboard from './pages/system/SystemDashboard';

function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/check-status" element={<CheckStatus />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route path="/system" element={<SystemDashboard />} />

          {/* Nested Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="affiliates" element={<AdminAffiliates />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="audit" element={<AdminAudit />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<ProfessorSettings />} />
          </Route>

          {/* Nested Professor Routes */}
          <Route path="/professor" element={<ProfessorLayout />}>
            <Route index element={<ProfessorHome />} />
            <Route path="profile" element={<ProfessorProfile />} />
            <Route path="documents" element={<ProfessorDocuments />} />
            <Route path="settings" element={<ProfessorSettings />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;