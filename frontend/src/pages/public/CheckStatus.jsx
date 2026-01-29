import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, AlertCircle, CheckCircle, XCircle, MessageSquare, X } from 'lucide-react';
import api from '../../api';
import { maskCPF } from '../../utils/masks';
import Loading from '../../components/Loading';
import ChatComponent from '../../components/ChatComponent';
import ThemeToggle from '../../components/ThemeToggle';

const CheckStatus = () => {
    const [cpf, setCpf] = useState('');
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleCheck = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStatusData(null);
        setIsChatOpen(false);

        try {
            const response = await api.post('/affiliations/status', { cpf });
            setStatusData(response.data);
            // If there are messages and status is rejected/analysis, user might want to see them
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao consultar status');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setCpf(maskCPF(e.target.value));
    };

    const toggleChat = () => {
        if (statusData) {
            setIsChatOpen(!isChatOpen);
        }
    };

    return (
        <div className="min-h-screen mesh-gradient-bg px-4 py-12 relative overflow-hidden flex items-center justify-center transition-colors duration-500">
            {/* Theme Toggle */}
            <div className="absolute top-6 right-6 z-20">
                <div className="glass p-2 rounded-full">
                    <ThemeToggle />
                </div>
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-normal"></div>
                <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-normal"></div>
            </div>

            {loading && <Loading message="Consultando base de dados..." />}

            {/* Main Container - Larger Size */}
            <div className={`transition-all duration-500 ease-in-out relative z-10 w-full ${statusData ? 'max-w-4xl' : 'max-w-md'}`}>

                <div className="glass-panel overflow-hidden flex flex-col md:flex-row min-h-[500px]">

                    {/* Left Panel: Content */}
                    <div className={`flex-1 p-8 md:p-10 flex flex-col ${isChatOpen ? 'md:w-1/2' : 'w-full'} transition-all duration-300`}>
                        <div className="text-center mb-10">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">CERNE System</h1>
                            <p className="text-blue-600 dark:text-blue-300 font-medium tracking-wide text-sm uppercase opacity-80">Portal de Transparência</p>
                        </div>

                        {!statusData ? (
                            <div className="flex-1 flex flex-col justify-center">
                                <form onSubmit={handleCheck} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">Informe seu CPF</label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={cpf}
                                                onChange={handleChange}
                                                className="input-field text-center text-lg tracking-widest"
                                                placeholder="000.000.000-00"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn-primary w-full py-4 flex justify-center items-center text-lg"
                                    >
                                        <Search className="mr-2" size={22} /> Consultar Situação
                                    </button>
                                </form>
                                <div className="mt-8 text-center">
                                    <Link to="/login" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-colors text-sm font-medium">
                                        <ArrowLeft size={16} className="mr-2" /> Voltar para o Login
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col animate-fade-in relative">
                                {/* Result Header with Chat Toggle */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{statusData.nome}</h2>
                                        <p className="text-blue-600 dark:text-blue-300 text-sm">Atualizado recentemente</p>
                                    </div>

                                    {/* Chat Icon Logic - Always Enabled */}
                                    <div className="relative group">
                                        <button
                                            onClick={toggleChat}
                                            className={`p-3 rounded-full transition-all duration-300 ${isChatOpen
                                                ? 'bg-blue-600 text-white shadow-glow'
                                                : statusData.message_count > 0
                                                    ? 'bg-blue-100 text-blue-600 dark:bg-white/10 dark:text-white hover:bg-blue-200 animate-pulse-slow'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            title={statusData.message_count > 0 ? `${statusData.message_count} novas mensagens` : "Abrir Suporte"}
                                        >
                                            <MessageSquare size={24} />
                                            {statusData.message_count > 0 && !isChatOpen && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800 font-bold">
                                                    {statusData.message_count}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Status Card */}
                                <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-2xl p-6 shadow-inner border border-white/50 dark:border-white/5 mb-6">
                                    <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium uppercase text-xs tracking-wider">Situação Atual</span>
                                        {statusData.status === 'concluido' ? (
                                            <span className="flex items-center text-green-700 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-sm">
                                                <CheckCircle size={16} className="mr-1.5" /> Aprovado
                                            </span>
                                        ) : statusData.status === 'rejeitado' ? (
                                            <span className="flex items-center text-red-700 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full text-sm">
                                                <XCircle size={16} className="mr-1.5" /> Rejeitado
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-yellow-700 dark:text-yellow-400 font-bold bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full text-sm">
                                                <AlertCircle size={16} className="mr-1.5" /> Em Análise
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-gray-800 dark:text-gray-200">
                                        {statusData.observacoes ? (
                                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1 uppercase">Feedback da Auditoria</p>
                                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{statusData.observacoes}</p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400 italic text-sm text-center py-2">Nenhuma observação registrada até o momento.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto space-y-4">
                                    {statusData.status === 'concluido' && (
                                        <div className="space-y-3">
                                            <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
                                                Seu acesso foi liberado. Verifique seu email para a senha temporária.
                                            </p>
                                            <Link to="/login" className="btn-primary w-full flex justify-center py-3">
                                                Acessar Área do Membro
                                            </Link>
                                        </div>
                                    )}

                                    {statusData.status === 'rejeitado' && (
                                        <div className="space-y-3">
                                            <Link to="/register" className="btn-secondary w-full flex justify-center py-3">
                                                Corrigir e Reenviar
                                            </Link>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => { setStatusData(null); setIsChatOpen(false); }}
                                        className="w-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white py-2 text-sm transition-colors"
                                    >
                                        Realizar Nova Consulta
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Mini Chat Drawer */}
                    <div className={`bg-gray-50 dark:bg-gray-900/50 transition-all duration-500 ease-in-out border-l border-gray-200 dark:border-gray-700 flex flex-col ${isChatOpen ? 'w-full md:w-[400px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                        {statusData && isChatOpen && (
                            <>
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shadow-sm bg-white dark:bg-gray-800">
                                    <div>
                                        <h3 className="font-bold text-gray-800 dark:text-white">Suporte Online</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Protocolo: #{String(statusData.id).slice(0, 8)}</p>
                                    </div>
                                    <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-black/20">
                                    <ChatComponent filiacaoId={statusData.id} cpf={cpf} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckStatus;
