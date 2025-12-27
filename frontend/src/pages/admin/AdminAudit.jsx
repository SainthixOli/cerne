import React, { useState, useEffect } from 'react';
import { Shield, Search, Eye, Filter, Calendar, User, FileText, Info } from 'lucide-react';
import api from '../../api';
import Modal from '../../components/Modal';

const AdminAudit = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/admin/audit');
                setLogs(res.data);
                setFilteredLogs(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    useEffect(() => {
        const results = logs.filter(log =>
            log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredLogs(results);
    }, [searchTerm, logs]);

    const getActionColor = (action) => {
        if (action.includes('APPROVE') || action.includes('CREATE')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
        if (action.includes('REJECT') || action.includes('DELETE')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    };

    const formatDetails = (detailsString) => {
        try {
            const details = JSON.parse(detailsString);
            return (
                <div className="space-y-3">
                    {Object.entries(details).map(([key, value]) => (
                        <div key={key} className="flex flex-col bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : value.toString()}
                            </span>
                        </div>
                    ))}
                </div>
            );
        } catch (e) {
            return <p className="text-gray-600 dark:text-gray-300">{detailsString}</p>;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center tracking-tight">
                        <Shield className="mr-3 text-blue-600" /> Auditoria
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Rastreamento completo de atividades do sistema</p>
                </div>

                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar registros..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl w-full md:w-80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                </div>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4">Ação</th>
                                <th className="px-6 py-4">Data & Hora</th>
                                <th className="px-6 py-4">Responsável</th>
                                <th className="px-6 py-4">Alvo (ID)</th>
                                <th className="px-6 py-4 text-center">Opções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500"><div className="animate-pulse">Carregando auditoria...</div></td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Nenhum registro encontrado para sua busca.</td></tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className="hidden md:table-row hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getActionColor(log.action_type)}`}>
                                                {log.action_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center">
                                                <Calendar size={14} className="mr-1.5 text-gray-400" />
                                                {new Date(log.created_at).toLocaleDateString()}
                                                <span className="mx-2 text-gray-300">|</span>
                                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3 text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    {log.admin_name?.charAt(0) || 'S'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {log.admin_name || 'Sistema'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                                            {log.target_id || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="p-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-blue-600">
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="Detalhes da Ação"
            >
                {selectedLog && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Tipo de Ação</p>
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border ${getActionColor(selectedLog.action_type)}`}>
                                    {selectedLog.action_type}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Data</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {new Date(selectedLog.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center mb-2 text-blue-600 dark:text-blue-400">
                                    <User size={18} className="mr-2" />
                                    <span className="font-bold text-sm">Realizado por</span>
                                </div>
                                <p className="text-gray-900 dark:text-white font-medium">{selectedLog.admin_name || 'Sistema Auto'}</p>
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center mb-2 text-purple-600 dark:text-purple-400">
                                    <FileText size={18} className="mr-2" />
                                    <span className="font-bold text-sm">Alvo (ID)</span>
                                </div>
                                <p className="text-gray-900 dark:text-white font-mono text-sm">{selectedLog.target_id}</p>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center mb-3">
                                <Info size={18} className="mr-2 text-gray-400" />
                                <h4 className="font-bold text-gray-900 dark:text-white">Dados Registrados</h4>
                            </div>
                            {formatDetails(selectedLog.details)}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminAudit;
