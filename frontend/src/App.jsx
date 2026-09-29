import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoadingProvider } from './contexts/LoadingContext';
import ProtectedRoute from './auth/ProtectedRoute';
import ProceduralLoader from './components/ProceduralLoader';

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ChangePassword = lazy(() => import('./pages/auth/ChangePassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const CheckStatus = lazy(() => import('./pages/public/CheckStatus'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const MemberLayout = lazy(() => import('./layouts/MemberLayout'));
const SystemDashboard = lazy(() => import('./pages/system/SystemDashboard'));
const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const AdminAffiliates = lazy(() => import('./pages/admin/AdminAffiliates'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCollaboratorDetail = lazy(() => import('./pages/admin/AdminCollaboratorDetail'));
const AdminDocuments = lazy(() => import('./pages/admin/AdminDocuments'));
const MemberHome = lazy(() => import('./pages/member/MemberHome'));
const MemberDocuments = lazy(() => import('./pages/member/MemberDocuments'));
const MemberSettings = lazy(() => import('./pages/member/MemberSettings'));
const UserProfile = lazy(() => import('./pages/shared/UserProfile'));
const ChatManager = lazy(() => import('./pages/shared/ChatManager'));
const AccessibilityWidget = lazy(() => import('./components/AccessibilityWidget'));
const CommandPalette = lazy(() => import('./components/CommandPalette'));

const ADMIN_ROLES = ['admin', 'super_admin'];
const MEMBER_ROLES = ['professor'];

function RouteLoader() {
  return <div className="flex min-h-screen items-center justify-center"><ProceduralLoader /></div>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/check-status" element={<CheckStatus />} />

        <Route element={<ProtectedRoute roles={['professor', 'admin', 'super_admin', 'system_manager']} />}>
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        <Route element={<ProtectedRoute roles={['system_manager']} />}>
          <Route path="/system" element={<SystemDashboard />} />
        </Route>

        <Route element={<ProtectedRoute roles={ADMIN_ROLES} />}>
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
            <Route path="settings" element={<MemberSettings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={MEMBER_ROLES} />}>
          <Route path="/member" element={<MemberLayout />}>
            <Route index element={<MemberHome />} />
            <Route path="chat" element={<ChatManager role="member" />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="documents" element={<MemberDocuments />} />
            <Route path="settings" element={<MemberSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AccessibilityWidget />
      <CommandPalette />
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <Toaster position="top-right" />
        <BrowserRouter><AppRoutes /></BrowserRouter>
      </LoadingProvider>
    </ThemeProvider>
  );
}
