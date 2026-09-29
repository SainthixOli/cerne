import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import NotificationBell from '../components/NotificationBell';
import AdminSidebar from '../components/AdminSidebar';

const MotionSection = motion.section;

export default function AdminLayout() {
    const location = useLocation();
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <AdminSidebar />
            <div className="flex-grow flex flex-col h-screen overflow-hidden">
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-end items-center px-8 shadow-sm z-20">
                    <div className="mr-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date().toLocaleDateString()}
                    </div>
                    <NotificationBell />
                </header>
                <main className="flex-grow overflow-y-auto p-8 relative">
                    <MotionSection
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        <Outlet />
                    </MotionSection>
                </main>
            </div>
        </div>
    );
}
