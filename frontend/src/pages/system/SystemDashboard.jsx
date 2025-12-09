import React, { useEffect, useState } from 'react';
import { Server, Database, HardDrive, Activity, Users, FileText } from 'lucide-react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

const SystemDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/system/stats');
                setStats(res.data);
            } catch (error) {
                console.error(error);
                alert('Erro ao carregar status do sistema');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Carregando Sistema...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-mono">
            <header className="flex justify-between items-center mb-12 border-b border-gray-700 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-green-400 flex items-center">
                        <Activity className="mr-3" /> SYSTEM MONITOR
                    </h1>
                    <p className="text-gray-400 mt-2">Status da Infraestrutura e Recursos</p>
                </div>
                <button onClick={logout} className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 rounded transition">
                    LOGOUT
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {/* Storage Card */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
                        <HardDrive className="mr-2" /> ARMAZENAMENTO
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Database (SQLite)</span>
                            <span className="font-bold">{stats?.storage.database}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Uploads (Docs)</span>
                            <span className="font-bold">{stats?.storage.uploads}</span>
                        </div>
                        <div className="h-px bg-gray-700 my-2"></div>
                        <div className="flex justify-between text-lg">
                            <span className="text-gray-300">Total Usado</span>
                            <span className="font-bold text-green-400">{stats?.storage.total}</span>
                        </div>
                    </div>
                </div>

                {/* Performance Card */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center">
                        <Server className="mr-2" /> PERFORMANCE
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Memória RAM (RSS)</span>
                            <span className="font-bold">{stats?.performance.memory}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Uptime</span>
                            <span className="font-bold">{stats?.performance.uptime}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Carga CPU</span>
                            <span className="font-bold text-yellow-400">{stats?.performance.cpuLoad}</span>
                        </div>
                    </div>
                </div>

                {/* Database Stats Card */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h2 className="text-xl font-bold text-orange-400 mb-4 flex items-center">
                        <Database className="mr-2" /> DADOS
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 flex items-center"><Users size={16} className="mr-2" /> Usuários</span>
                            <span className="font-bold text-2xl">{stats?.counts.users}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 flex items-center"><FileText size={16} className="mr-2" /> Filiações</span>
                            <span className="font-bold text-2xl">{stats?.counts.affiliations}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 flex items-center"><FileText size={16} className="mr-2" /> Documentos</span>
                            <span className="font-bold text-2xl">{stats?.counts.documents}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-gray-400 mb-4 text-sm uppercase tracking-wider">Logs do Sistema (Console)</h3>
                <div className="bg-black p-4 rounded font-mono text-sm text-green-500 h-48 overflow-y-auto">
                    <p>{'>'} System initialized...</p>
                    <p>{'>'} Database connection established.</p>
                    <p>{'>'} Monitoring services active.</p>
                    <p>{'>'} All systems operational.</p>
                    <p className="animate-pulse">{'>'} _</p>
                </div>
            </div>
        </div>
    );
};

export default SystemDashboard;
