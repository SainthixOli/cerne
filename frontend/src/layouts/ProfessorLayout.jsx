import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const ProfessorLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Sidebar />
            <main className="flex-grow overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default ProfessorLayout;
