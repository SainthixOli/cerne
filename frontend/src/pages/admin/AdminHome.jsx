import React, { useEffect, useState } from 'react';
import { Users, FileText, AlertCircle, TrendingUp, Activity, HardDrive } from 'lucide-react';
import api from '../../api';

const AdminHome = () => {
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        today: 0
    });
    const [systemHealth, setSystemHealth] = useState({ status: 'online', storage: 'good' }); // Mocked for Super Admin View
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/reports');
                setStats(response.data.summary || response.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { title: 'Total de Membros', value: stats.total, icon: Users, color: 'blue' },
        { title: 'Pendentes de Análise', value: stats.pending, icon: AlertCircle, color: 'yellow' },
        { title: 'Aprovados', value: stats.approved, icon: FileText, color: 'green' },
        { title: 'Novos Hoje', value: stats.today, icon: TrendingUp, color: 'purple' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Visão geral do sistema Empresa X.</p>
                </div>
                <div className="glass px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Sistema Operacional
                </div>
            </div>

            {/* Super Admin Exclusive: System Health (Premium Widget) */}
            {user?.role === 'super_admin' && (
                <div className="glass-panel p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-blue-500/20"></div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                        <Activity className="mr-2 text-blue-500" size={24} />
                        Saúde do Sistema
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-center p-6 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 backdrop-blur-sm transition-transform hover:scale-[1.02]">
                            <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-4 text-green-600 dark:text-green-400 shadow-sm">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">Online</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Todos os serviços ativos</p>
                            </div>
                        </div>

                        <div className="flex items-center p-6 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 backdrop-blur-sm transition-transform hover:scale-[1.02]">
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4 text-blue-600 dark:text-blue-400 shadow-sm">
                                <HardDrive size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-gray-900 dark:text-white">Armazenamento</span>
                                    <span className="text-sm text-green-500 font-medium">Saudável</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div className="bg-blue-500 h-full rounded-full w-[45%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className="glass-panel p-6 hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                                <h3 className="text-4xl font-bold text-gray-900 dark:text-white mt-2 tracking-tight">{card.value}</h3>
                            </div>
                            <div className={`p-3 rounded-2xl bg-${card.color}-50 dark:bg-${card.color}-900/20 text-${card.color}-600 dark:text-${card.color}-400 shadow-sm`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-panel p-8 min-h-[300px] flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
                    <Activity size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Atividade Recente</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                    Nenhuma atividade recente registrada no sistema. As ações dos usuários aparecerão aqui.
                </p>
            </div>
        </div>
    );
};

export default AdminHome;
