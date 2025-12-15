import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';

const Layout = () => {
    return (
        <div className="flex min-h-screen mesh-gradient-bg transition-colors duration-500">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <header className="glass m-4 mb-0 rounded-2xl p-4 flex justify-between items-center sticky top-4 z-10">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight ml-2">Portal do Membro</h1>
                    <div className="flex items-center space-x-4 mr-2">
                        <ThemeToggle />
                        <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                            {/* Placeholder for user avatar */}
                            <div className="w-full h-full bg-gradient-to-tr from-blue-400 to-purple-400"></div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="glass-panel p-8 min-h-full">
                        <Outlet />
                    </div>
                </main>
                <footer className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                    <p>&copy; 2024 Empresa X. Todos os direitos reservados.</p>
                </footer>
            </div>
        </div>
    );
};

export default Layout;
