import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../../api';

const AdminReports = () => {
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        pending_docs: 0
    });

    useEffect(() => {
        // Mocking data for now as we don't have a dedicated stats endpoint that returns all this detail yet,
        // or we can fetch all affiliations and calculate.
        // Let's fetch all affiliations to build the chart.
        const fetchData = async () => {
            try {
                const res = await api.get('/affiliations');
                const all = res.data;

                const approved = all.filter(a => a.status === 'concluido').length;
                const rejected = all.filter(a => a.status === 'rejeitado').length;
                const pending_docs = all.filter(a => a.status_conta === 'pendente_docs').length;
                const pending_analysis = all.filter(a => a.status === 'em_processamento' && a.status_conta !== 'pendente_docs').length;

                setStats({
                    total: all.length,
                    approved,
                    rejected,
                    pending: pending_analysis,
                    pending_docs
                });
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, []);

    const data = [
        { name: 'Aprovados', value: stats.approved, color: '#10B981' },
        { name: 'Em Análise', value: stats.pending, color: '#F59E0B' },
        { name: 'Aguardando Docs', value: stats.pending_docs, color: '#F97316' },
        { name: 'Rejeitados', value: stats.rejected, color: '#EF4444' },
    ].filter(d => d.value > 0);

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Relatórios e Estatísticas</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Chart Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Status das Filiações</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Resumo Geral</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <span className="text-gray-600 dark:text-gray-300">Total de Solicitações</span>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <span className="text-green-700 dark:text-green-300">Aprovados</span>
                            <span className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.approved}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                            <span className="text-red-700 dark:text-red-300">Rejeitados</span>
                            <span className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.rejected}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                            <span className="text-yellow-700 dark:text-yellow-300">Pendentes (Total)</span>
                            <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending + stats.pending_docs}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
