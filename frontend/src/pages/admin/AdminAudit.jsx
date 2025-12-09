import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import api from '../../api';

const AdminAudit = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/admin/audit');
                setLogs(res.data);
            } catch (error) {
                console.error(error);
                // If 403, maybe redirect or show message
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                    <Shield className="mr-3 text-blue-600" /> Auditoria do Sistema
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Registro de todas as ações administrativas.</p>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 font-medium text-sm uppercase">
                        <tr>
                            <th className="px-6 py-4">Data/Hora</th>
                            <th className="px-6 py-4">Ação</th>
                            <th className="px-6 py-4">Admin Responsável</th>
                            <th className="px-6 py-4">Alvo</th>
                            <th className="px-6 py-4">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Carregando logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Nenhum registro encontrado.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.action_type.includes('APPROVE') ? 'bg-green-100 text-green-800' :
                                            log.action_type.includes('REJECT') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {log.action_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{log.admin_name || 'Sistema'}</td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{log.target_id}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs font-mono max-w-xs truncate">
                                        {log.details}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminAudit;
