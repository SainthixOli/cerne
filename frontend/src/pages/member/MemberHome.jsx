import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, ChevronRight, ShieldCheck, AlertCircle, Clock, XCircle } from 'lucide-react';
import api from '../../api';
import ChatComponent from '../../components/ChatComponent';

const MemberHome = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                navigate('/login');
                return;
            }
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            // Buscar Status
            if (parsedUser.cpf) {
                api.post('/affiliations/status', { cpf: parsedUser.cpf })
                    .then(res => {
                        setStatusData(res.data);
                        setLoading(false);

                        // Sync localStorage if status changed (e.g. Active -> Inactive)
                        if (res.data.status_conta && res.data.status_conta !== parsedUser.status_conta) {
                            const updatedUser = { ...parsedUser, status_conta: res.data.status_conta };
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                            setUser(updatedUser); // Update local state

                            // Dispatch storage event to notify other components (like Sidebar if it listens)
                            window.dispatchEvent(new Event('storage'));
                        }
                    })
                    .catch(err => {
                        console.error("Error fetching status:", err);
                        setLoading(false);
                    });
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Error initializing user:", error);
            localStorage.removeItem('user');
            navigate('/login');
        }
    }, [navigate]);

    if (!user) return null;

    const renderStatusCard = () => {
        if (loading) return <div className="glass-panel p-8 animate-pulse"><p>Carregando status...</p></div>;

        if (!statusData) {
            return (
                <div className="glass-panel p-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Complete seu acesso</h3>
                    <p className="mt-2 text-gray-500">Estamos finalizando a configuração do seu perfil de membro.</p>
                    <button onClick={() => navigate('/member/profile')} className="mt-4 btn-primary px-4 py-2">Meus Dados</button>
                </div>
            );
        }

        const { status, observacoes, created_at, filiacao_id } = statusData;

        let colorClass = 'bg-blue-100 text-blue-600';
        let icon = <Clock size={28} />;
        let label = 'Em Análise';
        let description = 'Sua solicitação de associação está sendo analisada.';

        if (status === 'concluido' || statusData.status_conta === 'ativo') {
            colorClass = 'bg-green-100 text-green-600';
            icon = <ShieldCheck size={28} />;
            label = 'Membro Ativo';
            description = 'Sua afiliação está regular. Aproveite os benefícios de membro.';
        } else if (status === 'rejeitado') {
            colorClass = 'bg-red-100 text-red-600';
            icon = <XCircle size={28} />;
            label = 'Revisão Necessária';
            description = 'Precisamos de alguns ajustes em seu cadastro.';
        } else if (status === 'pendente_docs' || statusData.status_conta === 'pendente_docs') {
            colorClass = 'bg-orange-100 text-orange-600';
            icon = <AlertCircle size={28} />;
            label = 'Documentação Pendente';
            description = 'Envie os documentos necessários para ativar sua associação.';

            // Novos Estados
        } else if (status === 'solicitando_desfiliacao') {
            colorClass = 'bg-red-100 text-red-600';
            icon = <AlertCircle size={28} />;
            label = 'Desfiliação em Análise';
            description = 'Sua solicitação de desfiliação está sendo processada por um administrador.';
        } else if (status === 'desfiliado' || statusData.status_conta === 'inativo') {
            colorClass = 'bg-gray-200 text-gray-600';
            icon = <XCircle size={28} />;
            label = 'Desfiliado';
            description = 'Sua conta está inativa. Para voltar a ser membro, solicite a reativação abaixo.';
        } else if (status === 'solicitando_reativacao') {
            colorClass = 'bg-blue-100 text-blue-600';
            icon = <Clock size={28} />;
            label = 'Reativação em Análise';
            description = 'Aguarde a aprovação do administrador para reativar seu acesso.';
        }

        return (
            <div className="space-y-6">
                <div className="glass-panel p-8 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center mb-6">
                        <div className={`p-3 rounded-2xl mr-4 ${colorClass} bg-opacity-20`}>
                            {icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Status de Associação</h3>
                    </div>

                    {/* Botão de Reativação (Apenas se Desfiliado) */}
                    {(status === 'desfiliado' || statusData.status_conta === 'inativo') && (
                        <div className="glass-panel p-6 border-l-4 border-blue-500 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Deseja retornar?</h3>
                                <p className="text-sm text-gray-500">Solicite a reativação imediata da sua conta.</p>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        await api.post('/affiliations/request-reactivation');
                                        setStatusData({ ...statusData, status: 'solicitando_reativacao' });
                                        alert('Solicitação enviada! Aguarde a aprovação.');
                                    } catch (e) { alert('Erro ao solicitar.'); }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition shadow-lg shadow-blue-500/30"
                            >
                                Solicitar Reativação
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Situação Atual</span>
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full font-bold text-sm border ${colorClass.replace('text-', 'border-').replace('bg-', 'bg-opacity-20 ')}`}>
                            {label}
                        </span>
                    </div>

                    <p className="text-sm text-gray-400 mt-4">{description}</p>
                    {observacoes && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Observações do Admin</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{observacoes}</p>
                        </div>
                    )}
                </div>

                {/* Seção de Chat */}
                {statusData.id && (
                    <ChatComponent filiacaoId={statusData.id} cpf={user.cpf} />
                )}
            </div>
        );
    };

    const userName = user?.name?.split(' ')?.[0] || 'Membro';

    const isInactive = (user?.status_conta === 'inativo') || (statusData?.status === 'desfiliado');

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Olá, {userName}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Bem-vindo ao Painel do Associado.</p>
                </div>
            </header>



            <div className={`grid ${isInactive ? 'grid-cols-1' : 'md:grid-cols-2'} gap-8`}>
                {/* Coluna de Status */}
                <div className={isInactive ? 'max-w-2xl mx-auto w-full' : ''}>
                    {/* Fallback Reactivation Banner - Visible if Inactive */}
                    {isInactive && (
                        <div className="mb-6 p-6 bg-blue-600 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Clock size={32} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Conta Desfiliada/Inativa</h3>
                                    <p className="text-blue-100 text-sm">Sentimos sua falta! Clique ao lado para reativar seu acesso.</p>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        await api.post('/affiliations/request-reactivation');
                                        setStatusData({ ...statusData, status: 'solicitando_reativacao' });
                                        alert('Solicitação enviada! Aguarde a aprovação.');
                                        window.location.reload();
                                    } catch (e) {
                                        console.error(e);
                                        alert('Erro ao solicitar reativação: ' + (e.response?.data?.error || 'Erro desconhecido'));
                                    }
                                }}
                                className="whitespace-nowrap bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg w-full md:w-auto text-center"
                            >
                                Solicitar Reativação
                            </button>
                        </div>
                    )}

                    {renderStatusCard()}
                </div>

                {/* Coluna de Ações Rápidas - Ocultar se Inativo */}
                {!isInactive && statusData && (
                    <div className="glass-panel p-8 h-fit">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Ações Rápidas</h3>

                        <button onClick={() => navigate('/member/profile')} className="w-full flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 rounded-2xl transition group mb-4">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 mr-4 group-hover:scale-110 transition-transform">
                                    <User size={20} />
                                </div>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">Atualizar Dados</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </button>

                        <button onClick={() => navigate('/member/documents')} className="w-full flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 rounded-2xl transition group mb-4">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 mr-4 group-hover:scale-110 transition-transform">
                                    <CreditCard size={20} />
                                </div>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">Meus Documentos</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </button>

                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberHome;
