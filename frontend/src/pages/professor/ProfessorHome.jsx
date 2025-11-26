import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfessorHome = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
    }, [navigate]);

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Olá, {user.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Bem-vindo ao seu painel.</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {user.name.charAt(0)}
                </div>
            </header>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Status da Filiação</h3>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Situação Atual</span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 font-medium text-sm">
                            Ativo
                        </span>
                    </div>
                    <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-full rounded-full"></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Ações Rápidas</h3>
                    <div className="space-y-3">
                        <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition font-medium">
                            Atualizar Dados Cadastrais
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition font-medium">
                            Emitir Carteirinha Digital
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessorHome;
