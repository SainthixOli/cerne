import React, { useEffect, useState } from 'react';
import { Check, X, FileText, Search, Filter, RefreshCw, AlertCircle, Download } from 'lucide-react';
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

        if (activeTab === 'aprovados') return matchesSearch && isApproved;
        return matchesSearch && !isApproved;
    });

    const handleExportCSV = () => {
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
        <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Filiados</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Gerencie os pedidos de filiação.</p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={fetchAffiliations} className="glass px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center rounded-xl">
                        <RefreshCw size={18} className="mr-2" /> Atualizar
                    </button>
                    <button onClick={handleExportCSV} className="btn-primary flex items-center px-6 py-2">
                        <Download size={18} className="mr-2" /> Exportar CSV
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex space-x-2 p-1 glass rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('pendentes')}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${activeTab === 'pendentes'
                            ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                        }`}
                >
                    Solicitações Pendentes
                </button>
                <button
                    onClick={() => setActiveTab('aprovados')}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${activeTab === 'aprovados'
                            ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                        }`}
                >
                    Filiados Ativos
                </button>
            </div>

            <div className="glass-panel overflow-hidden">
                {/* Toolbar */}
                <div className="p-6 border-b border-gray-200/50 dark:border-white/10 flex gap-4">
                    <div className="relative flex-grow max-w-md">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-12"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-semibold text-sm uppercase tracking-wider">
                            <tr>
                                <th className="px-8 py-5">Nome</th>
                                <th className="px-6 py-5">CPF</th>
                                <th className="px-6 py-5">Data Solicitação</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Carregando...</td></tr>
                            ) : filteredAffiliations.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Nenhum registro encontrado nesta aba.</td></tr>
                            ) : (
                                filteredAffiliations.map((affiliation) => (
                                    <tr key={affiliation.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition duration-200">
                                        <td className="px-8 py-5 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs mr-3">
                                                    {affiliation.nome.charAt(0)}
                                                </div>
                                                {affiliation.nome}
                                                {affiliation.total_requests > 1 && (
                                                    <button
                                                        onClick={() => openModal(affiliation, 'history')}
                                                        className="ml-2 inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-200 transition cursor-pointer"
                                                    >
                                                        +{affiliation.total_requests - 1}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400">{affiliation.cpf}</td>
                                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400">
                                            {new Date(affiliation.data_solicitacao).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-5">
                                            {affiliation.status === 'concluido' ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                    Aprovado
                                                </span>
                                            ) : affiliation.status === 'rejeitado' ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                                                    Rejeitado
                                                </span>
                                            ) : affiliation.status_conta === 'pendente_docs' ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                                    Aguardando Docs
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                                                    Em Análise
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right space-x-2">
                                            <button
                                                onClick={() => {
                                                    if (affiliation.url_arquivo) {
                                                        const filename = affiliation.url_arquivo.split('/').pop().split('\\').pop();
                                                        window.open(`http://localhost:3000/api/documents/${filename}`, '_blank');
                                                    } else {
                                                        alert('Documento não encontrado');
                                                    }
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"
                                                title="Ver Documento"
                                            >
                                                <FileText size={20} />
                                            </button>

                                            {activeTab === 'pendentes' && affiliation.status !== 'rejeitado' && (
                                                <>
                                                    <button
                                                        onClick={() => openModal(affiliation, 'approve')}
                                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition"
                                                        title="Aprovar"
                                                    >
                                                        <Check size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => openModal(affiliation, 'reject')}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                                                        title="Rejeitar"
                                                    >
                                                        <X size={20} />
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-panel p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all scale-100">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            {modalAction === 'approve' ? 'Aprovar Filiação' :
                                modalAction === 'reject' ? 'Rejeitar Filiação' :
                                    'Histórico de Solicitações'}
                        </h3>

                        {modalAction === 'history' ? (
                            <div className="space-y-6">
                                {historyData.map((item, index) => (
                                    <div key={item.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-6 relative">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-gray-800"></div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                            {new Date(item.data_solicitacao).toLocaleString()}
                                        </p>
                                        <div className="flex items-center mb-2">
                                            <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${item.status === 'concluido' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                item.status === 'rejeitado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </div>
                                        {item.observacoes_admin && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                                Obs: {item.observacoes_admin}
                                            </p>
                                        )}
                                        {item.url_arquivo && (
                                            <a
                                                href={`http://localhost:3000/api/documents/${item.url_arquivo.split('/').pop()}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-blue-500 hover:text-blue-600 font-bold block mt-2"
                                            >
                                                Ver Documento Anexado
                                            </a>
                                        )}
                                    </div>
                                ))}
                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="px-6 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition font-medium"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                                    {modalAction === 'approve'
                                        ? `Deseja aprovar a filiação de ${selectedAffiliation?.nome}?`
                                        : `Deseja rejeitar a filiação de ${selectedAffiliation?.nome}?`
                                    }
                                </p>

                                <div className="mb-8">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        {modalAction === 'approve' ? 'Observações (Opcional)' : 'Motivo da Rejeição (Obrigatório)'}
                                    </label>
                                    <textarea
                                        value={observation}
                                        onChange={(e) => setObservation(e.target.value)}
                                        className="input-field h-32 resize-none"
                                        placeholder={modalAction === 'approve' ? "Tudo certo com a documentação..." : "Documento ilegível, falta assinatura..."}
                                    />
                                </div>

                                <div className="flex justify-end space-x-4">
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmAction}
                                        disabled={modalAction === 'reject' && !observation.trim()}
                                        className={`px-8 py-3 text-white rounded-xl font-bold transition shadow-lg disabled:opacity-50 ${modalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
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
