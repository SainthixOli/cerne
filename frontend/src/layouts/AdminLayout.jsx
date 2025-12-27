import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import AdminSidebar from '../components/AdminSidebar';
import api from '../api';

const AdminLayout = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    let user = {};
    try {
        user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
        console.error("Corrupted user data in localStorage, clearing.");
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }
    const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading

    useEffect(() => {
        const verifyAuth = async () => {
            if (!token || !user.role || (user.role !== 'admin' && user.role !== 'super_admin')) {
                setIsAuthenticated(false);
                return;
            }

            try {
                // Optional: Verify token with backend
                // await api.get('/auth/me'); 
                setIsAuthenticated(true);
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
            }
        };
        verifyAuth();
    }, [token, navigate]);

    if (isAuthenticated === null) return <div className="flex h-screen items-center justify-center">Carregando...</div>;
    if (isAuthenticated === false) return <Navigate to="/login" replace />;

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
