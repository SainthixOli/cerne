import React from 'react';
import { Outlet } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import Sidebar from '../components/Sidebar';

const ProfessorLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Sidebar />
            <div className="flex-grow flex flex-col h-screen overflow-hidden">
                <header className="h-16 flex justify-end items-center px-8 pt-4">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm">
                        <NotificationBell />
                    </div>
                </header>
                <main className="flex-grow overflow-y-auto p-8 pt-2">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ProfessorLayout;
