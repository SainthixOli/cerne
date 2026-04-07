import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
import MemberLayout from './layouts/MemberLayout';
import MemberHome from './pages/member/MemberHome';
import MemberDocuments from './pages/member/MemberDocuments';
import MemberSettings from './pages/member/MemberSettings';
import UserProfile from './pages/shared/UserProfile';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { Toaster } from 'react-hot-toast';
import ChatManager from './pages/shared/ChatManager';
import ForgotPassword from './pages/auth/ForgotPassword';
import CheckStatus from './pages/public/CheckStatus';
import SystemDashboard from './pages/system/SystemDashboard';
import AccessibilityWidget from './components/AccessibilityWidget';
import CommandPalette from './components/CommandPalette';

// Componente de Transição para todas as páginas
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, filter: 'blur(5px)' }}
    animate={{ opacity: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, filter: 'blur(5px)' }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

// Componente de Rotas separado para usar useLocation (necessário para AnimatePresence)
const AppRoutes = () => {
  const location = useLocation();
  // Key inteligente: Agrupa rotas por "contexto" (admin, member, public)
  // Isso evita que o Layout Admin seja desmontado ao navegar DENTRO do admin
  const topLevelKey = location.pathname.split('/')[1] || 'root';

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={topLevelKey}>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rotas Públicas com Transição */}
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/check-status" element={<PageTransition><CheckStatus /></PageTransition>} />
        <Route path="/change-password" element={<PageTransition><ChangePassword /></PageTransition>} />

        <Route path="/system" element={<PageTransition><SystemDashboard /></PageTransition>} />

        {/* Rotas de Admin (Layout gerencia as transições internas se necessário) */}
        <Route path="/admin" element={<PageTransition><AdminLayout /></PageTransition>}>
          <Route index element={<AdminHome />} />
          <Route path="affiliates" element={<AdminAffiliates />} />
          <Route path="chat" element={<ChatManager role="admin" />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminCollaboratorDetail />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="settings" element={<MemberSettings />} />
        </Route>

        {/* Rotas de Membro */}
        <Route path="/member" element={<PageTransition><MemberLayout /></PageTransition>}>
          <Route index element={<MemberHome />} />
          <Route path="chat" element={<ChatManager role="member" />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="documents" element={<MemberDocuments />} />
          <Route path="settings" element={<MemberSettings />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

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
          <AppRoutes />
          <AccessibilityWidget />
          <CommandPalette />
        </Router>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;