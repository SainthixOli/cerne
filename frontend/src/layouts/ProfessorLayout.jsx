import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import Sidebar from '../components/Sidebar';

const ProfessorLayout = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    let user = {};
    try {
        user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const verifyAuth = async () => {
            // Permitir professor, mas também admins podem ver o layout de professor se quiserem? 
            // Geralmente não, mas vamos restringir a quem tem token válido e role definida.
            if (!token || !user.role) {
                setIsAuthenticated(false);
                return;
            }
            setIsAuthenticated(true);
        };
        verifyAuth();
    }, [token, navigate]);

    if (isAuthenticated === null) return <div className="flex h-screen items-center justify-center">Carregando...</div>;
    if (isAuthenticated === false) return <Navigate to="/login" replace />;

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
