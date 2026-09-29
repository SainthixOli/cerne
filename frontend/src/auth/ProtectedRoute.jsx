import { Navigate, Outlet, useLocation } from 'react-router-dom';
import ProceduralLoader from '../components/ProceduralLoader';
import { useAuth } from './useAuth';
import { homeForRole } from './roleRoutes';

export default function ProtectedRoute({ roles, children }) {
    const { status, user } = useAuth();
    const location = useLocation();

    if (status === 'loading') {
        return <div className="flex min-h-screen items-center justify-center"><ProceduralLoader /></div>;
    }
    if (status !== 'authenticated' || !user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    if (roles && !roles.includes(user.role)) {
        return <Navigate to={homeForRole(user.role)} replace />;
    }
    if (user.changePasswordRequired && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }
    return children || <Outlet />;
}
