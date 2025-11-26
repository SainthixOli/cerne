import React, { useEffect, useState } from 'react';
import { Users, FileText, AlertCircle, TrendingUp } from 'lucide-react';
import api from '../../api';

const AdminHome = () => {
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        today: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/affiliations');
                const affiliations = response.data;

                setStats({
                    total: affiliations.length,
                    pending: affiliations.filter(a => a.status === 'em_analise' || a.status === 'em_processamento').length,
                    approved: affiliations.filter(a => a.status === 'concluido').length,
                    today: 0 // Mock for now
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { title: 'Total de Filiados', value: stats.total, icon: Users, color: 'blue' },
        { title: 'Pendentes de Análise', value: stats.pending, icon: AlertCircle, color: 'yellow' },
        { title: 'Aprovados', value: stats.approved, icon: FileText, color: 'green' },
        { title: 'Novos Hoje', value: stats.today, icon: TrendingUp, color: 'purple' },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Administrativo</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral do sistema.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((card, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{card.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl bg-${card.color}-100 dark:bg-${card.color}-900/30 text-${card.color}-600 dark:text-${card.color}-400`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Atividade Recente</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhuma atividade recente registrada.</p>
            </div>
        </div>
    );
};

export default AdminHome;
