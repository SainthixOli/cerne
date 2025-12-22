import React, { useEffect, useState } from 'react';
import { Users, FileText, AlertCircle, TrendingUp, Activity, HardDrive, CheckCircle } from 'lucide-react';
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

            {/* Super Admin Exclusive: System Health & Pending Broadcasts */}
            {user?.role === 'super_admin' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* System Health */}
                    <div className="glass-panel p-8 relative overflow-hidden group h-full">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-blue-500/20"></div>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <Activity className="mr-2 text-blue-500" size={24} />
                            Saúde do Sistema
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 backdrop-blur-sm">
                                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-4 text-green-600 dark:text-green-400 shadow-sm">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">Online</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Todos os serviços ativos</p>
                                </div>
                            </div>

                            <div className="flex items-center p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 backdrop-blur-sm">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4 text-blue-600 dark:text-blue-400 shadow-sm">
                                    <HardDrive size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-gray-900 dark:text-white text-sm">Armazenamento</span>
                                        <span className="text-xs text-green-500 font-medium">Saudável</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-blue-500 h-full rounded-full w-[45%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Broadcasts */}
                    <PendingBroadcastsWidget />
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

const PendingBroadcastsWidget = () => {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPending = async () => {
        try {
            const res = await api.get('/notifications/pending');
            setPending(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.post(`/notifications/${id}/approve`);
            alert('Notificação aprovada e enviada!');
            fetchPending();
        } catch (error) {
            alert('Erro ao aprovar');
        }
    };

    return (
        <div className="glass-panel p-8 h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <AlertCircle className="mr-2 text-yellow-500" size={24} />
                Aprovações Pendentes
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {loading ? (
                    <p className="text-gray-400 text-sm">Carregando...</p>
                ) : pending.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center opacity-70">
                        <CheckCircle size={32} className="mb-2 text-green-500" />
                        <p className="text-sm">Tudo em dia!</p>
                    </div>
                ) : (
                    pending.map(n => (
                        <div key={n.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl relative group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-800 dark:text-white text-sm">{n.title}</h4>
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider border px-1 rounded bg-white dark:bg-transparent">
                                    {n.target_group === 'all' ? 'Todos' : n.target_group}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{n.message}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-400">Por: {n.author_name}</span>
                                <button
                                    onClick={() => handleApprove(n.id)}
                                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center"
                                >
                                    <CheckCircle size={12} className="mr-1" /> Aprovar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminHome;
