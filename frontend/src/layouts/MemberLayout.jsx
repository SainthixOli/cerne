import { Navigate, Outlet, useLocation } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../auth/useAuth';

export default function MemberLayout() {
    const { user } = useAuth();
    const location = useLocation();
    const isInactive = user?.status === 'inativo';

    if (isInactive && location.pathname !== '/member') {
        return <Navigate to="/member" replace />;
    }

    return (
        <div className="flex h-screen bg-left-gradient dark:bg-gray-900 transition-colors duration-300">
            {!isInactive && <Sidebar />}
            <div className={`flex-grow flex flex-col h-screen overflow-hidden ${isInactive ? 'max-w-5xl mx-auto w-full' : ''}`}>
                <header className="h-16 flex justify-end items-center px-8 pt-4">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm">
                        <NotificationBell />
                    </div>
                </header>
                <main className="flex-grow overflow-y-auto p-8 pt-2"><Outlet /></main>
            </div>
        </div>
    );
}
