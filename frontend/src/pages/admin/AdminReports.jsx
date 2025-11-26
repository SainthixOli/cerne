import React, { useEffect, useState } from 'react';
import { BarChart, PieChart, Activity } from 'lucide-react';
import api from '../../api';

const AdminReports = () => {
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, today: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await api.get('/reports');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    if (loading) return <div className="text-center py-10">Carregando relatórios...</div>;

    // Calculate percentages for the bar chart mock
    const total = stats.total || 1; // avoid div by zero
    const pendingPct = Math.round((stats.pending / total) * 100);
    const approvedPct = Math.round((stats.approved / total) * 100);

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Relatórios</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Estatísticas e métricas do sistema.</p>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                        <BarChart className="mr-2 text-blue-500" size={20} /> Status das Filiações
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aprovados</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.approved} ({approvedPct}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${approvedPct}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pendentes</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.pending} ({pendingPct}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${pendingPct}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                        <Activity className="mr-2 text-purple-500" size={20} /> Resumo Geral
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total de Cadastros</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Novos Hoje</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.today}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
