import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, FileText, Search, RefreshCw, Download, MessageCircle, Megaphone, ArrowRightLeft, MessageCircleWarning, MoreVertical } from 'lucide-react';
import api from '../../api';
import ChatComponent from '../../components/ChatComponent';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

const AdminAffiliates = () => {
    const navigate = useNavigate();
    const [affiliations, setAffiliations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('pendentes'); // 'pendentes' | 'aprovados' | 'meus_protocolos'
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null); // 'approve' | 'reject' | 'history' | 'chat' | 'broadcast' | 'transfer'
    const [selectedAffiliation, setSelectedAffiliation] = useState(null);
    const [observation, setObservation] = useState('');
    const [historyData, setHistoryData] = useState([]);
    const [adminsList, setAdminsList] = useState([]); // For Transfer
    const [selectedAdminId, setSelectedAdminId] = useState(''); // For Transfer

    // Broadcast State
    const [broadcastData, setBroadcastData] = useState({ title: '', message: '', target_group: 'all' });

    // Dropdown State
    const [activeDropdownId, setActiveDropdownId] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    // Close Dropdown on Click Outside
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdownId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const toggleDropdown = (e, affiliationId) => {
        e.stopPropagation();
        if (activeDropdownId === affiliationId) {
            setActiveDropdownId(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            // Position: Just below the button, aligned right. 
            // Fixed positioning relative to viewport handles overflow issues.
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.right + window.scrollX - 192 // 192px = w-48 (12rem)
            });
            setActiveDropdownId(affiliationId);
        }
    };

    const fetchAffiliations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/affiliations');
            setAffiliations(response.data);
        } catch (error) {
            console.error('Error fetching affiliations:', error);
            // alert('Erro ao buscar filiações'); // Removed alert to be less intrusive on load
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
                toast.error('Erro ao carregar histórico');
                return;
            }
        }

        if (action === 'transfer') {
            try {
                const res = await api.get('/admin/users');
                // Filter only active admins/super_admins
                const availableAdmins = res.data.filter(u => u.status_conta === 'ativo' && (u.role === 'admin' || u.role === 'super_admin'));
                setAdminsList(availableAdmins);
            } catch (err) {
                toast.error('Erro ao carregar lista de admins');
            }
        }

        setModalOpen(true);
    };

    const handleTransfer = async () => {
        if (!selectedAdminId) return toast.error('Selecione um administrador.');

        try {
            const res = await api.post(`/affiliations/${selectedAffiliation.id}/transfer`, { targetAdminId: selectedAdminId });
            toast.success(res.data.message);
            setModalOpen(false);
            fetchAffiliations();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao transferir.');
        }
    };

    const handleRequestTransfer = async (id) => {
        const confirm = window.confirm('Deseja solicitar ao Super Admin a transferência deste atendimento?');
        if (!confirm) return;

        try {
            const res = await api.post(`/affiliations/${id}/request-transfer`);
            toast.success(res.data.message);
            fetchAffiliations();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao solicitar transferência.');
        }
    };

    const handleConfirmAction = async () => {
        if (!selectedAffiliation) return;

        const endpoint = modalAction === 'approve'
            ? `/affiliations/${selectedAffiliation.id}/approve`
            : `/affiliations/${selectedAffiliation.id}/reject`;

        const promise = api.post(endpoint, { observacoes: observation });

        toast.promise(promise, {
            loading: 'Processando solicitação...',
            success: (response) => {
                if (modalAction === 'approve') {
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#3b82f6', '#10b981', '#ffffff']
                    });
                    if (response.data.tempPassword) {
                        return `Aprovado! Senha Temp: ${response.data.tempPassword}`;
                    }
                    return 'Filiação aprovada com sucesso!';
                }
                return 'Filiação rejeitada com sucesso.';
            },
            error: (err) => {
                console.error(err);
                return 'Erro ao processar ação. Tente novamente.';
            }
        });

        try {
            await promise;
            setModalOpen(false);
            fetchAffiliations();
        } catch (error) {
            // Error is handled by toast.promise
        }
    };

    const handleSendBroadcast = async () => {
        try {
            await api.post('/notifications/broadcast', broadcastData);
            toast.success('Comunicado enviado com sucesso!');
            setModalOpen(false);
            setBroadcastData({ title: '', message: '', target_group: 'all' });
        } catch (error) {
            toast.error('Erro ao enviar comunicado');
        }
    };

    const handleAssumeProtocol = async (id) => {
        try {
            const response = await api.post(`/affiliations/${id}/assume`);
            toast.success(response.data.message);
            fetchAffiliations();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao assumir protocolo');
        }
    };

    const filteredAffiliations = affiliations.filter(aff => {
        const matchesSearch = aff.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (aff.protocolo && aff.protocolo.toLowerCase().includes(searchTerm.toLowerCase()));

        const isApproved = aff.status === 'concluido';

        if (activeTab === 'meus_protocolos') {
            return matchesSearch && aff.responsavel_admin_id === currentUser.id;
        }
        if (activeTab === 'aprovados') return matchesSearch && isApproved;

        if (activeTab === 'solicitacoes') {
            // Only show those with transfer_status 'pending'
            return matchesSearch && aff.transfer_status === 'pending';
        }

        // Pendentes: Not approved AND (Not assigned OR Assigned to me OR Assigned to someone else but showed in general list? 
        // Usually 'pendentes' implies 'work queue'. Let's show all unapproved.)
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
                    <button
                        onClick={() => { setModalAction('broadcast'); setModalOpen(true); }}
                        className="btn-secondary flex items-center px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 transition rounded-xl"
                    >
                        <Megaphone size={18} className="mr-2" /> Comunicado
                    </button>
                    <button onClick={fetchAffiliations} className="glass px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center rounded-xl">
                        <RefreshCw size={18} className="mr-2" /> Atualizar
                    </button>
                    <button onClick={handleExportCSV} className="btn-primary flex items-center px-6 py-2">
                        <Download size={18} className="mr-2" /> Exportar CSV
                    </button>
                </div>
            </header>

            {/* Abas */}
            <div className="flex space-x-2 p-1 glass rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('pendentes')}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${activeTab === 'pendentes'
                        ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                        }`}
                >
                    Fila Geral
                </button>
                <button
                    onClick={() => setActiveTab('meus_protocolos')}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${activeTab === 'meus_protocolos'
                        ? 'bg-white dark:bg-white/10 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                        }`}
                >
                    Meus Protocolos
                </button>
                <button
                    onClick={() => setActiveTab('aprovados')}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${activeTab === 'aprovados'
                        ? 'bg-white dark:bg-white/10 text-green-600 dark:text-green-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                        }`}
                >
                    Histórico
                </button>
                {currentUser.role === 'super_admin' && (
                    <button
                        onClick={() => setActiveTab('solicitacoes')}
                        className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${activeTab === 'solicitacoes'
                            ? 'bg-white dark:bg-white/10 text-orange-600 dark:text-orange-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                            }`}
                    >
                        Solicitações
                    </button>
                )}
            </div>

            <div className="glass-panel overflow-hidden">
                {/* Barra de Ferramentas */}
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

                {/* Tabela */}
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
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Nenhum registro encontrado.</td></tr>
                            ) : (
                                filteredAffiliations.map((affiliation) => (
                                    <tr key={affiliation.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition duration-200">
                                        <td className="px-8 py-5 font-medium text-gray-900 dark:text-white">
                                            <div className="flex flex-col">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs mr-3">
                                                        {affiliation.nome.charAt(0)}
                                                    </div>
                                                    {affiliation.nome}
                                                    {affiliation.total_requests > 1 && (
                                                        <button
                                                            onClick={() => openModal(affiliation, 'history')}
                                                            className="ml-2 inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-200 cursor-pointer"
                                                        >
                                                            +{affiliation.total_requests - 1}
                                                        </button>
                                                    )}
                                                </div>
                                                {affiliation.protocolo && (
                                                    <span className="ml-11 text-xs text-gray-400 font-mono mt-1">
                                                        {affiliation.protocolo}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400">{affiliation.cpf}</td>
                                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400">
                                            {new Date(affiliation.data_solicitacao).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold w-fit border ${affiliation.status === 'concluido' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                                                    affiliation.status === 'rejeitado' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                                                        affiliation.status_conta === 'pendente_docs' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                                                            'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                                                    }`}>
                                                    {affiliation.status === 'concluido' ? 'Aprovado' :
                                                        affiliation.status === 'rejeitado' ? 'Rejeitado' :
                                                            affiliation.status_conta === 'pendente_docs' ? 'Aguardando Docs' : 'Em Análise'}
                                                </span>
                                                {affiliation.status_atendimento === 'em_andamento' && (
                                                    <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">
                                                        {affiliation.responsavel_admin_id === currentUser.id ? 'Atendido por você' : 'Em atendimento'}
                                                    </span>
                                                )}
                                                {affiliation.transfer_status === 'pending' && (
                                                    <span className="flex items-center gap-1 text-[10px] text-orange-500 font-bold uppercase tracking-wide">
                                                        <MessageCircleWarning size={12} /> Solic. Transferência
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right relative">
                                            <button
                                                onClick={(e) => toggleDropdown(e, affiliation.id)}
                                                className={`p-2 rounded-xl transition flex items-center justify-center mx-auto ${activeDropdownId === affiliation.id ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300'}`}
                                                title="Opções"
                                            >
                                                <MoreVertical size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-panel p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            {modalAction === 'approve' ? 'Aprovar Filiação' :
                                modalAction === 'reject' ? 'Rejeitar Filiação' :
                                    modalAction === 'history' ? 'Histórico' :
                                        modalAction === 'broadcast' ? 'Novo Comunicado' :
                                            `Chat - ${selectedAffiliation?.nome}`}
                        </h3>

                        {modalAction === 'history' ? (
                            <div className="space-y-6">
                                {historyData.map((item) => (
                                    <div key={item.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-6 relative">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500"></div>
                                        <p className="text-sm text-gray-500 mb-1">{new Date(item.data_solicitacao).toLocaleString()}</p>
                                        <span className="text-sm font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800">{item.status.toUpperCase()}</span>
                                        {item.observacoes_admin && <p className="text-sm mt-1 bg-gray-50 p-2 rounded">Obs: {item.observacoes_admin}</p>}
                                    </div>
                                ))}
                                <div className="flex justify-end mt-4">
                                    <button onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2">Fechar</button>
                                </div>
                            </div>
                        ) : modalAction === 'chat' ? (
                            <div className="space-y-4">
                                <ChatComponent filiacaoId={selectedAffiliation?.id} />
                                <div className="flex justify-end">
                                    <button onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2">Fechar</button>
                                </div>
                            </div>
                        ) : modalAction === 'broadcast' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={broadcastData.title}
                                        onChange={e => setBroadcastData({ ...broadcastData, title: e.target.value })}
                                        className="input-field"
                                        placeholder="Ex: Manutenção"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Mensagem</label>
                                    <textarea
                                        value={broadcastData.message}
                                        onChange={e => setBroadcastData({ ...broadcastData, message: e.target.value })}
                                        className="input-field h-24 resize-none"
                                        placeholder="Mensagem..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Destino</label>
                                    <select
                                        value={broadcastData.target_group}
                                        onChange={e => setBroadcastData({ ...broadcastData, target_group: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="all">Todos</option>
                                        <option value="professors">Professores</option>
                                        <option value="admins">Admins</option>
                                    </select>
                                </div>
                                <div className="flex justify-end mt-4 space-x-3">
                                    <button onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2">Cancelar</button>
                                    <button onClick={handleSendBroadcast} className="btn-primary px-4 py-2 bg-purple-600 hover:bg-purple-700">Enviar</button>
                                </div>
                            </div>
                        ) : modalAction === 'transfer' ? (
                            <div className="space-y-4">
                                <p className="text-gray-600 dark:text-gray-300">
                                    Selecione o novo responsável pelo protocolo <strong>{selectedAffiliation?.protocolo}</strong>.
                                </p>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Novo Responsável</label>
                                    <select
                                        className="input-field"
                                        value={selectedAdminId}
                                        onChange={(e) => setSelectedAdminId(e.target.value)}
                                    >
                                        <option value="">Selecione um administrador...</option>
                                        {adminsList.map(admin => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.nome_completo} ({admin.role === 'super_admin' ? 'Super' : 'Admin'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end mt-4 space-x-3">
                                    <button onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2">Cancelar</button>
                                    <button onClick={handleTransfer} className="btn-primary px-4 py-2">Transferir</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {modalAction === 'approve' ? `Aprovar ${selectedAffiliation?.nome}?` : `Rejeitar ${selectedAffiliation?.nome}?`}
                                </p>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold mb-2">Observações</label>
                                    <textarea
                                        value={observation}
                                        onChange={(e) => setObservation(e.target.value)}
                                        className="input-field h-32 resize-none"
                                        placeholder="Digite aqui..."
                                    />
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2">Cancelar</button>
                                    <button
                                        onClick={handleConfirmAction}
                                        className={`px-8 py-2 text-white rounded-xl font-bold ${modalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Global Floating Dropdown (Google Docs Style) */}
            {activeDropdownId && (() => {
                const affiliation = affiliations.find(a => a.id === activeDropdownId);
                if (!affiliation) return null;

                return (
                    <div
                        className="fixed z-[9999] w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                    >
                        <div className="p-1 space-y-1">
                            {affiliation.url_arquivo && (
                                <button
                                    onClick={() => {
                                        const filename = affiliation.url_arquivo.split('/').pop().split('\\').pop();
                                        window.open(`http://localhost:3000/api/documents/${filename}`, '_blank');
                                        setActiveDropdownId(null);
                                    }}
                                    className="flex w-full items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg"
                                >
                                    <FileText size={16} className="mr-2" /> Ver Documento
                                </button>
                            )}

                            {(!affiliation.responsavel_admin_id && affiliation.status !== 'concluido' && affiliation.status !== 'rejeitado') && (
                                <button
                                    onClick={() => { handleAssumeProtocol(affiliation.id); setActiveDropdownId(null); }}
                                    className="flex w-full items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-bold"
                                >
                                    <Check size={16} className="mr-2" /> Assumir
                                </button>
                            )}

                            {/* My Protocol Actions */}
                            {(String(affiliation.responsavel_admin_id) === String(currentUser.id) && affiliation.status !== 'rejeitado' && affiliation.status !== 'concluido') && (
                                <>
                                    <button
                                        onClick={() => { openModal(affiliation, 'approve'); setActiveDropdownId(null); }}
                                        className="flex w-full items-center px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                    >
                                        <Check size={16} className="mr-2" /> Aprovar
                                    </button>
                                    <button
                                        onClick={() => { openModal(affiliation, 'reject'); setActiveDropdownId(null); }}
                                        className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    >
                                        <X size={16} className="mr-2" /> Rejeitar
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => {
                                    if (affiliation.status === 'concluido') {
                                        navigate('/admin/chat', { state: { startChatWith: affiliation.user_id, userName: affiliation.nome } });
                                    } else {
                                        openModal(affiliation, 'chat');
                                    }
                                    setActiveDropdownId(null);
                                }}
                                className="flex w-full items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg"
                            >
                                <MessageCircle size={16} className="mr-2" /> Chat / Docs
                            </button>

                            {(currentUser.role === 'super_admin' && affiliation.status_atendimento === 'em_andamento' && affiliation.transfer_status !== 'pending') && (
                                <button
                                    onClick={() => { openModal(affiliation, 'transfer'); setActiveDropdownId(null); }}
                                    className="flex w-full items-center px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                                >
                                    <ArrowRightLeft size={16} className="mr-2" /> Transferir
                                </button>
                            )}

                            {/* Transfer Request Logic */}
                            {(String(affiliation.responsavel_admin_id) === String(currentUser.id) && !affiliation.transfer_status && affiliation.status !== 'rejeitado' && affiliation.status !== 'concluido') && (
                                <button
                                    onClick={() => { handleRequestTransfer(affiliation.id); setActiveDropdownId(null); }}
                                    className="flex w-full items-center px-3 py-2 text-sm text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg"
                                >
                                    <MessageCircleWarning size={16} className="mr-2" /> Solicitar Transf.
                                </button>
                            )}

                            {/* Super Admin Transfer Request Management */}
                            {(currentUser.role === 'super_admin' && affiliation.transfer_status === 'pending') && (
                                <>
                                    <button
                                        onClick={() => { openModal(affiliation, 'transfer'); setActiveDropdownId(null); }}
                                        className="flex w-full items-center px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg font-bold"
                                    >
                                        <Check size={16} className="mr-2" /> Aceitar Transf.
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!window.confirm('Negar solicitação de transferência?')) return;
                                            try {
                                                await api.post(`/affiliations/${affiliation.id}/deny-transfer`);
                                                toast.success('Solicitação negada.');
                                                fetchAffiliations();
                                                setActiveDropdownId(null);
                                            } catch (e) { toast.error('Erro ao negar.'); }
                                        }}
                                        className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    >
                                        <X size={16} className="mr-2" /> Negar Transf.
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default AdminAffiliates;
