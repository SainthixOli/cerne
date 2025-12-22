import React from 'react';
import { Outlet } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import AdminSidebar from '../components/AdminSidebar';

const AdminLayout = () => {
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
                <main className="flex-grow overflow-y-auto p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
