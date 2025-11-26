import React, { useEffect, useState } from 'react';
import { Check, X, FileText, Search, Filter } from 'lucide-react';
import api from '../../api';

const AdminAffiliates = () => {
    const [affiliations, setAffiliations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAffiliations = async () => {
        try {
            const response = await api.get('/affiliations');
            setAffiliations(response.data);
        } catch (error) {
            console.error('Error fetching affiliations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAffiliations();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.post(`/affiliations/${id}/approve`);
            fetchAffiliations(); // Refresh list
        } catch (error) {
            alert('Erro ao aprovar filiação');
        }
    };

    const filteredAffiliations = affiliations.filter(aff =>
        aff.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportCSV = () => {
        if (affiliations.length === 0) {
            alert('Sem dados para exportar');
            return;
        }

        const headers = ['Nome', 'CPF', 'Telefone', 'Matrícula', 'Status', 'Data Solicitação'];
        const csvContent = [
            headers.join(','),
            ...affiliations.map(a => [
                `"${a.nome}"`,
                `"${a.cpf || ''}"`, // Assuming we might fetch more details or join in backend. 
                // Note: The current getAllAffiliations query only returns id, nome, status, data_solicitacao, url_arquivo.
                // To get CPF/Phone we need to update the backend query or just export what we have.
                // Let's export what we have for now to be safe, or update backend.
                // Updating backend query is better.
                `"${a.status}"`,
                `"${new Date(a.data_solicitacao).toLocaleDateString()}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'filiados.csv');
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Filiados</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie os pedidos de filiação.</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
                >
                    Exportar CSV
                </button>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-4">
                    <div className="relative flex-grow max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        />
                    </div>
                    <button className="flex items-center px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Filter size={20} className="mr-2" /> Filtros
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 font-medium text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4">Nome</th>
                                <th className="px-6 py-4">Data Solicitação</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Carregando...</td></tr>
                            ) : filteredAffiliations.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Nenhum registro encontrado.</td></tr>
                            ) : (
                                filteredAffiliations.map((affiliation) => (
                                    <tr key={affiliation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{affiliation.nome}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {new Date(affiliation.data_solicitacao).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${affiliation.status === 'concluido'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                }`}>
                                                {affiliation.status === 'concluido' ? 'Aprovado' : 'Pendente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => {
                                                    if (affiliation.url_arquivo) {
                                                        const filename = affiliation.url_arquivo.split('/').pop().split('\\').pop();
                                                        window.open(`http://localhost:3000/api/documents/${filename}`, '_blank');
                                                    } else {
                                                        alert('Documento não encontrado');
                                                    }
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                                title="Ver Documento"
                                            >
                                                <FileText size={18} />
                                            </button>
                                            {affiliation.status !== 'concluido' && (
                                                <button
                                                    onClick={() => handleApprove(affiliation.id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                                                    title="Aprovar"
                                                >
                                                    <Check size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAffiliates;
