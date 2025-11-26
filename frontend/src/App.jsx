import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ChangePassword from './pages/auth/ChangePassword';
import AdminLayout from './layouts/AdminLayout';
import AdminHome from './pages/admin/AdminHome';
import AdminAffiliates from './pages/admin/AdminAffiliates';
import AdminReports from './pages/admin/AdminReports';
import ProfessorLayout from './layouts/ProfessorLayout';
import ProfessorHome from './pages/professor/ProfessorHome';
import ProfessorProfile from './pages/professor/ProfessorProfile';
import ProfessorDocuments from './pages/professor/ProfessorDocuments';
import ProfessorSettings from './pages/professor/ProfessorSettings';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

import ForgotPassword from './pages/auth/ForgotPassword';

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
          <Route path="/change-password" element={<ChangePassword />} />
          {/* Nested Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="affiliates" element={<AdminAffiliates />} />
            <Route path="reports" element={<AdminReports />} />
            {/* Reuse ProfessorSettings for now or create AdminSettings */}
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