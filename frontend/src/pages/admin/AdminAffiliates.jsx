import React, { useEffect, useState } from 'react';
import { Check, X, FileText, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../api';

const AdminAffiliates = () => {
    const [affiliations, setAffiliations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('pendentes'); // 'pendentes' | 'aprovados'

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null); // 'approve' | 'reject' | 'history'
    const [selectedAffiliation, setSelectedAffiliation] = useState(null);
    const [observation, setObservation] = useState('');
    const [historyData, setHistoryData] = useState([]);

    const fetchAffiliations = async () => {
        try {
            const response = await api.get('/affiliations');
            setAffiliations(response.data);
        } catch (error) {
            console.error('Error fetching affiliations:', error);
            alert('Erro ao buscar filiações: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAffiliations();
    }, []);

    const openModal = async (affiliation, action) => {
        setSelectedAffiliation(affiliation);
        setModalAction(action);
        setObservation('');

        if (action === 'history') {
            try {
                const res = await api.get(`/affiliations/${affiliation.user_id}/history`);
                setHistoryData(res.data);
            } catch (err) {
                console.error(err);
                alert('Erro ao carregar histórico');
                return;
            }
        }

        setModalOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedAffiliation) return;

        try {
            const endpoint = modalAction === 'approve'
                ? `/affiliations/${selectedAffiliation.id}/approve`
                : `/affiliations/${selectedAffiliation.id}/reject`;

            const response = await api.post(endpoint, { observacoes: observation });

            if (modalAction === 'approve' && response.data.tempPassword) {
                alert(`Aprovado com sucesso!\nSenha Temporária Gerada: ${response.data.tempPassword}\n(Anote, pois ela foi enviada por email simulado)`);
            } else {
                alert(modalAction === 'approve' ? 'Aprovado com sucesso!' : 'Rejeitado com sucesso!');
            }

            setModalOpen(false);
            fetchAffiliations();
        } catch (error) {
            console.error(error);
            alert('Erro ao processar ação');
        }
    };

    const filteredAffiliations = affiliations.filter(aff => {
        const matchesSearch = aff.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const isApproved = aff.status === 'concluido';
        const isPending = aff.status !== 'concluido'; // Includes 'em_processamento', 'rejeitado' (maybe rejected should be separate?)
        // User asked for "Pending" and "Affiliated" (Approved). Rejected usually goes to history or stays in pending/rejected list.
        // Let's put Rejected in Pending tab for now or separate?
        // Let's keep 'pendentes' as anything NOT concluded.

        if (activeTab === 'aprovados') return matchesSearch && isApproved;
        return matchesSearch && !isApproved;
    });

    const handleExportCSV = () => {
        // ... (Keep existing CSV logic or update if needed)
        if (affiliations.length === 0) {
            alert('Sem dados para exportar');
            return;
        }
        const headers = ['Nome', 'CPF', 'Status', 'Data Solicitação'];
        const csvContent = [
            headers.join(','),
            ...affiliations.map(a => [
                `"${a.nome}"`, `"${a.cpf || ''}"`, `"${a.status}"`, `"${new Date(a.data_solicitacao).toLocaleDateString()}"`
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
                <div className="flex space-x-2">
                    <button onClick={fetchAffiliations} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 transition flex items-center">
                        <RefreshCw size={18} className="mr-2" /> Atualizar
                    </button>
                    <button onClick={handleExportCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md">
                        Exportar CSV
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('pendentes')}
                    className={`pb-3 px-4 font-medium transition relative ${activeTab === 'pendentes' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    Solicitações Pendentes
                    {activeTab === 'pendentes' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('aprovados')}
                    className={`pb-3 px-4 font-medium transition relative ${activeTab === 'aprovados' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    Filiados Ativos
                    {activeTab === 'aprovados' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>}
                </button>
            </div>

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
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 font-medium text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4">Nome</th>
                                <th className="px-6 py-4">CPF</th>
                                <th className="px-6 py-4">Data Solicitação</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Carregando...</td></tr>
                            ) : filteredAffiliations.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Nenhum registro encontrado nesta aba.</td></tr>
                            ) : (
                                filteredAffiliations.map((affiliation) => (
                                    <tr key={affiliation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {affiliation.nome}
                                            {affiliation.total_requests > 1 && (
                                                <button
                                                    onClick={() => openModal(affiliation, 'history')}
                                                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition cursor-pointer"
                                                >
                                                    +{affiliation.total_requests - 1}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{affiliation.cpf}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {new Date(affiliation.data_solicitacao).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {affiliation.status === 'concluido' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    Aprovado
                                                </span>
                                            ) : affiliation.status === 'rejeitado' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                    Rejeitado
                                                </span>
                                            ) : affiliation.status_conta === 'pendente_docs' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                                    Aguardando Docs
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                    Em Análise
                                                </span>
                                            )}
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

                                            {activeTab === 'pendentes' && affiliation.status !== 'rejeitado' && (
                                                <>
                                                    <button
                                                        onClick={() => openModal(affiliation, 'approve')}
                                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                                                        title="Aprovar"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openModal(affiliation, 'reject')}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                        title="Rejeitar"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {modalAction === 'approve' ? 'Aprovar Filiação' :
                                modalAction === 'reject' ? 'Rejeitar Filiação' :
                                    'Histórico de Solicitações'}
                        </h3>

                        {modalAction === 'history' ? (
                            <div className="space-y-4">
                                {historyData.map((item, index) => (
                                    <div key={item.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 relative">
                                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                            {new Date(item.data_solicitacao).toLocaleString()}
                                        </p>
                                        <div className="flex items-center mb-1">
                                            <span className={`text-sm font-bold ${item.status === 'concluido' ? 'text-green-600' :
                                                    item.status === 'rejeitado' ? 'text-red-600' : 'text-yellow-600'
                                                }`}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </div>
                                        {item.observacoes_admin && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                                Obs: {item.observacoes_admin}
                                            </p>
                                        )}
                                        {item.url_arquivo && (
                                            <a
                                                href={`http://localhost:3000/api/documents/${item.url_arquivo.split('/').pop()}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-blue-500 hover:underline block mt-1"
                                            >
                                                Ver Documento
                                            </a>
                                        )}
                                    </div>
                                ))}
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {modalAction === 'approve'
                                        ? `Deseja aprovar a filiação de ${selectedAffiliation?.nome}?`
                                        : `Deseja rejeitar a filiação de ${selectedAffiliation?.nome}?`
                                    }
                                </p>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {modalAction === 'approve' ? 'Observações (Opcional)' : 'Motivo da Rejeição (Obrigatório)'}
                                    </label>
                                    <textarea
                                        value={observation}
                                        onChange={(e) => setObservation(e.target.value)}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition h-24 resize-none"
                                        placeholder={modalAction === 'approve' ? "Tudo certo com a documentação..." : "Documento ilegível, falta assinatura..."}
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmAction}
                                        disabled={modalAction === 'reject' && !observation.trim()}
                                        className={`px-4 py-2 text-white rounded-lg transition disabled:opacity-50 ${modalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                            }`}
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAffiliates;
