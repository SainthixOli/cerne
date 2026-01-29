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
import AdminCollaboratorDetail from './pages/admin/AdminCollaboratorDetail';
import AdminDocuments from './pages/admin/AdminDocuments';
import ProfessorLayout from './layouts/ProfessorLayout';
import ProfessorHome from './pages/professor/ProfessorHome';
import ProfessorDocuments from './pages/professor/ProfessorDocuments';
import ProfessorSettings from './pages/professor/ProfessorSettings';
import UserProfile from './pages/shared/UserProfile';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { Toaster } from 'react-hot-toast';
import ChatManager from './pages/shared/ChatManager';
import ForgotPassword from './pages/auth/ForgotPassword';
import CheckStatus from './pages/public/CheckStatus';
import SystemDashboard from './pages/system/SystemDashboard';
import AccessibilityWidget from './components/AccessibilityWidget';

function App() {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: '',
            style: {
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '16px',
              color: '#1f2937',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: 'white',
              },
              style: {
                borderLeft: '4px solid #10B981',
              }
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: 'white',
              },
              style: {
                borderLeft: '4px solid #EF4444',
              }
            },
            loading: {
              style: {
                borderLeft: '4px solid #3B82F6',
              }
            }
          }}
        />
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

            {/* Rotas de Admin Aninhadas */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="affiliates" element={<AdminAffiliates />} />
              <Route path="chat" element={<ChatManager role="admin" />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminCollaboratorDetail />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="settings" element={<ProfessorSettings />} />
            </Route>

            {/* Rotas de Membro Aninhadas */}
            <Route path="/member" element={<ProfessorLayout />}>
              <Route index element={<ProfessorHome />} />
              <Route path="chat" element={<ChatManager role="professor" />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="documents" element={<ProfessorDocuments />} />
              <Route path="settings" element={<ProfessorSettings />} />
            </Route>
          </Routes>
          <AccessibilityWidget />
        </Router>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;