import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, FileText, ChevronRight, ShieldCheck } from 'lucide-react';

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
        <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Olá, {user.name.split(' ')[0]}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Bem-vindo ao seu painel de membro.</p>
                </div>
                <div className="glass px-4 py-2 rounded-full flex items-center space-x-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Matrícula</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{user.matricula || '---'}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white/20">
                        {user.name.charAt(0)}
                    </div>
                </div>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Status Card */}
                <div className="glass-panel p-8 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                    <div className="flex items-center mb-6">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl text-green-600 dark:text-green-400 mr-4">
                            <ShieldCheck size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Status da Filiação</h3>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Situação Atual</span>
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold text-sm border border-green-200 dark:border-green-800">
                            Ativo
                        </span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-full rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    </div>
                    <p className="text-sm text-gray-400 mt-4">Sua filiação está regular. Aproveite todos os benefícios.</p>
                </div>

                {/* Quick Actions */}
                <div className="glass-panel p-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Ações Rápidas</h3>
                    <div className="space-y-4">
                        <button onClick={() => navigate('/professor/profile')} className="w-full flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 rounded-2xl transition group">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 mr-4 group-hover:scale-110 transition-transform">
                                    <User size={20} />
                                </div>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">Atualizar Dados Cadastrais</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </button>

                        <button className="w-full flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 rounded-2xl transition group">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 mr-4 group-hover:scale-110 transition-transform">
                                    <CreditCard size={20} />
                                </div>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">Carteirinha Digital</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessorHome;
